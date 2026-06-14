import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { insertRsvp, getRsvpsBySlug, getRsvpSummaryBySlug, incrementInvitationViews } from "./db";
import { ENV } from "./_core/env";

export const rsvpRouter = router({
  /**
   * Public — any guest can submit an RSVP for a given invitation slug.
   */
  submit: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(16),
        guestName: z.string().min(1).max(128).trim(),
        partySize: z.number().int().min(1).max(50),
        attending: z.boolean().default(true),
        message: z.string().max(500).optional(),
        phone: z.string().max(32).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // ── Demo slug guard ──────────────────────────────────────────────────────────────────────────────
      const DEMO_SLUGS = ["demo-royal", "demo-blush", "demo-ivory"];
      if (DEMO_SLUGS.includes(input.slug)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "RSVP is disabled on demo invitations." });
      }
      // ── Event-date read-only guard ──────────────────────────────────────────────────────────────────
      // Fetch the invitation to check event date and payment status
      try {
        const { getDb } = await import("./db");
        const { invitations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          const rows = await db.select().from(invitations).where(eq(invitations.slug, input.slug)).limit(1);
          if (rows.length > 0) {
            const inv = rows[0];
            // Block if not paid
            if (!inv.isPaid) {
              throw new TRPCError({ code: "FORBIDDEN", message: "This invitation is not yet active." });
            }
            // Block if event date has passed (give 1-day grace period)
            if (inv.data) {
              try {
                const rawData = inv.data as unknown;
                const dataStr = Buffer.isBuffer(rawData) ? (rawData as Buffer).toString("utf8") : String(rawData);
                const parsed = typeof rawData === "object" && rawData !== null && !Buffer.isBuffer(rawData)
                  ? rawData as any
                  : JSON.parse(dataStr);
                const eventDateStr = parsed?.date as string | undefined;
                if (eventDateStr) {
                  const eventDate = new Date(eventDateStr);
                  const cutoff = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // +1 day grace
                  if (!isNaN(eventDate.getTime()) && new Date() > cutoff) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "RSVP submissions are closed — the event has already taken place." });
                  }
                }
              } catch (parseErr: any) {
                if (parseErr?.code === "FORBIDDEN") throw parseErr;
                // ignore parse errors
              }
            }
          }
        }
      } catch (guardErr: any) {
        if (guardErr?.code === "FORBIDDEN") throw guardErr;
        // ignore DB errors — don't block RSVP on infra issues
      }

      await insertRsvp({
        invitationSlug: input.slug,
        guestName: input.guestName,
        partySize: input.attending ? input.partySize : 0,
        attending: input.attending,
        message: input.message ?? null,
        phone: input.phone ?? null,
      });
      return { success: true };
    }),

  /**
   * Public — called when a guest opens the invitation page.
   * Increments the view counter for the invitation.
   */
  trackView: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(16) }))
    .mutation(async ({ input }) => {
      await incrementInvitationViews(input.slug);
      return { success: true };
    }),

  /**
   * Protected — only the invitation's creator (or the app owner) can view RSVP responses.
   * Returns the full list of responses plus a summary for a given slug.
   */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string().min(1).max(16) }))
    .query(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { invitations } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check that the caller owns this invitation (or is the global app owner)
      const inv = await db.select().from(invitations).where(eq(invitations.slug, input.slug)).limit(1);
      if (inv.length === 0) return { responses: [], summary: { totalGuests: 0, responseCount: 0 } };

      const isOwner =
        inv[0].ownerOpenId === ctx.user.openId ||
        ctx.user.openId === ENV.ownerOpenId;

      if (!isOwner) return { responses: [], summary: { totalGuests: 0, responseCount: 0 } };

      const [responses, summary] = await Promise.all([
        getRsvpsBySlug(input.slug),
        getRsvpSummaryBySlug(input.slug),
      ]);
      return { responses, summary };
    }),

  /**
   * Protected — returns all invitations owned by the signed-in user,
   * grouped with their RSVP summaries. Used by the RSVP dashboard.
   * The global app owner sees ALL invitations (for admin purposes).
   */
  /**
   * Protected — deletes all RSVP responses for a given slug.
   * Only the invitation's creator (or the app owner) can do this.
   */
  clearResponses: protectedProcedure
    .input(z.object({ slug: z.string().min(1).max(16) }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { rsvpResponses, invitations } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const inv = await db.select().from(invitations).where(eq(invitations.slug, input.slug)).limit(1);
      if (inv.length === 0) throw new Error("Not found");

      const isOwner = inv[0].ownerOpenId === ctx.user.openId || ctx.user.openId === ENV.ownerOpenId;
      if (!isOwner) throw new Error("Forbidden");

      await db.delete(rsvpResponses).where(eq(rsvpResponses.invitationSlug, input.slug));
      return { success: true };
    }),

  /**
   * Protected — toggles the showOnWall flag for a single RSVP response.
   * Only the invitation owner (or app owner) can moderate messages.
   */
  toggleShowOnWall: protectedProcedure
    .input(z.object({
      responseId: z.number().int(),
      showOnWall: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { rsvpResponses, invitations } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch the response to check ownership via the invitation
      const resp = await db.select().from(rsvpResponses).where(eq(rsvpResponses.id, input.responseId)).limit(1);
      if (resp.length === 0) throw new Error("Not found");

      const inv = await db.select().from(invitations).where(eq(invitations.slug, resp[0].invitationSlug)).limit(1);
      if (inv.length === 0) throw new Error("Not found");

      const isOwner = inv[0].ownerOpenId === ctx.user.openId || ctx.user.openId === ENV.ownerOpenId;
      if (!isOwner) throw new Error("Forbidden");

      await db.update(rsvpResponses).set({ showOnWall: input.showOnWall }).where(eq(rsvpResponses.id, input.responseId));
      return { success: true };
    }),

  /**
   * Public — returns only the approved (showOnWall=true) responses for a given slug.
   * Used by the Wedding Wishes Wall display page.
   */
  getWallMessages: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(16) }))
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const { rsvpResponses } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return { messages: [] };

      const rows = await db
        .select()
        .from(rsvpResponses)
        .where(and(
          eq(rsvpResponses.invitationSlug, input.slug),
          eq(rsvpResponses.showOnWall, true)
        ))
        .orderBy(rsvpResponses.createdAt);

      return {
        messages: rows.map((r) => ({
          id: r.id,
          guestName: r.guestName,
          message: r.message ?? "",
          attending: r.attending,
          partySize: r.partySize,
          createdAt: r.createdAt,
        })),
      };
    }),

  getAllSlugs: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { rsvpResponses, invitations } = await import("../drizzle/schema");
    const { sql, eq, or, isNull } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

      const isAppOwner = ctx.user.openId === ENV.ownerOpenId;

    // App owner sees all invitations; other users see only their own
    const allInvitations = isAppOwner
      ? await db.select().from(invitations).orderBy(invitations.createdAt)
      : await db
          .select()
          .from(invitations)
          .where(eq(invitations.ownerOpenId, ctx.user.openId))
          .orderBy(invitations.createdAt);

    if (allInvitations.length === 0) return { slugs: [] };

    // Get per-slug RSVP summaries
    const rsvpSummaries = await db
      .select({
        slug: rsvpResponses.invitationSlug,
        totalGuests: sql<number>`SUM(CASE WHEN ${rsvpResponses.attending} = 1 THEN ${rsvpResponses.partySize} ELSE 0 END)`,
        responseCount: sql<number>`COUNT(*)`,
        confirmedCount: sql<number>`SUM(CASE WHEN ${rsvpResponses.attending} = 1 THEN 1 ELSE 0 END)`,
        declinedCount: sql<number>`SUM(CASE WHEN ${rsvpResponses.attending} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(rsvpResponses)
      .groupBy(rsvpResponses.invitationSlug);

    const summaryMap = new Map(
      rsvpSummaries.map((s) => [
        s.slug,
        {
          totalGuests: Number(s.totalGuests ?? 0),
          responseCount: Number(s.responseCount ?? 0),
          confirmedCount: Number(s.confirmedCount ?? 0),
          declinedCount: Number(s.declinedCount ?? 0),
        },
      ])
    );

    return {
      slugs: allInvitations.map((inv) => {
        let title = inv.title || "Untitled";
        if (!title || title === "Untitled") {
          try {
            const data = JSON.parse(
              Buffer.isBuffer(inv.data) ? (inv.data as unknown as Buffer).toString("utf8") : String(inv.data)
            );
            const bride = data.brideFirstName || "";
            const groom = data.groomFirstName || "";
            if (bride || groom) title = [bride, "&", groom].filter(Boolean).join(" ");
          } catch {}
        }
        const summary = summaryMap.get(inv.slug) ?? {
          totalGuests: 0,
          responseCount: 0,
          confirmedCount: 0,
          declinedCount: 0,
        };
        return {
          slug: inv.slug,
          title,
          createdAt: inv.createdAt,
          views: Number(inv.views ?? 0),
          ...summary,
        };
      }),
    };
  }),
});
