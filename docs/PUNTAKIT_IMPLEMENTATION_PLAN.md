# Puntakit Implementation Plan — Ministry Operating System

Date: 2026-09-24

Each phase is a coherent, shippable slice. No phase deletes existing
working functionality. Schema changes are additive (new tables, nullable
FKs) until a later, explicitly-approved deprecation step.

## Phase 0 — Foundation docs (this change)

- `docs/PUNTAKIT_PRODUCT_RESEARCH.md`
- `docs/PUNTAKIT_UX_AUDIT.md`
- `docs/PUNTAKIT_PRODUCT_ARCHITECTURE.md`
- `docs/PUNTAKIT_IMPLEMENTATION_PLAN.md` (this file)
- Fix `CLAUDE.md`'s stale "no backend, mock data" description.

Non-destructive, no schema change, no UI change. Safe to ship alone.

## Phase 1 — Ministry Activity data layer

- Add `missionActivities`, `missionActivityMedia`,
  `missionActivityParticipants` tables (Drizzle migration via
  `pnpm db:generate` + `pnpm db:migrate`).
- Add `server/routes/activities.ts`: CRUD + list with filters
  (group, person, place, date range, type), server-side RBAC and
  `visibility` enforcement.
- Add `shared` validation schema for activity create/update (matching the
  existing `shared/validation.ts` pattern).
- Tests: route tests following the existing `*.test.ts` pattern next to
  each route module.

No new navigation yet. No Feed UI yet. This phase makes the data layer
real so every later UI phase reads/writes one source of truth from day
one, instead of UI being built ahead of data and mocked in the meantime.

## Phase 2 — Feed (primary "what happened" surface)

- New page `client/src/pages/Feed.tsx`: chronological, filterable list
  over `missionActivities`, photo-first cards, links out to
  person/group/place.
- Capture flow: mobile-first, full-screen create form (photo + type +
  group + people + story), following the brief's "sheets/full-screen
  mobile flows, not shrunk desktop forms" instruction.
- Wire `/feed` route; keep `/` (Home) as-is until Phase 6 (Operations)
  actually needs the slot.
- Apply the warm palette (burnt orange / vanilla / warm ivory / charcoal)
  as the token update in `client/src/index.css` `:root`, since Feed is the
  first genuinely new surface and the natural place to validate the new
  visual language before rolling it across the whole app.

## Phase 3 — Timeline + Person/Group detail integration

- Reusable `<ActivityTimeline subjectType="person|group|place" subjectId>`
  component, rendered inline on existing Member detail and Group detail
  views (progressive disclosure: Overview tab default, Activity tab on
  demand).
- No new top-level nav item (per architecture doc — Timeline is a lens,
  not a page).

## Phase 4 — Follow-up

- Add `followUps` table + `server/routes/followUps.ts`.
- Add `/follow-up` page: open/overdue/completed views, owner assignment.
- Link follow-up creation from an Activity card and from a Person page.
- Do not touch `members.status` yet — both can coexist; migrate that flag
  into real follow-up records only after Phase 4 ships and is validated,
  as a separate, explicitly-approved step (touches existing data).

## Phase 5 — Mission Inbox

- Add `missionSubmissions` table + `server/routes/submissions.ts`.
- Add `/inbox` page: queue UI with new/reviewing/needs-info/approved/
  rejected states; "Publish" action promotes a submission into a
  `missionActivities` row.
- No LINE adapter in this phase — manual submission entry only (e.g. an
  admin pastes what came in over LINE today). The `source` enum already
  reserves the `line` value for when a real channel/credential exists;
  do not fake an integration in the meantime.

## Phase 6 — Operations (replaces ad hoc dashboard framing)

- Evolve `server/routes/dashboard.ts` and `Home.tsx` into an Operations
  surface: submissions waiting for review, open/overdue follow-ups,
  groups with no recent activity, recent activity, upcoming events —
  all real aggregates over Phase 1–5 tables, no fabricated scores.

## Phase 7 — Map

- Wire `client/src/components/Map.tsx` (confirm current usage first) to
  `missionActivities`/`groups` location data, respecting `visibility`.

## Phase 8 — Navigation restructuring

- Only after Feed/Inbox/Follow-up/Operations exist and have real content
  to point to: restructure the sidebar per the proposed IA in the
  architecture doc. This is the one step classified as a genuinely
  user-visible "major architecture replacement" — confirm the final IA
  with the product owner before shipping, per the brief's own escalation
  rule.
- Roll the warm palette out from Feed (Phase 2) to the rest of the app in
  the same pass, so the visual language changes once, coherently, not
  page-by-page.

## Phase 9+ — Reports, Notifications, Search, Administration

- Reports: real exports over Phase 1–7 data, replacing the `ComingSoon`
  stub.
- Notifications: event-driven (follow-up due, submission needs review),
  built on the existing `pushSubscriptions` table.
- Search: cross-domain, start with server-side `ILIKE`/trigram search
  over existing Postgres before introducing a separate search
  infrastructure — the brief explicitly asks to justify that before
  adding it.
- Administration: real RBAC management UI over the existing `USER_ROLES`
  enum, filling the `/settings` `ComingSoon` stub.

## What requires explicit confirmation before proceeding

Per the brief's own escalation rule ("ask only for destructive migration,
irreversible data loss, ... major architecture replacement, fundamental
product contradiction"):

1. **Starting Phase 1** (schema migration) — first real schema change;
   confirm the `missionActivities` shape in the architecture doc before
   generating a migration against it.
2. **Phase 4's data migration** of `members.status` into `followUps` —
   touches existing member data.
2. **Phase 8's navigation restructuring** — the one user-facing,
   highly visible IA change; confirm final structure first.

Everything else in Phases 1–7, 9+ is additive and can proceed once Phase 1
is confirmed, without a stop-and-ask at every step.
