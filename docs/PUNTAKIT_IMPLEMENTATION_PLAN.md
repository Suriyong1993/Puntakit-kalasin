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

## Phase 2 — Feed — DONE (palette rollout deferred, see below)

Shipped on branch `claude/eloquent-archimedes-04s1kg`, not yet in a PR.

- New page `client/src/pages/Feed.tsx`: chronological, filterable
  (type/status) grid over `GET /api/activities`, photo-first cards
  (thumbnail, type/status badges, group or place, author, story snippet),
  reusing existing `AppLayout`/`CardGridSkeleton`/`ApiError` patterns —
  no new client architecture introduced.
- Capture flow: a full-width `Sheet` (mobile-first — covers the full
  viewport width on phone, a right-hand panel on desktop) with type,
  title, story, occurred-at, optional group, place label, a participant
  checklist (from `/api/members`), and media as URL entries (no file
  upload infra exists yet, so photo capture is a URL field for now, not a
  camera integration — flagged as a real gap, not silently skipped).
- Status actions on each card (submit for review / publish / archive /
  restore) call `PUT /api/activities/:id/status` directly — the server
  is the actual authority; the client just hides actions that are
  obviously never valid (e.g. no "publish" on an archived card) and lets
  the server 403 the rest.
- Added a single new sidebar entry ("ฟีดกิจกรรม" → `/feed`) — this is
  additive, not the Phase 8 restructuring; the rest of the nav is
  untouched.
- List query extended with a correlated-subquery `thumbnailUrl` (first
  media row by `sortOrder`) so Feed cards are photo-first without a
  second round trip per card.

**Deliberately deviated from the original plan on one point: did not
apply the warm palette.** The plan's original text called for swapping
`:root` tokens as part of this phase. On inspection, that's not a
Feed-scoped change — this app's CSS custom properties (`--navy`, `--blue`,
etc.) are global and already used by every existing page, so redefining
them would instantly restyle the entire app, not just Feed. Doing that
without a human able to look at it live (the person who owns this repo
was asleep for this phase) is the kind of visually risky, hard-to-verify-
blind change this plan's own quality bar ("run the actual application...
fix problems introduced by your work") argues against. Feed instead uses
the existing navy/blue design system as-is. The palette swap stays
scheduled for Phase 8, when it can be reviewed live in one pass together
with the navigation restructuring.

**Real bug found and fixed while visually verifying this phase:** the
installed shadcn/ui `Sheet` (and by the same mechanism, `Dialog`)
component renders with a fully transparent background in this app,
because `client/src/index.css` never defines the standard shadcn tokens
(`--background`, `--foreground`, `--popover`, `--border`, etc.) that
`bg-background` and friends resolve to — this codebase uses its own
`--navy`/`--blue`/`--surface` token set instead. That's very likely why
every existing page (see `Announcements.tsx`) rolls its own
`.modal-backdrop`/`.modal-card` CSS instead of using the installed
`Dialog`/`Sheet` primitives — they'd have looked broken. Fixed locally in
`Feed.tsx` with an explicit `bg-white` on `SheetContent`. The systemic gap
(shadcn tokens undefined app-wide) is real and worth fixing centrally, but
is a design-token change outside this phase's scope — flagged as a
follow-up, not fixed globally here.

**Verification actually performed:** `pnpm check`, `pnpm test` (125/125,
unchanged — no new automated tests added for this UI phase, see note
below), `pnpm build` all pass. Additionally, actually ran the app: seeded
a local PGlite database and an admin user, started `pnpm dev`, and drove
it with a headless Chromium (Playwright, the pre-installed browser) at
both a 1440×900 desktop viewport and a 390×844 mobile viewport — logged
in, opened Feed, opened the capture sheet, submitted a real activity,
confirmed it appeared in the list as a draft, changed its status to
published through the UI, and confirmed the status filter and badge
updated. This is what caught the transparent-Sheet bug above; screenshots
are not committed to the repo (they're verification artifacts, not
product assets). No automated browser test (e.g. Playwright in CI) was
added — this phase was UI-focused and manually verified end to end, but a
repeatable UI regression test is not yet part of the test suite, which is
a real gap.

## Phase 3 — Timeline + Person/Group detail integration — DONE

Shipped on branch `claude/eloquent-archimedes-04s1kg`, not yet in a PR.

- Added `client/src/components/ActivityTimeline.tsx`: `subjectType`
  (`"member" | "group"`) + `subjectId` → queries `GET /api/activities`
  with `memberId=`/`groupId=` — the same Phase 1 endpoint Feed uses, no
  new backend route and no new data. This is a pure read lens, exactly as
  the architecture doc specified ("Timeline is a lens, not a page").
- Rendered inline in the existing Member detail modal
  (`client/src/pages/Members.tsx`, under "กิจกรรมพันธกิจล่าสุด") and the
  existing Group members modal (`client/src/pages/Groups.tsx`, under
  "กิจกรรมพันธกิจล่าสุดของกลุ่ม") — both pre-existing modals, not new
  pages. No `place`/Place-entity subject type: Phase 1 kept location as
  columns on the activity, not a Place entity, so there is no Place
  detail view yet for a Place timeline to attach to. Adding it later is
  additive, not a redesign of this component.
- No new top-level nav item — matches the architecture doc.

**Verification:** `pnpm check`, `pnpm test` (125/125, unchanged), `pnpm
build` all pass. Manually verified live: seeded a group, a member, and one
mission activity linking both via the real API in the same authenticated
browser session, then opened the Member detail modal and the Group
members modal and confirmed the same activity renders correctly in both
— proving the "one activity, reused by every lens" rule from the
architecture doc, not just asserted but actually observed across two
different surfaces.

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
