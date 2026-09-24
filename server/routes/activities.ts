import { Router, type Request } from "express";
import {
  and,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
} from "drizzle-orm";
import { getDb, type Database } from "../db/client";
import {
  groups,
  groupMembers,
  members,
  missionActivities,
  missionActivityMedia,
  missionActivityParticipants,
  users,
  type MissionActivity,
  type UserRole,
} from "../../shared/schema";
import {
  missionActivityInputSchema,
  missionActivityQuerySchema,
  missionActivityUpdateSchema,
} from "../../shared/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";

export const activitiesRouter = Router();
activitiesRouter.use(requireAuth);

const OPERATIONAL_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "staff",
  "ministry_leader",
];

type ActivityRow = {
  id: string;
  type: MissionActivity["type"];
  status: MissionActivity["status"];
  source: MissionActivity["source"];
  visibility: MissionActivity["visibility"];
  occurredAt: Date;
  title: string;
  story: string;
  locationText: string | null;
  latitude: string | null;
  longitude: string | null;
  groupId: string | null;
  createdById: string;
  verifiedById: string | null;
  verifiedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  groupName: string | null;
  groupArea: string | null;
  creatorName: string | null;
};

type ActivityResponse = ActivityRow & {
  participants: Array<{
    id: string;
    name: string;
    nickname: string | null;
    avatarUrl: string | null;
    role: string;
  }>;
  media: Array<{
    id: string;
    type: string;
    url: string;
    caption: string | null;
    sortOrder: number;
  }>;
};

function isOperationalRole(role: UserRole) {
  return OPERATIONAL_ROLES.includes(role);
}

function normalizeOptional(value: string | null | undefined) {
  return value && value.length > 0 ? value : null;
}

function visibilityCondition(req: Request) {
  const user = req.user!;
  if (isOperationalRole(user.role)) return undefined;

  const activeMembership = exists(
    getDb()
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .innerJoin(members, eq(groupMembers.memberId, members.id))
      .where(
        and(
          eq(groupMembers.groupId, missionActivities.groupId),
          eq(groupMembers.status, "active"),
          eq(members.userId, user.id),
          isNull(members.deletedAt)
        )
      )
  );

  const isGroupLeader = exists(
    getDb()
      .select({ id: groups.id })
      .from(groups)
      .where(
        and(
          eq(groups.id, missionActivities.groupId),
          or(eq(groups.leaderId, user.id), eq(groups.coLeaderId, user.id))
        )
      )
  );

  return or(
    eq(missionActivities.visibility, "public"),
    and(
      eq(missionActivities.visibility, "group"),
      or(activeMembership, isGroupLeader)
    ),
    and(eq(missionActivities.visibility, "leaders"), isGroupLeader),
    eq(missionActivities.createdById, user.id)
  );
}

async function canManageGroupActivity(req: Request, groupId: string | null) {
  if (!groupId) return isOperationalRole(req.user!.role);
  if (isOperationalRole(req.user!.role)) return true;

  const db = getDb();
  const [group] = await db
    .select({
      id: groups.id,
      leaderId: groups.leaderId,
      coLeaderId: groups.coLeaderId,
    })
    .from(groups)
    .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
    .limit(1);

  if (!group) throw new NotFoundError("ไม่พบกลุ่มที่ระบุ");
  if (group.leaderId === req.user!.id || group.coLeaderId === req.user!.id)
    return true;

  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .innerJoin(members, eq(groupMembers.memberId, members.id))
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, "active"),
        eq(groupMembers.role, "leader"),
        eq(members.userId, req.user!.id),
        isNull(members.deletedAt)
      )
    )
    .limit(1);

  return Boolean(membership);
}

async function canSubmitToGroup(req: Request, groupId: string | null) {
  if (!groupId || isOperationalRole(req.user!.role)) return true;
  const db = getDb();
  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .innerJoin(members, eq(groupMembers.memberId, members.id))
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, "active"),
        eq(members.userId, req.user!.id),
        isNull(members.deletedAt)
      )
    )
    .limit(1);
  if (membership) return true;
  return canManageGroupActivity(req, groupId);
}

async function getActivityRow(db: Database, id: string) {
  const [row] = await db
    .select({
      id: missionActivities.id,
      type: missionActivities.type,
      status: missionActivities.status,
      source: missionActivities.source,
      visibility: missionActivities.visibility,
      occurredAt: missionActivities.occurredAt,
      title: missionActivities.title,
      story: missionActivities.story,
      locationText: missionActivities.locationText,
      latitude: missionActivities.latitude,
      longitude: missionActivities.longitude,
      groupId: missionActivities.groupId,
      createdById: missionActivities.createdById,
      verifiedById: missionActivities.verifiedById,
      verifiedAt: missionActivities.verifiedAt,
      archivedAt: missionActivities.archivedAt,
      createdAt: missionActivities.createdAt,
      updatedAt: missionActivities.updatedAt,
      groupName: groups.name,
      groupArea: groups.area,
      creatorName: users.name,
    })
    .from(missionActivities)
    .leftJoin(groups, eq(missionActivities.groupId, groups.id))
    .leftJoin(users, eq(missionActivities.createdById, users.id))
    .where(eq(missionActivities.id, id))
    .limit(1);
  return row as ActivityRow | undefined;
}

async function hydrateActivity(
  db: Database,
  row: ActivityRow
): Promise<ActivityResponse> {
  const [participants, media] = await Promise.all([
    db
      .select({
        id: missionActivityParticipants.id,
        name: members.name,
        nickname: members.nickname,
        avatarUrl: members.avatarUrl,
        role: missionActivityParticipants.role,
      })
      .from(missionActivityParticipants)
      .innerJoin(members, eq(missionActivityParticipants.memberId, members.id))
      .where(eq(missionActivityParticipants.activityId, row.id)),
    db
      .select({
        id: missionActivityMedia.id,
        type: missionActivityMedia.type,
        url: missionActivityMedia.url,
        caption: missionActivityMedia.caption,
        sortOrder: missionActivityMedia.sortOrder,
      })
      .from(missionActivityMedia)
      .where(eq(missionActivityMedia.activityId, row.id))
      .orderBy(missionActivityMedia.sortOrder),
  ]);
  return { ...row, participants, media };
}

async function requireReadableActivity(req: Request, row: ActivityRow) {
  const user = req.user!;
  if (isOperationalRole(user.role) || row.createdById === user.id) return;
  if (row.status !== "published")
    throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการดู");
  if (row.visibility === "public") return;
  if (row.visibility === "private")
    throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการดู");
  if (await canSubmitToGroup(req, row.groupId)) return;
  throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการดู");
}

activitiesRouter.get("/", async (req, res, next) => {
  try {
    const parsed = missionActivityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(
        "พารามิเตอร์กิจกรรมไม่ถูกต้อง",
        parsed.error.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message,
        }))
      );
    }

    const query = parsed.data;
    const db = getDb();
    const conditions = [];
    const status = isOperationalRole(req.user!.role)
      ? query.status
      : "published";

    if (status !== "all") conditions.push(eq(missionActivities.status, status));
    if (query.type) conditions.push(eq(missionActivities.type, query.type));
    if (query.groupId)
      conditions.push(eq(missionActivities.groupId, query.groupId));
    if (query.startDate)
      conditions.push(
        gte(missionActivities.occurredAt, new Date(query.startDate))
      );
    if (query.endDate)
      conditions.push(
        lte(missionActivities.occurredAt, new Date(query.endDate))
      );
    if (query.area) conditions.push(ilike(groups.area, `%${query.area}%`));
    if (query.memberId) {
      conditions.push(
        exists(
          db
            .select({ id: missionActivityParticipants.id })
            .from(missionActivityParticipants)
            .where(
              and(
                eq(
                  missionActivityParticipants.activityId,
                  missionActivities.id
                ),
                eq(missionActivityParticipants.memberId, query.memberId)
              )
            )
        )
      );
    }

    const access = visibilityCondition(req);
    if (access) conditions.push(access);
    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ total: count() })
      .from(missionActivities)
      .leftJoin(groups, eq(missionActivities.groupId, groups.id))
      .where(whereClause);
    const total = Number(countResult?.total ?? 0);

    const rows = (await db
      .select({
        id: missionActivities.id,
        type: missionActivities.type,
        status: missionActivities.status,
        source: missionActivities.source,
        visibility: missionActivities.visibility,
        occurredAt: missionActivities.occurredAt,
        title: missionActivities.title,
        story: missionActivities.story,
        locationText: missionActivities.locationText,
        latitude: missionActivities.latitude,
        longitude: missionActivities.longitude,
        groupId: missionActivities.groupId,
        createdById: missionActivities.createdById,
        verifiedById: missionActivities.verifiedById,
        verifiedAt: missionActivities.verifiedAt,
        archivedAt: missionActivities.archivedAt,
        createdAt: missionActivities.createdAt,
        updatedAt: missionActivities.updatedAt,
        groupName: groups.name,
        groupArea: groups.area,
        creatorName: users.name,
      })
      .from(missionActivities)
      .leftJoin(groups, eq(missionActivities.groupId, groups.id))
      .leftJoin(users, eq(missionActivities.createdById, users.id))
      .where(whereClause)
      .orderBy(
        desc(missionActivities.occurredAt),
        desc(missionActivities.createdAt)
      )
      .limit(query.limit)
      .offset((query.page - 1) * query.limit)) as ActivityRow[];

    const items = await Promise.all(rows.map(row => hydrateActivity(db, row)));
    res.json({
      success: true,
      data: items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

activitiesRouter.get("/:id", async (req, res, next) => {
  try {
    const row = await getActivityRow(getDb(), req.params.id);
    if (!row) throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการดู");
    await requireReadableActivity(req, row);
    res.json({ success: true, data: await hydrateActivity(getDb(), row) });
  } catch (err) {
    next(err);
  }
});

activitiesRouter.post("/", async (req, res, next) => {
  try {
    const parsed = missionActivityInputSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0]?.message ?? "ข้อมูลกิจกรรมไม่ถูกต้อง",
        parsed.error.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message,
        }))
      );
    }

    const input = parsed.data;
    const groupId = normalizeOptional(input.groupId);
    if (!(await canSubmitToGroup(req, groupId))) {
      throw new ForbiddenError("คุณไม่มีสิทธิ์ส่งกิจกรรมเข้ากลุ่มนี้");
    }

    const db = getDb();
    if (groupId) {
      const [group] = await db
        .select({ id: groups.id })
        .from(groups)
        .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
        .limit(1);
      if (!group) throw new NotFoundError("ไม่พบกลุ่มที่ระบุ");
    }

    const participantIds = Array.from(new Set(input.participants));
    if (participantIds.length > 0) {
      const existingParticipants = await db
        .select({ id: members.id })
        .from(members)
        .where(
          and(inArray(members.id, participantIds), isNull(members.deletedAt))
        );
      if (existingParticipants.length !== participantIds.length) {
        throw new ValidationError("มีสมาชิกบางรายไม่พบในระบบ");
      }
    }

    const [created] = await db
      .insert(missionActivities)
      .values({
        type: input.type,
        title: input.title,
        story: input.story,
        occurredAt: input.occurredAt,
        groupId,
        locationText: normalizeOptional(input.locationText),
        latitude: normalizeOptional(input.latitude),
        longitude: normalizeOptional(input.longitude),
        source: input.source,
        visibility: input.visibility,
        status: "pending_review",
        createdById: req.user!.id,
      })
      .returning();

    if (participantIds.length > 0) {
      await db.insert(missionActivityParticipants).values(
        participantIds.map(memberId => ({
          activityId: created.id,
          memberId,
        }))
      );
    }
    if (input.media.length > 0) {
      await db.insert(missionActivityMedia).values(
        input.media.map((item, index) => ({
          activityId: created.id,
          type: item.type,
          url: item.url,
          caption: normalizeOptional(item.caption),
          sortOrder: index,
        }))
      );
    }

    await logAudit({
      req,
      userId: req.user!.id,
      action: "MISSION_ACTIVITY_CREATED",
      entityType: "mission_activity",
      entityId: created.id,
      details: { status: created.status, source: created.source, groupId },
    });

    const row = await getActivityRow(db, created.id);
    res.status(201).json({
      success: true,
      data: row ? await hydrateActivity(db, row) : created,
    });
  } catch (err) {
    next(err);
  }
});

activitiesRouter.put("/:id", async (req, res, next) => {
  try {
    const db = getDb();
    const existing = await getActivityRow(db, req.params.id);
    if (!existing) throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการแก้ไข");

    const canManageGroup = await canManageGroupActivity(req, existing.groupId);
    const canEdit =
      isOperationalRole(req.user!.role) ||
      canManageGroup ||
      existing.createdById === req.user!.id;
    if (!canEdit) throw new ForbiddenError("คุณไม่มีสิทธิ์แก้ไขกิจกรรมนี้");
    if (existing.status === "archived")
      throw new ForbiddenError("กิจกรรมที่เก็บถาวรแล้วไม่สามารถแก้ไขได้");

    const parsed = missionActivityUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("ข้อมูลแก้ไขกิจกรรมไม่ถูกต้อง");
    }

    const input = parsed.data;
    const nextGroupId =
      input.groupId === undefined
        ? existing.groupId
        : normalizeOptional(input.groupId);
    if (!(await canSubmitToGroup(req, nextGroupId))) {
      throw new ForbiddenError("คุณไม่มีสิทธิ์ใช้กลุ่มนี้กับกิจกรรม");
    }

    await db
      .update(missionActivities)
      .set({
        ...(input.type !== undefined && { type: input.type }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.story !== undefined && { story: input.story }),
        ...(input.occurredAt !== undefined && { occurredAt: input.occurredAt }),
        ...(input.groupId !== undefined && { groupId: nextGroupId }),
        ...(input.locationText !== undefined && {
          locationText: normalizeOptional(input.locationText),
        }),
        ...(input.latitude !== undefined && {
          latitude: normalizeOptional(input.latitude),
        }),
        ...(input.longitude !== undefined && {
          longitude: normalizeOptional(input.longitude),
        }),
        ...(input.source !== undefined && { source: input.source }),
        ...(input.visibility !== undefined && { visibility: input.visibility }),
        updatedAt: new Date(),
      })
      .where(eq(missionActivities.id, existing.id));

    if (input.participants !== undefined) {
      const participantIds = Array.from(new Set(input.participants));
      await db
        .delete(missionActivityParticipants)
        .where(eq(missionActivityParticipants.activityId, existing.id));
      if (participantIds.length > 0) {
        await db.insert(missionActivityParticipants).values(
          participantIds.map(memberId => ({
            activityId: existing.id,
            memberId,
          }))
        );
      }
    }
    if (input.media !== undefined) {
      await db
        .delete(missionActivityMedia)
        .where(eq(missionActivityMedia.activityId, existing.id));
      if (input.media.length > 0) {
        await db.insert(missionActivityMedia).values(
          input.media.map((item, index) => ({
            activityId: existing.id,
            type: item.type,
            url: item.url,
            caption: normalizeOptional(item.caption),
            sortOrder: index,
          }))
        );
      }
    }

    await logAudit({
      req,
      userId: req.user!.id,
      action: "MISSION_ACTIVITY_UPDATED",
      entityType: "mission_activity",
      entityId: existing.id,
      details: { changedFields: Object.keys(input) },
    });

    const row = await getActivityRow(db, existing.id);
    res.json({
      success: true,
      data: row ? await hydrateActivity(db, row) : null,
    });
  } catch (err) {
    next(err);
  }
});

activitiesRouter.post(
  "/:id/publish",
  requireRole(
    "super_admin",
    "admin",
    "staff",
    "ministry_leader",
    "group_leader"
  ),
  async (req, res, next) => {
    try {
      const db = getDb();
      const existing = await getActivityRow(db, req.params.id);
      if (!existing) throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการเผยแพร่");

      if (
        !(await canManageGroupActivity(req, existing.groupId)) &&
        existing.createdById !== req.user!.id
      ) {
        throw new ForbiddenError("คุณไม่มีสิทธิ์ยืนยันกิจกรรมนี้");
      }
      if (existing.status === "archived")
        throw new ForbiddenError("กิจกรรมที่เก็บถาวรแล้วไม่สามารถเผยแพร่ได้");
      if (existing.status !== "published") {
        await db
          .update(missionActivities)
          .set({
            status: "published",
            verifiedById: req.user!.id,
            verifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(missionActivities.id, existing.id));
        await logAudit({
          req,
          userId: req.user!.id,
          action: "MISSION_ACTIVITY_PUBLISHED",
          entityType: "mission_activity",
          entityId: existing.id,
        });
      }

      const row = await getActivityRow(db, existing.id);
      res.json({
        success: true,
        data: row ? await hydrateActivity(db, row) : null,
      });
    } catch (err) {
      next(err);
    }
  }
);

activitiesRouter.post(
  "/:id/archive",
  requireRole(
    "super_admin",
    "admin",
    "staff",
    "ministry_leader",
    "group_leader"
  ),
  async (req, res, next) => {
    try {
      const db = getDb();
      const existing = await getActivityRow(db, req.params.id);
      if (!existing) throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการเก็บถาวร");
      if (
        !(await canManageGroupActivity(req, existing.groupId)) &&
        existing.createdById !== req.user!.id
      ) {
        throw new ForbiddenError("คุณไม่มีสิทธิ์เก็บถาวรกิจกรรมนี้");
      }

      await db
        .update(missionActivities)
        .set({
          status: "archived",
          archivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(missionActivities.id, existing.id));
      await logAudit({
        req,
        userId: req.user!.id,
        action: "MISSION_ACTIVITY_ARCHIVED",
        entityType: "mission_activity",
        entityId: existing.id,
      });

      const row = await getActivityRow(db, existing.id);
      res.json({
        success: true,
        data: row ? await hydrateActivity(db, row) : null,
      });
    } catch (err) {
      next(err);
    }
  }
);
