import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { users } from "../../shared/schema";
import { AUTH_COOKIE_NAME, hashPassword, signAuthToken, verifyPassword } from "../lib/auth";
import { loginInputSchema } from "../../shared/validation";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

authRouter.post("/login", async (req, res) => {
  const parsed = loginInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" });
    return;
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    return;
  }

  const token = signAuthToken({ sub: user.id, email: user.email, role: user.role });
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
  res.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.json({ success: true, data: null });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, req.user!.sub)).limit(1);
  if (!user) {
    res.status(401).json({ success: false, error: "ไม่พบผู้ใช้งาน" });
    return;
  }
  res.json({ success: true, data: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// Exposed only for the one-time seed script (server/scripts/seed-admin.ts), not mounted as a route.
export async function createUser(email: string, password: string, name: string, role: "admin" | "user") {
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const [created] = await db.insert(users).values({ email, passwordHash, name, role }).returning();
  return created;
}
