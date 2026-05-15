import { eq } from "drizzle-orm";
import { z } from "zod";
import { invitations } from "../drizzle/schema";
import { getDb } from "./db";
import { publicProcedure, router } from "./_core/trpc";

function generateSlug(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const invitationsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        data: z.object({
          brideFirstName: z.string(),
          brideLastName: z.string().optional(),
          groomFirstName: z.string(),
          groomLastName: z.string().optional(),
          date: z.string(),
          time: z.string(),
          venueName: z.string(),
          venueAddress: z.string(),
          venueMapQuery: z.string(),
          message: z.string().optional(),
          sections: z.record(z.string(), z.boolean()),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let slug = generateSlug(8);
      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 5) {
        const existing = await db
          .select()
          .from(invitations)
          .where(eq(invitations.slug, slug))
          .limit(1);
        if (existing.length === 0) break;
        slug = generateSlug(8);
        attempts++;
      }

      await db.insert(invitations).values({
        slug,
        data: JSON.stringify(input.data),
      } as any);

      return { slug };
    }),

  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(invitations)
        .where(eq(invitations.slug, input.slug))
        .limit(1);

      if (result.length === 0) return null;

      return {
        ...result[0],
        data: JSON.parse(result[0].data),
      };
    }),
});
