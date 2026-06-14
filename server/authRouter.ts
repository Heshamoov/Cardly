/**
 * Custom authentication router — replaces Manus OAuth portal.
 * Supports email/password registration + login, and Google Sign-In.
 * Sessions are JWT cookies signed with JWT_SECRET (same as before).
 */
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { nanoid } from "nanoid";
import { z } from "zod";
import * as db from "./db";
import { ENV } from "./_core/env";
import { sendEmail, buildResetEmailHtml } from "./_core/email";
import { notifyOwner } from "./_core/notification";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

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

  /**
   * Request a password reset. Always returns success (does not reveal whether
   * an account exists). When the user exists with a password, generates a
   * single-use token, emails a reset link, and (in dev / when email isn't
   * configured) returns the link directly so it can be tested.
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const genericResponse = { success: true as const, emailed: false, resetUrl: undefined as string | undefined };

      const user = await db.getUserByEmail(input.email);
      // Only proceed for accounts that actually have a password set.
      if (!user || !user.passwordHash) {
        return genericResponse;
      }

      // Invalidate previous outstanding tokens, then issue a fresh one.
      await db.invalidateResetTokensForUser(user.openId);
      const rawToken = `${nanoid(32)}${nanoid(32)}`;
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await db.createPasswordResetToken(user.openId, tokenHash, expiresAt);

      const resetUrl = `${input.origin.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

      const emailResult = await sendEmail({
        to: input.email,
        subject: "Reset your YalaInvite password",
        html: buildResetEmailHtml(resetUrl, user.name),
        text: `Reset your YalaInvite password using this link (valid for 1 hour): ${resetUrl}`,
      });

      if (emailResult.sent) {
        return { success: true as const, emailed: true, resetUrl: undefined };
      }

      // Always log the link server-side for owner diagnostics.
      console.log(`[PasswordReset] Reset link for ${input.email}: ${resetUrl}`);

      // Send failed. Alert the owner so the problem is never silent — especially
      // the Resend test-mode case (no verified domain), which silently rejects
      // any recipient other than the account owner.
      const isTestModeBlock = emailResult.reason === "test_mode_unverified_domain";
      void notifyOwner({
        title: "YalaInvite: password reset email failed to send",
        content: isTestModeBlock
          ? `A user (${input.email}) requested a password reset but Resend rejected the send because no domain is verified (test mode). Verify a domain at resend.com/domains and set RESEND_FROM_EMAIL to that domain so emails reach all users. Reset link (share manually if needed): ${resetUrl}`
          : `A password reset email to ${input.email} failed (${emailResult.reason ?? "unknown"}). Detail: ${emailResult.detail ?? "n/a"}. Reset link: ${resetUrl}`,
      }).catch(() => {});

      // SECURITY: only surface the link to the client when NO email provider is
      // configured at all (pure dev/testing fallback so the flow is never a dead
      // end). Once RESEND_API_KEY exists, a failed send must NOT leak the token
      // to the caller — otherwise anyone could reset any account's password.
      if (!ENV.resendApiKey) {
        return { success: true as const, emailed: false, resetUrl };
      }
      // Signal to the client that delivery did not succeed (without leaking the
      // token) so the UI can show an honest fallback message.
      return { success: true as const, emailed: false, resetUrl: undefined, deliveryFailed: true };
    }),

  /** Complete a password reset using a token from the email link. */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(10),
        newPassword: z.string().min(6).max(128),
      })
    )
    .mutation(async ({ input }) => {
      const tokenHash = hashToken(input.token);
      const record = await db.getValidResetToken(tokenHash);
      if (!record) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link is invalid or has expired. Please request a new one.",
        });
      }

      const user = await db.getUserByOpenId(record.ownerOpenId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
      await db.upsertUser({ openId: user.openId, passwordHash });
      await db.markResetTokenUsed(tokenHash);

      return { success: true as const };
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
