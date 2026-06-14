import { describe, it, expect } from "vitest";

/**
 * Pure-logic tests for the comp (lifetime) access quota rules.
 * Mirrors the decision logic in paymentRouter.hasSubscriptionQuota without a live DB.
 *
 * Rules under test:
 *  - No subscription            → not allowed (reason: no_subscription)
 *  - comp plan                  → always allowed, unlimited (ignores invitationsUsed/limit)
 *  - stripe plan within quota   → allowed
 *  - stripe plan at/over quota  → not allowed (reason: quota_exceeded)
 */

type Sub = {
  plan: "stripe" | "comp";
  status: string;
  invitationsUsed: number;
  invitationsLimit: number;
} | null;

function quotaDecision(sub: Sub): { allowed: boolean; reason?: string } {
  if (!sub) return { allowed: false, reason: "no_subscription" };
  if (sub.plan === "comp") return { allowed: true };
  if (sub.invitationsUsed >= sub.invitationsLimit) {
    return { allowed: false, reason: "quota_exceeded" };
  }
  return { allowed: true };
}

describe("lifetime/comp access quota rules", () => {
  it("denies users without any subscription", () => {
    expect(quotaDecision(null)).toEqual({ allowed: false, reason: "no_subscription" });
  });

  it("allows comp accounts even when usage far exceeds a normal limit", () => {
    const sub: Sub = { plan: "comp", status: "active", invitationsUsed: 5000, invitationsLimit: 10 };
    expect(quotaDecision(sub)).toEqual({ allowed: true });
  });

  it("allows comp accounts at zero usage", () => {
    const sub: Sub = { plan: "comp", status: "active", invitationsUsed: 0, invitationsLimit: 999999 };
    expect(quotaDecision(sub)).toEqual({ allowed: true });
  });

  it("allows stripe accounts within quota", () => {
    const sub: Sub = { plan: "stripe", status: "active", invitationsUsed: 3, invitationsLimit: 10 };
    expect(quotaDecision(sub)).toEqual({ allowed: true });
  });

  it("blocks stripe accounts at the quota limit", () => {
    const sub: Sub = { plan: "stripe", status: "active", invitationsUsed: 10, invitationsLimit: 10 };
    expect(quotaDecision(sub)).toEqual({ allowed: false, reason: "quota_exceeded" });
  });
});

/**
 * The Stripe webhook keys every update on stripeSubscriptionId. Comp rows have
 * a NULL stripeSubscriptionId, so they can never be matched/overwritten.
 */
function webhookCanTouch(row: { stripeSubscriptionId: string | null }, eventSubId: string): boolean {
  return row.stripeSubscriptionId !== null && row.stripeSubscriptionId === eventSubId;
}

describe("stripe webhook never touches comp rows", () => {
  it("ignores comp rows (null stripeSubscriptionId)", () => {
    expect(webhookCanTouch({ stripeSubscriptionId: null }, "sub_123")).toBe(false);
  });

  it("still matches real stripe subscriptions", () => {
    expect(webhookCanTouch({ stripeSubscriptionId: "sub_123" }, "sub_123")).toBe(true);
  });
});

/**
 * hasLifetimeAccess flag derivation used by the admin user list.
 */
function hasLifetimeAccess(subPlan: string | null, subStatus: string | null): boolean {
  return subPlan === "comp" && subStatus === "active";
}

describe("admin lifetime-access flag", () => {
  it("is true only for active comp subscriptions", () => {
    expect(hasLifetimeAccess("comp", "active")).toBe(true);
    expect(hasLifetimeAccess("comp", "canceled")).toBe(false);
    expect(hasLifetimeAccess("stripe", "active")).toBe(false);
    expect(hasLifetimeAccess(null, null)).toBe(false);
  });
});
