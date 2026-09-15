import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type User = NonNullable<TrpcContext["user"]>;
function createContext(role: "admin" | "user"): TrpcContext {
  const user: User = { id: role === "admin" ? 1 : 2, openId: `${role}-tester`, email: `${role}@example.com`, name: role, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("member permissions", () => {
  it("rejects Bulk Edit for non-admin users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.members.bulkUpdate({ ids: [1], area: "เมือง 1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects Bulk Edit when no fields are provided", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.members.bulkUpdate({ ids: [1] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects Activity Log access for non-admin users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.activityLog.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
