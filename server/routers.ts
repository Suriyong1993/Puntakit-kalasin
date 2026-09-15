import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { createActivityLog, getMembersByIds, listActivityLogs, listMembers, updateMembersBulk } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const bulkEditInput = z.object({ ids: z.array(z.number().int().positive()).min(1).max(500), area: z.string().trim().min(1).max(80).optional(), groupName: z.string().trim().min(1).max(160).optional(), status: z.enum(["ติดตามแล้ว", "ต้องติดตาม"]).optional() }).refine((value) => value.area || value.groupName || value.status, { message: "อย่างน้อยหนึ่งฟิลด์ต้องถูกแก้ไข" });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  members: router({
    list: protectedProcedure.query(() => listMembers()),
    bulkUpdate: adminProcedure.input(bulkEditInput).mutation(async ({ input, ctx }) => {
      const before = await getMembersByIds(input.ids);
      const patch = { ...(input.area ? { area: input.area } : {}), ...(input.groupName ? { groupName: input.groupName } : {}), ...(input.status ? { status: input.status } : {}) };
      const updated = await updateMembersBulk(input.ids, patch);
      await createActivityLog({ actorId: ctx.user.id, action: "bulk_updated", entityType: "member", memberName: `${input.ids.length} สมาชิก`, summary: `แก้ไขข้อมูลสมาชิก ${input.ids.length} รายการ`, metadata: JSON.stringify({ ids: input.ids, before, patch }) });
      return updated;
    }),
  }),
  activityLog: router({ list: adminProcedure.query(() => listActivityLogs()) }),
});

export type AppRouter = typeof appRouter;
