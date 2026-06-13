/**
 * Tests for custom auth procedures: register, login, googleSignIn, logout
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserByGoogleId: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

// Mock google-auth-library
vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      getPayload: () => ({
        sub: "google-user-123",
        email: "google@example.com",
        name: "Google User",
      }),
    }),
  })),
}));

import * as db from "./db";

const mockDb = db as {
  getUserByEmail: ReturnType<typeof vi.fn>;
  getUserByGoogleId: ReturnType<typeof vi.fn>;
  getUserByOpenId: ReturnType<typeof vi.fn>;
  upsertUser: ReturnType<typeof vi.fn>;
};

type SetCookieCall = { name: string; value: string; options: Record<string, unknown> };
type ClearCookieCall = { name: string; options: Record<string, unknown> };

function createPublicContext(): {
  ctx: TrpcContext;
  setCookies: SetCookieCall[];
  clearedCookies: ClearCookieCall[];
} {
  const setCookies: SetCookieCall[] = [];
  const clearedCookies: ClearCookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as unknown as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies };
}

describe("auth.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new user and sets session cookie", async () => {
    mockDb.getUserByEmail.mockResolvedValue(undefined);
    mockDb.upsertUser.mockResolvedValue(undefined);
    mockDb.getUserByOpenId.mockResolvedValue({
      id: 1,
      openId: "email_abc123",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "email",
      role: "user",
      passwordHash: "hashed",
      googleId: null,
      stripeCustomerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const { ctx, setCookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.register({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe("test@example.com");
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("throws CONFLICT if email already exists", async () => {
    mockDb.getUserByEmail.mockResolvedValue({
      id: 1,
      openId: "existing",
      email: "test@example.com",
    });

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        name: "Test",
        email: "test@example.com",
        password: "password123",
      })
    ).rejects.toThrow("already exists");
  });
});

describe("auth.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws UNAUTHORIZED for wrong password", async () => {
    mockDb.getUserByEmail.mockResolvedValue({
      id: 1,
      openId: "email_abc",
      email: "test@example.com",
      passwordHash: "$2a$10$invalidhash",
    });

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({ email: "test@example.com", password: "wrongpassword" })
    ).rejects.toThrow("Invalid email or password");
  });

  it("throws UNAUTHORIZED if user not found", async () => {
    mockDb.getUserByEmail.mockResolvedValue(undefined);

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({ email: "nobody@example.com", password: "password" })
    ).rejects.toThrow("Invalid email or password");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});
