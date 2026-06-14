import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertRsvpResponse, rsvpResponses, users, invitations, passwordResetTokens } from "../drizzle/schema";
import { ENV } from './_core/env';
let _db: ReturnType<typeof drizzle> | null = null;
// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  const url = ENV.databaseUrl || process.env.DATABASE_URL;
  if (!_db && url) {
    try {
      _db = drizzle(url);
      console.log("[Database] Connected to:", url.split("@")[1]?.split("/")[0] ?? "unknown");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "passwordHash", "googleId"] as const;
  type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ── RSVP helpers ─────────────────────────────────────────────────────────────

export async function insertRsvp(data: InsertRsvpResponse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(rsvpResponses).values(data);
}

export async function getRsvpsBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(rsvpResponses)
    .where(eq(rsvpResponses.invitationSlug, slug))
    .orderBy(rsvpResponses.createdAt);
}

export async function getRsvpSummaryBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select({ total: sql<number>`SUM(${rsvpResponses.partySize})`, count: sql<number>`COUNT(*)` })
    .from(rsvpResponses)
    .where(eq(rsvpResponses.invitationSlug, slug));
  return { totalGuests: Number(rows[0]?.total ?? 0), responseCount: Number(rows[0]?.count ?? 0) };
}

// ── Password reset token helpers ─────────────────────────────────────────────

/** Persist a single-use reset token (stores only the hash). */
export async function createPasswordResetToken(
  ownerOpenId: string,
  tokenHash: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(passwordResetTokens).values({ ownerOpenId, tokenHash, expiresAt });
}

/** Look up a valid (unused, unexpired) reset token by its hash. */
export async function getValidResetToken(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

/** Mark a reset token as consumed. */
export async function markResetTokenUsed(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.tokenHash, tokenHash));
}

/** Invalidate any outstanding tokens for a user (called before issuing a new one). */
export async function invalidateResetTokensForUser(ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.ownerOpenId, ownerOpenId),
        isNull(passwordResetTokens.usedAt)
      )
    );
}

/** Atomically increment the view counter for an invitation by slug. */
export async function incrementInvitationViews(slug: string) {
  const db = await getDb();
  if (!db) return; // silently skip if DB unavailable
  await db
    .update(invitations)
    .set({ views: sql`${invitations.views} + 1` })
    .where(eq(invitations.slug, slug));
}
