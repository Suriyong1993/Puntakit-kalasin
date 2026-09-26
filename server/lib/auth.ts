import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import type { UserRole } from "../../shared/schema.js";

export const AUTH_COOKIE_NAME = "puntakit_session";

/** Local user identity attached to authenticated requests (see middleware/auth.ts). */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  sessionId?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET is not set. Add it to your environment before starting the server."
      );
    }
    return "puntakit-dev-jwt-secret-do-not-use-in-production-123456789";
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}
