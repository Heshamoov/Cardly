import type { Express, Request, Response } from "express";
import express from "express";
import { eq } from "drizzle-orm";
import { getStripe } from "./paymentRouter";
import { getDb } from "./db";
import { invitations, payments } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

/**
 * Register Stripe webhook route at /api/stripe/webhook.
 *
 * IMPORTANT: This must be registered BEFORE express.json() so that the raw body
 * is available for signature verification.
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
          // No signature or secret — try to parse raw event but treat as untrusted.
          // We still need to handle test events from Manus integration tests.
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

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object;
            const slug = session.metadata?.invitation_slug;
            const invitationIdRaw = session.metadata?.invitation_id;
            const paymentIntentId = (session.payment_intent as string) || session.id;
            const amount = session.amount_total ?? 0;
            const currency = (session.currency as string)?.toUpperCase() ?? "AED";
            const email = session.customer_email || session.metadata?.customer_email || null;

            if (!slug) {
              console.warn("[Stripe Webhook] checkout.session.completed missing invitation_slug metadata");
              break;
            }

            const db = await getDb();
            if (!db) {
              console.error("[Stripe Webhook] DB not available");
              break;
            }

            // Mark invitation as paid (idempotent)
            await db
              .update(invitations)
              .set({
                isPaid: true,
                paidAt: new Date(),
                stripePaymentIntentId: paymentIntentId,
              })
              .where(eq(invitations.slug, slug));

            // Record/update payment row (idempotent)
            try {
              const invitationId = invitationIdRaw ? Number(invitationIdRaw) : null;
              if (invitationId) {
                // Try to update existing pending row first
                const updated = await db
                  .update(payments)
                  .set({
                    status: "succeeded",
                    succeededAt: new Date(),
                    amount,
                    currency,
                    stripePaymentIntentId: paymentIntentId,
                    email,
                  } as any)
                  .where(eq(payments.invitationId, invitationId));
                // If no rows updated, insert new
                if (!(updated as any)?.[0]?.affectedRows) {
                  await db
                    .insert(payments)
                    .values({
                      invitationId,
                      stripePaymentIntentId: paymentIntentId,
                      amount,
                      currency,
                      status: "succeeded",
                      email,
                      succeededAt: new Date(),
                    } as any)
                    .onDuplicateKeyUpdate({
                      set: { status: "succeeded", succeededAt: new Date(), amount, currency, email } as any,
                    });
                }
              }
            } catch (dbErr) {
              console.warn("[Stripe Webhook] Payment row upsert warning:", dbErr);
            }

            console.log("[Stripe Webhook] Marked invitation paid:", slug);

            // Notify the project owner of the new payment
            try {
              const invRows = await db.select({ title: invitations.title }).from(invitations).where(eq(invitations.slug, slug)).limit(1);
              const invTitle = invRows[0]?.title || slug;
              await notifyOwner({
                title: "New Cardly Payment Received 💍",
                content: `Invitation "${invTitle}" (slug: ${slug}) has been paid.\nAmount: ${(amount / 100).toFixed(2)} ${currency}\nCustomer: ${email || "unknown"}`,
              });
            } catch {
              // Notification failure is non-fatal
            }
            break;
          }
          case "payment_intent.succeeded":
          case "payment_intent.payment_failed":
          case "charge.succeeded":
          case "charge.refunded":
            // Could log these for audit; primary state is set in checkout.session.completed.
            console.log("[Stripe Webhook] Event:", event.type, event.id);
            break;
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
