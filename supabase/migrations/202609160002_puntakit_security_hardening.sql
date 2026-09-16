-- Puntakit security and foreign-key index hardening
revoke execute on function public.can_manage_ministry() from anon, authenticated;
revoke execute on function public.is_privileged() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.write_audit_log() from anon, authenticated;
revoke execute on function public.can_manage_ministry() from public;
revoke execute on function public.is_privileged() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.write_audit_log() from public;

create index if not exists activities_created_by_idx on public.activities(created_by);
create index if not exists announcements_author_id_idx on public.announcements(author_id);
create index if not exists areas_leader_id_idx on public.areas(leader_id);
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists group_members_member_id_idx on public.group_members(member_id);
create index if not exists media_uploaded_by_idx on public.media(uploaded_by);
create index if not exists ministry_groups_coordinator_id_idx on public.ministry_groups(coordinator_id);
create index if not exists ministry_groups_leader_id_idx on public.ministry_groups(leader_id);
create index if not exists ministry_reports_submitted_by_idx on public.ministry_reports(submitted_by);
create index if not exists profiles_area_id_idx on public.profiles(area_id);
create index if not exists report_attendance_member_id_idx on public.report_attendance(member_id);
