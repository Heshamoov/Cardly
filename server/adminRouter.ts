/**
 * Admin Router — protected by adminProcedure (role === 'admin' only)
 * Provides: stats overview, subscribers list, all invitations, promo code management
 */
import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users, subscriptions, invitations, rsvpResponses } from "../drizzle/schema";
import { desc, eq, sql, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function getStripeAdmin() {
  const Stripe = require("stripe");
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe key not configured" });
  return new Stripe(key) as import("stripe").default;
}

export const adminRouter = router({
  /** ── Overview KPIs ── */
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const [subStats] = await db
      .select({
        total: count(),
        active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
        canceled: sql<number>`SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END)`,
        pastDue: sql<number>`SUM(CASE WHEN status = 'past_due' THEN 1 ELSE 0 END)`,
      })
      .from(subscriptions);

    const [invStats] = await db
      .select({ total: count() })
      .from(invitations);

    const [userStats] = await db
      .select({ total: count() })
      .from(users);

    const [rsvpStats] = await db
      .select({ total: count() })
      .from(rsvpResponses);

    const AED_PER_MONTH = 200;
    const mrr = Number(subStats.active ?? 0) * AED_PER_MONTH;

    return {
      subscribers: {
        total: Number(subStats.total ?? 0),
        active: Number(subStats.active ?? 0),
        canceled: Number(subStats.canceled ?? 0),
        pastDue: Number(subStats.pastDue ?? 0),
      },
      mrr,
      totalInvitations: Number(invStats.total ?? 0),
      totalUsers: Number(userStats.total ?? 0),
      totalRsvps: Number(rsvpStats.total ?? 0),
    };
  }),

  /** ── All Subscribers ── */
  getAllSubscribers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const rows = await db
      .select({
        subId: subscriptions.id,
        ownerOpenId: subscriptions.ownerOpenId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        stripeCustomerId: subscriptions.stripeCustomerId,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        invitationsUsed: subscriptions.invitationsUsed,
        invitationsLimit: subscriptions.invitationsLimit,
        createdAt: subscriptions.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(subscriptions)
      .leftJoin(users, eq(users.openId, subscriptions.ownerOpenId))
      .orderBy(desc(subscriptions.createdAt));

    return rows;
  }),

  /** ── All Invitations ── */
  getAllInvitations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const rows = await db
      .select({
        id: invitations.id,
        slug: invitations.slug,
        title: invitations.title,
        views: invitations.views,
        isPaid: invitations.isPaid,
        ownerOpenId: invitations.ownerOpenId,
        createdAt: invitations.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(invitations)
      .leftJoin(users, eq(users.openId, invitations.ownerOpenId))
      .orderBy(desc(invitations.createdAt));

    return rows;
  }),

  /** ── Promo Codes ── */
  listPromoCodes: adminProcedure.query(async () => {
    const stripe = getStripeAdmin();
    // Fetch promotion codes (active + inactive)
    const promoCodes = await stripe.promotionCodes.list({ limit: 100 });
    return promoCodes.data.map((pc: any) => ({
      id: pc.id,
      code: pc.code,
      active: pc.active,
      timesRedeemed: pc.times_redeemed,
      maxRedemptions: pc.max_redemptions,
      expiresAt: pc.expires_at ? new Date(pc.expires_at * 1000).toISOString() : null,
      couponId: pc.coupon?.id ?? null,
      couponName: pc.coupon?.name ?? null,
      percentOff: pc.coupon?.percent_off ?? null,
      amountOff: pc.coupon?.amount_off ?? null,
      currency: pc.coupon?.currency ?? null,
      createdAt: new Date(pc.created * 1000).toISOString(),
    }));
  }),

  createPromoCode: adminProcedure
    .input(
      z.object({
        code: z.string().min(3).max(20).toUpperCase(),
        percentOff: z.number().min(1).max(100).optional(),
        amountOffAed: z.number().min(1).optional(),
        maxRedemptions: z.number().min(1).optional(),
        expiresInDays: z.number().min(1).optional(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.percentOff && !input.amountOffAed) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Provide either percentOff or amountOffAed" });
      }
      const stripe = getStripeAdmin();

      // Create coupon first
      const couponParams: any = {
        duration: "once",
        name: input.name ?? input.code,
      };
      if (input.percentOff) {
        couponParams.percent_off = input.percentOff;
      } else {
        couponParams.amount_off = Math.round((input.amountOffAed ?? 0) * 100); // fils
        couponParams.currency = "aed";
      }

      const coupon = await stripe.coupons.create(couponParams);

      // Create promotion code
      const promoParams: any = {
        coupon: coupon.id,
        code: input.code,
      };
      if (input.maxRedemptions) promoParams.max_redemptions = input.maxRedemptions;
      if (input.expiresInDays) {
        promoParams.expires_at = Math.floor(Date.now() / 1000) + input.expiresInDays * 86400;
      }

      const promoCode = await stripe.promotionCodes.create(promoParams);

      return {
        id: promoCode.id,
        code: promoCode.code,
        active: promoCode.active,
        couponId: coupon.id,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
      };
    }),

  deactivatePromoCode: adminProcedure
    .input(z.object({ promoCodeId: z.string() }))
    .mutation(async ({ input }) => {
      const stripe = getStripeAdmin();
      await stripe.promotionCodes.update(input.promoCodeId, { active: false });
      return { success: true };
    }),

  /** ── User Management ── */
  getAllUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const rows = await db
      .select({
        id: users.id,
        openId: users.openId,
        name: users.name,
        email: users.email,
        role: users.role,
        stripeCustomerId: users.stripeCustomerId,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return rows;
  }),
});
