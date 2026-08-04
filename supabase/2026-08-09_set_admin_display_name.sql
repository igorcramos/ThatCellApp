-- Set the app-visible name for the configured bootstrap administrator.
-- This does not change the login email, Supabase user ID, GitHub account,
-- repository name, or published application URL.

begin;

do $$
declare
  updated_profiles integer;
begin
  update public.profiles profile
  set full_name = 'igorcramos',
      updated_at = now()
  from public.app_auth_bootstrap bootstrap
  where bootstrap.id = 1
    and lower(profile.email) = bootstrap.admin_email
    and profile.is_active
    and profile.full_name is distinct from 'igorcramos';

  get diagnostics updated_profiles = row_count;

  if not exists (
    select 1
    from public.profiles profile
    join public.app_auth_bootstrap bootstrap
      on bootstrap.id = 1 and lower(profile.email) = bootstrap.admin_email
    where profile.is_active
      and profile.full_name = 'igorcramos'
  ) then
    raise exception 'The active bootstrap administrator profile was not found.';
  end if;

  raise notice 'App display name is igorcramos (% profile updated).', updated_profiles;
end $$;

commit;
