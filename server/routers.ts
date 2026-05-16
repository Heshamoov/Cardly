import { COOKIE_NAME } from "@shared/const";
// v2 — full invitations router with get, create, resolveMapUrl
import { invitationsRouter } from "./invitationsRouter";
import { rsvpRouter } from "./rsvpRouter";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  invitations: invitationsRouter,
  rsvp: rsvpRouter,
  debug: router({
    dbCheck: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return { connected: false, error: "getDb returned null", dbUrl: !!process.env.DATABASE_URL };
      try {
        const result = await db.execute("SELECT database() as db, (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=database() AND table_name='invitations') as hasTable, (SELECT COUNT(*) FROM invitations) as rowCount");
        return { connected: true, result: (result as any)[0], dbUrl: !!process.env.DATABASE_URL };
      } catch (e: any) {
        return { connected: false, error: e.message, dbUrl: !!process.env.DATABASE_URL };
      }
    }),
    rawGet: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const { getDb } = await import("./db");
      const { invitations } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return { error: "no db" };
      try {
        const result = await db.select().from(invitations).where(eq(invitations.slug, input.slug)).limit(1);
        if (result.length === 0) return { found: false };
        const raw = result[0].data;
        const isBuffer = Buffer.isBuffer(raw);
        const dataStr = isBuffer ? (raw as Buffer).toString('utf8') : String(raw);
        return { found: true, rawType: typeof raw, isBuffer, rawLength: dataStr.length, rawFirst100: dataStr.substring(0, 100), parseResult: (() => { try { const p = JSON.parse(dataStr); return { type: typeof p, isObj: typeof p === 'object', keys: typeof p === 'object' ? Object.keys(p).slice(0,5) : [] }; } catch(e: any) { return { error: e.message }; } })() };
      } catch (e: any) {
        return { error: e.message };
      }
    }),
    listSlugs: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return { error: "no db" };
      try {
        const rows = await db.execute("SELECT slug, LEFT(data, 100) as data_preview, createdAt FROM invitations ORDER BY createdAt DESC LIMIT 10");
        return { rows: (rows as any)[0] };
      } catch (e: any) {
        return { error: e.message };
      }
    }),
  }),
  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
