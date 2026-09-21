import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "user"] })
    .notNull()
    .default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const members = pgTable(
  "members",
  {
    id: id(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    role: text("role").notNull().default("สมาชิก"),
    area: text("area"),
    group: text("group"),
    status: text("status", { enum: ["ติดตามแล้ว", "ต้องติดตาม"] })
      .notNull()
      .default("ต้องติดตาม"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("members_area_idx").on(table.area), index("members_status_idx").on(table.status)]
);

export const announcements = pgTable("announcements", {
  id: id(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  publishDate: timestamp("publish_date", { withTimezone: true }).notNull().defaultNow(),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: id(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  location: text("location"),
  category: text("category", { enum: ["worship", "activity", "meeting", "other"] })
    .notNull()
    .default("worship"),
  status: text("status", { enum: ["scheduled", "cancelled", "completed"] })
    .notNull()
    .default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ministries = pgTable("ministries", {
  id: id(),
  name: text("name").notNull(),
  description: text("description"),
  leader: text("leader"),
  status: text("status", { enum: ["active", "inactive"] })
    .notNull()
    .default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const churchProfile = pgTable("church_profile", {
  id: text("id").primaryKey().default("main"),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Ministry = typeof ministries.$inferSelect;
export type ChurchProfile = typeof churchProfile.$inferSelect;
