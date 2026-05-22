/**
 * GET /api/wall-export/:slug
 * Generates and streams a PPTX file containing all approved (showOnWall=true)
 * guest messages for the given invitation slug.
 *
 * Features:
 * - Dark gold 16:9 widescreen theme
 * - Auto-advance 6 seconds per slide via ZIP post-processing (p:transition XML injection)
 * - Couple photo on title slide (fetched from invitation data)
 * - One message slide per guest, Arabic RTL auto-detected
 * - Large centred text with proper vertical centering
 * - Closing "Thank You" slide
 *
 * This is a raw Express route (not tRPC) because we need to stream binary data.
 * It is PUBLIC — no auth required — matching the WishesWall display page.
 */
import type { Express, Request, Response } from "express";
import _PptxGenJS from "pptxgenjs";
import AdmZip from "adm-zip";
import https from "https";
import http from "http";

// pptxgenjs ships a CJS bundle; tsx ESM interop puts the constructor on .default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PptxGenJS: any =
  typeof _PptxGenJS === "function" ? _PptxGenJS : (_PptxGenJS as any).default;

// ── Colour palette ────────────────────────────────────────────────────────────
const BG_DARK = "0A0F1E";
const GOLD = "D4AF37";
const GOLD_DIM = "8B6914";
const CREAM = "F5E6B3";
const SLIDE_W = 10; // inches (widescreen 16:9)
const SLIDE_H = 5.625; // inches

// Auto-advance: 6 seconds per slide (milliseconds)
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

/**
 * Post-process the generated PPTX buffer:
 * - Inject <p:transition advTm="{ms}" advClick="0"> into every slide XML
 *   so PowerPoint auto-advances without clicking.
 */
function injectAutoAdvance(pptxBuffer: Buffer, advanceMs: number): Buffer {
  const zip = new AdmZip(pptxBuffer);
  const entries = zip.getEntries();

  // Transition XML to inject — placed just before </p:sld>
  // advClick="0" disables click-to-advance; advTm is in milliseconds
  const transitionXml = `<p:transition advClick="0" advTm="${advanceMs}"><p:fade/></p:transition>`;

  for (const entry of entries) {
    // Only process slide XML files (ppt/slides/slide*.xml), not layouts/masters
    if (/^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName)) {
      let xml = zip.readAsText(entry);
      // Only inject if not already present
      if (!xml.includes("<p:transition")) {
        // Insert before the closing </p:sld> tag
        xml = xml.replace("</p:sld>", `${transitionXml}</p:sld>`);
        zip.updateFile(entry.entryName, Buffer.from(xml, "utf8"));
      }
    }
  }

  return zip.toBuffer();
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

// Master slide name constant
const MASTER_NAME = "WeddingWishes";

async function buildPptx(
  messages: { guestName: string; message: string; attending: boolean; partySize: number }[],
  coupleTitle: string,
  photoBase64: string | null
): Promise<any> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 10×5.625 inches = 16:9

  // ── Define Slide Master ──────────────────────────────────────────────────────
  // The master carries:
  //   - Dark background
  //   - Top & bottom gold ornament lines
  //   - A "message" body placeholder spanning the full usable area (y=0.45 to y=4.5)
  //     → PowerPoint centres text inside this placeholder via its own layout engine
  //   - A "name" body placeholder pinned at the bottom
  pptx.defineSlideMaster({
    title: MASTER_NAME,
    background: { color: BG_DARK },
    objects: [
      // Top ornament line
      { line: { x: 0.6, y: 0.35, w: SLIDE_W - 1.2, h: 0, line: { color: GOLD_DIM, width: 0.5 } } },
      // Bottom ornament line
      { line: { x: 0.6, y: SLIDE_H - 0.18, w: SLIDE_W - 1.2, h: 0, line: { color: GOLD_DIM, width: 0.5 } } },
      // Divider ornament above name
      { text: { text: "✦", options: { x: 0, y: 4.27, w: SLIDE_W, h: 0.3, align: "center", color: GOLD, fontSize: 11 } } },
      // Opening quote (decorative, top-left)
      { text: { text: "\u201C", options: { x: 0.1, y: 0.42, w: 0.6, h: 0.6, color: GOLD_DIM, fontSize: 40, fontFace: "Georgia", valign: "top", align: "left" } } },
      // Closing quote (decorative, bottom-right of message area)
      { text: { text: "\u201D", options: { x: SLIDE_W - 0.7, y: 3.8, w: 0.6, h: 0.6, color: GOLD_DIM, fontSize: 40, fontFace: "Georgia", valign: "bottom", align: "right" } } },
      // ── Message placeholder: spans full usable area, centred by PowerPoint ──
      {
        placeholder: {
          options: {
            name: "message",
            type: "body",
            x: 0.5, y: 0.45,
            w: SLIDE_W - 1.0,
            h: 4.05,           // from y=0.45 to y=4.5 — full usable zone
            align: "center",
            valign: "middle",  // PowerPoint centres text in this placeholder
            color: CREAM,
            fontSize: 32,
            fontFace: "Georgia",
            italic: true,
            wrap: true,
          },
          text: "",
        },
      },
      // ── Name placeholder: pinned at bottom ──
      {
        placeholder: {
          options: {
            name: "guestName",
            type: "body",
            x: 0.5, y: 4.6,
            w: SLIDE_W - 1.0,
            h: 0.7,
            align: "center",
            valign: "middle",
            color: GOLD,
            fontSize: 22,
            fontFace: "Calibri",
            bold: true,
            wrap: true,
          },
          text: "",
        },
      },
    ],
  });

  // ── Title slide ─────────────────────────────────────────────────────────────
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BG_DARK };

  if (photoBase64) {
    // Photo on the left half, text on the right
    titleSlide.addImage({
      data: photoBase64,
      x: 0.4, y: 0.6, w: 3.8, h: 4.4,
      rounding: true,
    });
    titleSlide.addShape(pptx.ShapeType.line, { x: 5.0, y: 1.6, w: 4.5, h: 0, line: { color: GOLD_DIM, width: 0.75 } });
    titleSlide.addShape(pptx.ShapeType.line, { x: 5.0, y: 3.9, w: 4.5, h: 0, line: { color: GOLD_DIM, width: 0.75 } });
    titleSlide.addText("✦", { x: 5.0, y: 0.8, w: 4.5, h: 0.5, align: "center", color: GOLD_DIM, fontSize: 14 });
    titleSlide.addText("Wedding Wishes", { x: 4.8, y: 1.7, w: 4.8, h: 1, align: "center", color: GOLD, fontSize: 36, fontFace: "Georgia", italic: true });
    titleSlide.addText(coupleTitle, { x: 4.8, y: 2.75, w: 4.8, h: 0.7, align: "center", color: CREAM, fontSize: 20, fontFace: "Calibri" });
    titleSlide.addText("✦", { x: 5.0, y: 4.0, w: 4.5, h: 0.5, align: "center", color: GOLD_DIM, fontSize: 14 });
  } else {
    titleSlide.addShape(pptx.ShapeType.line, { x: 1.5, y: 1.6, w: 7, h: 0, line: { color: GOLD_DIM, width: 0.75 } });
    titleSlide.addShape(pptx.ShapeType.line, { x: 1.5, y: 3.9, w: 7, h: 0, line: { color: GOLD_DIM, width: 0.75 } });
    titleSlide.addText("✦", { x: 0, y: 0.8, w: SLIDE_W, h: 0.5, align: "center", color: GOLD_DIM, fontSize: 14 });
    titleSlide.addText("Wedding Wishes", { x: 0.5, y: 1.7, w: 9, h: 1, align: "center", color: GOLD, fontSize: 44, fontFace: "Georgia", italic: true });
    titleSlide.addText(coupleTitle, { x: 0.5, y: 2.75, w: 9, h: 0.7, align: "center", color: CREAM, fontSize: 22, fontFace: "Calibri" });
    titleSlide.addText("✦", { x: 0, y: 4.0, w: SLIDE_W, h: 0.5, align: "center", color: GOLD_DIM, fontSize: 14 });
  }

  // ── One message slide per guest ──────────────────────────────────────────────
  // Each slide uses the MASTER_NAME layout so it inherits the dark background,
  // ornament lines, and placeholder definitions. We only fill in the content.
  // PowerPoint's own layout engine handles vertical centering via the placeholder.
  messages.forEach((msg) => {
    const isArabic = /[\u0600-\u06FF]/.test(msg.message) || /[\u0600-\u06FF]/.test(msg.guestName);
    const msgFont = isArabic ? "Arial" : "Georgia";
    const nameFont = isArabic ? "Arial" : "Calibri";
    const msgLen = (msg.message || "").length;
    const msgFontSize = msgLen > 300 ? 22 : msgLen > 180 ? 26 : msgLen > 80 ? 30 : 36;

    // Add slide using the master layout — inherits background + ornaments + placeholders
    const slide = pptx.addSlide({ masterName: MASTER_NAME });

    // Fill the "message" placeholder.
    // Only set fontSize (scales with length) and rtlMode — all other styling
    // (align, valign, color, font, italic) is inherited from the master placeholder
    // so that manual edits to the master in PowerPoint propagate to all slides.
    slide.addText(msg.message || "(No message)", {
      placeholder: "message",
      fontSize: msgFontSize,
      rtlMode: isArabic,
    });

    // Fill the "guestName" placeholder — inherit all styling from master
    const nameLabel = msg.guestName + (msg.attending && msg.partySize > 1 ? ` & ${msg.partySize - 1} more` : "");
    slide.addText(nameLabel, {
      placeholder: "guestName",
      rtlMode: isArabic,
    });
  });

  // ── Closing slide ────────────────────────────────────────────────────────────
  const endSlide = pptx.addSlide();
  endSlide.background = { color: BG_DARK };
  endSlide.addShape(pptx.ShapeType.line, { x: 1.5, y: 2.0, w: 7, h: 0, line: { color: GOLD_DIM, width: 0.75 } });
  endSlide.addShape(pptx.ShapeType.line, { x: 1.5, y: 3.5, w: 7, h: 0, line: { color: GOLD_DIM, width: 0.75 } });
  endSlide.addText("✦  Thank You  ✦", {
    x: 0.5, y: 0, w: 9, h: SLIDE_H,
    align: "center", valign: "middle",
    color: GOLD, fontSize: 40,
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
        const resolvedUrl = photoUrl.startsWith("/")
          ? `http://localhost:${(req.socket as any).localPort || 3000}${photoUrl}`
          : photoUrl;
        photoBase64 = await fetchImageAsBase64(resolvedUrl);
      }

      const pptx = await buildPptx(messages, title, photoBase64);

      // Write to buffer, then inject auto-advance timing via ZIP post-processing
      const rawBuffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
      const finalBuffer = injectAutoAdvance(rawBuffer, AUTO_ADVANCE_MS);

      const filename = `${title.replace(/[^a-z0-9]/gi, "_")}_Wishes_Wall.pptx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", finalBuffer.length);
      res.send(finalBuffer);
    } catch (err) {
      console.error("[wall-export] Error:", err);
      res.status(500).json({ error: "Failed to generate presentation." });
    }
  });
}
