import type { Express, Request, Response } from "express";
import express from "express";
import { eq } from "drizzle-orm";
import { getStripe, INVITATIONS_LIMIT } from "./paymentRouter";
import { getDb } from "./db";
import { subscriptions, users } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

/**
 * Register Stripe webhook route at /api/stripe/webhook.
 *
 * IMPORTANT: This must be registered BEFORE express.json() so that the raw body
 * is available for signature verification.
 *
 * Handles subscription lifecycle events:
 *   checkout.session.completed   → activate subscription
 *   invoice.paid                 → renew period + reset quota
 *   customer.subscription.updated → sync status
 *   customer.subscription.deleted → mark canceled
 *   invoice.payment_failed       → mark past_due
 */
export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string | undefined;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: any;
      try {
        const stripe = await getStripe();
        if (!sig || !webhookSecret) {
          event = JSON.parse(req.body.toString());
        } else {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err?.message);
        return res.status(400).send(`Webhook Error: ${err?.message}`);
      }

      // ── CRITICAL: Test events must return {verified: true} ─────────────────
      if (event?.id && typeof event.id === "string" && event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected:", event.id);
        return res.json({ verified: true });
      }

      const db = await getDb();
      if (!db) {
        console.error("[Stripe Webhook] DB not available");
        return res.status(500).json({ error: "Database not available" });
      }

      try {
        switch (event.type) {
          // ── New subscription activated via checkout ────────────────────
          case "checkout.session.completed": {
            const session = event.data.object;
            if (session.mode !== "subscription") break;

            const openId = session.metadata?.open_id;
            const stripeCustomerId = session.customer as string;
            const stripeSubscriptionId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id;

            if (!openId || !stripeSubscriptionId) {
              console.warn("[Stripe Webhook] Missing openId or subscriptionId in session metadata");
              break;
            }

            // Fetch subscription details to get period end
            // NOTE: In Stripe SDK v22, current_period_end moved from Subscription to SubscriptionItem
            const stripe = await getStripe();
            const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
              expand: ['items.data'],
            });
            const periodEndTs = (stripeSub.items?.data?.[0] as any)?.current_period_end
              ?? (stripeSub as any).current_period_end;
            const periodEnd = periodEndTs ? new Date(periodEndTs * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            // Upsert subscription row
            const existing = await db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.ownerOpenId, openId))
              .limit(1);

            if (existing.length > 0) {
              await db
                .update(subscriptions)
                .set({
                  stripeSubscriptionId,
                  stripeCustomerId,
                  status: "active",
                  currentPeriodEnd: periodEnd,
                  invitationsUsed: 0,
                })
                .where(eq(subscriptions.ownerOpenId, openId));
            } else {
              await db.insert(subscriptions).values({
                ownerOpenId: openId,
                stripeSubscriptionId,
                stripeCustomerId,
                status: "active",
                currentPeriodEnd: periodEnd,
                invitationsUsed: 0,
                invitationsLimit: INVITATIONS_LIMIT,
              });
            }

            // Save stripeCustomerId on user row
            await db
              .update(users)
              .set({ stripeCustomerId })
              .where(eq(users.openId, openId));

            const customerName = session.metadata?.customer_name || "A user";
            const customerEmail = session.metadata?.customer_email || "";
            await notifyOwner({
              title: "💳 New Cardly Subscription",
              content: `${customerName} (${customerEmail}) subscribed to the AED 200/month plan.\nPeriod ends: ${periodEnd.toLocaleDateString()}.`,
            }).catch(() => {});

            console.log(`[Stripe Webhook] Subscription activated for ${openId}`);
            break;
          }

          // ── Subscription renewed (new billing period) ──────────────────
          case "invoice.paid": {
            const invoice = event.data.object;
            const stripeSubscriptionId = invoice.subscription as string;
            if (!stripeSubscriptionId) break;

            // Fetch updated period end from Stripe
            // NOTE: In Stripe SDK v22, current_period_end moved from Subscription to SubscriptionItem
            const stripe = await getStripe();
            const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
              expand: ['items.data'],
            });
            const periodEndTs = (stripeSub.items?.data?.[0] as any)?.current_period_end
              ?? (stripeSub as any).current_period_end;
            const periodEnd = periodEndTs ? new Date(periodEndTs * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await db
              .update(subscriptions)
              .set({
                status: "active",
                currentPeriodEnd: periodEnd,
                invitationsUsed: 0, // Reset quota on renewal
              })
              .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

            console.log(`[Stripe Webhook] Subscription renewed: ${stripeSubscriptionId}, new period ends ${periodEnd.toLocaleDateString()}`);
            break;
          }

          // ── Subscription status changed ────────────────────────────────
          case "customer.subscription.updated": {
            const stripeSub = event.data.object;
            const stripeSubscriptionId = stripeSub.id;
            const newStatus = stripeSub.status;
            // In Stripe SDK v22, current_period_end moved to SubscriptionItem level
            const periodEndTs2 = (stripeSub.items?.data?.[0] as any)?.current_period_end
              ?? (stripeSub as any).current_period_end;
            const periodEnd = periodEndTs2 ? new Date(periodEndTs2 * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await db
              .update(subscriptions)
              .set({ status: newStatus, currentPeriodEnd: periodEnd })
              .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

            console.log(`[Stripe Webhook] Subscription ${stripeSubscriptionId} status → ${newStatus}`);
            break;
          }

          // ── Subscription cancelled ─────────────────────────────────────
          case "customer.subscription.deleted": {
            const stripeSub = event.data.object;
            await db
              .update(subscriptions)
              .set({ status: "canceled" })
              .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));

            console.log(`[Stripe Webhook] Subscription ${stripeSub.id} canceled`);
            break;
          }

          // ── Payment failed ─────────────────────────────────────────────
          case "invoice.payment_failed": {
            const invoice = event.data.object;
            const stripeSubscriptionId = invoice.subscription as string;
            if (!stripeSubscriptionId) break;

            await db
              .update(subscriptions)
              .set({ status: "past_due" })
              .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

            console.log(`[Stripe Webhook] Payment failed for subscription ${stripeSubscriptionId}`);
            break;
          }

          default:
            console.log("[Stripe Webhook] Unhandled event type:", event.type);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Handler error:", err);
        // Still return 200 so Stripe doesn't retry indefinitely on internal bugs.
      }

      return res.json({ received: true });
    }
  );
}
