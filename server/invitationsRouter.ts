import { eq } from "drizzle-orm";
import { z } from "zod";
import { invitations } from "../drizzle/schema";
import { getDb } from "./db";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

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
        title: z.string().default("Untitled"),
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
          fontScale: z.number().optional(),
          arBrideFirstName: z.string().optional(),
          arBrideLastName: z.string().optional(),
          arGroomFirstName: z.string().optional(),
          arGroomLastName: z.string().optional(),
          arVenueName: z.string().optional(),
          arVenueAddress: z.string().optional(),
          arMessage: z.string().optional(),
          sections: z.record(z.string(), z.boolean()),
          couplePhotoUrl: z.string().optional(),
          defaultLang: z.enum(["en", "ar"]).optional(),
          musicUrl: z.string().optional(),
          subHeadline: z.string().optional(),
          arSubHeadline: z.string().optional(),
          hostingLine: z.string().optional(),
          arHostingLine: z.string().optional(),
          rsvpDeadline: z.string().optional(),
          scriptFont: z.string().optional(),
          bodyFontChoice: z.string().optional(),
          showParticles: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
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

      // Store the creator's openId so they can see their own responses later
      const ownerOpenId = ctx?.user?.openId ?? null;

      await db.insert(invitations).values({
        slug,
        title: input.title || "Untitled",
        data: JSON.stringify(input.data),
        ownerOpenId,
      } as any);

      return { slug };
    }),

  delete: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Only the invitation's creator (or the app owner) can delete it
      const { ENV } = await import("./_core/env");
      const existing = await db.select().from(invitations).where(eq(invitations.slug, input.slug)).limit(1);
      if (existing.length === 0) throw new Error("Not found");
      const inv = existing[0];
      const isOwner = inv.ownerOpenId === ctx.user.openId || ctx.user.openId === ENV.ownerOpenId;
      if (!isOwner) throw new Error("Forbidden");
      // Delete related RSVP responses first (cascade)
      const { rsvpResponses } = await import("../drizzle/schema");
      await db.delete(rsvpResponses).where(eq(rsvpResponses.invitationSlug, input.slug));
      // Delete the invitation
      await db.delete(invitations).where(eq(invitations.slug, input.slug));
      return { success: true };
    }),

  uploadMusic: publicProcedure
    .input(z.object({
      base64: z.string(), // data:audio/...;base64,... or raw base64
      mimeType: z.string().default("audio/mpeg"),
    }))
    .mutation(async ({ input }) => {
      const { storagePut } = await import("./storage");
      const raw = input.base64.includes(",") ? input.base64.split(",")[1] : input.base64;
      const buffer = Buffer.from(raw, "base64");
      const ext = input.mimeType.includes("mp4") || input.mimeType.includes("m4a") ? "m4a" : "mp3";
      const { url } = await storagePut(`couple-music/music.${ext}`, buffer, input.mimeType);
      return { url };
    }),

  uploadPhoto: publicProcedure
    .input(z.object({
      base64: z.string(), // data:image/...;base64,... or raw base64
      mimeType: z.string().default("image/jpeg"),
    }))
    .mutation(async ({ input }) => {
      const { storagePut } = await import("./storage");
      // Strip data URL prefix if present
      const raw = input.base64.includes(",") ? input.base64.split(",")[1] : input.base64;
      const buffer = Buffer.from(raw, "base64");
      const ext = input.mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const { url } = await storagePut(`couple-photos/photo.${ext}`, buffer, input.mimeType);
      return { url };
    }),

  resolveMapUrl: publicProcedure
    .input(z.object({ url: z.string() }))
    .query(async ({ input }) => {
      if (!input.url.trim()) return null;
      return await resolveGoogleMapsUrl(input.url);
    }),

  duplicate: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch the original invitation
      const existing = await db.select().from(invitations).where(eq(invitations.slug, input.slug)).limit(1);
      if (existing.length === 0) throw new Error("Not found");
      const original = existing[0];

      // Only the owner can duplicate
      const { ENV } = await import("./_core/env");
      const isOwner = original.ownerOpenId === ctx.user.openId || ctx.user.openId === ENV.ownerOpenId;
      if (!isOwner) throw new Error("Forbidden");

      // Generate a new unique slug
      let newSlug = generateSlug(8);
      let attempts = 0;
      while (attempts < 5) {
        const check = await db.select().from(invitations).where(eq(invitations.slug, newSlug)).limit(1);
        if (check.length === 0) break;
        newSlug = generateSlug(8);
        attempts++;
      }

      // Parse existing data
      let parsedData: Record<string, unknown>;
      try {
        const rawData = original.data as unknown;
        if (typeof rawData === "object" && rawData !== null && !Buffer.isBuffer(rawData)) {
          parsedData = rawData as Record<string, unknown>;
        } else {
          const dataStr = Buffer.isBuffer(rawData) ? (rawData as Buffer).toString("utf8") : String(rawData);
          parsedData = JSON.parse(dataStr);
          if (typeof parsedData === "string") parsedData = JSON.parse(parsedData);
        }
      } catch {
        throw new Error("Failed to parse invitation data");
      }

      // Build title with "Copy of" prefix
      const originalTitle = (original.title as string) || "Untitled";
      const newTitle = originalTitle.startsWith("Copy of ") ? originalTitle : `Copy of ${originalTitle}`;

      await db.insert(invitations).values({
        slug: newSlug,
        title: newTitle,
        data: JSON.stringify(parsedData),
        ownerOpenId: ctx.user.openId,
      } as any);

      return { slug: newSlug };
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
