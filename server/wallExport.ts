/**
 * GET /api/wall-export/:slug
 * Generates and streams a PPTX file containing all approved (showOnWall=true)
 * guest messages for the given invitation slug.
 *
 * Features:
 * - Dark gold 16:9 widescreen theme
 * - Auto-advance set to 6 seconds per slide (hands-free TV playback)
 * - Couple photo on title slide (fetched from invitation data)
 * - One message slide per guest, Arabic RTL auto-detected
 * - Closing "Thank You" slide
 *
 * This is a raw Express route (not tRPC) because we need to stream binary data.
 * It is PUBLIC — no auth required — matching the WishesWall display page.
 */
import type { Express, Request, Response } from "express";
import _PptxGenJS from "pptxgenjs";
import https from "https";
import http from "http";

// pptxgenjs ships a CJS bundle; tsx ESM interop puts the constructor on .default
const PptxGenJS: typeof _PptxGenJS =
  (typeof _PptxGenJS === "function" ? _PptxGenJS : (_PptxGenJS as any).default) as typeof _PptxGenJS;

// ── Colour palette ────────────────────────────────────────────────────────────
const BG_DARK = "0A0F1E";
const GOLD = "D4AF37";
const GOLD_DIM = "8B6914";
const CREAM = "F5E6B3";
const SLIDE_W = 10; // inches (widescreen 16:9)

// Auto-advance: 6 seconds per slide (in milliseconds for pptxgenjs)
const AUTO_ADVANCE_MS = 6000;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fetch a remote URL and return a base64 data URI, or null on failure. */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith("https") ? https : http;
      const req = client.get(url, { timeout: 8000 }, (res) => {
        if (res.statusCode && res.statusCode >= 400) { resolve(null); return; }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const contentType = res.headers["content-type"] ?? "image/jpeg";
          resolve(`data:${contentType};base64,${buf.toString("base64")}`);
        });
        res.on("error", () => resolve(null));
      });
      req.on("error", () => resolve(null));
      req.on("timeout", () => { req.destroy(); resolve(null); });
    } catch {
      resolve(null);
    }
  });
}

async function getWallData(slug: string) {
  const { getDb } = await import("./db");
  const { rsvpResponses, invitations } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return { messages: [], title: "Wedding Wishes", photoUrl: null as string | null };

  const [rows, inv] = await Promise.all([
    db
      .select()
      .from(rsvpResponses)
      .where(and(eq(rsvpResponses.invitationSlug, slug), eq(rsvpResponses.showOnWall, true)))
      .orderBy(rsvpResponses.createdAt),
    db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1),
  ]);

  let title = "Wedding Wishes";
  let photoUrl: string | null = null;

  if (inv.length > 0) {
    try {
      const data = JSON.parse(
        Buffer.isBuffer(inv[0].data)
          ? (inv[0].data as unknown as Buffer).toString("utf8")
          : String(inv[0].data)
      );
      const bride = data.brideFirstName || "";
      const groom = data.groomFirstName || "";
      if (bride || groom) title = `${bride} & ${groom}`;
      // couplePhoto is stored as a URL string in the invitation data
      if (data.couplePhoto && typeof data.couplePhoto === "string") {
        photoUrl = data.couplePhoto;
      }
    } catch {}
    if (inv[0].title && inv[0].title !== "Untitled") title = inv[0].title;
  }

  return {
    messages: rows.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      message: r.message ?? "",
      attending: r.attending,
      partySize: r.partySize,
    })),
    title,
    photoUrl,
  };
}

// ── PPTX builder ─────────────────────────────────────────────────────────────

async function buildPptx(
  messages: { guestName: string; message: string; attending: boolean; partySize: number }[],
  coupleTitle: string,
  photoBase64: string | null
): Promise<PptxGenJS> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 10×5.625 inches = 16:9

  // ── Title slide ─────────────────────────────────────────────────────────────
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BG_DARK };
  // Auto-advance after 6 seconds
  (titleSlide as any).slideNumber = undefined;
  (titleSlide as any).transition = { type: "fade", durations: AUTO_ADVANCE_MS };

  if (photoBase64) {
    // Photo on the left half, text on the right
    titleSlide.addImage({
      data: photoBase64,
      x: 0.4, y: 0.6, w: 3.8, h: 4.4,
      rounding: true,
    });

    // Right side decorative lines
    titleSlide.addShape(pptx.ShapeType.line, {
      x: 5.0, y: 1.6, w: 4.5, h: 0,
      line: { color: GOLD_DIM, width: 0.75 },
    });
    titleSlide.addShape(pptx.ShapeType.line, {
      x: 5.0, y: 3.9, w: 4.5, h: 0,
      line: { color: GOLD_DIM, width: 0.75 },
    });
    titleSlide.addText("✦", {
      x: 5.0, y: 0.8, w: 4.5, h: 0.5,
      align: "center", color: GOLD_DIM, fontSize: 14,
    });
    titleSlide.addText("Wedding Wishes", {
      x: 4.8, y: 1.7, w: 4.8, h: 1,
      align: "center", color: GOLD, fontSize: 36,
      fontFace: "Georgia", italic: true,
    });
    titleSlide.addText(coupleTitle, {
      x: 4.8, y: 2.75, w: 4.8, h: 0.7,
      align: "center", color: CREAM, fontSize: 20,
      fontFace: "Calibri",
    });
    titleSlide.addText("✦", {
      x: 5.0, y: 4.0, w: 4.5, h: 0.5,
      align: "center", color: GOLD_DIM, fontSize: 14,
    });
  } else {
    // Centred layout (no photo)
    titleSlide.addShape(pptx.ShapeType.line, {
      x: 1.5, y: 1.6, w: 7, h: 0,
      line: { color: GOLD_DIM, width: 0.75 },
    });
    titleSlide.addShape(pptx.ShapeType.line, {
      x: 1.5, y: 3.9, w: 7, h: 0,
      line: { color: GOLD_DIM, width: 0.75 },
    });
    titleSlide.addText("✦", {
      x: 0, y: 0.8, w: SLIDE_W, h: 0.5,
      align: "center", color: GOLD_DIM, fontSize: 14,
    });
    titleSlide.addText("Wedding Wishes", {
      x: 0.5, y: 1.7, w: 9, h: 1,
      align: "center", color: GOLD, fontSize: 44,
      fontFace: "Georgia", italic: true,
    });
    titleSlide.addText(coupleTitle, {
      x: 0.5, y: 2.75, w: 9, h: 0.7,
      align: "center", color: CREAM, fontSize: 22,
      fontFace: "Calibri",
    });
    titleSlide.addText("✦", {
      x: 0, y: 4.0, w: SLIDE_W, h: 0.5,
      align: "center", color: GOLD_DIM, fontSize: 14,
    });
  }

  // ── One message slide per guest ──────────────────────────────────────────────
  messages.forEach((msg) => {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    (slide as any).transition = { type: "fade", durations: AUTO_ADVANCE_MS };

    const isArabic = /[\u0600-\u06FF]/.test(msg.message) || /[\u0600-\u06FF]/.test(msg.guestName);
    const rtl = isArabic;
    const msgFont = isArabic ? "Arial" : "Georgia";
    const nameFont = isArabic ? "Arial" : "Calibri";

    // Top ornament line
    slide.addShape(pptx.ShapeType.line, {
      x: 1.2, y: 0.55, w: 7.6, h: 0,
      line: { color: GOLD_DIM, width: 0.5 },
    });

    // Opening quote mark
    slide.addText("\u201C", {
      x: 0.3, y: 0.55, w: 1.2, h: 1.0,
      color: GOLD_DIM, fontSize: 72, fontFace: "Georgia", valign: "top",
    });

    // Message text — large, centred, italic
    const msgFontSize = msg.message.length > 200 ? 20 : msg.message.length > 100 ? 24 : 28;
    slide.addText(msg.message || "(No message)", {
      x: 0.8, y: 0.9, w: 8.4, h: 3.0,
      align: "center", valign: "middle",
      color: CREAM, fontSize: msgFontSize,
      fontFace: msgFont, italic: true,
      rtlMode: rtl, wrap: true,
    });

    // Closing quote mark
    slide.addText("\u201D", {
      x: 8.5, y: 2.5, w: 1.2, h: 1.0,
      color: GOLD_DIM, fontSize: 72, fontFace: "Georgia", valign: "bottom",
    });

    // Divider + ornament
    slide.addShape(pptx.ShapeType.line, {
      x: 3.5, y: 4.05, w: 3, h: 0,
      line: { color: GOLD_DIM, width: 0.5 },
    });
    slide.addText("✦", {
      x: 0, y: 3.85, w: SLIDE_W, h: 0.4,
      align: "center", color: GOLD, fontSize: 12,
    });

    // Guest name
    const nameLabel = msg.guestName + (msg.attending && msg.partySize > 1 ? ` & ${msg.partySize - 1} more` : "");
    slide.addText(nameLabel, {
      x: 0.5, y: 4.3, w: 9, h: 0.6,
      align: "center", color: GOLD, fontSize: 18,
      fontFace: nameFont, bold: true, rtlMode: rtl,
    });

    // Bottom ornament line
    slide.addShape(pptx.ShapeType.line, {
      x: 1.2, y: 5.1, w: 7.6, h: 0,
      line: { color: GOLD_DIM, width: 0.5 },
    });
  });

  // ── Closing slide ────────────────────────────────────────────────────────────
  const endSlide = pptx.addSlide();
  endSlide.background = { color: BG_DARK };
  (endSlide as any).transition = { type: "fade", durations: AUTO_ADVANCE_MS };
  endSlide.addShape(pptx.ShapeType.line, {
    x: 1.5, y: 2.0, w: 7, h: 0,
    line: { color: GOLD_DIM, width: 0.75 },
  });
  endSlide.addShape(pptx.ShapeType.line, {
    x: 1.5, y: 3.5, w: 7, h: 0,
    line: { color: GOLD_DIM, width: 0.75 },
  });
  endSlide.addText("✦  Thank You  ✦", {
    x: 0.5, y: 2.1, w: 9, h: 1.3,
    align: "center", valign: "middle",
    color: GOLD, fontSize: 36,
    fontFace: "Georgia", italic: true,
  });

  return pptx;
}

// ── Express route ─────────────────────────────────────────────────────────────

export function registerWallExport(app: Express) {
  app.get("/api/wall-export/:slug", async (req: Request, res: Response) => {
    const slug = (req.params.slug ?? "").replace(/[^a-z0-9_-]/gi, "").slice(0, 16);
    if (!slug) {
      res.status(400).json({ error: "Invalid slug" });
      return;
    }

    try {
      const { messages, title, photoUrl } = await getWallData(slug);

      if (messages.length === 0) {
        res.status(404).json({ error: "No approved messages found for this invitation." });
        return;
      }

      // Fetch couple photo as base64 if available (so it embeds in the PPTX)
      let photoBase64: string | null = null;
      if (photoUrl) {
        // Resolve relative /manus-storage/ paths to absolute using the request host
        const resolvedUrl = photoUrl.startsWith("/")
          ? `http://localhost:${(req.socket as any).localPort || 3000}${photoUrl}`
          : photoUrl;
        photoBase64 = await fetchImageAsBase64(resolvedUrl);
      }

      const pptx = await buildPptx(messages, title, photoBase64);

      const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
      const filename = `${title.replace(/[^a-z0-9]/gi, "_")}_Wishes_Wall.pptx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (err) {
      console.error("[wall-export] Error:", err);
      res.status(500).json({ error: "Failed to generate presentation." });
    }
  });
}
