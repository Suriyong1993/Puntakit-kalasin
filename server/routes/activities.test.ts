import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createApp } from "../app";
import {
  missionActivityInputSchema,
  missionActivityQuerySchema,
} from "../../shared/validation";

describe("Mission Activity API", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>(resolve => {
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
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it("requires authentication for the feed", async () => {
    const response = await fetch(`${baseUrl}/api/activities`);
    expect(response.status).toBe(401);
    const body = (await response.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("requires authentication before accepting a submission", async () => {
    const response = await fetch(`${baseUrl}/api/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "กิจกรรมทดสอบ",
        story: "เรื่องราวกิจกรรม",
        type: "house_mission",
      }),
    });
    expect(response.status).toBe(401);
  });

  it("validates the capture payload without allowing a client-published status", () => {
    const result = missionActivityInputSchema.safeParse({
      type: "bible_study",
      occurredAt: "2026-09-24T10:00:00.000Z",
      title: "ศึกษาพระคำที่บ้านแม่กุล",
      story: "ได้แบ่งปันพระคำและอธิษฐานร่วมกัน",
      source: "manual",
      visibility: "group",
      participants: [],
      media: [
        {
          type: "image",
          url: "https://images.example.com/activity.jpg",
        },
      ],
      status: "published",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).status).toBeUndefined();
      expect(result.data.type).toBe("bible_study");
      expect(result.data.media).toHaveLength(1);
    }
  });

  it("defaults feed queries to published activities", () => {
    const result = missionActivityQuerySchema.parse({});
    expect(result.status).toBe("published");
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("rejects malformed media and empty stories", () => {
    const result = missionActivityInputSchema.safeParse({
      type: "prayer",
      title: "คำอธิษฐาน",
      story: " ",
      media: [{ type: "image", url: "not-a-url" }],
    });
    expect(result.success).toBe(false);
  });
});
