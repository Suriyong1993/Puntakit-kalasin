import { describe, expect, it } from "vitest";
import { dashboardSnapshot } from "../client/src/data/mockData";
import { listMembers, searchChurchContent } from "../client/src/services/puntakitService";

describe("Puntakit dashboard data", () => {
  it("keeps the discipleship journey at six stages", () => {
    expect(dashboardSnapshot.journey).toHaveLength(6);
    expect(dashboardSnapshot.journey.map((step) => step.number)).toEqual(["01", "02", "03", "04", "05", "06"]);
    expect(dashboardSnapshot.journey.every((step) => step.title && step.detail && step.icon)).toBe(true);
  });

  it("contains recent activity entries with people-first metadata", () => {
    expect(dashboardSnapshot.activities).toHaveLength(4);
    expect(dashboardSnapshot.activities.every((item) => item.title && item.meta && item.time && item.icon)).toBe(true);
    expect(dashboardSnapshot.activities.map((item) => item.tone)).toEqual(["blue", "orange", "pink", "purple"]);
  });

  it("uses numeric member distribution values for chart rendering", () => {
    expect(dashboardSnapshot.distribution).toHaveLength(6);
    expect(dashboardSnapshot.distribution.every((item) => Number.isFinite(item.value) && item.value > 0)).toBe(true);
    expect(dashboardSnapshot.distribution.find((item) => item.label === "สมเด็จ")?.value).toBe(180);
  });

  it("supports searchable member and activity records", async () => {
    expect((await listMembers("เมือง 1"))[0]?.name).toBe("กนกวรรณ ใจดี");
    expect((await searchChurchContent("ตลาดสด"))[0]?.type).toBe("กิจกรรม");
  });
});
