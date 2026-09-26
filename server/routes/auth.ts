import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../db/client.js";
import { users, userSessions, type UserRole } from "../../shared/schema.js";
import {
  AUTH_COOKIE_NAME,
  hashPassword,
  hashToken,
  signAuthToken,
  verifyPassword,
} from "../lib/auth.js";
import { changePasswordInputSchema, loginInputSchema } from "../../shared/validation.js";
import { requireAuth } from "../middleware/auth.js";
import { loginRateLimiter } from "../middleware/rateLimit.js";
import { logAudit } from "../lib/audit.js";
import { ForbiddenError, UnauthorizedError, ValidationError } from "../lib/errors.js";

export const authRouter = Router();

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

authRouter.post("/login", loginRateLimiter, async (req, res, next) => {
  try {
    const parsed = loginInputSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      await logAudit({
        req,
        action: "LOGIN_FAILED",
        entityType: "user",
        details: { email: parsed.data.email },
      });
      throw new UnauthorizedError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    if (user.status === "suspended") {
      await logAudit({
        req,
        userId: user.id,
        action: "LOGIN_BLOCKED_SUSPENDED",
        entityType: "user",
        entityId: user.id,
      });
      throw new ForbiddenError("บัญชีนี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ");
    }

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      sessionId,
    });

    // Record session in user_sessions
    await db.insert(userSessions).values({
      id: sessionId,
      userId: user.id,
      tokenHash: hashToken(token),
      userAgent: (req.headers["user-agent"] as string) || null,
      ipAddress: req.ip || req.socket.remoteAddress || null,
      expiresAt,
    });

    await logAudit({
      req,
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "user",
      entityId: user.id,
    });

    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (token) {
      const db = getDb();
      const tokenHashVal = hashToken(token);
      await db
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(eq(userSessions.tokenHash, tokenHashVal));

      await logAudit({
        req,
        action: "LOGOUT",
        entityType: "user",
      });
    }

    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = req.user!;
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const parsed = changePasswordInputSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
    if (!user) {
      throw new UnauthorizedError("ไม่พบผู้ใช้งาน");
    }

    const validCurrent = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!validCurrent) {
      throw new ValidationError("รหัสผ่านปัจจุบันไม่ถูกต้อง");
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Revoke all other active sessions for security
    await db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(userSessions.userId, user.id));

    await logAudit({
      req,
      userId: user.id,
      action: "PASSWORD_CHANGED",
      entityType: "user",
      entityId: user.id,
    });

    res.json({
      success: true,
      data: { message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง" },
    });
  } catch (err) {
    next(err);
  }
});

// Exposed only for the seed script (server/scripts/seed-admin.ts)
export async function createUser(email: string, password: string, name: string, role: UserRole) {
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({ email, passwordHash, name, role, status: "active" })
    .returning();
  return created;
}
