# Puntakit Product Architecture — Ministry Operating System

Date: 2026-09-24
Status: proposed, not yet implemented. See `docs/PUNTAKIT_IMPLEMENTATION_PLAN.md`
for what ships in which phase.

## Product hierarchy

```
PUNTAKIT
└── Ministry Operating System
    ├── People            (existing: members, users)
    ├── Groups            (existing: groups, groupMembers)
    ├── Ministry Activity  (new)
    ├── Feed              (new — view over Ministry Activity)
    ├── Timeline          (new — reusable view over Ministry Activity)
    ├── Places / Map      (existing geo fields, no surface yet)
    ├── Mission Inbox      (new)
    ├── Follow-up          (new)
    ├── Attendance         (existing: attendanceRecords)
    ├── Events             (existing: events, eventRegistrations)
    ├── Ministries         (existing, needs FK to groups)
    ├── Operations         (evolves from existing dashboard.ts + Home.tsx)
    ├── Reports            (evolves from ComingSoon stub)
    ├── Notifications       (evolves from pushSubscriptions)
    ├── Search             (new, cross-domain)
    └── Administration      (evolves from ComingSoon /settings stub)
```

Feed is not the product. Dashboard is not the product. `MissionActivity`
is the core object; every surface above is a lens on it plus the existing
People/Group/Attendance/Event tables. This follows the audit finding in
`docs/PUNTAKIT_UX_AUDIT.md` §2: no activity table exists today, and the
existing `auditLogs` table is not reused for it (system audit trail vs.
ministry content must stay separate).

## Source of truth

| Domain | Source of truth (table) | Notes |
|---|---|---|
| Person | `members` (+ `users` for login identity) | unchanged |
| Group | `groups` | unchanged |
| Group membership | `groupMembers` | unchanged |
| Attendance | `attendanceRecords` | unchanged |
| Event | `events`, `eventRegistrations` | unchanged |
| Ministry (org unit) | `ministries` | gains `groupId` FK (nullable, additive) |
| Ministry activity | `missionActivities` (new) | see below |
| Activity media | `missionActivityMedia` (new) | see below |
| Activity participants | `missionActivityParticipants` (new, join table) | links activity ↔ member |
| Raw field submission | `missionSubmissions` (new) | pre-publish inbox item |
| Follow-up task | `followUps` (new) | |
| System/security audit | `auditLogs` | unchanged, stays system-only |

Feed, Timeline, Map, and Operations are **read models**, not new tables:
- Feed = `missionActivities` filtered/sorted by `occurredAt`.
- Timeline (person/group/place) = `missionActivities` filtered by
  participant/group/place FK, merged with `attendanceRecords` for that
  same subject where useful (e.g., "attended Sunday service" as a
  timeline entry) — read-only join, not a copy.
- Map = `missionActivities`/`groups` with non-null location, respecting
  visibility rules in §Security.
- Operations = aggregates over `missionSubmissions` (pending review),
  `followUps` (open/overdue), `missionActivities` (recent), `groups`
  (no activity in N days) — the same aggregation `server/routes/dashboard.ts`
  already does for metrics today, extended with these new signals.

## New domain model (minimum, per the brief's own "why does it exist"
test)

```ts
// shared/schema.ts additions — illustrative, not final column list

export const MISSION_ACTIVITY_TYPES = [
  "house_mission", "mission_visit", "bible_study", "prayer", "worship",
  "fellowship", "testimony", "evangelism", "pastoral_visit", "outreach",
  "ministry_update", "other",
] as const;

export const MISSION_ACTIVITY_STATUSES = [
  "draft", "pending_review", "published", "archived",
] as const;

export const MISSION_ACTIVITY_SOURCES = [
  "manual", "line", "import", "system",
] as const;

export const missionActivities = pgTable("mission_activities", {
  id: id(),
  type: text("type", { enum: MISSION_ACTIVITY_TYPES }).notNull(),
  status: text("status", { enum: MISSION_ACTIVITY_STATUSES })
    .notNull().default("draft"),
  source: text("source", { enum: MISSION_ACTIVITY_SOURCES })
    .notNull().default("manual"),
  title: text("title").notNull(),
  story: text("story"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  groupId: text("group_id").references(() => groups.id, { onDelete: "set null" }),
  visibility: text("visibility", { enum: ["church", "leaders", "private"] })
    .notNull().default("church"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  placeLabel: text("place_label"),
  createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const missionActivityMedia = pgTable("mission_activity_media", {
  id: id(),
  activityId: text("activity_id").notNull()
    .references(() => missionActivities.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  kind: text("kind", { enum: ["image", "video"] }).notNull().default("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const missionActivityParticipants = pgTable(
  "mission_activity_participants",
  {
    id: id(),
    activityId: text("activity_id").notNull()
      .references(() => missionActivities.id, { onDelete: "cascade" }),
    memberId: text("member_id").notNull()
      .references(() => members.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("mission_activity_participant_uniq").on(t.activityId, t.memberId)]
);

export const MISSION_SUBMISSION_STATUSES = [
  "new", "reviewing", "needs_info", "approved", "rejected",
] as const;

export const missionSubmissions = pgTable("mission_submissions", {
  id: id(),
  status: text("status", { enum: MISSION_SUBMISSION_STATUSES })
    .notNull().default("new"),
  source: text("source", { enum: MISSION_ACTIVITY_SOURCES })
    .notNull().default("line"),
  rawText: text("raw_text"),
  rawMediaUrls: text("raw_media_urls"), // JSON array, kept simple until an adapter exists
  submittedByLabel: text("submitted_by_label"), // e.g. LINE display name, not a users FK
  publishedActivityId: text("published_activity_id")
    .references(() => missionActivities.id, { onDelete: "set null" }),
  reviewedById: text("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const FOLLOW_UP_STATUSES = [
  "open", "in_progress", "completed", "cancelled",
] as const;

export const followUps = pgTable("follow_ups", {
  id: id(),
  status: text("status", { enum: FOLLOW_UP_STATUSES }).notNull().default("open"),
  subjectMemberId: text("subject_member_id").references(() => members.id, { onDelete: "cascade" }),
  subjectGroupId: text("subject_group_id").references(() => groups.id, { onDelete: "cascade" }),
  activityId: text("activity_id").references(() => missionActivities.id, { onDelete: "set null" }),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  note: text("note"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Every new table above answers the brief's own required question ("why
does it exist, what existing entity cannot represent this"):
- `missionActivities` — nothing today represents "something happened,"
  as distinct from attendance (a roll-call) or an announcement (broadcast
  text). Needed as the Feed/Timeline/Map source of truth.
- `missionActivityMedia` — one-to-many photos per activity; a text[] or
  JSON column would work for MVP and is the leaner alternative — **flag
  for Phase 1 decision**, not settled here.
- `missionActivityParticipants` — reuses the same join-table shape as
  `groupMembers`/`eventRegistrations` already in the schema; lets a
  Person's Timeline show activities they were part of.
- `missionSubmissions` — the brief requires a Mission Inbox distinct from
  published activity, with review states. Publishing copies/promotes a
  submission into a `missionActivities` row (`publishedActivityId` links
  them) rather than duplicating the data model.
- `followUps` — `members.status` (`ต้องติดตาม`/`ติดตามแล้ว`) is a
  two-state flag on a person; it cannot express "who owns this, by when,"
  which the brief explicitly asks for. A real table is justified.

**Reused, not duplicated:** `ministries` gets one additive nullable FK
(`groupId`) to express Church → Ministry → Group without a new table.
`groups.latitude`/`longitude` already exist and are reused for Map, no
new location table for groups. `attendanceRecords` is reused as-is for
the Attendance domain and referenced (not copied) into Timeline views.

## Information architecture (proposed, to validate — see §7 of the brief)

The current sidebar (`docs/PUNTAKIT_UX_AUDIT.md` §3) already has 12 items
plus a parallel `/app/*` member PWA. The OS brief's own hypothesis
(Feed/Groups/People/Map/More on mobile) should be validated against real
task frequency, not assumed. Proposed grouping, building on today's nav
rather than replacing it outright:

```
Primary (always visible):
  Feed            /feed        (new landing page, replaces or sits beside Home)
  Groups          /groups      (existing)
  People          /members     (existing, relabeled)
  Map             /map         (new)

Secondary ("More" on mobile, full sidebar on desktop):
  Timeline        (rendered inline on Person/Group/Place pages, not a
                   standalone nav item — per brief §6, "not every domain
                   needs a top-level nav item")
  Mission Inbox   /inbox        (new)
  Follow-up       /follow-up    (new)
  Attendance      /attendance   (existing)
  Events          /events       (existing, currently labeled "worship")
  Ministries      /ministries   (existing)
  Operations      /operations   (evolves from Home.tsx dashboard)
  Reports         /reports      (evolves from ComingSoon)
  Announcements   /announcements (existing)
  Church          /church       (existing)
  Administration  /settings     (evolves from ComingSoon)
  Profile         /profile      (existing)
```

This is a hypothesis for Phase 3 (see implementation plan), not a Phase 1
change — reshuffling live navigation is a highly visible, user-facing
change and should wait until Feed/Activity actually exist to navigate to.

## Security model

- All new tables get server-side authorization in the corresponding
  `server/routes/*.ts` module, following the existing RBAC pattern
  (`USER_ROLES` checked server-side, not UI-hidden only — matches current
  code, e.g. `server/routes/members.ts` pattern to confirm and replicate).
- `missionActivities.visibility` (`church`/`leaders`/`private`) gates Feed
  and Map queries at the query layer, not by hiding cards client-side.
- `missionSubmissions.rawText`/media may contain unreviewed, unverified
  field content — never expose it on Feed/Map until `status = approved`
  and it is promoted to a `missionActivities` row.
- Confidential prayer requests (`prayerRequests.isConfidential`) stay out
  of Feed/Timeline entirely — Feed only ever reads from
  `missionActivities`, never from `prayerRequests`.

## What this document intentionally leaves open

- Exact column list for `missionActivityMedia` (JSON column vs. join
  table) — small, reversible, decide at implementation time.
- Whether `followUps` needs its own notification trigger table or reuses
  `pushSubscriptions` directly — decide when Notifications phase starts.
- LINE adapter design — out of scope until a real LINE channel/credential
  exists; `missionSubmissions.source` already reserves room for it without
  committing to an integration now.
