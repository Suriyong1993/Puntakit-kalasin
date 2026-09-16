-- Puntakit Church core domain schema
-- Apply with the Supabase SQL editor or Supabase CLI after configuring the project.
-- This migration is idempotent where practical and keeps authorization in Postgres RLS.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('super_admin', 'admin', 'area_leader', 'ministry_leader', 'group_leader', 'member', 'viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.group_status as enum ('active', 'inactive', 'pending', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.spiritual_status as enum ('visitor', 'interested', 'new_believer', 'member', 'leader', 'volunteer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.follow_up_status as enum ('new', 'contacted', 'in_progress', 'stable', 'needs_attention', 'inactive');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_status as enum ('draft', 'submitted', 'reviewed', 'approved', 'returned');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'absent', 'visitor', 'new_believer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.activity_type as enum ('worship', 'evangelism', 'bible_study', 'prayer', 'fellowship', 'training', 'outreach', 'meeting', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.content_status as enum ('draft', 'scheduled', 'published', 'archived');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 160),
  avatar_url text,
  email text,
  phone text,
  role public.app_role not null default 'viewer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 120),
  code text not null unique check (char_length(trim(code)) between 1 and 40),
  description text,
  leader_id uuid references public.profiles(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists area_id uuid references public.areas(id) on delete set null;

create table if not exists public.ministry_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 160),
  area_id uuid not null references public.areas(id) on delete restrict,
  leader_id uuid references public.profiles(id) on delete set null,
  coordinator_id uuid references public.profiles(id) on delete set null,
  meeting_day text,
  meeting_time time,
  location text,
  village text,
  subdistrict text,
  district text,
  province text,
  latitude double precision,
  longitude double precision,
  status public.group_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (area_id, name)
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) between 1 and 160),
  nickname text,
  phone text,
  avatar_url text,
  gender text check (gender in ('male', 'female', 'other', 'unspecified')),
  birth_date date,
  address text,
  village text,
  subdistrict text,
  district text,
  province text,
  area_id uuid references public.areas(id) on delete set null,
  group_id uuid references public.ministry_groups(id) on delete set null,
  role text not null default 'member',
  spiritual_status public.spiritual_status not null default 'visitor',
  follow_up_status public.follow_up_status not null default 'new',
  joined_at date not null default current_date,
  last_contact_at timestamptz,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.ministry_groups(id) on delete restrict,
  member_id uuid not null references public.members(id) on delete restrict,
  role text not null default 'member',
  joined_at date not null default current_date,
  left_at date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, member_id, active)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 180),
  description text,
  type public.activity_type not null default 'other',
  activity_date timestamptz not null,
  location text,
  organizer text,
  status public.content_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ministry_reports (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.ministry_groups(id) on delete restrict,
  report_date date not null,
  participants_count integer not null default 0 check (participants_count >= 0),
  new_visitors integer not null default 0 check (new_visitors >= 0),
  new_believers integer not null default 0 check (new_believers >= 0),
  activities text,
  sermon_topic text,
  bible_verse text,
  received text,
  application text,
  prayer_requests text,
  notes text,
  submitted_by uuid references public.profiles(id) on delete set null,
  status public.report_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, report_date)
);

create table if not exists public.report_attendance (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.ministry_reports(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  attendance_status public.attendance_status not null,
  created_at timestamptz not null default now(),
  unique (report_id, member_id)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 220),
  content text not null,
  cover_image text,
  category text,
  publish_at timestamptz,
  expire_at timestamptz,
  status public.content_status not null default 'draft',
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expire_at is null or publish_at is null or expire_at > publish_at)
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 220),
  description text,
  type text not null check (type in ('image', 'pdf', 'document', 'video', 'training', 'form')),
  file_url text not null,
  thumbnail_url text,
  category text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('create', 'update', 'delete', 'approve', 'reject', 'assign', 'transfer')),
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists members_active_idx on public.members(active);
create index if not exists members_area_idx on public.members(area_id);
create index if not exists members_group_idx on public.members(group_id);
create index if not exists members_follow_up_idx on public.members(follow_up_status);
create index if not exists members_joined_idx on public.members(joined_at desc);
create index if not exists reports_group_date_idx on public.ministry_reports(group_id, report_date desc);
create index if not exists notifications_recipient_idx on public.notifications(recipient_id, read_at, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_privileged()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role in ('super_admin', 'admin')
  );
$$;

create or replace function public.can_manage_ministry()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role in ('super_admin', 'admin', 'area_leader', 'ministry_leader', 'group_leader')
  );
$$;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, old_data)
    values (auth.uid(), 'delete', tg_table_name, old.id, to_jsonb(old));
    return old;
  elsif tg_op = 'INSERT' then
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, new_data)
    values (auth.uid(), 'create', tg_table_name, new.id, to_jsonb(new));
    return new;
  else
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, old_data, new_data)
    values (auth.uid(), 'update', tg_table_name, new.id, to_jsonb(old), to_jsonb(new));
    return new;
  end if;
end;
$$;

do $$
declare
  target text;
begin
  foreach target in array array['profiles', 'areas', 'ministry_groups', 'members', 'group_members', 'activities', 'ministry_reports', 'announcements', 'media']
  loop
    execute format('drop trigger if exists %I on public.%I', target || '_set_updated_at', target);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', target || '_set_updated_at', target);
    execute format('drop trigger if exists %I on public.%I', target || '_audit', target);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.write_audit_log()', target || '_audit', target);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.areas enable row level security;
alter table public.ministry_groups enable row level security;
alter table public.members enable row level security;
alter table public.group_members enable row level security;
alter table public.activities enable row level security;
alter table public.ministry_reports enable row level security;
alter table public.report_attendance enable row level security;
alter table public.announcements enable row level security;
alter table public.media enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_admin_manage" on public.profiles;
drop policy if exists "areas_read_authenticated" on public.areas;
drop policy if exists "areas_admin_manage" on public.areas;
drop policy if exists "groups_read_authenticated" on public.ministry_groups;
drop policy if exists "groups_managers_manage" on public.ministry_groups;
drop policy if exists "members_read_authenticated" on public.members;
drop policy if exists "members_managers_create" on public.members;
drop policy if exists "members_managers_update" on public.members;
drop policy if exists "members_admin_delete" on public.members;
drop policy if exists "group_members_read_authenticated" on public.group_members;
drop policy if exists "group_members_managers_manage" on public.group_members;
drop policy if exists "activities_read_authenticated" on public.activities;
drop policy if exists "activities_managers_manage" on public.activities;
drop policy if exists "reports_read_authenticated" on public.ministry_reports;
drop policy if exists "reports_managers_manage" on public.ministry_reports;
drop policy if exists "attendance_read_authenticated" on public.report_attendance;
drop policy if exists "attendance_managers_manage" on public.report_attendance;
drop policy if exists "announcements_read_published_or_manager" on public.announcements;
drop policy if exists "announcements_managers_manage" on public.announcements;
drop policy if exists "media_read_authenticated" on public.media;
drop policy if exists "media_managers_manage" on public.media;
drop policy if exists "notifications_read_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_admin_insert" on public.notifications;
drop policy if exists "audit_logs_admin_read" on public.audit_logs;

create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_privileged());
create policy "profiles_admin_manage" on public.profiles for all to authenticated using (public.is_privileged()) with check (public.is_privileged());
create policy "areas_read_authenticated" on public.areas for select to authenticated using (true);
create policy "areas_admin_manage" on public.areas for all to authenticated using (public.is_privileged()) with check (public.is_privileged());
create policy "groups_read_authenticated" on public.ministry_groups for select to authenticated using (true);
create policy "groups_managers_manage" on public.ministry_groups for all to authenticated using (public.can_manage_ministry()) with check (public.can_manage_ministry());
create policy "members_read_authenticated" on public.members for select to authenticated using (true);
create policy "members_managers_create" on public.members for insert to authenticated with check (public.can_manage_ministry());
create policy "members_managers_update" on public.members for update to authenticated using (public.can_manage_ministry()) with check (public.can_manage_ministry());
create policy "members_admin_delete" on public.members for delete to authenticated using (public.is_privileged());
create policy "group_members_read_authenticated" on public.group_members for select to authenticated using (true);
create policy "group_members_managers_manage" on public.group_members for all to authenticated using (public.can_manage_ministry()) with check (public.can_manage_ministry());
create policy "activities_read_authenticated" on public.activities for select to authenticated using (true);
create policy "activities_managers_manage" on public.activities for all to authenticated using (public.can_manage_ministry()) with check (public.can_manage_ministry());
create policy "reports_read_authenticated" on public.ministry_reports for select to authenticated using (true);
create policy "reports_managers_manage" on public.ministry_reports for all to authenticated using (public.can_manage_ministry()) with check (public.can_manage_ministry());
create policy "attendance_read_authenticated" on public.report_attendance for select to authenticated using (true);
create policy "attendance_managers_manage" on public.report_attendance for all to authenticated using (public.can_manage_ministry()) with check (public.can_manage_ministry());
create policy "announcements_read_published_or_manager" on public.announcements for select to authenticated using (status = 'published' or public.can_manage_ministry());
create policy "announcements_managers_manage" on public.announcements for all to authenticated using (public.can_manage_ministry()) with check (public.can_manage_ministry());
create policy "media_read_authenticated" on public.media for select to authenticated using (true);
create policy "media_managers_manage" on public.media for all to authenticated using (public.can_manage_ministry()) with check (public.can_manage_ministry());
create policy "notifications_read_own" on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "notifications_admin_insert" on public.notifications for insert to authenticated with check (public.is_privileged());
create policy "audit_logs_admin_read" on public.audit_logs for select to authenticated using (public.is_privileged());

-- Bootstrap profiles from Supabase Auth. New accounts remain viewers until an admin assigns a ministry role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, 'สมาชิก'), '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

comment on table public.ministry_groups is 'Named ministry groups; named this way to avoid the PostgreSQL GROUPS keyword.';
comment on table public.audit_logs is 'Append-only audit history written by database triggers for material changes.';
