import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  data: text("data").notNull(), // JSON string
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
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RsvpResponse = typeof rsvpResponses.$inferSelect;
export type InsertRsvpResponse = typeof rsvpResponses.$inferInsert;