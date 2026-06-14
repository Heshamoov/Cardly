import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { eq, and, gte } from "drizzle-orm";
import { invitations, subscriptions, users } from "../drizzle/schema";
import { getDb } from "./db";

let _stripe: any = null;

export async function getStripe() {
  if (!_stripe) {
    const Stripe = (await import("stripe")).default;
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  }
  return _stripe;
}

/** AED 200 in fils (Stripe smallest unit). */
export const SUBSCRIPTION_PRICE_AED_FILS = 20000; // 200 AED * 100

/** Max invitations per billing period. */
export const INVITATIONS_LIMIT = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the active subscription for a user, or null. */
export async function getActiveSubscription(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.ownerOpenId, ownerOpenId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);
  if (rows.length === 0) return null;
  const sub = rows[0];
  // Also check the period hasn't expired (belt-and-suspenders; webhook should handle this)
  if (new Date() > new Date(sub.currentPeriodEnd)) return null;
  return sub;
}

/** Returns true if the user has an active subscription with quota remaining. */
export async function hasSubscriptionQuota(ownerOpenId: string): Promise<{
  allowed: boolean;
  reason?: string;
  subscription?: typeof subscriptions.$inferSelect;
}> {
  const sub = await getActiveSubscription(ownerOpenId);
  if (!sub) return { allowed: false, reason: "no_subscription" };
  // Comp (lifetime) accounts have unlimited invitations — never quota-limited.
  if (sub.plan === "comp") {
    return { allowed: true, subscription: sub };
  }
  if (sub.invitationsUsed >= sub.invitationsLimit) {
    return { allowed: false, reason: "quota_exceeded", subscription: sub };
  }
  return { allowed: true, subscription: sub };
}

// ── Router ───────────────────────────────────────────────────────────────────

export const paymentRouter = router({
  /**
   * Create a Stripe Checkout Session for a monthly subscription.
   * Uses mode: "subscription" with a recurring price.
   */
  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        origin: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if already subscribed
      const existing = await getActiveSubscription(ctx.user.openId);
      if (existing) {
        return { alreadySubscribed: true, checkoutUrl: null, sessionId: null };
      }

      const stripe = await getStripe();
      const origin = input.origin || ctx.req.headers.origin || `https://${ctx.req.headers.host}`;

      // Get or create Stripe customer
      const userRows = await db.select().from(users).where(eq(users.openId, ctx.user.openId)).limit(1);
      const userRow = userRows[0];
      let stripeCustomerId = userRow?.stripeCustomerId || undefined;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email || undefined,
          name: ctx.user.name || undefined,
          metadata: { openId: ctx.user.openId, userId: ctx.user.id.toString() },
        });
        stripeCustomerId = customer.id;
        await db.update(users).set({ stripeCustomerId }).where(eq(users.openId, ctx.user.openId));
      }

      // Create or retrieve the recurring price (AED 200/month)
      // We use price_data inline so no pre-created product is needed in test mode
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer: stripeCustomerId,
        line_items: [
          {
            price_data: {
              currency: "aed",
              product_data: {
                name: "YalaInvite Monthly Plan",
                description: "Create up to 10 digital invitations per month",
              },
              unit_amount: SUBSCRIPTION_PRICE_AED_FILS,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/create?subscribed=1`,
        cancel_url: `${origin}/create?subscribed=0`,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          open_id: ctx.user.openId,
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "Guest",
        },
        allow_promotion_codes: true,
      });

      return {
        alreadySubscribed: false,
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    }),

  /**
   * Get current subscription status for the authenticated user.
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const sub = await getActiveSubscription(ctx.user.openId);
    if (!sub) {
      return {
        isActive: false,
        invitationsUsed: 0,
        invitationsRemaining: 0,
        invitationsLimit: INVITATIONS_LIMIT,
        renewsAt: null,
        status: "none",
      };
    }
    return {
      isActive: true,
      invitationsUsed: sub.invitationsUsed,
      invitationsRemaining: Math.max(0, sub.invitationsLimit - sub.invitationsUsed),
      invitationsLimit: sub.invitationsLimit,
      renewsAt: sub.currentPeriodEnd,
      status: sub.status,
    };
  }),

  /**
   * Create a Stripe Customer Portal session so users can manage/cancel their subscription.
   */
  createPortalSession: protectedProcedure
    .input(z.object({ origin: z.string().url().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const stripe = await getStripe();
      const origin = input.origin || ctx.req.headers.origin || `https://${ctx.req.headers.host}`;

      const userRows = await db.select().from(users).where(eq(users.openId, ctx.user.openId)).limit(1);
      const stripeCustomerId = userRows[0]?.stripeCustomerId;
      if (!stripeCustomerId) throw new Error("No Stripe customer found");

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${origin}/create`,
      });

      return { url: portalSession.url };
    }),

  /**
   * Verify a Stripe checkout session and sync subscription to DB.
   * Fallback if webhook is delayed.
   */
  verifySubscriptionSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const stripe = await getStripe();
      const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
        expand: ["subscription"],
      });

      if (session.status !== "complete" || !session.subscription) {
        return { success: false };
      }

      const stripeSub = session.subscription as any;
      const stripeSubId = typeof stripeSub === "string" ? stripeSub : stripeSub.id;

      // Upsert subscription row
      const existing = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.ownerOpenId, ctx.user.openId))
        .limit(1);

      // In Stripe SDK v22, current_period_end moved from Subscription to SubscriptionItem
      const periodEndTs = typeof stripeSub === "object"
        ? ((stripeSub.items?.data?.[0]?.current_period_end) ?? (stripeSub.current_period_end))
        : null;
      const periodEnd = periodEndTs
        ? new Date(periodEndTs * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (existing.length > 0) {
        await db
          .update(subscriptions)
          .set({
            stripeSubscriptionId: stripeSubId,
            stripeCustomerId: session.customer as string,
            status: "active",
            currentPeriodEnd: periodEnd,
            invitationsUsed: 0,
          })
          .where(eq(subscriptions.ownerOpenId, ctx.user.openId));
      } else {
        await db.insert(subscriptions).values({
          ownerOpenId: ctx.user.openId,
          stripeSubscriptionId: stripeSubId,
          stripeCustomerId: session.customer as string,
          status: "active",
          currentPeriodEnd: periodEnd,
          invitationsUsed: 0,
          invitationsLimit: INVITATIONS_LIMIT,
        });
      }

      return { success: true };
    }),
});
