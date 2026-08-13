-- Adds multi-lab membership and promotes the configured bootstrap admin.
-- Run this after 2026-08-13_member_labs_access.sql.

alter table public.profiles
  add column if not exists lab_names text[] not null default '{}';

update public.profiles
set lab_names = case
    when cardinality(lab_names) > 0 then lab_names
    when nullif(btrim(lab_name), '') is not null then array[nullif(btrim(lab_name), '')]
    else '{}'
  end,
  updated_at = now();

create index if not exists idx_profiles_lab_names on public.profiles using gin(lab_names);

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  should_be_admin boolean;
  selected_lab text;
  selected_labs text[];
begin
  select lower(new.email) = bootstrap.admin_email
         and not exists (select 1 from public.profiles where role = 'admin')
    into should_be_admin
  from public.app_auth_bootstrap bootstrap
  where bootstrap.id = 1;

  should_be_admin := coalesce(should_be_admin, false);
  selected_lab := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'lab_name', new.raw_user_meta_data ->> 'lab')), '');
  selected_labs := case when selected_lab is null then '{}'::text[] else array[selected_lab] end;

  insert into public.profiles (id, email, full_name, lab_name, lab_names, role, is_active)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    selected_lab,
    selected_labs,
    case when should_be_admin then 'admin'::public.app_role else 'member'::public.app_role end,
    should_be_admin
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      lab_name = coalesce(public.profiles.lab_name, excluded.lab_name),
      lab_names = case
        when cardinality(public.profiles.lab_names) > 0 then public.profiles.lab_names
        else excluded.lab_names
      end,
      updated_at = now();

  if should_be_admin then
    perform public.claim_legacy_data_for_admin(new.id);
  end if;

  return new;
end;
$$;

revoke update on public.profiles from authenticated;
grant update(full_name, lab_name, lab_names) on public.profiles to authenticated;

create or replace function public.admin_update_profile(
  profile_id_arg uuid,
  lab_name_arg text,
  lab_names_arg text[],
  role_arg public.app_role,
  is_active_arg boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  cleaned_labs text[];
begin
  if not public.current_user_is_admin() then
    raise exception 'Only administrators can update member access.';
  end if;

  if profile_id_arg = auth.uid() and (role_arg <> 'admin'::public.app_role or not coalesce(is_active_arg, false)) then
    raise exception 'You cannot remove your own administrator access.';
  end if;

  select coalesce(array_agg(distinct lab), '{}'::text[])
    into cleaned_labs
  from (
    select nullif(btrim(lab), '') as lab
    from unnest(coalesce(lab_names_arg, '{}'::text[])) as lab
  ) labs
  where lab is not null;

  update public.profiles
  set lab_name = coalesce(nullif(btrim(lab_name_arg), ''), cleaned_labs[1]),
      lab_names = cleaned_labs,
      role = role_arg,
      is_active = coalesce(is_active_arg, false),
      updated_at = now()
  where id = profile_id_arg;
end;
$$;

revoke all on function public.admin_update_profile(uuid, text, text[], public.app_role, boolean) from public;
grant execute on function public.admin_update_profile(uuid, text, text[], public.app_role, boolean) to authenticated;

update public.profiles
set role = 'admin'::public.app_role,
    is_active = true,
    lab_name = 'Victor Lab',
    lab_names = array['Victor Lab', 'Rita Lab'],
    updated_at = now()
where lower(email) = (
  select admin_email
  from public.app_auth_bootstrap
  where id = 1
);
