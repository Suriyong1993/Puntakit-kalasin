import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import { createApp } from "../app";
import { requireRole } from "../middleware/auth";
import {
  groupInputSchema,
  groupMemberInputSchema,
  groupQuerySchema,
} from "../../shared/validation";
import type { UserRole } from "../../shared/schema";

describe("Groups API & Security Tests", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (typeof address === "object" && address !== null) {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe("401 Unauthorized Protection", () => {
    it("returns 401 when accessing GET /api/groups without auth token", async () => {
      const res = await fetch(`${baseUrl}/api/groups`);
      expect(res.status).toBe(401);
      const body = (await res.json()) as { success: boolean; error: { code: string } };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 when accessing POST /api/groups without auth token", async () => {
      const res = await fetch(`${baseUrl}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "กลุ่มแคร์เมือง" }),
      });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { success: boolean; error: { code: string } };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("RBAC Role-Gating for Groups", () => {
    it("allows super_admin and admin to create groups", () => {
      const middleware = requireRole("super_admin", "admin");
      const nextAdmin = vi.fn();
      middleware(
        { user: { id: "u-1", email: "admin@test.com", name: "Admin", role: "admin" as UserRole } } as any,
        {} as any,
        nextAdmin
      );
      expect(nextAdmin).toHaveBeenCalledWith();

      const nextSuper = vi.fn();
      middleware(
        { user: { id: "u-2", email: "super@test.com", name: "Super", role: "super_admin" as UserRole } } as any,
        {} as any,
        nextSuper
      );
      expect(nextSuper).toHaveBeenCalledWith();
    });

    it("blocks standard member, viewer, and staff from group creation", () => {
      const middleware = requireRole("super_admin", "admin");
      const roles: UserRole[] = ["member", "viewer", "staff"];

      for (const r of roles) {
        const next = vi.fn();
        middleware(
          { user: { id: "u-3", email: "test@test.com", name: "Test", role: r } } as any,
          {} as any,
          next
        );
        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Group Input Validation", () => {
    it("rejects group with empty name", () => {
      const result = groupInputSchema.safeParse({
        name: "   ",
        category: "cell",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("กรุณากรอกชื่อกลุ่ม");
      }
    });

    it("accepts valid group input with Thai meeting schedules", () => {
      const result = groupInputSchema.safeParse({
        name: "กลุ่มแคร์วัยรุ่นกาฬสินธุ์",
        category: "youth",
        meetingDay: "วันศุกร์",
        meetingTime: "18:30 - 20:30",
        meetingLocation: "ร้านกาแฟคริสตจักร",
        description: "กลุ่มสร้างสาวกวัยรุ่นและนักศึกษา",
        status: "active",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("กลุ่มแคร์วัยรุ่นกาฬสินธุ์");
        expect(result.data.category).toBe("youth");
      }
    });

    it("validates group member addition requiring valid UUID memberId", () => {
      const invalid = groupMemberInputSchema.safeParse({
        memberId: "not-a-uuid",
        role: "member",
      });
      expect(invalid.success).toBe(false);

      const valid = groupMemberInputSchema.safeParse({
        memberId: "123e4567-e89b-12d3-a456-426614174000",
        role: "assistant_leader",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.role).toBe("assistant_leader");
      }
    });

    it("validates group query filters", () => {
      const query = groupQuerySchema.safeParse({
        search: "แคร์",
        category: "cell",
        status: "active",
        page: "1",
        limit: "20",
      });
      expect(query.success).toBe(true);
      if (query.success) {
        expect(query.data.page).toBe(1);
        expect(query.data.limit).toBe(20);
        expect(query.data.search).toBe("แคร์");
      }
    });
  });
});
