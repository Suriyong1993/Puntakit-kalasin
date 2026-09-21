# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Puntakit is a church management dashboard: a Thai-first, data-driven React SPA (member metrics, group/attendance tracking, journey pipeline) served by a minimal Express static host. It was originally scaffolded by the Manus platform — several vendor-specific pieces (`vite-plugin-manus-runtime`, the debug-collector/storage-proxy plugins in `vite.config.ts`, `client/public/__manus__`) are platform plumbing, not app logic; leave them alone unless the task specifically involves that tooling.

## Commands

Package manager is **pnpm** (see `packageManager` in `package.json`; a `wouter` patch is applied via pnpm's `patchedDependencies`, so don't switch package managers).

```bash
pnpm install        # install deps (patches applied automatically)
pnpm dev             # Vite dev server on :3000 (--host, falls back to next free port)
pnpm build           # vite build (client -> dist/public) + esbuild bundle of server/index.ts -> dist/index.js
pnpm start           # NODE_ENV=production node dist/index.js (serves the built client)
pnpm preview          # vite preview of the production client build
pnpm check           # tsc --noEmit (project-wide type check)
pnpm format          # prettier --write .
```

There is no lint script and no ESLint config in this repo — `pnpm check` (TypeScript) is the only static gate. `vitest` is a devDependency but there is no test script and no test files exist yet; if adding tests, add both the spec files and a `test` script.

## Architecture

**Three top-level source roots**, wired together via path aliases (`vite.config.ts` and `tsconfig.json` must stay in sync):
- `client/src` → `@/*`
- `shared` → `@shared/*` (currently just `shared/const.ts`, re-exported through `client/src/const.ts`)
- `server` → plain relative imports, not part of the Vite build graph

**Client is a single-page app with client-side routing only** (`wouter`, not Next.js despite the `nextjs` tag in the environment metadata — there is no `app/` or `pages/` router convention here). `client/src/App.tsx` wraps everything in `ErrorBoundary > ThemeProvider > TooltipProvider` and defines routes with `wouter`'s `<Switch>/<Route>`. Pages live flat in `client/src/pages/` (`Home.tsx`, `Members.tsx`, `NotFound.tsx`); each page composes `AppLayout` (`client/src/components/layout/AppLayout.tsx`) which renders the `Sidebar` + `Topbar` shell around page content.

**Server is a thin production static host, not an API backend.** `server/index.ts` is a single-file Express app: it serves `dist/public` (or `server/public` in prod) and falls back to `index.html` for all routes (SPA catch-all). It has no routes, database, or business logic — all data currently lives inline in the page components (e.g. the `metrics`/journey arrays at the top of `Home.tsx`) as static/mock data, not fetched from an API. If real data fetching is introduced, it belongs behind new Express routes in `server/`, following the `shared/` pattern for cross-boundary types.

**UI components**: `client/src/components/ui/` holds ~53 shadcn/ui primitives (Radix-based) generated per `components.json` (`style: new-york`, alias-driven, Tailwind v4 CSS variables). Don't hand-edit these unless intentionally diverging from shadcn — regenerate via the shadcn CLI instead when possible. App-specific components (`Map.tsx`, `ManusDialog.tsx`, `ErrorBoundary.tsx`) sit one level up in `client/src/components/`.

**Styling is Tailwind v4** (`@tailwindcss/vite` plugin, no `tailwind.config.js` — config is CSS-first via `@import "tailwindcss"` in `client/src/index.css`) layered with a large block of hand-written, non-Tailwind CSS in the same file (custom classes like `.app-shell`, `.sidebar`, `.metric-card`, `.journey-step`, `.goal-ring`, etc.) that implements the actual dashboard visual design. When touching dashboard UI, prefer extending these existing hand-rolled classes/CSS custom properties (`--navy`, `--blue`, `--ink`, `--chart-1..6`, defined in `:root`) over introducing new ad-hoc Tailwind utility soup, to keep the look consistent with `brand-spec.md`.

**Brand/design reference**: `brand-spec.md` documents the intended visual direction (Thai-first typography via the Prompt font, color tokens, 240px sidebar / 76px topbar layout, card radii). Check it before making layout or color changes — the CSS custom properties in `index.css` should match these tokens.

**Env vars** are read via `import.meta.env.VITE_*` (e.g. `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID` in `client/src/const.ts` for the OAuth login redirect flow) and via `process.env` in the Vite config's storage-proxy plugin (`BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` — Manus platform storage, not app-level config).

**Path/alias gotcha**: `@assets` is aliased in `vite.config.ts` to an `attached_assets` directory that does not exist in this repo yet — only add files there if actually wiring up that alias.
