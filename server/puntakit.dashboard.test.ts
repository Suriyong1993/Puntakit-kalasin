import { describe, expect, it } from "vitest";
import { activities, distribution, journey } from "../client/src/pages/Home";

describe("Puntakit dashboard data", () => {
  it("keeps the discipleship journey at six stages", () => {
    expect(journey).toHaveLength(6);
    expect(journey.map((step) => step.n)).toEqual(["01", "02", "03", "04", "05", "06"]);
    expect(journey.every((step) => step.title && step.detail && step.icon)).toBe(true);
  });

  it("contains recent activity entries with people-first metadata", () => {
    expect(activities).toHaveLength(4);
    expect(activities.every((item) => item.title && item.meta && item.time && item.icon)).toBe(true);
    expect(activities.map((item) => item.tone)).toEqual(["blue", "orange", "pink", "purple"]);
  });

  it("uses numeric member distribution values for chart rendering", () => {
    expect(distribution).toHaveLength(6);
    expect(distribution.every((item) => Number.isFinite(item.value) && item.value > 0)).toBe(true);
    expect(distribution.find((item) => item.label === "สมเด็จ")?.value).toBe(180);
  });
});
