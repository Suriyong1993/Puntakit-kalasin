import { beforeAll, describe, expect, it } from "vitest";
import { hashPassword, signAuthToken, verifyAuthToken, verifyPassword } from "./auth";

beforeAll(() => {
  process.env.JWT_SECRET = "test-only-secret-do-not-use-in-production";
});

describe("password hashing", () => {
  it("hashes a password and verifies it correctly", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(hash).not.toBe("correct-horse-battery-staple");
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});

describe("JWT auth tokens", () => {
  it("round-trips a signed payload", () => {
    const payload = { sub: "user-1", email: "a@b.com", role: "admin" as const };
    const token = signAuthToken(payload);
    const decoded = verifyAuthToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("throws when the token is tampered with", () => {
    const token = signAuthToken({ sub: "user-1", email: "a@b.com", role: "user" });
    expect(() => verifyAuthToken(`${token}tampered`)).toThrow();
  });
});
