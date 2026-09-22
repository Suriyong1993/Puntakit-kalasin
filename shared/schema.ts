import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
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
    index("members_user_id_idx").on(table.userId),
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

export const GROUP_CATEGORIES = ["cell", "youth", "fellowship", "family", "general"] as const;
export type GroupCategory = (typeof GROUP_CATEGORIES)[number];

export const GROUP_MEMBER_ROLES = ["leader", "assistant_leader", "host", "member"] as const;
export type GroupMemberRole = (typeof GROUP_MEMBER_ROLES)[number];

export const SERVICE_TYPES = [
  "sunday_service",
  "care_group",
  "prayer_meeting",
  "youth_service",
  "special_event",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const ATTENDANCE_STATUSES = ["present", "absent", "leave", "online"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const CHECKIN_METHODS = ["manual", "qr_scan", "self_qr", "kiosk"] as const;
export type CheckInMethod = (typeof CHECKIN_METHODS)[number];

export const groups = pgTable(
  "groups",
  {
    id: id(),
    name: text("name").notNull(),
    leaderId: text("leader_id").references(() => users.id, { onDelete: "set null" }),
    category: text("category", { enum: GROUP_CATEGORIES }).default("cell"),
    meetingDay: text("meeting_day"),
    meetingTime: text("meeting_time"),
    meetingLocation: text("meeting_location"),
    description: text("description"),
    status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
    createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("groups_status_idx").on(table.status),
    index("groups_leader_id_idx").on(table.leaderId),
    index("groups_deleted_at_idx").on(table.deletedAt),
  ]
);

export const groupMembers = pgTable(
  "group_members",
  {
    id: id(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    role: text("role", { enum: GROUP_MEMBER_ROLES }).notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("group_members_group_member_uniq").on(table.groupId, table.memberId),
    index("group_members_group_id_idx").on(table.groupId),
    index("group_members_member_id_idx").on(table.memberId),
  ]
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: id(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    serviceType: text("service_type", { enum: SERVICE_TYPES }).notNull().default("sunday_service"),
    groupId: text("group_id").references(() => groups.id, { onDelete: "set null" }),
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    status: text("status", { enum: ATTENDANCE_STATUSES }).notNull().default("present"),
    checkInMethod: text("check_in_method", { enum: CHECKIN_METHODS }).notNull().default("manual"),
    checkedInBy: text("checked_in_by").references(() => users.id, { onDelete: "set null" }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("attendance_date_idx").on(table.date),
    index("attendance_service_type_idx").on(table.serviceType),
    index("attendance_group_id_idx").on(table.groupId),
    index("attendance_member_id_idx").on(table.memberId),
    index("attendance_status_idx").on(table.status),
  ]
);

export const PRAYER_CATEGORIES = [
  "health",
  "family",
  "work",
  "spiritual",
  "thanksgiving",
  "other",
] as const;
export type PrayerCategory = (typeof PRAYER_CATEGORIES)[number];

export const PRAYER_STATUSES = ["pending", "praying", "answered"] as const;
export type PrayerStatus = (typeof PRAYER_STATUSES)[number];

export const EVENT_REGISTRATION_STATUSES = ["registered", "cancelled", "attended"] as const;
export type EventRegistrationStatus = (typeof EVENT_REGISTRATION_STATUSES)[number];

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status", { enum: EVENT_REGISTRATION_STATUSES }).notNull().default("registered"),
    registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("event_registrations_event_user_uniq").on(table.eventId, table.userId),
    index("event_registrations_event_id_idx").on(table.eventId),
    index("event_registrations_user_id_idx").on(table.userId),
    index("event_registrations_member_id_idx").on(table.memberId),
  ]
);

export const prayerRequests = pgTable(
  "prayer_requests",
  {
    id: id(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    memberId: text("member_id").references(() => members.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: text("category", { enum: PRAYER_CATEGORIES }).notNull().default("spiritual"),
    isConfidential: boolean("is_confidential").notNull().default(false),
    status: text("status", { enum: PRAYER_STATUSES }).notNull().default("pending"),
    answeredNotes: text("answered_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("prayer_requests_user_id_idx").on(table.userId),
    index("prayer_requests_status_idx").on(table.status),
    index("prayer_requests_category_idx").on(table.category),
    index("prayer_requests_created_at_idx").on(table.createdAt),
  ]
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("push_subscriptions_user_id_idx").on(table.userId),
  ]
);

export type User = typeof users.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Ministry = typeof ministries.$inferSelect;
export type ChurchProfile = typeof churchProfile.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type PrayerRequest = typeof prayerRequests.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
