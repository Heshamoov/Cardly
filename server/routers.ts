import { COOKIE_NAME } from "@shared/const";
// v2 — full invitations router with get, create, resolveMapUrl
import { invitationsRouter } from "./invitationsRouter";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

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
  }),
  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
