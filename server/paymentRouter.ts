import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

let stripe: any;

async function getStripe() {
  if (!stripe) {
    const Stripe = (await import("stripe")).default;
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2024-11-20",
    });
  }
  return stripe;
}

// AED 500 in fils (1 AED = 100 fils)
const INVITATION_PRICE_AED = 50000; // 500 AED in fils

// Currency conversion rates (approximate, relative to AED)
const CURRENCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 0.272, // 1 USD ≈ 3.67 AED
  EUR: 0.296, // 1 EUR ≈ 3.38 AED
  GBP: 0.341, // 1 GBP ≈ 2.93 AED
  SAR: 0.0726, // 1 SAR ≈ 13.77 AED
  QAR: 0.0747, // 1 QAR ≈ 13.38 AED
  KWD: 0.886, // 1 KWD ≈ 1.13 AED
  BHD: 0.722, // 1 BHD ≈ 1.39 AED
  OMR: 0.707, // 1 OMR ≈ 1.41 AED
  INR: 0.00327, // 1 INR ≈ 0.022 AED
  PKR: 0.00098, // 1 PKR ≈ 0.001 AED
  EGP: 0.0055, // 1 EGP ≈ 0.014 AED
  CAD: 0.195, // 1 CAD ≈ 5.13 AED
  AUD: 0.179, // 1 AUD ≈ 5.59 AED
  JPY: 0.00185, // 1 JPY ≈ 0.025 AED
  CNY: 0.0375, // 1 CNY ≈ 0.037 AED
};

/**
 * Convert AED amount to target currency
 * @param amountAED Amount in AED fils (e.g., 50000 for 500 AED)
 * @param targetCurrency Target currency code (e.g., "USD")
 * @returns Amount in smallest unit of target currency
 */
function convertCurrency(amountAED: number, targetCurrency: string): number {
  const rate = CURRENCY_RATES[targetCurrency] || CURRENCY_RATES["USD"];
  const amountInTargetCurrency = (amountAED / 100) * rate; // Convert fils to AED first
  
  // Convert to smallest unit (cents for USD/EUR, etc.)
  const smallestUnit = Math.round(amountInTargetCurrency * 100);
  return Math.max(smallestUnit, 50); // Stripe minimum is $0.50
}

/**
 * Get currency from country code or browser locale
 */
function getCurrencyFromLocale(locale?: string): string {
  if (!locale) return "USD";

  const currencyMap: Record<string, string> = {
    "en-AE": "AED",
    "ar-AE": "AED",
    "en-US": "USD",
    "en-GB": "GBP",
    "en-CA": "CAD",
    "en-AU": "AUD",
    "de-DE": "EUR",
    "fr-FR": "EUR",
    "ja-JP": "JPY",
    "zh-CN": "CNY",
    "en-IN": "INR",
    "en-SA": "SAR",
    "en-QA": "QAR",
    "en-KW": "KWD",
    "en-BH": "BHD",
    "en-OM": "OMR",
    "en-EG": "EGP",
    "ur-PK": "PKR",
  };

  return currencyMap[locale] || "USD";
}

export const paymentRouter = router({
  /**
   * Create a Stripe Checkout Session for invitation payment
   * Returns the checkout URL to redirect the user to
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        invitationId: z.number(),
        invitationSlug: z.string(),
        currency: z.string().optional(),
        locale: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const stripeClient = await getStripe();
        // Determine currency
        const currency = input.currency || getCurrencyFromLocale(input.locale) || "USD";
        const amount = convertCurrency(INVITATION_PRICE_AED, currency);

        // Create checkout session
        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: currency.toLowerCase(),
                product_data: {
                  name: "Cardly Invitation",
                  description: `Digital invitation for your event`,
                  images: [], // Add logo URL if available
                },
                unit_amount: amount,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${ctx.req.headers.origin}/invitations/${input.invitationSlug}?payment=success`,
          cancel_url: `${ctx.req.headers.origin}/builder?payment=cancelled`,
          customer_email: ctx.user.email,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            invitation_id: input.invitationId.toString(),
            invitation_slug: input.invitationSlug,
            customer_email: ctx.user.email,
            customer_name: ctx.user.name || "Guest",
          },
          allow_promotion_codes: true,
        });

        return {
          success: true,
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      } catch (error) {
        console.error("[Payment] Checkout session creation failed:", error);
        throw new Error("Failed to create checkout session");
      }
    }),

  /**
   * Verify payment status after checkout
   */
  verifyPayment: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        invitationSlug: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const stripeClient = await getStripe();
        const session = await stripeClient.checkout.sessions.retrieve(input.sessionId);

        return {
          success: session.payment_status === "paid",
          status: session.payment_status,
          paymentIntentId: session.payment_intent,
        };
      } catch (error) {
        console.error("[Payment] Verification failed:", error);
        return {
          success: false,
          status: "unknown",
        };
      }
    }),

  /**
   * Get payment history for a user
   */
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      // In a real app, this would query the payments table
      // For now, return empty array
      return {
        payments: [],
      };
    } catch (error) {
      console.error("[Payment] History retrieval failed:", error);
      return {
        payments: [],
      };
    }
  }),
});
