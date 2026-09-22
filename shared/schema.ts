import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const USER_ROLES = [
  "super_admin",
  "admin",
  "ministry_leader",
  "group_leader",
  "staff",
  "member",
  "viewer",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: USER_ROLES })
    .notNull()
    .default("member"),
  status: text("status", { enum: ["active", "suspended"] })
    .notNull()
    .default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSessions = pgTable(
  "user_sessions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("user_sessions_user_id_idx").on(table.userId),
    index("user_sessions_token_hash_idx").on(table.tokenHash),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: text("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

export const MEMBERSHIP_STATUSES = ["active", "visitor", "candidate", "transferred", "inactive"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const members = pgTable(
  "members",
  {
    id: id(),
    name: text("name").notNull(),
    nickname: text("nickname"),
    avatarUrl: text("avatar_url"),
    gender: text("gender", { enum: GENDERS }),
    birthDate: timestamp("birth_date", { withTimezone: true }),
    phone: text("phone"),
    email: text("email"),
    lineId: text("line_id"),
    address: text("address"),
    role: text("role").notNull().default("สมาชิก"),
    area: text("area"),
    group: text("group"),
    membershipStatus: text("membership_status", { enum: MEMBERSHIP_STATUSES })
      .notNull()
      .default("visitor"),
    status: text("status", { enum: ["ติดตามแล้ว", "ต้องติดตาม"] })
      .notNull()
      .default("ต้องติดตาม"),
    assignedLeaderId: text("assigned_leader_id").references(() => users.id, { onDelete: "set null" }),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    emergencyContactRelation: text("emergency_contact_relation"),
    consentGiven: boolean("consent_given").notNull().default(false),
    consentDate: timestamp("consent_date", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
    updatedById: text("updated_by_id").references(() => users.id, { onDelete: "set null" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("members_area_idx").on(table.area),
    index("members_status_idx").on(table.status),
    index("members_phone_idx").on(table.phone),
    index("members_email_idx").on(table.email),
    index("members_deleted_at_idx").on(table.deletedAt),
  ]
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
export type UserSession = typeof userSessions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Ministry = typeof ministries.$inferSelect;
export type ChurchProfile = typeof churchProfile.$inferSelect;
