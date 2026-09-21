import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME, verifyAuthToken, type JwtPayload } from "../lib/auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ success: false, error: "กรุณาเข้าสู่ระบบ" });
    return;
  }

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: "กรุณาเข้าสู่ระบบ" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ success: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" });
    return;
  }
  next();
}
