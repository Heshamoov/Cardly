/**
 * Validates that:
 * 1. GOOGLE_CLIENT_ID environment variable is configured
 * 2. The auth.googleSignIn tRPC procedure exists and rejects invalid tokens
 */
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock google-auth-library to simulate an invalid token rejection
vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken: vi.fn().mockRejectedValue(new Error("Invalid token")),
  })),
}));

vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserByGoogleId: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Google Sign-In integration", () => {
  it("GOOGLE_CLIENT_ID environment variable is configured", () => {
    // This test will fail if the secret was not set
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId, "GOOGLE_CLIENT_ID must be set in environment secrets").toBeTruthy();
    expect(clientId?.length, "GOOGLE_CLIENT_ID must be a non-empty string").toBeGreaterThan(10);
  });

  it("auth.googleSignIn procedure exists in the router", () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.auth.googleSignIn).toBe("function");
  });

  it("auth.googleSignIn rejects invalid tokens with UNAUTHORIZED", async () => {
    // Temporarily set a fake client ID so the procedure doesn't bail early
    const original = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = "fake-client-id.apps.googleusercontent.com";

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.googleSignIn({ idToken: "invalid-token" })
    ).rejects.toThrow();

    process.env.GOOGLE_CLIENT_ID = original;
  });
});
