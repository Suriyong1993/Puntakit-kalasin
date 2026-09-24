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

## Phase 1 — Ministry Activity data layer — DONE

Shipped on branch `claude/eloquent-archimedes-04s1kg`, not yet in a PR.

- Added `mission_activities`, `mission_activity_participants`,
  `mission_activity_media` tables — additive migration
  `server/db/migrations/0004_clumsy_legion.sql` (3 `CREATE TABLE`s, no
  `ALTER`/`DROP` on any existing table).
- Added `server/routes/activities.ts`: list/detail/create/update/status
  transition/soft-delete, filtered by group/person/type/status/date/
  search, server-side RBAC reusing the existing `USER_ROLES` middleware
  (no `visibility` column — see architecture doc for why).
- Added `missionActivityInputSchema`/`missionActivityQuerySchema`/
  `missionActivityStatusUpdateSchema` to `shared/validation.ts`.
- Added `server/routes/activities.test.ts` (17 tests): full loop against
  a real embedded PostgreSQL instance (PGlite) — create, persist, fetch,
  401/403/404 authorization, group relation, participant relation, two
  lifecycle-publish paths, invalid-transition rejection, audit log rows,
  soft delete.
- Fixed a pre-existing hardcoded migration count in
  `server/db/bootstrap.test.ts` (4 → 5).
- `pnpm check`, `pnpm test` (125/125), `pnpm build` all pass. See the
  architecture doc's "Verification actually performed" section for what
  was and wasn't exercised (no live Neon/Postgres — no credential
  available in this environment).

No new navigation yet. No Feed UI yet — the `GET /api/activities` list
endpoint is the query Feed will read from in Phase 2, so Feed can be built
directly against real data with no interim mock layer.

**Deferred to later phases, on purpose (kept the schema minimal):**
`missionSubmissions` (Mission Inbox, Phase 5), `followUps` (Phase 4), a
`visibility` enum (not needed while status already gates draft/
pending_review visibility), LINE/AI integration (not started).

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

Approved 2026-09-24: proceed autonomously through Phases 2–7 and 9+
without stopping for approval at each phase boundary. Per the brief's own
escalation rule ("ask only for destructive migration, irreversible data
loss, ... major architecture replacement, fundamental product
contradiction"), only two points still require a stop-and-confirm:

1. **Phase 4's data migration** of `members.status` into `followUps` —
   touches existing member data, not additive.
2. **Phase 8's navigation restructuring** — the one user-facing, highly
   visible IA change; confirm final structure first.

Everything else in Phases 2–7, 9+ is additive and proceeds without asking
again, continuing straight through phase boundaries.
