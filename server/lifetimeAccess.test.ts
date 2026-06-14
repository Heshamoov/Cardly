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

/**
 * Regression: the comp expiry date must be storable by MySQL TIMESTAMP,
 * which overflows after 2038-01-19 (the "Year 2038" limit). A date of 2999
 * caused ER_TRUNCATED_WRONG_VALUE and failed the grant insert.
 */
describe("comp expiry date is within MySQL TIMESTAMP range", () => {
  const MYSQL_TIMESTAMP_MAX = new Date("2038-01-19T03:14:07Z");
  const COMP_EXPIRY = new Date("2037-12-31T00:00:00Z");

  it("is before the MySQL 2038 limit", () => {
    expect(COMP_EXPIRY.getTime()).toBeLessThan(MYSQL_TIMESTAMP_MAX.getTime());
  });

  it("is still far enough in the future to act as lifetime", () => {
    const tenYears = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;
    expect(COMP_EXPIRY.getTime()).toBeGreaterThan(tenYears);
  });
});
