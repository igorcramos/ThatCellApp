-- Selective sharing for the cell-line and differentiation-protocol libraries.
-- Privacy-safe upgrade: existing and newly created records start private.

begin;

alter table public.cell_lines
  add column if not exists is_shared boolean not null default false;

alter table public.differentiation_protocols
  add column if not exists is_shared boolean not null default false;

comment on column public.cell_lines.is_shared is
  'When true, every active laboratory user may discover and reuse this cell line.';
comment on column public.differentiation_protocols.is_shared is
  'When true, every active laboratory user may discover and reuse this protocol and its tasks.';

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
      and (
        protocol.is_shared
        or protocol.created_by = auth.uid()
        or public.current_user_is_admin()
      )
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
      and (protocol.created_by = auth.uid() or public.current_user_is_admin())
  );
$$;

revoke all on function public.can_access_protocol(uuid) from public;
revoke all on function public.can_manage_protocol(uuid) from public;
grant execute on function public.can_access_protocol(uuid) to authenticated;
grant execute on function public.can_manage_protocol(uuid) to authenticated;

-- Remove every historical cell-line policy name that could grant a broader read.
drop policy if exists "Prototype public read cell lines" on public.cell_lines;
drop policy if exists "Prototype public insert cell lines" on public.cell_lines;
drop policy if exists "Prototype public update cell lines" on public.cell_lines;
drop policy if exists "Prototype public delete cell lines" on public.cell_lines;
drop policy if exists "Authenticated read cell lines" on public.cell_lines;
drop policy if exists "Authenticated create cell lines" on public.cell_lines;
drop policy if exists "Owners or admins update cell lines" on public.cell_lines;
drop policy if exists "Owners or admins delete cell lines" on public.cell_lines;
drop policy if exists "cell lines active read" on public.cell_lines;
drop policy if exists "cell lines active insert" on public.cell_lines;
drop policy if exists "cell lines owner update" on public.cell_lines;
drop policy if exists "cell lines owner delete" on public.cell_lines;
drop policy if exists "cell lines selective read" on public.cell_lines;

create policy "cell lines selective read" on public.cell_lines
for select using (
  public.is_active_user()
  and (is_shared or created_by = auth.uid() or public.current_user_is_admin())
);
create policy "cell lines active insert" on public.cell_lines
for insert with check (public.is_active_user() and created_by = auth.uid());
create policy "cell lines owner update" on public.cell_lines
for update using (public.current_user_is_admin() or created_by = auth.uid())
with check (public.current_user_is_admin() or created_by = auth.uid());
create policy "cell lines owner delete" on public.cell_lines
for delete using (public.current_user_is_admin() or created_by = auth.uid());

-- Protocol visibility is enforced through can_access_protocol so its tasks
-- automatically inherit the same private/shared status.
drop policy if exists "protocols member read" on public.differentiation_protocols;
drop policy if exists "protocols member insert" on public.differentiation_protocols;
drop policy if exists "protocols member update" on public.differentiation_protocols;
drop policy if exists "protocols member delete" on public.differentiation_protocols;
drop policy if exists "protocols shared library read" on public.differentiation_protocols;
drop policy if exists "protocols shared library insert" on public.differentiation_protocols;
drop policy if exists "protocols creator update" on public.differentiation_protocols;
drop policy if exists "protocols creator delete" on public.differentiation_protocols;
drop policy if exists "protocols selective read" on public.differentiation_protocols;

create policy "protocols selective read" on public.differentiation_protocols
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

-- A shared identity is unique across the laboratory. Private identities are
-- unique only inside each creator's private library.
drop index if exists public.uq_cell_lines_shared_identity;
drop index if exists public.uq_protocols_shared_name_version;

do $$
begin
  if not exists (
    select 1 from public.cell_lines
    where is_shared
    group by lower(btrim(identifier)), lower(btrim(coalesce(clone, '')))
    having count(*) > 1
  ) then
    execute 'create unique index if not exists uq_cell_lines_lab_shared_identity
      on public.cell_lines (lower(btrim(identifier)), lower(btrim(coalesce(clone, ''''))))
      where is_shared';
  else
    raise notice 'Shared cell-line duplicate protection was skipped because duplicate records need review.';
  end if;

  if not exists (
    select 1 from public.cell_lines
    where not is_shared and created_by is not null
    group by created_by, lower(btrim(identifier)), lower(btrim(coalesce(clone, '')))
    having count(*) > 1
  ) then
    execute 'create unique index if not exists uq_cell_lines_owner_private_identity
      on public.cell_lines (created_by, lower(btrim(identifier)), lower(btrim(coalesce(clone, ''''))))
      where not is_shared and created_by is not null';
  else
    raise notice 'Private cell-line duplicate protection was skipped because duplicate records need review.';
  end if;

  if not exists (
    select 1 from public.differentiation_protocols
    where is_shared
    group by lower(btrim(name)), lower(btrim(coalesce(version, '')))
    having count(*) > 1
  ) then
    execute 'create unique index if not exists uq_protocols_lab_shared_name_version
      on public.differentiation_protocols (lower(btrim(name)), lower(btrim(coalesce(version, ''''))))
      where is_shared';
  else
    raise notice 'Shared protocol duplicate protection was skipped because duplicate records need review.';
  end if;

  if not exists (
    select 1 from public.differentiation_protocols
    where not is_shared and created_by is not null
    group by created_by, lower(btrim(name)), lower(btrim(coalesce(version, '')))
    having count(*) > 1
  ) then
    execute 'create unique index if not exists uq_protocols_owner_private_name_version
      on public.differentiation_protocols (created_by, lower(btrim(name)), lower(btrim(coalesce(version, ''''))))
      where not is_shared and created_by is not null';
  else
    raise notice 'Private protocol duplicate protection was skipped because duplicate records need review.';
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
    raise exception 'The protocol is unavailable.';
  end if;
  if nullif(btrim(cloned_name), '') is null then
    raise exception 'A name is required for the cloned protocol.';
  end if;
  if not public.is_project_name_member(cloned_project) then
    raise exception 'You cannot add a protocol to this project.';
  end if;

  insert into public.differentiation_protocols (
    name, project, target_cell_type, version, expected_duration_days, notes, is_shared, created_by
  )
  select
    btrim(cloned_name),
    nullif(btrim(cloned_project), ''),
    source.target_cell_type,
    nullif(btrim(cloned_version), ''),
    source.expected_duration_days,
    source.notes,
    false,
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
  'Allows active users to read their own protocols and protocols explicitly shared with the laboratory.';
comment on function public.can_manage_protocol(uuid) is
  'Allows only the protocol creator or an administrator to change its content or visibility.';
comment on function public.clone_shared_protocol(uuid, text, text, text) is
  'Clones an accessible protocol and its tasks as a private protocol owned by the current user.';

commit;
