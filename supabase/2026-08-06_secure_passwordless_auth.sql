-- Passwordless authentication, project-scoped RLS, and audit trail.
--
-- REQUIRED ORDER:
--   1. 2026-08-04_reagent_inventory.sql
--   2. 2026-08-05_reagent_operations.sql
--   3. this file
--
-- BEFORE RUNNING: replace BOTH quoted values YOUR_ADMIN_EMAIL@example.com below
-- with the email that will own the first administrator account. Configure the
-- Supabase Site URL and Redirect URLs first; see docs/passwordless-auth-rollout.md.

begin;

do $$
declare
  configured_admin_email text := lower(btrim('igor.cabreira.ramos@usp.br'));
begin
  if configured_admin_email like '%your_admin_email%'
     or configured_admin_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'Configure a real first-administrator email before running this migration.';
  end if;
end $$;

create extension if not exists "pgcrypto";
do $$ begin
  create type public.app_role as enum ('admin', 'member');
exception when duplicate_object then null;
end $$;

create table if not exists public.app_security_status (
  id smallint primary key default 1 check (id = 1),
  auth_required boolean not null default true,
  activated_at timestamptz not null default now()
);

insert into public.app_security_status (id, auth_required)
values (1, true)
on conflict (id) do update
set auth_required = excluded.auth_required,
    activated_at = now();

create table if not exists public.app_auth_bootstrap (
  id smallint primary key default 1 check (id = 1),
  admin_email text not null check (admin_email = lower(btrim(admin_email))),
  created_at timestamptz not null default now()
);

insert into public.app_auth_bootstrap (id, admin_email)
values (1, lower(btrim('igor.cabreira.ramos@usp.br')))
on conflict (id) do update
set admin_email = excluded.admin_email;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'member',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_active boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.culture_members (
  culture_id uuid not null references public.cultures(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (culture_id, user_id)
);

-- The original auth migration created these columns. Reassert their defaults so
-- new writes are always attributed after public prototype mode is removed.
alter table public.cell_lines add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.projects add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.cultures add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.culture_events add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.culture_vessels add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.vessel_wells add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.vessel_cultures add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.cryo_boxes add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.cryo_vials add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.differentiation_protocols add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.differentiation_protocol_tasks add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.differentiation_runs add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.differentiation_run_wells add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();
alter table public.differentiation_events add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();

alter table public.cell_lines alter column created_by set default auth.uid();
alter table public.projects alter column created_by set default auth.uid();
alter table public.cultures alter column created_by set default auth.uid();
alter table public.culture_events alter column created_by set default auth.uid();
alter table public.culture_vessels alter column created_by set default auth.uid();
alter table public.vessel_wells alter column created_by set default auth.uid();
alter table public.vessel_cultures alter column created_by set default auth.uid();
alter table public.cryo_boxes alter column created_by set default auth.uid();
alter table public.cryo_vials alter column created_by set default auth.uid();
alter table public.differentiation_protocols alter column created_by set default auth.uid();
alter table public.differentiation_protocol_tasks alter column created_by set default auth.uid();
alter table public.differentiation_runs alter column created_by set default auth.uid();
alter table public.differentiation_run_wells alter column created_by set default auth.uid();
alter table public.differentiation_events alter column created_by set default auth.uid();

create index if not exists idx_profiles_role_active on public.profiles(role, is_active);
create index if not exists idx_project_members_user_id on public.project_members(user_id);
create index if not exists idx_culture_members_user_id on public.culture_members(user_id);

create or replace function public.claim_legacy_data_for_admin(admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'cell_lines', 'projects', 'cultures', 'culture_events', 'culture_vessels',
    'vessel_wells', 'vessel_cultures', 'cryo_boxes', 'cryo_vials',
    'differentiation_protocols', 'differentiation_protocol_tasks',
    'differentiation_runs', 'differentiation_run_wells', 'differentiation_events',
    'reagent_catalog', 'reagent_inventory_items', 'reagent_aliquots'
  ] loop
    if to_regclass('public.' || target_table) is not null
       and exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = target_table and column_name = 'created_by'
       ) then
      execute format('update public.%I set created_by = $1 where created_by is null', target_table) using admin_id;
    end if;
  end loop;

  insert into public.project_members(project_id, user_id)
  select id, admin_id from public.projects on conflict do nothing;
  insert into public.culture_members(culture_id, user_id)
  select id, admin_id from public.cultures on conflict do nothing;
end;
$$;

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
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when should_be_admin then 'admin'::public.app_role else 'member'::public.app_role end,
    should_be_admin
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now();
  if should_be_admin then
    perform public.claim_legacy_data_for_admin(new.id);
  end if;
  return new;
end;
$$;

revoke all on function public.claim_legacy_data_for_admin(uuid) from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_profile();

insert into public.profiles (id, email, full_name, role, is_active)
select
  users.id,
  lower(users.email),
  coalesce(users.raw_user_meta_data ->> 'full_name', split_part(users.email, '@', 1)),
  case when lower(users.email) = bootstrap.admin_email then 'admin'::public.app_role else 'member'::public.app_role end,
  lower(users.email) = bootstrap.admin_email
from auth.users users
cross join public.app_auth_bootstrap bootstrap
where bootstrap.id = 1
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    role = case when excluded.role = 'admin' then 'admin'::public.app_role else public.profiles.role end,
    is_active = public.profiles.is_active or excluded.is_active,
    updated_at = now();

do $$
begin
  if exists (select 1 from auth.users)
     and not exists (select 1 from public.profiles where role = 'admin' and is_active) then
    raise exception 'The configured administrator email does not match an existing Auth user. Create that user first or use the matching email, then rerun.';
  end if;
end $$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active and role = 'admin'
  );
$$;

create or replace function public.is_project_member(project_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.current_user_is_admin()
    or (public.is_active_user() and exists (
      select 1 from public.project_members
      where project_id = project_id_arg and user_id = auth.uid()
    ));
$$;

create or replace function public.is_project_name_member(project_name_arg text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and (
    project_name_arg is null
    or btrim(project_name_arg) = ''
    or public.current_user_is_admin()
    or exists (
      select 1
      from public.projects project
      join public.project_members member on member.project_id = project.id
      where project.name = project_name_arg and member.user_id = auth.uid()
    )
  );
$$;

create or replace function public.can_access_culture(culture_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and (
    public.current_user_is_admin()
    or exists (
      select 1 from public.cultures culture
      where culture.id = culture_id_arg
        and (
          culture.created_by = auth.uid()
          or public.is_project_name_member(culture.project)
          or exists (
            select 1 from public.culture_members member
            where member.culture_id = culture.id and member.user_id = auth.uid()
          )
        )
    )
  );
$$;

create or replace function public.can_access_vessel(vessel_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and (
    public.current_user_is_admin()
    or exists (
      select 1 from public.culture_vessels vessel
      where vessel.id = vessel_id_arg
        and (
          vessel.created_by = auth.uid()
          or (vessel.culture_id is not null and public.can_access_culture(vessel.culture_id))
          or exists (
            select 1 from public.vessel_cultures link
            where link.vessel_id = vessel.id and public.can_access_culture(link.culture_id)
          )
        )
    )
  );
$$;

create or replace function public.can_access_protocol(protocol_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and (
    public.current_user_is_admin()
    or exists (
      select 1 from public.differentiation_protocols protocol
      where protocol.id = protocol_id_arg
        and (protocol.created_by = auth.uid() or public.is_project_name_member(protocol.project))
    )
  );
$$;

create or replace function public.can_access_run(run_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and (
    public.current_user_is_admin()
    or exists (
      select 1 from public.differentiation_runs run
      where run.id = run_id_arg
        and (
          run.created_by = auth.uid()
          or public.is_project_name_member(run.project)
          or public.can_access_protocol(run.protocol_id)
          or (run.source_culture_id is not null and public.can_access_culture(run.source_culture_id))
          or (run.source_vessel_id is not null and public.can_access_vessel(run.source_vessel_id))
        )
    )
  );
$$;

create or replace function public.can_access_cryo_box(box_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and (
    public.current_user_is_admin()
    or exists (
      select 1 from public.cryo_boxes box
      where box.id = box_id_arg
        and (box.created_by = auth.uid() or public.is_project_name_member(box.project))
    )
  );
$$;

revoke all on function public.is_active_user() from public;
revoke all on function public.current_user_is_admin() from public;
revoke all on function public.is_project_member(uuid) from public;
revoke all on function public.is_project_name_member(text) from public;
revoke all on function public.can_access_culture(uuid) from public;
revoke all on function public.can_access_vessel(uuid) from public;
revoke all on function public.can_access_protocol(uuid) from public;
revoke all on function public.can_access_run(uuid) from public;
revoke all on function public.can_access_cryo_box(uuid) from public;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.is_project_member(uuid) to authenticated;
grant execute on function public.is_project_name_member(text) to authenticated;
grant execute on function public.can_access_culture(uuid) to authenticated;
grant execute on function public.can_access_vessel(uuid) to authenticated;
grant execute on function public.can_access_protocol(uuid) to authenticated;
grant execute on function public.can_access_run(uuid) to authenticated;
grant execute on function public.can_access_cryo_box(uuid) to authenticated;

create or replace function public.activate_profile_from_membership()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.profiles
  set is_active = true, updated_at = now()
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists activate_project_member_profile on public.project_members;
create trigger activate_project_member_profile
after insert on public.project_members
for each row execute function public.activate_profile_from_membership();
drop trigger if exists activate_culture_member_profile on public.culture_members;
create trigger activate_culture_member_profile
after insert on public.culture_members
for each row execute function public.activate_profile_from_membership();

create or replace function public.add_project_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.created_by is not null then
    insert into public.project_members(project_id, user_id)
    values (new.id, new.created_by)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_project_created_add_member on public.projects;
create trigger on_project_created_add_member
after insert on public.projects
for each row execute function public.add_project_creator_membership();

create or replace function public.add_culture_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.created_by is not null then
    insert into public.culture_members(culture_id, user_id)
    values (new.id, new.created_by)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_culture_created_add_member on public.cultures;
create trigger on_culture_created_add_member
after insert on public.cultures
for each row execute function public.add_culture_creator_membership();

-- Claim legacy rows for the designated administrator before policies close.
do $$
declare
  admin_id uuid;
begin
  select profile.id into admin_id
  from public.profiles profile
  join public.app_auth_bootstrap bootstrap on lower(profile.email) = bootstrap.admin_email
  where bootstrap.id = 1 and profile.role = 'admin'
  limit 1;

  if admin_id is null and exists (select 1 from auth.users) then
    raise exception 'Could not resolve the configured administrator profile.';
  end if;

  if admin_id is not null then
    perform public.claim_legacy_data_for_admin(admin_id);
  end if;
end $$;

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  record_key jsonb not null default '{}'::jsonb,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_audit_log_table_time on public.audit_log(table_name, occurred_at desc);
create index if not exists idx_audit_log_actor_time on public.audit_log(actor_id, occurred_at desc);

create or replace function public.capture_audit_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  before_row jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  after_row jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  key_source jsonb := coalesce(after_row, before_row, '{}'::jsonb);
  changed text[];
begin
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(entry.key order by entry.key), array[]::text[])
    into changed
    from jsonb_each(after_row) entry
    where before_row -> entry.key is distinct from entry.value;
  end if;

  insert into public.audit_log(
    table_name, action, record_key, old_data, new_data, changed_fields, actor_id, actor_email
  ) values (
    tg_table_name,
    tg_op,
    jsonb_strip_nulls(jsonb_build_object(
      'id', key_source ->> 'id',
      'project_id', key_source ->> 'project_id',
      'culture_id', key_source ->> 'culture_id',
      'user_id', key_source ->> 'user_id',
      'inventory_item_id', key_source ->> 'inventory_item_id',
      'differentiation_run_id', key_source ->> 'differentiation_run_id'
    )),
    before_row,
    after_row,
    changed,
    auth.uid(),
    auth.jwt() ->> 'email'
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles', 'project_members', 'culture_members', 'cell_lines', 'projects',
    'cultures', 'culture_events', 'culture_vessels', 'vessel_wells',
    'vessel_cultures', 'culture_cell_lines', 'cryo_boxes', 'cryo_vials',
    'differentiation_protocols', 'differentiation_protocol_tasks',
    'differentiation_runs', 'differentiation_run_wells',
    'differentiation_run_cell_lines', 'differentiation_events', 'reagent_catalog',
    'reagent_inventory_items', 'reagent_aliquots', 'reagent_purchase_requests'
  ] loop
    if to_regclass('public.' || target_table) is not null then
      execute format('drop trigger if exists audit_changes on public.%I', target_table);
      execute format(
        'create trigger audit_changes after insert or update or delete on public.%I for each row execute function public.capture_audit_change()',
        target_table
      );
    end if;
  end loop;
end $$;

-- Remove every legacy/prototype policy from protected tables in one pass.
do $$
declare
  policy_row record;
  protected_tables text[] := array[
    'profiles', 'project_members', 'culture_members', 'audit_log', 'cell_lines',
    'projects', 'cultures', 'culture_events', 'culture_vessels', 'vessel_wells',
    'vessel_cultures', 'culture_cell_lines', 'cryo_boxes', 'cryo_vials',
    'differentiation_protocols', 'differentiation_protocol_tasks',
    'differentiation_runs', 'differentiation_run_wells',
    'differentiation_run_cell_lines', 'differentiation_events', 'reagent_catalog',
    'reagent_inventory_items', 'reagent_aliquots', 'reagent_purchase_requests'
  ];
  target_table text;
begin
  foreach target_table in array protected_tables loop
    if to_regclass('public.' || target_table) is not null then
      execute format('alter table public.%I enable row level security', target_table);
    end if;
  end loop;

  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename = any(protected_tables)
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end $$;

alter table public.app_security_status enable row level security;
alter table public.app_auth_bootstrap enable row level security;
drop policy if exists "security status readable" on public.app_security_status;
create policy "security status readable" on public.app_security_status
for select using (true);
revoke all on public.app_security_status from anon, authenticated;
grant select on public.app_security_status to anon, authenticated;
revoke all on public.app_auth_bootstrap from anon, authenticated;

create policy "profiles self or active read" on public.profiles
for select using (id = auth.uid() or public.is_active_user());
create policy "profiles self insert" on public.profiles
for insert with check (id = auth.uid() and role = 'member' and not is_active);
create policy "profiles self name update" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid() and role = 'member');
revoke update on public.profiles from authenticated;
grant update(full_name) on public.profiles to authenticated;

create policy "project memberships read" on public.project_members
for select using (public.current_user_is_admin() or user_id = auth.uid() or public.is_project_member(project_id));
create policy "project memberships admin insert" on public.project_members
for insert with check (public.current_user_is_admin());
create policy "project memberships admin delete" on public.project_members
for delete using (public.current_user_is_admin());

create policy "culture memberships read" on public.culture_members
for select using (public.current_user_is_admin() or user_id = auth.uid() or public.can_access_culture(culture_id));
create policy "culture memberships admin insert" on public.culture_members
for insert with check (public.current_user_is_admin());
create policy "culture memberships admin delete" on public.culture_members
for delete using (public.current_user_is_admin());

create policy "audit admin read" on public.audit_log
for select using (public.current_user_is_admin());
revoke insert, update, delete on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create policy "cell lines active read" on public.cell_lines
for select using (public.is_active_user());
create policy "cell lines active insert" on public.cell_lines
for insert with check (public.is_active_user() and created_by = auth.uid());
create policy "cell lines owner update" on public.cell_lines
for update using (public.current_user_is_admin() or created_by = auth.uid())
with check (public.current_user_is_admin() or created_by = auth.uid());
create policy "cell lines owner delete" on public.cell_lines
for delete using (public.current_user_is_admin() or created_by = auth.uid());

create policy "projects member read" on public.projects
for select using (public.is_project_member(id));
create policy "projects active insert" on public.projects
for insert with check (public.is_active_user() and created_by = auth.uid());
create policy "projects member update" on public.projects
for update using (public.is_project_member(id)) with check (public.is_project_member(id));
create policy "projects admin delete" on public.projects
for delete using (public.current_user_is_admin());

create policy "cultures collaborator read" on public.cultures
for select using (public.can_access_culture(id));
create policy "cultures project insert" on public.cultures
for insert with check (public.is_active_user() and created_by = auth.uid() and public.is_project_name_member(project));
create policy "cultures collaborator update" on public.cultures
for update using (public.can_access_culture(id))
with check (public.can_access_culture(id) and public.is_project_name_member(project));
create policy "cultures collaborator delete" on public.cultures
for delete using (public.can_access_culture(id));

create policy "events collaborator read" on public.culture_events
for select using (
  public.current_user_is_admin() or created_by = auth.uid()
  or (culture_id is not null and public.can_access_culture(culture_id))
  or (vessel_id is not null and public.can_access_vessel(vessel_id))
);
create policy "events collaborator insert" on public.culture_events
for insert with check (
  public.is_active_user() and created_by = auth.uid() and (
    (culture_id is not null and public.can_access_culture(culture_id))
    or (vessel_id is not null and public.can_access_vessel(vessel_id))
  )
);
create policy "events collaborator update" on public.culture_events
for update using (
  public.current_user_is_admin() or created_by = auth.uid()
  or (culture_id is not null and public.can_access_culture(culture_id))
  or (vessel_id is not null and public.can_access_vessel(vessel_id))
) with check (
  public.current_user_is_admin() or created_by = auth.uid()
  or (culture_id is not null and public.can_access_culture(culture_id))
  or (vessel_id is not null and public.can_access_vessel(vessel_id))
);
create policy "events collaborator delete" on public.culture_events
for delete using (
  public.current_user_is_admin() or created_by = auth.uid()
  or (culture_id is not null and public.can_access_culture(culture_id))
  or (vessel_id is not null and public.can_access_vessel(vessel_id))
);

create policy "vessels collaborator read" on public.culture_vessels
for select using (public.can_access_vessel(id));
create policy "vessels collaborator insert" on public.culture_vessels
for insert with check (
  public.is_active_user() and created_by = auth.uid()
  and (culture_id is null or public.can_access_culture(culture_id))
);
create policy "vessels collaborator update" on public.culture_vessels
for update using (public.can_access_vessel(id))
with check (public.can_access_vessel(id) and (culture_id is null or public.can_access_culture(culture_id)));
create policy "vessels collaborator delete" on public.culture_vessels
for delete using (public.can_access_vessel(id));

create policy "wells collaborator read" on public.vessel_wells
for select using (public.can_access_vessel(vessel_id));
create policy "wells collaborator insert" on public.vessel_wells
for insert with check (
  public.is_active_user() and created_by = auth.uid() and public.can_access_vessel(vessel_id)
  and (culture_id is null or public.can_access_culture(culture_id))
);
create policy "wells collaborator update" on public.vessel_wells
for update using (public.can_access_vessel(vessel_id))
with check (public.can_access_vessel(vessel_id) and (culture_id is null or public.can_access_culture(culture_id)));
create policy "wells collaborator delete" on public.vessel_wells
for delete using (public.can_access_vessel(vessel_id));

create policy "vessel culture links read" on public.vessel_cultures
for select using (public.can_access_vessel(vessel_id) or public.can_access_culture(culture_id));
create policy "vessel culture links insert" on public.vessel_cultures
for insert with check (
  public.is_active_user() and created_by = auth.uid()
  and public.can_access_vessel(vessel_id) and public.can_access_culture(culture_id)
);
create policy "vessel culture links delete" on public.vessel_cultures
for delete using (public.can_access_vessel(vessel_id) and public.can_access_culture(culture_id));

create policy "culture cell links read" on public.culture_cell_lines
for select using (public.can_access_culture(culture_id));
create policy "culture cell links insert" on public.culture_cell_lines
for insert with check (public.can_access_culture(culture_id));
create policy "culture cell links delete" on public.culture_cell_lines
for delete using (public.can_access_culture(culture_id));

create policy "cryo boxes member read" on public.cryo_boxes
for select using (public.can_access_cryo_box(id));
create policy "cryo boxes member insert" on public.cryo_boxes
for insert with check (public.is_active_user() and created_by = auth.uid() and public.is_project_name_member(project));
create policy "cryo boxes member update" on public.cryo_boxes
for update using (public.can_access_cryo_box(id))
with check (public.can_access_cryo_box(id) and public.is_project_name_member(project));
create policy "cryo boxes member delete" on public.cryo_boxes
for delete using (public.can_access_cryo_box(id));

create policy "cryo vials member read" on public.cryo_vials
for select using (public.can_access_cryo_box(box_id));
create policy "cryo vials member insert" on public.cryo_vials
for insert with check (public.is_active_user() and created_by = auth.uid() and public.can_access_cryo_box(box_id));
create policy "cryo vials member update" on public.cryo_vials
for update using (public.can_access_cryo_box(box_id)) with check (public.can_access_cryo_box(box_id));
create policy "cryo vials member delete" on public.cryo_vials
for delete using (public.can_access_cryo_box(box_id));

create policy "protocols member read" on public.differentiation_protocols
for select using (public.can_access_protocol(id));
create policy "protocols member insert" on public.differentiation_protocols
for insert with check (public.is_active_user() and created_by = auth.uid() and public.is_project_name_member(project));
create policy "protocols member update" on public.differentiation_protocols
for update using (public.can_access_protocol(id))
with check (public.can_access_protocol(id) and public.is_project_name_member(project));
create policy "protocols member delete" on public.differentiation_protocols
for delete using (public.can_access_protocol(id));

create policy "protocol tasks member read" on public.differentiation_protocol_tasks
for select using (public.can_access_protocol(protocol_id));
create policy "protocol tasks member insert" on public.differentiation_protocol_tasks
for insert with check (public.is_active_user() and created_by = auth.uid() and public.can_access_protocol(protocol_id));
create policy "protocol tasks member update" on public.differentiation_protocol_tasks
for update using (public.can_access_protocol(protocol_id)) with check (public.can_access_protocol(protocol_id));
create policy "protocol tasks member delete" on public.differentiation_protocol_tasks
for delete using (public.can_access_protocol(protocol_id));

create policy "runs member read" on public.differentiation_runs
for select using (public.can_access_run(id));
create policy "runs member insert" on public.differentiation_runs
for insert with check (
  public.is_active_user() and created_by = auth.uid()
  and public.is_project_name_member(project) and public.can_access_protocol(protocol_id)
  and (source_culture_id is null or public.can_access_culture(source_culture_id))
  and (source_vessel_id is null or public.can_access_vessel(source_vessel_id))
);
create policy "runs member update" on public.differentiation_runs
for update using (public.can_access_run(id))
with check (public.can_access_run(id) and public.is_project_name_member(project));
create policy "runs member delete" on public.differentiation_runs
for delete using (public.can_access_run(id));

create policy "run wells member read" on public.differentiation_run_wells
for select using (public.can_access_run(differentiation_run_id));
create policy "run wells member insert" on public.differentiation_run_wells
for insert with check (public.can_access_run(differentiation_run_id) and public.can_access_vessel(vessel_id));
create policy "run wells member delete" on public.differentiation_run_wells
for delete using (public.can_access_run(differentiation_run_id));

create policy "run cell links member read" on public.differentiation_run_cell_lines
for select using (public.can_access_run(differentiation_run_id));
create policy "run cell links member insert" on public.differentiation_run_cell_lines
for insert with check (public.can_access_run(differentiation_run_id));
create policy "run cell links member delete" on public.differentiation_run_cell_lines
for delete using (public.can_access_run(differentiation_run_id));

create policy "differentiation events member read" on public.differentiation_events
for select using (public.can_access_run(differentiation_run_id));
create policy "differentiation events member insert" on public.differentiation_events
for insert with check (
  public.is_active_user() and created_by = auth.uid() and public.can_access_run(differentiation_run_id)
);
create policy "differentiation events member update" on public.differentiation_events
for update using (public.can_access_run(differentiation_run_id))
with check (public.can_access_run(differentiation_run_id));
create policy "differentiation events member delete" on public.differentiation_events
for delete using (public.can_access_run(differentiation_run_id));

-- Reagent catalog/stock is lab-wide for active members. Project-scoped data stays
-- isolated above; every stock write is attributed and audited.
create policy "reagent catalog active read" on public.reagent_catalog
for select using (public.is_active_user());
create policy "reagent catalog admin insert" on public.reagent_catalog
for insert with check (public.current_user_is_admin() and created_by = auth.uid());
create policy "reagent catalog admin update" on public.reagent_catalog
for update using (public.current_user_is_admin()) with check (public.current_user_is_admin());
create policy "reagent catalog admin delete" on public.reagent_catalog
for delete using (public.current_user_is_admin());

create policy "reagent inventory active read" on public.reagent_inventory_items
for select using (public.is_active_user());
create policy "reagent inventory active insert" on public.reagent_inventory_items
for insert with check (public.is_active_user() and created_by = auth.uid());
create policy "reagent inventory active update" on public.reagent_inventory_items
for update using (public.is_active_user()) with check (public.is_active_user());
create policy "reagent inventory active delete" on public.reagent_inventory_items
for delete using (public.current_user_is_admin() or created_by = auth.uid());

create policy "reagent aliquots active read" on public.reagent_aliquots
for select using (public.is_active_user());
create policy "reagent aliquots active insert" on public.reagent_aliquots
for insert with check (public.is_active_user() and created_by = auth.uid());
create policy "reagent aliquots active update" on public.reagent_aliquots
for update using (public.is_active_user()) with check (public.is_active_user());
create policy "reagent aliquots active delete" on public.reagent_aliquots
for delete using (public.current_user_is_admin() or created_by = auth.uid());

do $$
begin
  if to_regclass('public.reagent_purchase_requests') is not null then
    execute 'create policy "purchase requests active read" on public.reagent_purchase_requests for select using (public.is_active_user())';
    execute 'create policy "purchase requests owner insert" on public.reagent_purchase_requests for insert with check (public.is_active_user() and requested_by = auth.uid() and status = ''requested'')';
    execute 'create policy "purchase requests owner update" on public.reagent_purchase_requests for update using (public.current_user_is_admin() or (requested_by = auth.uid() and status in (''requested'', ''cancelled''))) with check (public.current_user_is_admin() or (requested_by = auth.uid() and status in (''requested'', ''cancelled'')))';
    execute 'create policy "purchase requests owner delete" on public.reagent_purchase_requests for delete using (public.current_user_is_admin() or (requested_by = auth.uid() and status in (''requested'', ''cancelled'')))';
  end if;
end $$;

-- Private photo bucket: images are displayed through one-hour signed URLs in app.js.
update storage.buckets set public = false where id = 'culture-photos';
drop policy if exists "Prototype public read culture photos" on storage.objects;
drop policy if exists "Prototype public upload culture photos" on storage.objects;
drop policy if exists "Public culture photo read" on storage.objects;
drop policy if exists "Public culture photo upload" on storage.objects;
drop policy if exists "Public culture photo update" on storage.objects;
drop policy if exists "Public culture photo delete" on storage.objects;
drop policy if exists "Authenticated read culture photos" on storage.objects;
drop policy if exists "Authenticated upload culture photos" on storage.objects;
drop policy if exists "secure culture photo read" on storage.objects;
drop policy if exists "secure culture photo insert" on storage.objects;
drop policy if exists "secure culture photo update" on storage.objects;
drop policy if exists "secure culture photo delete" on storage.objects;
create policy "secure culture photo read" on storage.objects
for select using (bucket_id = 'culture-photos' and public.is_active_user());
create policy "secure culture photo insert" on storage.objects
for insert with check (bucket_id = 'culture-photos' and public.is_active_user());
create policy "secure culture photo update" on storage.objects
for update using (bucket_id = 'culture-photos' and public.is_active_user())
with check (bucket_id = 'culture-photos' and public.is_active_user());
create policy "secure culture photo delete" on storage.objects
for delete using (bucket_id = 'culture-photos' and public.is_active_user());

commit;
