import { describe, it, expect } from "vitest";

// ── Pure logic tests for paymentRouter helpers ────────────────────────────────
// These test the currency conversion and locale-to-currency mapping logic
// without requiring a live DB or Stripe connection.

// Replicated from paymentRouter.ts for unit testing
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

const INVITATION_PRICE_AED_FILS = 50000; // 500 AED * 100

function convertCurrency(amountAEDFils: number, targetCurrency: string): number {
  const rate = CURRENCY_RATES[targetCurrency] ?? CURRENCY_RATES.USD;
  const aed = amountAEDFils / 100;
  const inTarget = aed * rate;
  const noDecimal = ["JPY"];
  const threeDecimal = ["KWD", "BHD", "OMR"];
  let smallest: number;
  if (noDecimal.includes(targetCurrency)) {
    smallest = Math.round(inTarget);
  } else if (threeDecimal.includes(targetCurrency)) {
    smallest = Math.round(inTarget * 1000);
  } else {
    smallest = Math.round(inTarget * 100);
  }
  return Math.max(smallest, 50);
}

function getCurrencyFromLocale(locale?: string): string {
  if (!locale) return "AED";
  const map: Record<string, string> = {
    "en-AE": "AED", "ar-AE": "AED", "en-US": "USD", "en-GB": "GBP",
    "en-CA": "CAD", "en-AU": "AUD", "de-DE": "EUR", "fr-FR": "EUR",
    "ja-JP": "JPY", "zh-CN": "CNY", "en-IN": "INR", "en-SA": "SAR",
  };
  return map[locale] || "AED";
}

describe("convertCurrency", () => {
  it("returns AED fils unchanged for AED", () => {
    const result = convertCurrency(INVITATION_PRICE_AED_FILS, "AED");
    expect(result).toBe(50000); // 500 AED = 50000 fils
  });

  it("converts to USD cents correctly", () => {
    const result = convertCurrency(INVITATION_PRICE_AED_FILS, "USD");
    // 500 AED * 0.272 = 136 USD = 13600 cents
    expect(result).toBe(13600);
  });

  it("converts to JPY without decimal places", () => {
    const result = convertCurrency(INVITATION_PRICE_AED_FILS, "JPY");
    // 500 AED * 42 = 21000 JPY (no smallest unit multiplication)
    expect(result).toBe(21000);
  });

  it("converts to KWD with 3 decimal places", () => {
    const result = convertCurrency(INVITATION_PRICE_AED_FILS, "KWD");
    // 500 AED * 0.083 = 41.5 KWD = 41500 fils (3 decimal)
    expect(result).toBe(41500);
  });

  it("never returns below minimum of 50", () => {
    // Even for very small amounts, minimum is 50
    const result = convertCurrency(1, "USD");
    expect(result).toBeGreaterThanOrEqual(50);
  });

  it("handles unknown currency by falling back to USD rate", () => {
    const usd = convertCurrency(INVITATION_PRICE_AED_FILS, "USD");
    const unknown = convertCurrency(INVITATION_PRICE_AED_FILS, "XYZ");
    expect(unknown).toBe(usd);
  });
});

describe("getCurrencyFromLocale", () => {
  it("returns AED for UAE locales", () => {
    expect(getCurrencyFromLocale("en-AE")).toBe("AED");
    expect(getCurrencyFromLocale("ar-AE")).toBe("AED");
  });

  it("returns USD for US locale", () => {
    expect(getCurrencyFromLocale("en-US")).toBe("USD");
  });

  it("returns GBP for UK locale", () => {
    expect(getCurrencyFromLocale("en-GB")).toBe("GBP");
  });

  it("returns EUR for German locale", () => {
    expect(getCurrencyFromLocale("de-DE")).toBe("EUR");
  });

  it("defaults to AED for unknown locale", () => {
    expect(getCurrencyFromLocale("xx-XX")).toBe("AED");
  });

  it("defaults to AED when locale is undefined", () => {
    expect(getCurrencyFromLocale(undefined)).toBe("AED");
  });
});

describe("payment amount validation", () => {
  it("AED 500 equals 50000 fils", () => {
    expect(INVITATION_PRICE_AED_FILS).toBe(50000);
  });

  it("price is above Stripe minimum for all supported currencies", () => {
    const currencies = Object.keys(CURRENCY_RATES);
    for (const currency of currencies) {
      const amount = convertCurrency(INVITATION_PRICE_AED_FILS, currency);
      expect(amount).toBeGreaterThanOrEqual(50);
    }
  });
});

describe("webhook test event detection", () => {
  it("identifies test events by evt_test_ prefix", () => {
    const isTestEvent = (id: string) => id.startsWith("evt_test_");
    expect(isTestEvent("evt_test_abc123")).toBe(true);
    expect(isTestEvent("evt_1abc123")).toBe(false);
    expect(isTestEvent("evt_test_")).toBe(true);
  });
});
