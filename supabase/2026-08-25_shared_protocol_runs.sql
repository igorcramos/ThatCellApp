-- Allow active users to start their own differentiation runs from a protocol
-- they can access, including a protocol shared by another laboratory member.

begin;

drop policy if exists "Project members create runs" on public.differentiation_runs;
drop policy if exists "runs member insert" on public.differentiation_runs;
drop policy if exists "Project members update runs" on public.differentiation_runs;
drop policy if exists "runs member update" on public.differentiation_runs;

create policy "runs member insert" on public.differentiation_runs
for insert with check (
  public.is_active_user()
  and created_by = auth.uid()
  and public.can_access_protocol(protocol_id)
  and (source_culture_id is null or public.can_access_culture(source_culture_id))
  and (source_vessel_id is null or public.can_access_vessel(source_vessel_id))
);

create policy "runs member update" on public.differentiation_runs
for update using (public.can_access_run(id))
with check (
  public.can_access_run(id)
  and (
    created_by = auth.uid()
    or public.current_user_is_admin()
    or public.is_project_name_member(project)
  )
  and public.can_access_protocol(protocol_id)
  and (source_culture_id is null or public.can_access_culture(source_culture_id))
  and (source_vessel_id is null or public.can_access_vessel(source_vessel_id))
);

commit;
