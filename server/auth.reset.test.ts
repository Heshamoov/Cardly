/**
 * Tests for password reset procedures: requestPasswordReset, resetPassword
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserByGoogleId: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  createPasswordResetToken: vi.fn(),
  getValidResetToken: vi.fn(),
  markResetTokenUsed: vi.fn(),
  invalidateResetTokensForUser: vi.fn(),
}));

// Mock email module so no real HTTP call is made. Default: email sends
// successfully (the production path). Individual tests can override.
vi.mock("./_core/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: true }),
  buildResetEmailHtml: vi.fn().mockReturnValue("<html></html>"),
}));

import * as db from "./db";

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

describe("auth.requestPasswordReset", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns generic success without creating a token for unknown email", async () => {
    mockDb.getUserByEmail.mockResolvedValue(undefined);

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.requestPasswordReset({
      email: "unknown@example.com",
      origin: "https://yalainvite.com",
    });

    expect(result.success).toBe(true);
    expect(result.emailed).toBe(false);
    expect(mockDb.createPasswordResetToken).not.toHaveBeenCalled();
  });

  it("does not create a token for Google-only accounts (no passwordHash)", async () => {
    mockDb.getUserByEmail.mockResolvedValue({
      openId: "google_abc",
      email: "g@example.com",
      passwordHash: null,
    });

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.requestPasswordReset({
      email: "g@example.com",
      origin: "https://yalainvite.com",
    });

    expect(result.success).toBe(true);
    expect(mockDb.createPasswordResetToken).not.toHaveBeenCalled();
  });

  it("creates a single-use token and emails the reset link for a password account", async () => {
    mockDb.getUserByEmail.mockResolvedValue({
      openId: "email_abc",
      name: "Test",
      email: "test@example.com",
      passwordHash: "$2a$10$hash",
    });
    mockDb.invalidateResetTokensForUser.mockResolvedValue(undefined);
    mockDb.createPasswordResetToken.mockResolvedValue(undefined);

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.requestPasswordReset({
      email: "test@example.com",
      origin: "https://yalainvite.com",
    });

    expect(result.success).toBe(true);
    expect(mockDb.invalidateResetTokensForUser).toHaveBeenCalledWith("email_abc");
    expect(mockDb.createPasswordResetToken).toHaveBeenCalledTimes(1);
    // Email sent successfully -> link is NOT leaked back to the caller.
    expect(result.emailed).toBe(true);
    expect(result.resetUrl).toBeUndefined();
  });

  it("surfaces the reset link only when email delivery fails AND no key is set", async () => {
    const email = await import("./_core/email");
    (email.sendEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sent: false,
      reason: "no_api_key",
    });

    mockDb.getUserByEmail.mockResolvedValue({
      openId: "email_abc",
      name: "Test",
      email: "test@example.com",
      passwordHash: "$2a$10$hash",
    });
    mockDb.invalidateResetTokensForUser.mockResolvedValue(undefined);
    mockDb.createPasswordResetToken.mockResolvedValue(undefined);

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.requestPasswordReset({
      email: "test@example.com",
      origin: "https://yalainvite.com",
    });

    expect(result.success).toBe(true);
    expect(mockDb.createPasswordResetToken).toHaveBeenCalledTimes(1);
    expect(result.emailed).toBe(false);
    // When RESEND_API_KEY is configured in the env, the link must stay hidden
    // even on a failed send; otherwise it is surfaced for the dev fallback.
    if (process.env.RESEND_API_KEY) {
      expect(result.resetUrl).toBeUndefined();
    } else {
      expect(result.resetUrl).toContain("https://yalainvite.com/reset-password?token=");
    }
  });
});

describe("auth.resetPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an invalid or expired token", async () => {
    mockDb.getValidResetToken.mockResolvedValue(undefined);

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.resetPassword({ token: "bad-token-1234567890", newPassword: "newpass123" })
    ).rejects.toThrow("invalid or has expired");
  });

  it("updates the password and consumes the token on a valid request", async () => {
    mockDb.getValidResetToken.mockResolvedValue({
      ownerOpenId: "email_abc",
      tokenHash: "hash",
    });
    mockDb.getUserByOpenId.mockResolvedValue({
      openId: "email_abc",
      email: "test@example.com",
    });
    mockDb.upsertUser.mockResolvedValue(undefined);
    mockDb.markResetTokenUsed.mockResolvedValue(undefined);

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.resetPassword({
      token: "valid-token-1234567890",
      newPassword: "newpass123",
    });

    expect(result.success).toBe(true);
    expect(mockDb.upsertUser).toHaveBeenCalledTimes(1);
    expect(mockDb.markResetTokenUsed).toHaveBeenCalledTimes(1);
  });
});
