import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { insertRsvp, getRsvpsBySlug, getRsvpSummaryBySlug } from "./db";
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
        message: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await insertRsvp({
        invitationSlug: input.slug,
        guestName: input.guestName,
        partySize: input.partySize,
        message: input.message ?? null,
      });
      return { success: true };
    }),

  /**
   * Protected — only the logged-in owner can view RSVP responses.
   * Returns the full list of responses plus a summary for a given slug.
   */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string().min(1).max(16) }))
    .query(async ({ input, ctx }) => {
      // Only the app owner can view RSVP responses
      if (ctx.user.openId !== ENV.ownerOpenId) {
        return { responses: [], summary: { totalGuests: 0, responseCount: 0 } };
      }
      const [responses, summary] = await Promise.all([
        getRsvpsBySlug(input.slug),
        getRsvpSummaryBySlug(input.slug),
      ]);
      return { responses, summary };
    }),

  /**
   * Protected — returns all RSVPs across every invitation owned by the logged-in user,
   * grouped by invitation slug. Used by the RSVP dashboard.
   */
  getAllSlugs: protectedProcedure.query(async ({ ctx }) => {
    // Verify the caller is the app owner (single-owner app)
    if (ctx.user.openId !== ENV.ownerOpenId) {
      return { slugs: [] };
    }
    const { getDb } = await import("./db");
    const { rsvpResponses, invitations } = await import("../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all invitations for the owner
    const allInvitations = await db.select().from(invitations).orderBy(invitations.createdAt);

    // Get per-slug RSVP summaries
    const rsvpSummaries = await db
      .select({
        slug: rsvpResponses.invitationSlug,
        totalGuests: sql<number>`SUM(${rsvpResponses.partySize})`,
        responseCount: sql<number>`COUNT(*)`,
      })
      .from(rsvpResponses)
      .groupBy(rsvpResponses.invitationSlug);

    const summaryMap = new Map(
      rsvpSummaries.map((s) => [s.slug, { totalGuests: Number(s.totalGuests), responseCount: Number(s.responseCount) }])
    );

    return {
      slugs: allInvitations.map((inv) => {
        let title = "Untitled";
        try {
          const data = JSON.parse(
            Buffer.isBuffer(inv.data) ? (inv.data as unknown as Buffer).toString("utf8") : String(inv.data)
          );
          const bride = data.brideFirstName || "";
          const groom = data.groomFirstName || "";
          if (bride || groom) title = [bride, "&", groom].filter(Boolean).join(" ");
        } catch {}
        const summary = summaryMap.get(inv.slug) ?? { totalGuests: 0, responseCount: 0 };
        return { slug: inv.slug, title, createdAt: inv.createdAt, ...summary };
      }),
    };
  }),
});
