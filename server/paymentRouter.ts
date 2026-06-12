import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { invitations, payments } from "../drizzle/schema";
import { getDb } from "./db";

let _stripe: any = null;

export async function getStripe() {
  if (!_stripe) {
    const Stripe = (await import("stripe")).default;
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  }
  return _stripe;
}

// AED 500 in fils (1 AED = 100 fils) — Stripe expects amount in smallest unit
const INVITATION_PRICE_AED_FILS = 50000; // 500 AED * 100

// Approximate currency rates relative to 1 AED
const CURRENCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 0.272,
  EUR: 0.252,
  GBP: 0.215,
  SAR: 1.02,
  QAR: 0.99,
  KWD: 0.083,
  BHD: 0.103,
  OMR: 0.105,
  INR: 23.0,
  PKR: 76.0,
  EGP: 13.5,
  CAD: 0.37,
  AUD: 0.42,
  JPY: 42.0,
  CNY: 1.97,
};

/** Convert AED fils to target currency smallest unit. */
function convertCurrency(amountAEDFils: number, targetCurrency: string): number {
  const rate = CURRENCY_RATES[targetCurrency] ?? CURRENCY_RATES.USD;
  const aed = amountAEDFils / 100; // 500 AED
  const inTarget = aed * rate;
  // Most currencies: smallest unit = ×100. Exceptions: JPY/KWD/BHD/OMR.
  const noDecimal = ["JPY"]; // 0 decimals
  const threeDecimal = ["KWD", "BHD", "OMR"]; // 3 decimals
  let smallest: number;
  if (noDecimal.includes(targetCurrency)) {
    smallest = Math.round(inTarget);
  } else if (threeDecimal.includes(targetCurrency)) {
    smallest = Math.round(inTarget * 1000);
  } else {
    smallest = Math.round(inTarget * 100);
  }
  // Stripe minimum ~ $0.50 USD equivalent
  return Math.max(smallest, 50);
}

function getCurrencyFromLocale(locale?: string): string {
  if (!locale) return "AED";
  const map: Record<string, string> = {
    "en-AE": "AED", "ar-AE": "AED", "en-US": "USD", "en-GB": "GBP",
    "en-CA": "CAD", "en-AU": "AUD", "de-DE": "EUR", "fr-FR": "EUR",
    "ja-JP": "JPY", "zh-CN": "CNY", "en-IN": "INR", "en-SA": "SAR",
    "en-QA": "QAR", "en-KW": "KWD", "en-BH": "BHD", "en-OM": "OMR",
    "en-EG": "EGP", "ur-PK": "PKR",
  };
  return map[locale] || "AED";
}

export const paymentRouter = router({
  /**
   * Create a Stripe Checkout Session for a specific invitation slug.
   * The invitation must already exist in the DB (created as a draft).
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        invitationSlug: z.string().min(1),
        currency: z.string().optional(),
        locale: z.string().optional(),
        origin: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify invitation exists and is owned by the caller
      const rows = await db.select().from(invitations).where(eq(invitations.slug, input.invitationSlug)).limit(1);
      if (rows.length === 0) throw new Error("Invitation not found");
      const inv = rows[0];
      if (inv.ownerOpenId && inv.ownerOpenId !== ctx.user.openId) {
        throw new Error("You do not own this invitation");
      }
      if (inv.isPaid) {
        return { success: true, alreadyPaid: true, checkoutUrl: null, sessionId: null };
      }

      const stripe = await getStripe();
      const currency = (input.currency || getCurrencyFromLocale(input.locale) || "AED").toUpperCase();
      const amount = convertCurrency(INVITATION_PRICE_AED_FILS, currency);
      const origin = input.origin || ctx.req.headers.origin || `https://${ctx.req.headers.host}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: "Cardly Digital Invitation",
                description: `One published invitation — ${inv.title || "Untitled event"}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/create?paid=1&slug=${input.invitationSlug}`,
        cancel_url: `${origin}/create?paid=0&slug=${input.invitationSlug}`,
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          invitation_id: inv.id.toString(),
          invitation_slug: input.invitationSlug,
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "Guest",
        },
        allow_promotion_codes: true,
      });

      // Record a pending payment row
      try {
        await db.insert(payments).values({
          invitationId: inv.id,
          stripePaymentIntentId: session.payment_intent || session.id,
          amount,
          currency,
          status: "pending",
          email: ctx.user.email || null,
        } as any);
      } catch (err) {
        // Duplicate key etc. — ignore, webhook will reconcile
        console.warn("[Payment] Could not insert pending payment row:", err);
      }

      return {
        success: true,
        alreadyPaid: false,
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    }),

  /**
   * Get current payment status for an invitation slug.
   * Public so that, after returning from Stripe checkout, the Builder can poll
   * even before re-authenticating completes.
   */
  getStatus: publicProcedure
    .input(z.object({ invitationSlug: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(invitations).where(eq(invitations.slug, input.invitationSlug)).limit(1);
      if (rows.length === 0) return { found: false, isPaid: false };
      return {
        found: true,
        isPaid: !!rows[0].isPaid,
        paidAt: rows[0].paidAt,
      };
    }),

  /**
   * Verify a Stripe checkout session & sync DB (used as a fallback if webhook
   * is delayed). Idempotent.
   */
  verifySession: protectedProcedure
    .input(z.object({ sessionId: z.string(), invitationSlug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const stripe = await getStripe();
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      const isPaid = session.payment_status === "paid";
      if (isPaid) {
        await db
          .update(invitations)
          .set({ isPaid: true, paidAt: new Date(), stripePaymentIntentId: session.payment_intent as string })
          .where(eq(invitations.slug, input.invitationSlug));
      }
      return { isPaid };
    }),

  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { payments: [] };
    // Join via invitations.ownerOpenId
    const rows = await db
      .select({
        paymentId: payments.id,
        invitationId: payments.invitationId,
        invitationSlug: invitations.slug,
        title: invitations.title,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(invitations, eq(payments.invitationId, invitations.id))
      .where(eq(invitations.ownerOpenId, ctx.user.openId));
    return { payments: rows };
  }),
});
