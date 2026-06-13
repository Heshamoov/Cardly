/**
 * Custom authentication router — replaces Manus OAuth portal.
 * Supports email/password registration + login, and Google Sign-In.
 * Sessions are JWT cookies signed with JWT_SECRET (same as before).
 */
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { nanoid } from "nanoid";
import { z } from "zod";
import * as db from "./db";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const SALT_ROUNDS = 10;

function generateOpenId(prefix: string): string {
  return `${prefix}_${nanoid(20)}`;
}

async function issueSession(
  res: any,
  req: any,
  openId: string,
  name: string
): Promise<void> {
  const token = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export const authRouter = router({
  /** Return current authenticated user (or null) */
  me: publicProcedure.query((opts) => opts.ctx.user),

  /** Register with email + password */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        email: z.string().email().max(320),
        password: z.string().min(6).max(128),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
      const openId = generateOpenId("email");

      // Auto-promote owner email to admin
      const isOwner =
        (ENV.ownerEmail && input.email === ENV.ownerEmail) ||
        (ENV.ownerOpenId && openId === ENV.ownerOpenId);

      await db.upsertUser({
        openId,
        name: input.name,
        email: input.email,
        loginMethod: "email",
        passwordHash,
        role: isOwner ? "admin" : "user",
        lastSignedIn: new Date(),
      });

      await issueSession(ctx.res, ctx.req, openId, input.name);
      const user = await db.getUserByOpenId(openId);
      return { success: true, user };
    }),

  /** Login with email + password */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      await issueSession(ctx.res, ctx.req, user.openId, user.name ?? "");
      return { success: true, user };
    }),

  /** Verify Google ID token from frontend Google Sign-In button */
  googleSignIn: publicProcedure
    .input(
      z.object({
        idToken: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ENV.googleClientId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Google Sign-In is not configured.",
        });
      }

      const client = new OAuth2Client(ENV.googleClientId);
      let ticket;
      try {
        ticket = await client.verifyIdToken({
          idToken: input.idToken,
          audience: ENV.googleClientId,
        });
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Google token.",
        });
      }

      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Could not read Google account info.",
        });
      }

      const googleId = payload.sub;
      const email = payload.email ?? null;
      const name = payload.name ?? payload.email ?? "Google User";

      // Find existing user by googleId or email
      let user = await db.getUserByGoogleId(googleId);
      if (!user && email) {
        user = await db.getUserByEmail(email);
      }

      if (user) {
        // Update googleId if not set yet (email account upgrading to Google)
        await db.upsertUser({
          openId: user.openId,
          googleId,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });
      } else {
        // Create new user
        const openId = generateOpenId("google");
        const isOwner = ENV.ownerEmail && email === ENV.ownerEmail;
        await db.upsertUser({
          openId,
          name,
          email,
          googleId,
          loginMethod: "google",
          role: isOwner ? "admin" : "user",
          lastSignedIn: new Date(),
        });
        user = await db.getUserByOpenId(openId);
      }

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user account.",
        });
      }

      await issueSession(ctx.res, ctx.req, user.openId, user.name ?? "");
      return { success: true, user };
    }),

  /** Logout — clear session cookie */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  /** Change password (requires current password) */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6).max(128),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      if (user.passwordHash) {
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Current password is incorrect.",
          });
        }
      }

      const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
      await db.upsertUser({ openId: user.openId, passwordHash });
      return { success: true };
    }),
});
