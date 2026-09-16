# Puntakit database setup and authorization

Puntakit now uses a **Supabase/PostgreSQL-ready relational schema**. The database, not browser state, is the source of truth for church members, groups, reports, attendance, activities, content, notifications, and audit history. The schema is located at `supabase/migrations/202609160001_puntakit_core.sql`.

## Apply the migration

Create or select the church's Supabase project, open the SQL Editor, and apply the migration in a single transaction. Alternatively, run it through the Supabase CLI against the intended project. Apply it **before** deploying the frontend; without the migration the application deliberately shows a configuration error rather than substituting mock data.

## Frontend runtime variables

Configure these values in the deployment environment and in a local `.env.local` file only. Never commit real values.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

For a deployment that supplies Next.js-style names, map `NEXT_PUBLIC_SUPABASE_URL` to
`VITE_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to
`VITE_SUPABASE_ANON_KEY` for this Vite client.

The anon key is safe to expose to the browser only because every business table is protected by Row Level Security. Do not put a Supabase service-role key in the Vite environment or client bundle.

## Authentication and role assignment

Supabase Auth creates an authenticated user. The database trigger creates a corresponding `profiles` record with the `viewer` role. A `super_admin` or `admin` must promote appropriate users after their first sign-in. The allowed roles are:

| Role | Scope |
| --- | --- |
| `super_admin` | Full organization and user administration |
| `admin` | Organization administration, audit log access, and destructive member actions |
| `area_leader` | Ministry data management within the application policy |
| `ministry_leader` | Ministry data management within the application policy |
| `group_leader` | Ministry data management within the application policy |
| `member` | Authenticated read access to ministry records |
| `viewer` | Authenticated read access to ministry records |

The SQL policies enforce the authorization decision. The UI may hide unavailable actions for clarity, but it is not trusted for access control.

## Data integrity and auditing

Foreign keys preserve the key relationships: a ministry group belongs to an area; group memberships join members to groups; reports belong to groups; attendance belongs to reports; and deleting a referenced group is restricted. Member deactivation is an `active = false` update rather than an immediate deletion. Database triggers write before-and-after JSON snapshots to `audit_logs` for material changes.

## Verification checklist

After migration, sign in with a promoted ministry role and verify: creating a member persists after refresh; editing and deactivating a member produces an audit row; normal members cannot create or modify members; filtering queries return only persisted records; and a direct SQL attempt from a non-privileged account is denied by RLS.
