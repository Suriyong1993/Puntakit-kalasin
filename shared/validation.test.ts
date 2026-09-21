import { describe, expect, it } from "vitest";
import {
  announcementInputSchema,
  churchProfileInputSchema,
  eventInputSchema,
  loginInputSchema,
  memberInputSchema,
  ministryInputSchema,
  registerInputSchema,
} from "./validation";

describe("memberInputSchema", () => {
  it("accepts a minimal valid member", () => {
    const result = memberInputSchema.safeParse({ name: "สมชาย ใจดี" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = memberInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = memberInputSchema.safeParse({ name: "สมชาย", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status enum", () => {
    const result = memberInputSchema.safeParse({ name: "สมชาย", status: "unknown" });
    expect(result.success).toBe(false);
  });

  it("defaults status when omitted", () => {
    const result = memberInputSchema.parse({ name: "สมชาย" });
    expect(result.status).toBe("ต้องติดตาม");
  });
});

describe("announcementInputSchema", () => {
  it("requires title and content", () => {
    expect(announcementInputSchema.safeParse({ title: "", content: "" }).success).toBe(false);
    expect(announcementInputSchema.safeParse({ title: "หัวข้อ", content: "เนื้อหา" }).success).toBe(true);
  });

  it("rejects an invalid status", () => {
    const result = announcementInputSchema.safeParse({ title: "a", content: "b", status: "archived" });
    expect(result.success).toBe(false);
  });
});

describe("eventInputSchema", () => {
  it("requires an eventDate", () => {
    const result = eventInputSchema.safeParse({ title: "นมัสการ" });
    expect(result.success).toBe(false);
  });

  it("accepts a full valid payload", () => {
    const result = eventInputSchema.safeParse({
      title: "นมัสการวันอาทิตย์",
      eventDate: new Date().toISOString(),
      category: "worship",
      status: "scheduled",
    });
    expect(result.success).toBe(true);
  });
});

describe("ministryInputSchema", () => {
  it("requires a name", () => {
    expect(ministryInputSchema.safeParse({ name: "" }).success).toBe(false);
    expect(ministryInputSchema.safeParse({ name: "ทีมนมัสการ" }).success).toBe(true);
  });
});

describe("churchProfileInputSchema", () => {
  it("requires a name and validates email", () => {
    expect(churchProfileInputSchema.safeParse({ name: "" }).success).toBe(false);
    expect(churchProfileInputSchema.safeParse({ name: "คริสตจักร", email: "bad" }).success).toBe(false);
    expect(churchProfileInputSchema.safeParse({ name: "คริสตจักร", email: "a@b.com" }).success).toBe(true);
  });
});

describe("auth schemas", () => {
  it("rejects a short password on register", () => {
    const result = registerInputSchema.safeParse({ email: "a@b.com", password: "short", name: "A" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid register payload", () => {
    const result = registerInputSchema.safeParse({ email: "a@b.com", password: "longenough", name: "A" });
    expect(result.success).toBe(true);
  });

  it("requires email and password on login", () => {
    expect(loginInputSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
    expect(loginInputSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
});
