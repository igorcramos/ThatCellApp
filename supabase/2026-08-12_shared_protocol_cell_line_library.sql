-- Shared laboratory library for cell lines and differentiation protocols.
-- Approved users may discover and use shared definitions. Only the creator
-- (or an administrator) may change the canonical record.

begin;

create or replace function public.can_access_protocol(protocol_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and exists (
    select 1
    from public.differentiation_protocols protocol
    where protocol.id = protocol_id_arg
  );
$$;

create or replace function public.can_manage_protocol(protocol_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and exists (
    select 1
    from public.differentiation_protocols protocol
    where protocol.id = protocol_id_arg
      and (public.current_user_is_admin() or protocol.created_by = auth.uid())
  );
$$;

-- A shared protocol template must not implicitly expose every run created
-- from it. Runs remain visible only to their creator, project members, or
-- collaborators who can access the source culture/plate.
create or replace function public.can_access_run(run_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and exists (
    select 1
    from public.differentiation_runs run
    where run.id = run_id_arg
      and (
        public.current_user_is_admin()
        or run.created_by = auth.uid()
        or (
          nullif(btrim(run.project), '') is not null
          and public.is_project_name_member(run.project)
        )
        or (run.source_culture_id is not null and public.can_access_culture(run.source_culture_id))
        or (run.source_vessel_id is not null and public.can_access_vessel(run.source_vessel_id))
      )
  );
$$;

revoke all on function public.can_manage_protocol(uuid) from public;
revoke all on function public.can_access_protocol(uuid) from public;
revoke all on function public.can_access_run(uuid) from public;
grant execute on function public.can_manage_protocol(uuid) to authenticated;
grant execute on function public.can_access_protocol(uuid) to authenticated;
grant execute on function public.can_access_run(uuid) to authenticated;

drop policy if exists "Prototype public read cell lines" on public.cell_lines;
drop policy if exists "cell lines active read" on public.cell_lines;
create policy "cell lines active read" on public.cell_lines
for select using (public.is_active_user());

drop policy if exists "protocols member read" on public.differentiation_protocols;
drop policy if exists "protocols member insert" on public.differentiation_protocols;
drop policy if exists "protocols member update" on public.differentiation_protocols;
drop policy if exists "protocols member delete" on public.differentiation_protocols;
drop policy if exists "protocols shared library read" on public.differentiation_protocols;
drop policy if exists "protocols shared library insert" on public.differentiation_protocols;
drop policy if exists "protocols creator update" on public.differentiation_protocols;
drop policy if exists "protocols creator delete" on public.differentiation_protocols;
drop policy if exists "Members read protocols" on public.differentiation_protocols;
drop policy if exists "Project members create protocols" on public.differentiation_protocols;
drop policy if exists "Project members update protocols" on public.differentiation_protocols;
drop policy if exists "Project members delete protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public read differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public insert differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public update differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public delete differentiation protocols" on public.differentiation_protocols;

create policy "protocols shared library read" on public.differentiation_protocols
for select using (public.can_access_protocol(id));
create policy "protocols shared library insert" on public.differentiation_protocols
for insert with check (
  public.is_active_user()
  and created_by = auth.uid()
  and public.is_project_name_member(project)
);
create policy "protocols creator update" on public.differentiation_protocols
for update using (public.can_manage_protocol(id))
with check (public.can_manage_protocol(id) and public.is_project_name_member(project));
create policy "protocols creator delete" on public.differentiation_protocols
for delete using (public.can_manage_protocol(id));

drop policy if exists "protocol tasks member read" on public.differentiation_protocol_tasks;
drop policy if exists "protocol tasks member insert" on public.differentiation_protocol_tasks;
drop policy if exists "protocol tasks member update" on public.differentiation_protocol_tasks;
drop policy if exists "protocol tasks member delete" on public.differentiation_protocol_tasks;
drop policy if exists "protocol tasks shared library read" on public.differentiation_protocol_tasks;
drop policy if exists "protocol tasks creator insert" on public.differentiation_protocol_tasks;
drop policy if exists "protocol tasks creator update" on public.differentiation_protocol_tasks;
drop policy if exists "protocol tasks creator delete" on public.differentiation_protocol_tasks;
drop policy if exists "Members read protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Project members create protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Project members update protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Project members delete protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public read differentiation protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public insert differentiation protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public update differentiation protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public delete differentiation protocol tasks" on public.differentiation_protocol_tasks;

create policy "protocol tasks shared library read" on public.differentiation_protocol_tasks
for select using (public.can_access_protocol(protocol_id));
create policy "protocol tasks creator insert" on public.differentiation_protocol_tasks
for insert with check (
  public.is_active_user()
  and created_by = auth.uid()
  and public.can_manage_protocol(protocol_id)
);
create policy "protocol tasks creator update" on public.differentiation_protocol_tasks
for update using (public.can_manage_protocol(protocol_id))
with check (public.can_manage_protocol(protocol_id));
create policy "protocol tasks creator delete" on public.differentiation_protocol_tasks
for delete using (public.can_manage_protocol(protocol_id));

grant select, insert, update, delete on public.cell_lines to authenticated;
grant select, insert, update, delete on public.differentiation_protocols to authenticated;
grant select, insert, update, delete on public.differentiation_protocol_tasks to authenticated;

-- Install database-level duplicate protection when the current library is
-- already clean. Existing duplicate data is left untouched for safe review.
do $$
begin
  if not exists (
    select 1
    from public.cell_lines
    group by lower(btrim(identifier)), lower(btrim(coalesce(clone, '')))
    having count(*) > 1
  ) then
    execute 'create unique index if not exists uq_cell_lines_shared_identity
      on public.cell_lines (lower(btrim(identifier)), lower(btrim(coalesce(clone, ''''))))';
  else
    raise notice 'Cell-line duplicate protection was skipped because duplicate identifier + clone pairs already exist.';
  end if;

  if not exists (
    select 1
    from public.differentiation_protocols
    group by lower(btrim(name)), lower(btrim(coalesce(version, '')))
    having count(*) > 1
  ) then
    execute 'create unique index if not exists uq_protocols_shared_name_version
      on public.differentiation_protocols (lower(btrim(name)), lower(btrim(coalesce(version, ''''))))';
  else
    raise notice 'Protocol duplicate protection was skipped because duplicate name + version pairs already exist.';
  end if;
end $$;

create or replace function public.clone_shared_protocol(
  source_protocol_id uuid,
  cloned_name text,
  cloned_version text default null,
  cloned_project text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  cloned_protocol_id uuid;
begin
  if not public.can_access_protocol(source_protocol_id) then
    raise exception 'The shared protocol is unavailable.';
  end if;
  if nullif(btrim(cloned_name), '') is null then
    raise exception 'A name is required for the cloned protocol.';
  end if;
  if not public.is_project_name_member(cloned_project) then
    raise exception 'You cannot add a protocol to this project.';
  end if;

  insert into public.differentiation_protocols (
    name, project, target_cell_type, version, expected_duration_days, notes, created_by
  )
  select
    btrim(cloned_name),
    nullif(btrim(cloned_project), ''),
    source.target_cell_type,
    nullif(btrim(cloned_version), ''),
    source.expected_duration_days,
    source.notes,
    auth.uid()
  from public.differentiation_protocols source
  where source.id = source_protocol_id
  returning id into cloned_protocol_id;

  insert into public.differentiation_protocol_tasks (
    protocol_id, task_day, title, task_type, estimated_duration_hours, medium, notes, created_by
  )
  select
    cloned_protocol_id,
    task.task_day,
    task.title,
    task.task_type,
    task.estimated_duration_hours,
    task.medium,
    task.notes,
    auth.uid()
  from public.differentiation_protocol_tasks task
  where task.protocol_id = source_protocol_id;

  return cloned_protocol_id;
end;
$$;

revoke all on function public.clone_shared_protocol(uuid, text, text, text) from public;
grant execute on function public.clone_shared_protocol(uuid, text, text, text) to authenticated;

comment on function public.can_access_protocol(uuid) is
  'Allows every active laboratory user to read and use a shared protocol template.';
comment on function public.can_manage_protocol(uuid) is
  'Allows only the protocol creator or an administrator to modify a shared protocol template.';
comment on function public.clone_shared_protocol(uuid, text, text, text) is
  'Clones a shared protocol and all of its tasks atomically for the current active user.';

commit;
