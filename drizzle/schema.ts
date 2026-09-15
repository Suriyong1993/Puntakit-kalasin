import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  role: varchar("role", { length: 80 }).notNull(),
  area: varchar("area", { length: 80 }).notNull(),
  groupName: varchar("groupName", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["ติดตามแล้ว", "ต้องติดตาม"]).default("ต้องติดตาม").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ areaIdx: index("members_area_idx").on(table.area), statusIdx: index("members_status_idx").on(table.status), joinedIdx: index("members_joined_idx").on(table.joinedAt) }));

export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId"),
  action: mysqlEnum("action", ["created", "updated", "deleted", "bulk_updated", "bulk_deleted"]).notNull(),
  entityType: varchar("entityType", { length: 60 }).notNull().default("member"),
  entityId: int("entityId"),
  memberName: varchar("memberName", { length: 160 }).notNull(),
  summary: text("summary").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ createdIdx: index("activity_logs_created_idx").on(table.createdAt), actionIdx: index("activity_logs_action_idx").on(table.action) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
