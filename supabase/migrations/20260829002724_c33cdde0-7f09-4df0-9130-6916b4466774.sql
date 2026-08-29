create or replace function public.ak_user_id_by_email(_email text)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(trim(_email)) limit 1
$$;

revoke all on function public.ak_user_id_by_email(text) from public;
revoke all on function public.ak_user_id_by_email(text) from anon;
revoke all on function public.ak_user_id_by_email(text) from authenticated;
grant execute on function public.ak_user_id_by_email(text) to service_role;