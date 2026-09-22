import type { NextFunction, Request, Response } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { AUTH_COOKIE_NAME, hashToken, verifyAuthToken, type JwtPayload } from "../lib/auth";
import { getDb } from "../db/client";
import { users, userSessions, type UserRole } from "../../shared/schema";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token =
    req.cookies?.[AUTH_COOKIE_NAME] ||
    (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

  if (!token) {
    return next(new UnauthorizedError("กรุณาเข้าสู่ระบบก่อนดำเนินการ"));
  }

  let payload: JwtPayload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    return next(new UnauthorizedError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง"));
  }

  try {
    const db = getDb();
    const [dbUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!dbUser) {
      return next(new UnauthorizedError("ไม่พบบัญชีผู้ใช้งานในระบบ"));
    }

    if (dbUser.status === "suspended") {
      return next(new ForbiddenError("บัญชีผู้ใช้งานของคุณถูกระงับการใช้งานชั่วคราว"));
    }

    // If session tracking is used, verify session hasn't been revoked
    if (payload.sessionId) {
      const [session] = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.id, payload.sessionId),
            isNull(userSessions.revokedAt)
          )
        )
        .limit(1);

      if (!session || new Date() > session.expiresAt) {
        return next(new UnauthorizedError("เซสชันนี้ถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบใหม่"));
      }
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as UserRole,
      sessionId: payload.sessionId,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("กรุณาเข้าสู่ระบบ"));
    }
    // super_admin always has access to all role-gated routes
    if (req.user.role === "super_admin" || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return next(new ForbiddenError("คุณไม่มีสิทธิ์ในการเข้าถึงหรือดำเนินการในส่วนนี้"));
  };
}

export const requireAdmin = requireRole("super_admin", "admin");
export const requireStaffOrAdmin = requireRole("super_admin", "admin", "staff", "ministry_leader", "group_leader");
