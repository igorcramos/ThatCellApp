-- Adds lab assignment and an admin-only profile management RPC.
-- Run this after 2026-08-06_secure_passwordless_auth.sql.

alter table public.profiles
  add column if not exists lab_name text;

create index if not exists idx_profiles_lab_name on public.profiles(lab_name);

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  should_be_admin boolean;
begin
  select lower(new.email) = bootstrap.admin_email
         and not exists (select 1 from public.profiles where role = 'admin')
    into should_be_admin
  from public.app_auth_bootstrap bootstrap
  where bootstrap.id = 1;

  should_be_admin := coalesce(should_be_admin, false);

  insert into public.profiles (id, email, full_name, lab_name, role, is_active)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'lab_name', new.raw_user_meta_data ->> 'lab')), ''),
    case when should_be_admin then 'admin'::public.app_role else 'member'::public.app_role end,
    should_be_admin
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      lab_name = coalesce(public.profiles.lab_name, excluded.lab_name),
      updated_at = now();

  if should_be_admin then
    perform public.claim_legacy_data_for_admin(new.id);
  end if;

  return new;
end;
$$;

revoke update on public.profiles from authenticated;
grant update(full_name, lab_name) on public.profiles to authenticated;

create or replace function public.admin_update_profile(
  profile_id_arg uuid,
  lab_name_arg text,
  role_arg public.app_role,
  is_active_arg boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'Only administrators can update member access.';
  end if;

  if profile_id_arg = auth.uid() and (role_arg <> 'admin'::public.app_role or not coalesce(is_active_arg, false)) then
    raise exception 'You cannot remove your own administrator access.';
  end if;

  update public.profiles
  set lab_name = nullif(btrim(lab_name_arg), ''),
      role = role_arg,
      is_active = coalesce(is_active_arg, false),
      updated_at = now()
  where id = profile_id_arg;
end;
$$;

revoke all on function public.admin_update_profile(uuid, text, public.app_role, boolean) from public;
grant execute on function public.admin_update_profile(uuid, text, public.app_role, boolean) to authenticated;
