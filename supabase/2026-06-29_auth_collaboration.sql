-- Auth, profiles, admin/member roles, and collaborative project/culture access.
-- SAFE VERSION 2026-06-29c: no dollar-quoted functions and no AS-quoted function bodies.
-- Run this after the existing schema migrations.

create extension if not exists "pgcrypto";

do 'begin create type public.app_role as enum (''admin'', ''member''); exception when duplicate_object then null; end;';

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now()
);

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

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_project_members_user_id on public.project_members(user_id);
create index if not exists idx_culture_members_user_id on public.culture_members(user_id);
create index if not exists idx_cultures_created_by on public.cultures(created_by);
create index if not exists idx_projects_created_by on public.projects(created_by);

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

insert into public.profiles (id, email, full_name)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

create or replace function public.current_user_is_admin() returns boolean
language sql
stable
security definer
set search_path = public
return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );

create or replace function public.is_project_member(project_id_arg uuid) returns boolean
language sql
stable
security definer
set search_path = public
return public.current_user_is_admin()
    or exists (
      select 1
      from public.project_members
      where project_id = project_id_arg
        and user_id = auth.uid()
    )
    or exists (
      select 1
      from public.projects
      where id = project_id_arg
        and created_by = auth.uid()
    );

create or replace function public.project_id_for_name(project_name_arg text) returns uuid
language sql
stable
security definer
set search_path = public
return (
  select id
  from public.projects
  where name = project_name_arg
  limit 1
);

create or replace function public.is_project_name_member(project_name_arg text) returns boolean
language sql
stable
security definer
set search_path = public
return project_name_arg is null
    or btrim(project_name_arg) = ''
    or public.current_user_is_admin()
    or public.is_project_member(public.project_id_for_name(project_name_arg));

create or replace function public.can_access_culture(culture_id_arg uuid) returns boolean
language sql
stable
security definer
set search_path = public
return public.current_user_is_admin()
    or exists (
      select 1
      from public.cultures c
      where c.id = culture_id_arg
        and (
          c.created_by = auth.uid()
          or exists (
            select 1 from public.culture_members cm
            where cm.culture_id = c.id and cm.user_id = auth.uid()
          )
          or public.is_project_name_member(c.project)
        )
    );

create or replace function public.can_access_vessel(vessel_id_arg uuid) returns boolean
language sql
stable
security definer
set search_path = public
return public.current_user_is_admin()
    or exists (
      select 1
      from public.culture_vessels v
      where v.id = vessel_id_arg
        and (
          v.created_by = auth.uid()
          or (v.culture_id is not null and public.can_access_culture(v.culture_id))
          or exists (
            select 1 from public.vessel_cultures vc
            where vc.vessel_id = v.id and public.can_access_culture(vc.culture_id)
          )
        )
    );

create or replace function public.can_access_protocol(protocol_id_arg uuid) returns boolean
language sql
stable
security definer
set search_path = public
return public.current_user_is_admin()
    or exists (
      select 1
      from public.differentiation_protocols p
      where p.id = protocol_id_arg
        and (p.created_by = auth.uid() or public.is_project_name_member(p.project))
    );

create or replace function public.can_access_run(run_id_arg uuid) returns boolean
language sql
stable
security definer
set search_path = public
return public.current_user_is_admin()
    or exists (
      select 1
      from public.differentiation_runs r
      where r.id = run_id_arg
        and (
          r.created_by = auth.uid()
          or public.is_project_name_member(r.project)
          or public.can_access_protocol(r.protocol_id)
          or (r.source_culture_id is not null and public.can_access_culture(r.source_culture_id))
          or (r.source_vessel_id is not null and public.can_access_vessel(r.source_vessel_id))
        )
    );

create or replace function public.can_access_cryo_box(box_id_arg uuid) returns boolean
language sql
stable
security definer
set search_path = public
return public.current_user_is_admin()
    or exists (
      select 1
      from public.cryo_boxes b
      where b.id = box_id_arg
        and (b.created_by = auth.uid() or public.is_project_name_member(b.project))
    );

drop trigger if exists on_project_created_add_member on public.projects;
drop function if exists public.add_project_creator_membership();

drop trigger if exists on_culture_created_add_member on public.cultures;
drop function if exists public.add_culture_creator_membership();

alter table public.profiles enable row level security;
alter table public.project_members enable row level security;
alter table public.culture_members enable row level security;

do 'declare target record; begin for target in select schemaname, tablename, policyname from pg_policies where schemaname = ''public'' and tablename = any (array[''profiles'', ''project_members'', ''culture_members'', ''cell_lines'', ''projects'', ''cultures'', ''culture_events'', ''culture_vessels'', ''vessel_wells'', ''vessel_cultures'', ''cryo_boxes'', ''cryo_vials'', ''differentiation_protocols'', ''differentiation_protocol_tasks'', ''differentiation_runs'', ''differentiation_run_wells'', ''differentiation_events'']) loop execute format(''drop policy if exists %I on %I.%I'', target.policyname, target.schemaname, target.tablename); end loop; end;';

drop policy if exists "Profiles readable by signed in users" on public.profiles;
drop policy if exists "Profiles can update own name" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Profiles readable by signed in users" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can insert own profile" on public.profiles for insert with check (id = auth.uid() and role = 'member');
create policy "Admins can update profiles" on public.profiles for update using (public.current_user_is_admin());

drop policy if exists "Project members readable by collaborators" on public.project_members;
drop policy if exists "Project members managed by admins" on public.project_members;
create policy "Project members readable by collaborators" on public.project_members for select using (public.current_user_is_admin() or user_id = auth.uid() or public.is_project_member(project_id));
create policy "Project members inserted by admins" on public.project_members for insert with check (public.current_user_is_admin());
create policy "Project members deleted by admins" on public.project_members for delete using (public.current_user_is_admin());

drop policy if exists "Culture members readable by collaborators" on public.culture_members;
drop policy if exists "Culture members managed by admins" on public.culture_members;
create policy "Culture members readable by collaborators" on public.culture_members for select using (public.current_user_is_admin() or user_id = auth.uid() or public.can_access_culture(culture_id));
create policy "Culture members inserted by admins" on public.culture_members for insert with check (public.current_user_is_admin());
create policy "Culture members deleted by admins" on public.culture_members for delete using (public.current_user_is_admin());

-- Remove the prototype public policies.
drop policy if exists "Prototype public read cell lines" on public.cell_lines;
drop policy if exists "Prototype public insert cell lines" on public.cell_lines;
drop policy if exists "Prototype public update cell lines" on public.cell_lines;
drop policy if exists "Prototype public delete cell lines" on public.cell_lines;
drop policy if exists "Prototype public read projects" on public.projects;
drop policy if exists "Prototype public insert projects" on public.projects;
drop policy if exists "Prototype public update projects" on public.projects;
drop policy if exists "Prototype public delete projects" on public.projects;
drop policy if exists "Prototype public read cultures" on public.cultures;
drop policy if exists "Prototype public insert cultures" on public.cultures;
drop policy if exists "Prototype public update cultures" on public.cultures;
drop policy if exists "Prototype public delete cultures" on public.cultures;
drop policy if exists "Prototype public read culture events" on public.culture_events;
drop policy if exists "Prototype public insert culture events" on public.culture_events;
drop policy if exists "Prototype public update culture events" on public.culture_events;
drop policy if exists "Prototype public delete culture events" on public.culture_events;
drop policy if exists "Prototype public read culture vessels" on public.culture_vessels;
drop policy if exists "Prototype public insert culture vessels" on public.culture_vessels;
drop policy if exists "Prototype public update culture vessels" on public.culture_vessels;
drop policy if exists "Prototype public delete culture vessels" on public.culture_vessels;
drop policy if exists "Prototype public read vessel wells" on public.vessel_wells;
drop policy if exists "Prototype public insert vessel wells" on public.vessel_wells;
drop policy if exists "Prototype public update vessel wells" on public.vessel_wells;
drop policy if exists "Prototype public delete vessel wells" on public.vessel_wells;
drop policy if exists "Prototype public read vessel cultures" on public.vessel_cultures;
drop policy if exists "Prototype public insert vessel cultures" on public.vessel_cultures;
drop policy if exists "Prototype public update vessel cultures" on public.vessel_cultures;
drop policy if exists "Prototype public delete vessel cultures" on public.vessel_cultures;
drop policy if exists "Prototype public read cryo boxes" on public.cryo_boxes;
drop policy if exists "Prototype public insert cryo boxes" on public.cryo_boxes;
drop policy if exists "Prototype public update cryo boxes" on public.cryo_boxes;
drop policy if exists "Prototype public delete cryo boxes" on public.cryo_boxes;
drop policy if exists "Prototype public read cryo vials" on public.cryo_vials;
drop policy if exists "Prototype public insert cryo vials" on public.cryo_vials;
drop policy if exists "Prototype public update cryo vials" on public.cryo_vials;
drop policy if exists "Prototype public delete cryo vials" on public.cryo_vials;
drop policy if exists "Prototype public read differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public insert differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public update differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public delete differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public read differentiation protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public insert differentiation protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public update differentiation protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public delete differentiation protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public read differentiation runs" on public.differentiation_runs;
drop policy if exists "Prototype public insert differentiation runs" on public.differentiation_runs;
drop policy if exists "Prototype public update differentiation runs" on public.differentiation_runs;
drop policy if exists "Prototype public delete differentiation runs" on public.differentiation_runs;
drop policy if exists "Prototype public read differentiation run wells" on public.differentiation_run_wells;
drop policy if exists "Prototype public insert differentiation run wells" on public.differentiation_run_wells;
drop policy if exists "Prototype public update differentiation run wells" on public.differentiation_run_wells;
drop policy if exists "Prototype public delete differentiation run wells" on public.differentiation_run_wells;
drop policy if exists "Prototype public read differentiation events" on public.differentiation_events;
drop policy if exists "Prototype public insert differentiation events" on public.differentiation_events;
drop policy if exists "Prototype public update differentiation events" on public.differentiation_events;
drop policy if exists "Prototype public delete differentiation events" on public.differentiation_events;

create policy "Authenticated read cell lines" on public.cell_lines for select using (auth.role() = 'authenticated');
create policy "Authenticated create cell lines" on public.cell_lines for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "Owners or admins update cell lines" on public.cell_lines for update using (public.current_user_is_admin() or created_by = auth.uid()) with check (public.current_user_is_admin() or created_by = auth.uid());
create policy "Owners or admins delete cell lines" on public.cell_lines for delete using (public.current_user_is_admin() or created_by = auth.uid());

create policy "Members read projects" on public.projects for select using (public.current_user_is_admin() or public.is_project_member(id));
create policy "Authenticated create projects" on public.projects for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "Project members update projects" on public.projects for update using (public.current_user_is_admin() or public.is_project_member(id)) with check (public.current_user_is_admin() or public.is_project_member(id));
create policy "Admins delete projects" on public.projects for delete using (public.current_user_is_admin());

create policy "Members read cultures" on public.cultures for select using (public.can_access_culture(id));
create policy "Project members create cultures" on public.cultures for insert with check (auth.uid() is not null and created_by = auth.uid() and public.is_project_name_member(project));
create policy "Culture collaborators update cultures" on public.cultures for update using (public.can_access_culture(id)) with check (public.can_access_culture(id) and public.is_project_name_member(project));
create policy "Culture collaborators delete cultures" on public.cultures for delete using (public.can_access_culture(id));

create policy "Members read culture events" on public.culture_events for select using (public.current_user_is_admin() or (culture_id is not null and public.can_access_culture(culture_id)) or (vessel_id is not null and public.can_access_vessel(vessel_id)) or created_by = auth.uid());
create policy "Culture collaborators create culture events" on public.culture_events for insert with check (auth.uid() is not null and created_by = auth.uid() and ((culture_id is not null and public.can_access_culture(culture_id)) or (vessel_id is not null and public.can_access_vessel(vessel_id))));
create policy "Culture collaborators update culture events" on public.culture_events for update using (public.current_user_is_admin() or created_by = auth.uid() or (culture_id is not null and public.can_access_culture(culture_id)) or (vessel_id is not null and public.can_access_vessel(vessel_id))) with check (public.current_user_is_admin() or created_by = auth.uid() or (culture_id is not null and public.can_access_culture(culture_id)) or (vessel_id is not null and public.can_access_vessel(vessel_id)));
create policy "Culture collaborators delete culture events" on public.culture_events for delete using (public.current_user_is_admin() or created_by = auth.uid() or (culture_id is not null and public.can_access_culture(culture_id)) or (vessel_id is not null and public.can_access_vessel(vessel_id)));

create policy "Members read vessels" on public.culture_vessels for select using (public.can_access_vessel(id));
create policy "Culture collaborators create vessels" on public.culture_vessels for insert with check (auth.uid() is not null and created_by = auth.uid() and (culture_id is null or public.can_access_culture(culture_id)));
create policy "Culture collaborators update vessels" on public.culture_vessels for update using (public.can_access_vessel(id)) with check (public.can_access_vessel(id) and (culture_id is null or public.can_access_culture(culture_id)));
create policy "Culture collaborators delete vessels" on public.culture_vessels for delete using (public.can_access_vessel(id));

create policy "Members read vessel wells" on public.vessel_wells for select using (public.can_access_vessel(vessel_id));
create policy "Culture collaborators create vessel wells" on public.vessel_wells for insert with check (auth.uid() is not null and created_by = auth.uid() and public.can_access_vessel(vessel_id) and (culture_id is null or public.can_access_culture(culture_id)));
create policy "Culture collaborators update vessel wells" on public.vessel_wells for update using (public.can_access_vessel(vessel_id)) with check (public.can_access_vessel(vessel_id) and (culture_id is null or public.can_access_culture(culture_id)));
create policy "Culture collaborators delete vessel wells" on public.vessel_wells for delete using (public.can_access_vessel(vessel_id));

create policy "Members read vessel culture links" on public.vessel_cultures for select using (public.can_access_vessel(vessel_id) or public.can_access_culture(culture_id));
create policy "Culture collaborators create vessel culture links" on public.vessel_cultures for insert with check (auth.uid() is not null and created_by = auth.uid() and public.can_access_vessel(vessel_id) and public.can_access_culture(culture_id));
create policy "Culture collaborators update vessel culture links" on public.vessel_cultures for update using (public.can_access_vessel(vessel_id) and public.can_access_culture(culture_id)) with check (public.can_access_vessel(vessel_id) and public.can_access_culture(culture_id));
create policy "Culture collaborators delete vessel culture links" on public.vessel_cultures for delete using (public.can_access_vessel(vessel_id) and public.can_access_culture(culture_id));

create policy "Members read cryo boxes" on public.cryo_boxes for select using (public.can_access_cryo_box(id));
create policy "Project members create cryo boxes" on public.cryo_boxes for insert with check (auth.uid() is not null and created_by = auth.uid() and public.is_project_name_member(project));
create policy "Project members update cryo boxes" on public.cryo_boxes for update using (public.can_access_cryo_box(id)) with check (public.can_access_cryo_box(id) and public.is_project_name_member(project));
create policy "Project members delete cryo boxes" on public.cryo_boxes for delete using (public.can_access_cryo_box(id));

create policy "Members read cryo vials" on public.cryo_vials for select using (public.can_access_cryo_box(box_id));
create policy "Project members create cryo vials" on public.cryo_vials for insert with check (auth.uid() is not null and created_by = auth.uid() and public.can_access_cryo_box(box_id));
create policy "Project members update cryo vials" on public.cryo_vials for update using (public.can_access_cryo_box(box_id)) with check (public.can_access_cryo_box(box_id));
create policy "Project members delete cryo vials" on public.cryo_vials for delete using (public.can_access_cryo_box(box_id));

create policy "Members read protocols" on public.differentiation_protocols for select using (public.can_access_protocol(id));
create policy "Project members create protocols" on public.differentiation_protocols for insert with check (auth.uid() is not null and created_by = auth.uid() and public.is_project_name_member(project));
create policy "Project members update protocols" on public.differentiation_protocols for update using (public.can_access_protocol(id)) with check (public.can_access_protocol(id) and public.is_project_name_member(project));
create policy "Project members delete protocols" on public.differentiation_protocols for delete using (public.can_access_protocol(id));

create policy "Members read protocol tasks" on public.differentiation_protocol_tasks for select using (public.can_access_protocol(protocol_id));
create policy "Project members create protocol tasks" on public.differentiation_protocol_tasks for insert with check (auth.uid() is not null and created_by = auth.uid() and public.can_access_protocol(protocol_id));
create policy "Project members update protocol tasks" on public.differentiation_protocol_tasks for update using (public.can_access_protocol(protocol_id)) with check (public.can_access_protocol(protocol_id));
create policy "Project members delete protocol tasks" on public.differentiation_protocol_tasks for delete using (public.can_access_protocol(protocol_id));

create policy "Members read runs" on public.differentiation_runs for select using (public.can_access_run(id));
create policy "Project members create runs" on public.differentiation_runs for insert with check (auth.uid() is not null and created_by = auth.uid() and public.is_project_name_member(project) and public.can_access_protocol(protocol_id) and (source_culture_id is null or public.can_access_culture(source_culture_id)) and (source_vessel_id is null or public.can_access_vessel(source_vessel_id)));
create policy "Project members update runs" on public.differentiation_runs for update using (public.can_access_run(id)) with check (public.can_access_run(id) and public.is_project_name_member(project));
create policy "Project members delete runs" on public.differentiation_runs for delete using (public.can_access_run(id));

create policy "Members read run wells" on public.differentiation_run_wells for select using (public.can_access_run(differentiation_run_id));
create policy "Project members create run wells" on public.differentiation_run_wells for insert with check (public.can_access_run(differentiation_run_id) and public.can_access_vessel(vessel_id));
create policy "Project members update run wells" on public.differentiation_run_wells for update using (public.can_access_run(differentiation_run_id)) with check (public.can_access_run(differentiation_run_id) and public.can_access_vessel(vessel_id));
create policy "Project members delete run wells" on public.differentiation_run_wells for delete using (public.can_access_run(differentiation_run_id));

create policy "Members read differentiation events" on public.differentiation_events for select using (public.can_access_run(differentiation_run_id));
create policy "Project members create differentiation events" on public.differentiation_events for insert with check (auth.uid() is not null and created_by = auth.uid() and public.can_access_run(differentiation_run_id));
create policy "Project members update differentiation events" on public.differentiation_events for update using (public.can_access_run(differentiation_run_id)) with check (public.can_access_run(differentiation_run_id));
create policy "Project members delete differentiation events" on public.differentiation_events for delete using (public.can_access_run(differentiation_run_id));

-- Photos are still served by public URL for existing app compatibility, but uploads require login.
drop policy if exists "Prototype public read culture photos" on storage.objects;
drop policy if exists "Prototype public upload culture photos" on storage.objects;
drop policy if exists "Authenticated read culture photos" on storage.objects;
drop policy if exists "Authenticated upload culture photos" on storage.objects;
create policy "Authenticated read culture photos"
  on storage.objects for select
  using (bucket_id = 'culture-photos' and auth.role() = 'authenticated');
create policy "Authenticated upload culture photos"
  on storage.objects for insert
  with check (bucket_id = 'culture-photos' and auth.role() = 'authenticated');

-- After your own user exists, run this once to make yourself admin:
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';
