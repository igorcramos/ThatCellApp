alter table public.culture_events
  add column if not exists vessel_id uuid references public.culture_vessels(id) on delete set null;

alter table public.culture_events
  alter column culture_id drop not null;

create index if not exists idx_culture_events_vessel_id
  on public.culture_events(vessel_id);

drop policy if exists "Prototype public delete cell lines" on public.cell_lines;
drop policy if exists "Prototype public delete cultures" on public.cultures;
drop policy if exists "Prototype public delete culture events" on public.culture_events;
drop policy if exists "Prototype public delete culture vessels" on public.culture_vessels;
drop policy if exists "Prototype public delete vessel wells" on public.vessel_wells;
drop policy if exists "Prototype public delete differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public delete differentiation protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public delete differentiation runs" on public.differentiation_runs;
drop policy if exists "Prototype public delete differentiation run wells" on public.differentiation_run_wells;
drop policy if exists "Prototype public delete differentiation events" on public.differentiation_events;

create policy "Prototype public delete cell lines"
  on public.cell_lines for delete
  using (true);

create policy "Prototype public delete cultures"
  on public.cultures for delete
  using (true);

create policy "Prototype public delete culture events"
  on public.culture_events for delete
  using (true);

create policy "Prototype public delete culture vessels"
  on public.culture_vessels for delete
  using (true);

create policy "Prototype public delete vessel wells"
  on public.vessel_wells for delete
  using (true);

create policy "Prototype public delete differentiation protocols"
  on public.differentiation_protocols for delete
  using (true);

create policy "Prototype public delete differentiation protocol tasks"
  on public.differentiation_protocol_tasks for delete
  using (true);

create policy "Prototype public delete differentiation runs"
  on public.differentiation_runs for delete
  using (true);

create policy "Prototype public delete differentiation run wells"
  on public.differentiation_run_wells for delete
  using (true);

create policy "Prototype public delete differentiation events"
  on public.differentiation_events for delete
  using (true);
