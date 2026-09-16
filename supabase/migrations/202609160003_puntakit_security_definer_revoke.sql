-- SECURITY DEFINER helpers are trigger/RLS internals, not public RPC endpoints.
revoke execute on function public.can_manage_ministry() from public;
revoke execute on function public.is_privileged() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.write_audit_log() from public;
