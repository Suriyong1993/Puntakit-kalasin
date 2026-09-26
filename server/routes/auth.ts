import { Router } from "express";
import { getDb } from "../db/client.js";
import { users, type UserRole } from "../../shared/schema.js";
import { hashPassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * Legacy auth routes.
 *
 * `/login`, `/logout` and `/change-password` were removed when the project
 * moved to Clerk: sign-in/up/out and password management are now handled by
 * Clerk (hosted pages + `<UserButton />` on the client). The legacy JWT
 * session cookie still works for pre-migration sessions via the fallback in
 * `middleware/auth.ts`, so `/me` accepts both identity sources.
 */
export const authRouter = Router();

authRouter.get("/me", requireAuth, async (req, res) => {
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
});

// Exposed only for the seed script (server/scripts/seed-admin.ts). Creates a
// local admin account (legacy bcrypt login continues to work via the fallback
// until the account is linked to Clerk by email).
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: UserRole
) {
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({ email, passwordHash, name, role, status: "active" })
    .returning();
  return created;
}
