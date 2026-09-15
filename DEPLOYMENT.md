# Deployment notes

The current repository is a React/Vite dashboard with a small Express static-file server. It does not yet contain a Supabase schema, Drizzle ORM setup, authentication flow, or database seed scripts. The current `vercel.json` therefore deploys the client as a single-page application.

## Current verification

Run the following before deployment:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

## Vercel

Deploy the current static dashboard with the existing `vercel.json`. Do not add database variables until a backend implementation is merged.

When the Supabase migration is implemented, configure these variables in Vercel project settings for the appropriate environments:

- `DATABASE_URL` — Supabase PostgreSQL connection string.
- `JWT_SECRET` — long random secret used to sign sessions.
- `ADMIN_EMAIL` — initial administrator email used by the seed process.

Real values must remain in the hosting provider’s secret store and must never be committed. `.env.example` is intentionally a placeholder only.

## Supabase migration prerequisites

Before implementing the database layer, decide whether the application should use Supabase Auth or the existing Manus authentication approach. This choice changes the session model, protected routes, user table shape, and deployment runtime. The repository currently has no database credentials configured in this workspace, so migration and admin seeding cannot be executed safely here.
