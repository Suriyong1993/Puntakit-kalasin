import { Router, type Request } from "express";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  groups,
  groupMembers,
  members,
  users,
  type Group,
  type GroupMember,
} from "../../shared/schema";
import {
  groupInputSchema,
  groupMemberInputSchema,
  groupQuerySchema,
} from "../../shared/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

// Helper to check if user can manage the group (admin/super_admin or the group's assigned leader)
async function verifyGroupManagementAccess(req: Request, groupId: string) {
  const user = req.user!;
  if (user.role === "super_admin" || user.role === "admin") {
    return true;
  }

  if (user.role === "group_leader") {
    const db = getDb();
    const [group] = await db
      .select({ id: groups.id, leaderId: groups.leaderId })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      throw new NotFoundError("ไม่พบข้อมูลกลุ่มที่ระบุ");
    }

    if (group.leaderId === user.id) {
      return true;
    }
  }

  throw new ForbiddenError("คุณไม่มีสิทธิ์ในการจัดการกลุ่มนี้");
}

// 1. GET / - List groups with member count & leader info
groupsRouter.get("/", async (req, res, next) => {
  try {
    const parsed = groupQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(
        "พารามิเตอร์การค้นหาไม่ถูกต้อง",
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { search, category, status } = parsed.data;
    const db = getDb();
    const conditions = [isNull(groups.deletedAt)];

    if (status) {
      conditions.push(eq(groups.status, status));
    }
    if (category) {
      conditions.push(eq(groups.category, category));
    }
    if (search) {
      conditions.push(
        or(
          ilike(groups.name, `%${search}%`),
          ilike(groups.meetingLocation, `%${search}%`),
          ilike(groups.description, `%${search}%`)
        )!
      );
    }

    const rows = await db
      .select({
        id: groups.id,
        name: groups.name,
        leaderId: groups.leaderId,
        category: groups.category,
        meetingDay: groups.meetingDay,
        meetingTime: groups.meetingTime,
        meetingLocation: groups.meetingLocation,
        description: groups.description,
        status: groups.status,
        createdById: groups.createdById,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        leaderName: users.name,
        leaderEmail: users.email,
        memberCount: sql<number>`cast(count(distinct ${groupMembers.id}) as int)`,
      })
      .from(groups)
      .leftJoin(users, eq(groups.leaderId, users.id))
      .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(and(...conditions))
      .groupBy(groups.id, users.id)
      .orderBy(desc(groups.createdAt));

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET /:id - Group details with member list
groupsRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const [group] = await db
      .select({
        id: groups.id,
        name: groups.name,
        leaderId: groups.leaderId,
        category: groups.category,
        meetingDay: groups.meetingDay,
        meetingTime: groups.meetingTime,
        meetingLocation: groups.meetingLocation,
        description: groups.description,
        status: groups.status,
        createdById: groups.createdById,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        leaderName: users.name,
        leaderEmail: users.email,
      })
      .from(groups)
      .leftJoin(users, eq(groups.leaderId, users.id))
      .where(and(eq(groups.id, id), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      throw new NotFoundError("ไม่พบข้อมูลกลุ่มที่ระบุ");
    }

    // Get group members
    const membersList = await db
      .select({
        id: groupMembers.id,
        groupId: groupMembers.groupId,
        memberId: groupMembers.memberId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        memberName: members.name,
        memberNickname: members.nickname,
        memberAvatarUrl: members.avatarUrl,
        memberPhone: members.phone,
        membershipStatus: members.membershipStatus,
        pastoralStatus: members.status,
      })
      .from(groupMembers)
      .innerJoin(members, eq(groupMembers.memberId, members.id))
      .where(and(eq(groupMembers.groupId, id), isNull(members.deletedAt)))
      .orderBy(desc(groupMembers.joinedAt));

    res.json({
      success: true,
      data: {
        ...group,
        members: membersList,
        memberCount: membersList.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 3. POST / - Create group (admin, super_admin)
groupsRouter.post(
  "/",
  requireRole("super_admin", "admin"),
  async (req, res, next) => {
    try {
      const parsed = groupInputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          "ข้อมูลกลุ่มไม่ถูกต้อง",
          parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const db = getDb();
      const [newGroup] = await db
        .insert(groups)
        .values({
          ...parsed.data,
          leaderId: parsed.data.leaderId || null,
          createdById: req.user!.id,
          updatedAt: new Date(),
        })
        .returning();

      await logAudit({
        userId: req.user!.id,
        action: "CREATE_GROUP",
        entityType: "group",
        entityId: newGroup.id,
        details: { name: newGroup.name, category: newGroup.category },
        req,
      });

      res.status(201).json({
        success: true,
        data: newGroup,
        message: "สร้างกลุ่มเรียบร้อยแล้ว",
      });
    } catch (err) {
      next(err);
    }
  }
);

// 4. PUT /:id - Update group (admin, super_admin, or assigned group leader)
groupsRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await verifyGroupManagementAccess(req, id);

    const parsed = groupInputSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        "ข้อมูลแก้ไขกลุ่มไม่ถูกต้อง",
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const db = getDb();
    const [existing] = await db
      .select()
      .from(groups)
      .where(and(eq(groups.id, id), isNull(groups.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("ไม่พบกลุ่มที่ต้องการแก้ไข");
    }

    const [updatedGroup] = await db
      .update(groups)
      .set({
        ...parsed.data,
        leaderId: parsed.data.leaderId !== undefined ? (parsed.data.leaderId || null) : existing.leaderId,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, id))
      .returning();

    await logAudit({
      userId: req.user!.id,
      action: "UPDATE_GROUP",
      entityType: "group",
      entityId: id,
      details: parsed.data as Record<string, unknown>,
      req,
    });

    res.json({
      success: true,
      data: updatedGroup,
      message: "อัปเดตข้อมูลกลุ่มเรียบร้อยแล้ว",
    });
  } catch (err) {
    next(err);
  }
});

// 5. DELETE /:id - Soft-delete group (admin, super_admin)
groupsRouter.delete(
  "/:id",
  requireRole("super_admin", "admin"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const db = getDb();

      const [existing] = await db
        .select()
        .from(groups)
        .where(and(eq(groups.id, id), isNull(groups.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new NotFoundError("ไม่พบกลุ่มที่ต้องการลบ");
      }

      await db
        .update(groups)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(groups.id, id));

      await logAudit({
        userId: req.user!.id,
        action: "DELETE_GROUP",
        entityType: "group",
        entityId: id,
        details: { name: existing.name },
        req,
      });

      res.json({
        success: true,
        message: "ลบกลุ่มเรียบร้อยแล้ว",
      });
    } catch (err) {
      next(err);
    }
  }
);

// 6. POST /:id/members - Add member to group
groupsRouter.post("/:id/members", async (req, res, next) => {
  try {
    const { id } = req.params;
    await verifyGroupManagementAccess(req, id);

    const parsed = groupMemberInputSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        "ข้อมูลสมาชิกไม่ถูกต้อง",
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { memberId, role } = parsed.data;
    const db = getDb();

    // Verify group exists
    const [group] = await db
      .select()
      .from(groups)
      .where(and(eq(groups.id, id), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      throw new NotFoundError("ไม่พบกลุ่มที่ระบุ");
    }

    // Verify member exists
    const [member] = await db
      .select()
      .from(members)
      .where(and(eq(members.id, memberId), isNull(members.deletedAt)))
      .limit(1);

    if (!member) {
      throw new NotFoundError("ไม่พบสมาชิกที่ระบุ");
    }

    // Check if member is already in group
    const [existingMembership] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.memberId, memberId)))
      .limit(1);

    if (existingMembership) {
      throw new ConflictError("สมาชิกท่านนี้อยู่ในกลุ่มนี้แล้ว");
    }

    const [newGroupMember] = await db
      .insert(groupMembers)
      .values({
        groupId: id,
        memberId,
        role,
        joinedAt: new Date(),
      })
      .returning();

    // Update backward-compatible member `group` text column if empty or member preferred
    if (!member.group || member.group === "") {
      await db
        .update(members)
        .set({ group: group.name, updatedAt: new Date() })
        .where(eq(members.id, memberId));
    }

    await logAudit({
      userId: req.user!.id,
      action: "ADD_GROUP_MEMBER",
      entityType: "group_member",
      entityId: newGroupMember.id,
      details: { groupId: id, groupName: group.name, memberId, memberName: member.name, role },
      req,
    });

    res.status(201).json({
      success: true,
      data: newGroupMember,
      message: "เพิ่มสมาชิกเข้ากลุ่มเรียบร้อยแล้ว",
    });
  } catch (err) {
    next(err);
  }
});

// 7. DELETE /:id/members/:memberId - Remove member from group
groupsRouter.delete("/:id/members/:memberId", async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    await verifyGroupManagementAccess(req, id);

    const db = getDb();

    const [existing] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.memberId, memberId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("ไม่พบสมาชิกในกลุ่มนี้");
    }

    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.memberId, memberId)));

    await logAudit({
      userId: req.user!.id,
      action: "REMOVE_GROUP_MEMBER",
      entityType: "group_member",
      entityId: existing.id,
      details: { groupId: id, memberId },
      req,
    });

    res.json({
      success: true,
      message: "นำสมาชิกออกจากกลุ่มเรียบร้อยแล้ว",
    });
  } catch (err) {
    next(err);
  }
});
