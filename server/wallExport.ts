/**
 * GET /api/wall-export/:slug
 * Generates and streams a PPTX file containing all approved (showOnWall=true)
 * guest messages for the given invitation slug.
 *
 * Design: NO slide master / NO placeholders.
 * Every shape is placed with explicit absolute coordinates so the layout is
 * pixel-perfect and identical on every slide — no PowerPoint inheritance needed.
 *
 * Slide layout (10 × 5.625 inches, 16:9 widescreen):
 *   y=0.00 – 0.35  top ornament line
 *   y=0.42 – 0.90  opening quote mark (decorative)
 *   y=1.10 – 3.90  MESSAGE TEXT BOX  ← true vertical centre of slide
 *   y=4.10 – 4.40  ✦ divider
 *   y=4.40 – 5.10  guest name
 *   y=5.27 – 5.625 bottom ornament line
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
const BG_DARK  = "0A0F1E";
const GOLD     = "D4AF37";
const GOLD_DIM = "8B6914";
const CREAM    = "F5E6B3";
const SLIDE_W  = 10;      // inches (widescreen 16:9)
const SLIDE_H  = 5.625;   // inches

// ── Layout constants (all in inches) ─────────────────────────────────────────
// Message text box: centred in the slide.
// Slide centre = 5.625 / 2 = 2.8125"
// We give the message box 2.8" height, so:
//   y = 2.8125 - (2.8 / 2) = 1.4125  → round to 1.4
//   h = 2.8
const MSG_Y = 1.4;
const MSG_H = 2.8;
const MSG_X = 0.6;
const MSG_W = SLIDE_W - 1.2;

// Guest name row
const NAME_Y = 4.35;
const NAME_H = 0.75;
const NAME_X = 0.5;
const NAME_W = SLIDE_W - 1.0;

// Divider ✦ above name
const DIV_Y = 4.1;

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
 * Inject <p:transition advTm="{ms}" advClick="0"> into every slide XML
 * so PowerPoint auto-advances without clicking.
 */
function injectAutoAdvance(pptxBuffer: Buffer, advanceMs: number): Buffer {
  const zip = new AdmZip(pptxBuffer);
  const entries = zip.getEntries();
  const transitionXml = `<p:transition advClick="0" advTm="${advanceMs}"><p:fade/></p:transition>`;

  for (const entry of entries) {
    if (/^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName)) {
      let xml = zip.readAsText(entry);
      if (!xml.includes("<p:transition")) {
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

// ── Add a single background + ornaments to a slide ───────────────────────────
function addSlideBackground(pptx: any, slide: any) {
  slide.background = { color: BG_DARK };
  // Top ornament line
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6, y: 0.32, w: SLIDE_W - 1.2, h: 0,
    line: { color: GOLD_DIM, width: 0.5 },
  });
  // Bottom ornament line
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6, y: SLIDE_H - 0.15, w: SLIDE_W - 1.2, h: 0,
    line: { color: GOLD_DIM, width: 0.5 },
  });
  // Opening quote (top-left, decorative)
  slide.addText("\u201C", {
    x: 0.1, y: 0.38, w: 0.7, h: 0.7,
    color: GOLD_DIM, fontSize: 44, fontFace: "Georgia",
    valign: "top", align: "left",
  });
  // Closing quote (bottom-right of message area, decorative)
  slide.addText("\u201D", {
    x: SLIDE_W - 0.8, y: MSG_Y + MSG_H - 0.6, w: 0.7, h: 0.7,
    color: GOLD_DIM, fontSize: 44, fontFace: "Georgia",
    valign: "bottom", align: "right",
  });
}

// ── PPTX builder ─────────────────────────────────────────────────────────────
async function buildPptx(
  messages: { guestName: string; message: string; attending: boolean; partySize: number }[],
  coupleTitle: string,
  photoBase64: string | null
): Promise<any> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 10 × 5.625 inches = 16:9

  // ── Title slide ─────────────────────────────────────────────────────────────
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BG_DARK };

  if (photoBase64) {
    titleSlide.addImage({ data: photoBase64, x: 0.4, y: 0.6, w: 3.8, h: 4.4, rounding: true });
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
  // Pure absolute positioning — no master, no placeholders, no inheritance.
  // MSG_Y and MSG_H are calculated so the text box is exactly centred vertically.
  messages.forEach((msg) => {
    const isArabic = /[\u0600-\u06FF]/.test(msg.message) || /[\u0600-\u06FF]/.test(msg.guestName);
    const msgFont = isArabic ? "Arial" : "Georgia";
    const nameFont = isArabic ? "Arial" : "Calibri";
    const msgLen = (msg.message || "").length;
    const msgFontSize = msgLen > 300 ? 20 : msgLen > 180 ? 24 : msgLen > 80 ? 28 : 34;

    const slide = pptx.addSlide();
    addSlideBackground(pptx, slide);

    // ── Message text — absolutely centred ──
    // Text box spans y=MSG_Y to y=MSG_Y+MSG_H (1.4" to 4.2")
    // Slide centre = 2.8125"; text box centre = 1.4 + 2.8/2 = 2.8" ✓
    slide.addText(msg.message || "(No message)", {
      x: MSG_X,
      y: MSG_Y,
      w: MSG_W,
      h: MSG_H,
      align: "center",
      valign: "middle",
      color: CREAM,
      fontSize: msgFontSize,
      fontFace: msgFont,
      italic: true,
      rtlMode: isArabic,
      wrap: true,
    });

    // ── Divider ✦ ──
    slide.addText("✦", {
      x: 0, y: DIV_Y, w: SLIDE_W, h: 0.3,
      align: "center", color: GOLD, fontSize: 11,
    });

    // ── Guest name ──
    const nameLabel = msg.guestName + (msg.attending && msg.partySize > 1 ? ` & ${msg.partySize - 1} more` : "");
    slide.addText(nameLabel, {
      x: NAME_X,
      y: NAME_Y,
      w: NAME_W,
      h: NAME_H,
      align: "center",
      valign: "middle",
      color: GOLD,
      fontSize: 22,
      fontFace: nameFont,
      bold: true,
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
      // Gate: invitation must be paid before allowing PPTX export
      const { getDb } = await import("./db");
      const { invitations } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        const invRows = await db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1);
        if (invRows.length === 0) {
          res.status(404).json({ error: "Invitation not found." });
          return;
        }
        if (!invRows[0].isPaid) {
          res.status(402).json({ error: "Payment required. Please complete payment before exporting." });
          return;
        }
      }

      const { messages, title, photoUrl } = await getWallData(slug);

      if (messages.length === 0) {
        res.status(404).json({ error: "No approved messages found for this invitation." });
        return;
      }

      let photoBase64: string | null = null;
      if (photoUrl) {
        const resolvedUrl = photoUrl.startsWith("/")
          ? `http://localhost:${(req.socket as any).localPort || 3000}${photoUrl}`
          : photoUrl;
        photoBase64 = await fetchImageAsBase64(resolvedUrl);
      }

      const pptx = await buildPptx(messages, title, photoBase64);

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
