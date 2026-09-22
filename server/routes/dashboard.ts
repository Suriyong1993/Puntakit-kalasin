import { Router } from "express";
import { and, count, desc, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "../db/client";
import { announcements, members } from "../../shared/schema";
import { requireAuth } from "../middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    const db = getDb();

    // Calculate beginning of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total active members
    const [totalResult] = await db
      .select({ count: count() })
      .from(members)
      .where(isNull(members.deletedAt));
    const totalMembers = Number(totalResult?.count ?? 0);

    // 2. New members this month
    const [newResult] = await db
      .select({ count: count() })
      .from(members)
      .where(and(isNull(members.deletedAt), gte(members.joinedAt, startOfMonth)));
    const newThisMonth = Number(newResult?.count ?? 0);

    // 3. Need follow-up count
    const [needFollowResult] = await db
      .select({ count: count() })
      .from(members)
      .where(and(isNull(members.deletedAt), eq(members.status, "ต้องติดตาม")));
    const needFollowUp = Number(needFollowResult?.count ?? 0);

    // 4. Followed up count
    const [followedResult] = await db
      .select({ count: count() })
      .from(members)
      .where(and(isNull(members.deletedAt), eq(members.status, "ติดตามแล้ว")));
    const followedUp = Number(followedResult?.count ?? 0);

    // 5. In group count (members assigned to a cell group)
    const [inGroupResult] = await db
      .select({ count: count() })
      .from(members)
      .where(and(isNull(members.deletedAt), eq(members.membershipStatus, "active")));
    const activeMembers = Number(inGroupResult?.count ?? 0);

    // 6. Recent 5 members
    const recentMembers = await db
      .select({
        id: members.id,
        name: members.name,
        nickname: members.nickname,
        role: members.role,
        area: members.area,
        status: members.status,
        joinedAt: members.joinedAt,
      })
      .from(members)
      .where(isNull(members.deletedAt))
      .orderBy(desc(members.createdAt))
      .limit(5);

    // 7. Recent announcements
    const recentAnnouncements = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        publishDate: announcements.publishDate,
        status: announcements.status,
      })
      .from(announcements)
      .orderBy(desc(announcements.publishDate))
      .limit(3);

    res.json({
      success: true,
      data: {
        totalMembers,
        newThisMonth,
        needFollowUp,
        followedUp,
        activeMembers,
        recentMembers,
        recentAnnouncements,
      },
    });
  } catch (err) {
    next(err);
  }
});
