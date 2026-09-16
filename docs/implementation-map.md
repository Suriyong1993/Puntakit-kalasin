# Puntakit implementation map

## Audit summary — 16 September 2026

The `main` branch is a polished React/Vite static prototype. It uses a custom Thai-first design system in `client/src/index.css`, Wouter routing, a reusable `AppLayout` with `Sidebar` and `Topbar`, Lucide icons, and a small Express server that currently serves the built frontend only. Existing useful work includes the branded dashboard composition, responsive sidebar behavior, Prompt typography, design tokens, custom component primitives, profile page, map component, and production build configuration.

There is no database schema, authentication, API service layer, migration, or persistent CRUD on `main`. The dashboard (`Home.tsx`) and member list (`Members.tsx`) contain hard-coded arrays and state-only interactions. The remaining product routes currently render `ComingSoon`. The project is prepared for PostgreSQL/Supabase in `.env.example`, but no database connection is available in this workspace.

## Preserved architecture

The implementation will preserve the current React 19, TypeScript, Vite, Wouter, Tailwind, Radix/shadcn-style component, and bespoke CSS architecture. New backend functionality will be added as a minimal typed Express API layer beneath `server/`, while new frontend data access will live in `client/src/services/`. `AppLayout`, `Sidebar`, `Topbar`, existing design tokens, hero visuals, and intentional responsive behavior remain the foundation.

## Incremental implementation plan

1. Add a PostgreSQL/Supabase-ready schema, SQL migration, explicit role policy documentation, and a protected typed API service layer. The API must not use localStorage or React state for business data.
2. Convert members to a validated, searchable, filterable, paginated CRUD experience with a real form, a detail drawer, confirmation before deactivation, audit events, loading/empty/error states, and server-side authorization.
3. Add areas, ministry groups, group membership, weekly reports, attendance, activities, care queue, and dashboard queries in discrete feature slices.
4. Replace every placeholder route with a real data-backed page before production release; prioritize Members, Groups, Reports, and Dashboard.
5. Apply migrations only after the Supabase connection is enabled or production `DATABASE_URL` is supplied. No credentials or service keys will be committed.

## Current limitations and required deployment step

The active session has neither `DATABASE_URL` nor a Supabase connector. The included migration and runtime layer can be reviewed, tested for types/build, and deployed now; the live migration must be applied in a configured PostgreSQL/Supabase environment. The disabled Supabase connector can be enabled for that final step without exposing credentials to client code.
