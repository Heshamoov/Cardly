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

// Resolve a Google Maps short URL (maps.app.goo.gl) to real coordinates/place
async function resolveGoogleMapsUrl(input: string): Promise<{ embedUrl: string; directionsUrl: string; label: string }> {
  const trimmed = input.trim();

  // If it's a short URL, follow the redirect to get the real URL
  let resolvedUrl = trimmed;
  if (trimmed.includes("maps.app.goo.gl") || trimmed.includes("goo.gl/maps")) {
    try {
      const response = await fetch(trimmed, {
        method: "HEAD",
        redirect: "follow",
      });
      resolvedUrl = response.url;
    } catch {
      // If fetch fails, fall back to using the input as a text search
      resolvedUrl = trimmed;
    }
  }

  // Extract coordinates from the resolved URL (e.g. /@24.1849284,55.6486427,)
  const coordMatch = resolvedUrl.match(/@(-?[\d.]+),(-?[\d.]+)/);
  if (coordMatch) {
    const lat = coordMatch[1];
    const lng = coordMatch[2];
    const query = `${lat},${lng}`;
    return {
      embedUrl: `https://maps.google.com/maps?q=${query}&output=embed`,
      directionsUrl: `https://maps.google.com/maps?q=${query}`,
      label: query,
    };
  }

  // Extract place name from URL
  const placeMatch = resolvedUrl.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&output=embed`,
      directionsUrl: `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}`,
      label: placeName,
    };
  }

  // Extract q= param
  const qMatch = resolvedUrl.match(/[?&]q=([^&]+)/);
  if (qMatch) {
    const q = decodeURIComponent(qMatch[1]);
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`,
      directionsUrl: `https://maps.google.com/maps?q=${encodeURIComponent(q)}`,
      label: q,
    };
  }

  // Fallback: treat as plain text search
  return {
    embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`,
    directionsUrl: `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}`,
    label: trimmed,
  };
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
          envelopeStyle: z.string().optional(),
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

  resolveMapUrl: publicProcedure
    .input(z.object({ url: z.string() }))
    .query(async ({ input }) => {
      if (!input.url.trim()) return null;
      return await resolveGoogleMapsUrl(input.url);
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

      let parsedData;
      try {
        const rawData = result[0].data as unknown;
        // drizzle-orm with mysql2 may auto-parse JSON text columns into objects,
        // or return them as strings or Buffers depending on the driver version.
        if (typeof rawData === "object" && rawData !== null && !Buffer.isBuffer(rawData)) {
          // Already parsed by drizzle
          parsedData = rawData;
        } else {
          // Convert Buffer or string to string, then parse
          const dataStr = Buffer.isBuffer(rawData)
            ? (rawData as Buffer).toString("utf8")
            : String(rawData);
          parsedData = JSON.parse(dataStr);
          if (typeof parsedData === "string") {
            parsedData = JSON.parse(parsedData);
          }
        }
        if (typeof parsedData !== "object" || parsedData === null) return null;
      } catch {
        return null;
      }

      return {
        ...result[0],
        data: parsedData,
      };
    }),
});
