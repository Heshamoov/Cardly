import { describe, it, expect } from "vitest";

/**
 * Validates that the configured RESEND_API_KEY is a real, working credential by
 * calling a lightweight authenticated Resend endpoint (GET /domains).
 *
 * - If no key is configured, the test is skipped (the reset flow still works via
 *   the on-screen fallback).
 * - If a key is configured, it MUST authenticate successfully (HTTP 200).
 */
describe("Resend API key validation", () => {
  const apiKey = process.env.RESEND_API_KEY ?? "";

  it("authenticates against the Resend API when a key is configured", async () => {
    if (!apiKey) {
      console.warn("[email.resend.test] RESEND_API_KEY not set — skipping live validation.");
      expect(true).toBe(true);
      return;
    }

    const res = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: { authorization: `Bearer ${apiKey}` },
    });

    // 200 = valid key. 401/403 = bad key.
    expect(res.status).toBe(200);
  }, 20000);
});
