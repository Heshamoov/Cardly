import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Hashed password for email/password auth — null for Google-only accounts */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Google account ID for Google Sign-In — null for email/password accounts */
  googleId: varchar("googleId", { length: 128 }),
  /** Stripe Customer ID — set on first subscription checkout */
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Password reset tokens. We store only the SHA-256 hash of the token,
 * never the raw token. Tokens are single-use and expire after 1 hour.
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  /** FK to users.openId */
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  /** SHA-256 hash (hex) of the raw reset token */
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  /** UTC expiry timestamp */
  expiresAt: timestamp("expiresAt").notNull(),
  /** Set once the token has been consumed */
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Subscription table — one active row per user.
 * status mirrors Stripe subscription statuses.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  /** FK to users.openId */
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull().unique(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }).notNull(),
  /** active | past_due | canceled | unpaid | trialing | paused */
  status: varchar("status", { length: 32 }).notNull().default("active"),
  /** UTC timestamp when current billing period ends */
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  /** How many invitations have been created in this billing period */
  invitationsUsed: int("invitationsUsed").notNull().default(0),
  /** Max invitations allowed per period */
  invitationsLimit: int("invitationsLimit").notNull().default(10),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Invitations table.
 * isPaid is kept for legacy rows but new invitations are gated by subscription.
 */
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 16 }).notNull().unique(),
  title: varchar("title", { length: 128 }).default("Untitled").notNull(),
  data: text("data").notNull(), // JSON string
  views: int("views").notNull().default(0),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }),
  /** Legacy one-time payment flag — kept for backward compat */
  isPaid: boolean("isPaid").notNull().default(false),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

export const rsvpResponses = mysqlTable("rsvp_responses", {
  id: int("id").autoincrement().primaryKey(),
  invitationSlug: varchar("invitationSlug", { length: 16 }).notNull(),
  guestName: varchar("guestName", { length: 128 }).notNull(),
  partySize: int("partySize").notNull().default(1),
  attending: boolean("attending").notNull().default(true),
  message: text("message"),
  phone: varchar("phone", { length: 32 }),
  showOnWall: boolean("showOnWall").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RsvpResponse = typeof rsvpResponses.$inferSelect;
export type InsertRsvpResponse = typeof rsvpResponses.$inferInsert;

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  invitationId: int("invitationId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }).notNull().unique(),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed"]).notNull().default("pending"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  succeededAt: timestamp("succeededAt"),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
