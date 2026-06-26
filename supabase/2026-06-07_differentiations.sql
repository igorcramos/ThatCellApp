-- Run this in the Supabase SQL Editor to add differentiation protocols and runs.

create table if not exists public.differentiation_protocols (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_cell_type text,
  version text,
  expected_duration_days integer,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.differentiation_runs (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.differentiation_protocols(id) on delete restrict,
  run_name text not null,
  day_zero_date date not null,
  source_type text not null default 'culture',
  source_culture_id uuid references public.cultures(id) on delete set null,
  source_vessel_id uuid references public.culture_vessels(id) on delete set null,
  status text default 'active',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.differentiation_run_wells (
  differentiation_run_id uuid not null references public.differentiation_runs(id) on delete cascade,
  vessel_id uuid not null references public.culture_vessels(id) on delete cascade,
  well text not null,
  created_at timestamptz not null default now(),
  primary key (differentiation_run_id, vessel_id, well)
);

create table if not exists public.differentiation_events (
  id uuid primary key default gen_random_uuid(),
  differentiation_run_id uuid not null references public.differentiation_runs(id) on delete cascade,
  event_date date default current_date,
  event_day integer,
  event_type text,
  notes text,
  performed_by text,
  photo_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_differentiation_runs_protocol_id
  on public.differentiation_runs(protocol_id);

create index if not exists idx_differentiation_runs_source_culture_id
  on public.differentiation_runs(source_culture_id);

create index if not exists idx_differentiation_runs_source_vessel_id
  on public.differentiation_runs(source_vessel_id);

create index if not exists idx_differentiation_run_wells_vessel_id
  on public.differentiation_run_wells(vessel_id);

create index if not exists idx_differentiation_events_run_id
  on public.differentiation_events(differentiation_run_id);

alter table public.differentiation_protocols enable row level security;
alter table public.differentiation_runs enable row level security;
alter table public.differentiation_run_wells enable row level security;
alter table public.differentiation_events enable row level security;

drop policy if exists "Prototype public read differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public insert differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public update differentiation protocols" on public.differentiation_protocols;
drop policy if exists "Prototype public read differentiation runs" on public.differentiation_runs;
drop policy if exists "Prototype public insert differentiation runs" on public.differentiation_runs;
drop policy if exists "Prototype public update differentiation runs" on public.differentiation_runs;
drop policy if exists "Prototype public read differentiation run wells" on public.differentiation_run_wells;
drop policy if exists "Prototype public insert differentiation run wells" on public.differentiation_run_wells;
drop policy if exists "Prototype public update differentiation run wells" on public.differentiation_run_wells;
drop policy if exists "Prototype public read differentiation events" on public.differentiation_events;
drop policy if exists "Prototype public insert differentiation events" on public.differentiation_events;
drop policy if exists "Prototype public update differentiation events" on public.differentiation_events;

create policy "Prototype public read differentiation protocols"
  on public.differentiation_protocols for select
  using (true);

create policy "Prototype public insert differentiation protocols"
  on public.differentiation_protocols for insert
  with check (true);

create policy "Prototype public update differentiation protocols"
  on public.differentiation_protocols for update
  using (true)
  with check (true);

create policy "Prototype public read differentiation runs"
  on public.differentiation_runs for select
  using (true);

create policy "Prototype public insert differentiation runs"
  on public.differentiation_runs for insert
  with check (true);

create policy "Prototype public update differentiation runs"
  on public.differentiation_runs for update
  using (true)
  with check (true);

create policy "Prototype public read differentiation run wells"
  on public.differentiation_run_wells for select
  using (true);

create policy "Prototype public insert differentiation run wells"
  on public.differentiation_run_wells for insert
  with check (true);

create policy "Prototype public update differentiation run wells"
  on public.differentiation_run_wells for update
  using (true)
  with check (true);

create policy "Prototype public read differentiation events"
  on public.differentiation_events for select
  using (true);

create policy "Prototype public insert differentiation events"
  on public.differentiation_events for insert
  with check (true);

create policy "Prototype public update differentiation events"
  on public.differentiation_events for update
  using (true)
  with check (true);
