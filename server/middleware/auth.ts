import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { users, userSessions, type UserRole } from "../../shared/schema.js";
import {
  AUTH_COOKIE_NAME,
  verifyAuthToken,
  type AuthenticatedUser,
  type JwtPayload,
} from "../lib/auth.js";
import { isClerkConfigured, loadClerkUser } from "../lib/clerkAuth.js";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/** True when the value looks like a local users.id (legacy JWT subject). */
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

/** Returns the Clerk userId when the request carries a Clerk session, else null. */
function getClerkUserId(req: Request): string | null {
  try {
    return getAuth(req).userId ?? null;
  } catch {
    // clerkMiddleware not applied or no Clerk session on this request.
    return null;
  }
}

/** Verify the legacy JWT and load the matching local user + session state. */
async function loadLegacyUser(token: string): Promise<AuthenticatedUser> {
  let payload: JwtPayload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw new UnauthorizedError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
  }

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
    throw new UnauthorizedError("ไม่พบบัญชีผู้ใช้งานในระบบ");
  }

  if (dbUser.status === "suspended") {
    throw new ForbiddenError("บัญชีผู้ใช้งานของคุณถูกระงับการใช้งานชั่วคราว");
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
      throw new UnauthorizedError(
        "เซสชันนี้ถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบใหม่"
      );
    }
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role as AuthenticatedUser["role"],
    sessionId: payload.sessionId,
  };
}

/**
 * Authenticate the request via Clerk (when configured), falling back to the
 * legacy `puntakit_session` JWT cookie/bearer for sessions issued before the
 * Clerk migration. Attach the local user to `req.user` on success.
 *
 * Resolution order:
 * 1. Clerk session (cookie/Bearer handled by `clerkMiddleware()`) → mapped to
 *    the local `users` row via `users.clerk_id` (auto-provision/link on first
 *    login). Only tried while `CLERK_SECRET_KEY` is set.
 * 2. Legacy JWT whose subject is a local users.id (UUID).
 * 3. Otherwise → 401 UNAUTHORIZED.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const legacyToken =
    req.cookies?.[AUTH_COOKIE_NAME] ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null);

  if (isClerkConfigured()) {
    try {
      if (getClerkUserId(req)) {
        req.user = await loadClerkUser({ auth: () => getAuth(req) });
        return next();
      }
    } catch (err) {
      // A real Clerk session that fails mapping/provisioning is a genuine error.
      if (getClerkUserId(req)) {
        return next(err);
      }
      // clerkMiddleware itself failed (e.g. upstream Clerk error) — fall through
      // to the legacy path so pre-migration sessions keep working.
    }
  }

  if (legacyToken) {
    try {
      const payload: JwtPayload = verifyAuthToken(legacyToken);
      if (payload.sub && isUuid(payload.sub)) {
        req.user = await loadLegacyUser(legacyToken);
        return next();
      }
      // Not a legacy token shape — fall through to the generic 401 below.
    } catch (err) {
      if (err instanceof ForbiddenError) {
        // Suspended accounts surface their specific message.
        return next(err);
      }
      // Invalid/tampered/expired legacy credentials → generic 401 below.
    }
  }

  return next(new UnauthorizedError("กรุณาเข้าสู่ระบบก่อนดำเนินการ"));
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("กรุณาเข้าสู่ระบบ"));
    }
    // super_admin always has access to all role-gated routes
    if (
      req.user.role === "super_admin" ||
      allowedRoles.includes(req.user.role)
    ) {
      return next();
    }
    return next(
      new ForbiddenError("คุณไม่มีสิทธิ์ในการเข้าถึงหรือดำเนินการในส่วนนี้")
    );
  };
}

export const requireAdmin = requireRole("super_admin", "admin");
export const requireStaffOrAdmin = requireRole(
  "super_admin",
  "admin",
  "staff",
  "ministry_leader",
  "group_leader"
);
