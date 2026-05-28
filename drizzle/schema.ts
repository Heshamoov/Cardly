import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 16 }).notNull().unique(),
  title: varchar("title", { length: 128 }).default("Untitled").notNull(),
  data: text("data").notNull(), // JSON string
  /** Number of times the invitation page has been opened by guests */
  views: int("views").notNull().default(0),
  /** The openId of the user who created this invitation (null = legacy/public) */
  ownerOpenId: varchar("ownerOpenId", { length: 64 }),
  /** Whether this invitation has been paid for */
  isPaid: boolean("isPaid").notNull().default(false),
  /** Stripe Payment Intent ID for this invitation */
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  /** Timestamp when payment was completed */
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
  /** Guest's mobile number for follow-up calls (optional) */
  phone: varchar("phone", { length: 32 }),
  /** Whether this response is approved to show on the Wedding Wishes Wall */
  showOnWall: boolean("showOnWall").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RsvpResponse = typeof rsvpResponses.$inferSelect;
export type InsertRsvpResponse = typeof rsvpResponses.$inferInsert;

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to invitations table */
  invitationId: int("invitationId").notNull(),
  /** Stripe Payment Intent ID */
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }).notNull().unique(),
  /** Amount in smallest currency unit (e.g., fils for AED) */
  amount: int("amount").notNull(),
  /** Currency code (e.g., 'AED', 'USD', 'EUR') */
  currency: varchar("currency", { length: 3 }).notNull(),
  /** Payment status: pending, succeeded, failed */
  status: mysqlEnum("status", ["pending", "succeeded", "failed"]).notNull().default("pending"),
  /** Stripe Customer ID */
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  /** User's email at time of payment */
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  succeededAt: timestamp("succeededAt"),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;