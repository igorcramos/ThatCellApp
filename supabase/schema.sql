-- CellApp initial Supabase schema
-- Prototype mode: public read/write is enabled because the first version has no login.
-- Do not use this policy for sensitive data or public production deployments.

create extension if not exists "pgcrypto";

create table if not exists public.cell_lines (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  clone text,
  name text not null,
  description text,
  species text,
  cell_type text,
  source text,
  has_crispr boolean not null default false,
  crispr_target text,
  crispr_sgrna text,
  crispr_variant text,
  crispr_hcmg text,
  has_transgene boolean not null default false,
  transgene text,
  fluorescence text,
  marker_of text,
  plasmid text,
  transgene_notes text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.cultures (
  id uuid primary key default gen_random_uuid(),
  cell_line_id uuid not null references public.cell_lines(id) on delete restrict,
  culture_name text,
  project text,
  start_date date,
  passage_number integer,
  initial_cell_type text,
  vessel_type text,
  current_confluence numeric,
  medium text,
  status text default 'active',
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.culture_events (
  id uuid primary key default gen_random_uuid(),
  culture_id uuid references public.cultures(id) on delete cascade,
  vessel_id uuid references public.culture_vessels(id) on delete set null,
  event_type text,
  event_date date default current_date,
  passage_number integer,
  confluence numeric,
  notes text,
  performed_by text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.culture_vessels (
  id uuid primary key default gen_random_uuid(),
  culture_id uuid references public.cultures(id) on delete set null,
  name text not null,
  vessel_type text not null,
  location text,
  status text default 'active',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.vessel_wells (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.culture_vessels(id) on delete cascade,
  well text not null,
  cell_line_id uuid references public.cell_lines(id) on delete set null,
  culture_id uuid references public.cultures(id) on delete set null,
  condition_label text,
  treatment text,
  dose text,
  medium text,
  notes text,
  created_at timestamptz not null default now(),
  unique (vessel_id, well)
);

create table if not exists public.vessel_cultures (
  vessel_id uuid not null references public.culture_vessels(id) on delete cascade,
  culture_id uuid not null references public.cultures(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (vessel_id, culture_id)
);

create table if not exists public.cryo_boxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  freezer text not null,
  project text,
  rack text,
  shelf text,
  drawer text,
  box_position text,
  rows_count integer not null default 9 check (rows_count between 1 and 12),
  columns_count integer not null default 9 check (columns_count between 1 and 12),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.cryo_vials (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.cryo_boxes(id) on delete cascade,
  position text not null,
  cell_line_id uuid references public.cell_lines(id) on delete set null,
  lineage text not null,
  cell_type text,
  freeze_date date,
  passage_number integer,
  status text not null default 'available',
  frozen_by text,
  notes text,
  created_at timestamptz not null default now(),
  unique (box_id, position)
);

create table if not exists public.differentiation_protocols (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project text,
  target_cell_type text,
  version text,
  expected_duration_days integer,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.differentiation_protocol_tasks (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.differentiation_protocols(id) on delete cascade,
  task_day integer not null,
  title text not null,
  task_type text,
  estimated_duration_hours numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.differentiation_runs (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.differentiation_protocols(id) on delete restrict,
  run_name text not null,
  project text,
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

create index if not exists idx_cultures_cell_line_id
  on public.cultures(cell_line_id);

create index if not exists idx_cultures_project
  on public.cultures(project);

create index if not exists idx_culture_events_culture_id
  on public.culture_events(culture_id);

create index if not exists idx_culture_events_vessel_id
  on public.culture_events(vessel_id);

create index if not exists idx_culture_events_event_date
  on public.culture_events(event_date);

create index if not exists idx_culture_vessels_culture_id
  on public.culture_vessels(culture_id);

create index if not exists idx_vessel_wells_vessel_id
  on public.vessel_wells(vessel_id);

create index if not exists idx_vessel_cultures_culture_id
  on public.vessel_cultures(culture_id);

create index if not exists idx_cryo_boxes_freezer
  on public.cryo_boxes(freezer);

create index if not exists idx_cryo_boxes_project
  on public.cryo_boxes(project);

create index if not exists idx_cryo_vials_box_id
  on public.cryo_vials(box_id);

create index if not exists idx_cryo_vials_cell_line_id
  on public.cryo_vials(cell_line_id);

create index if not exists idx_differentiation_runs_protocol_id
  on public.differentiation_runs(protocol_id);

create index if not exists idx_differentiation_protocols_project
  on public.differentiation_protocols(project);

create index if not exists idx_differentiation_runs_project
  on public.differentiation_runs(project);

create index if not exists idx_differentiation_protocol_tasks_protocol_id
  on public.differentiation_protocol_tasks(protocol_id);

create index if not exists idx_differentiation_protocol_tasks_task_day
  on public.differentiation_protocol_tasks(task_day);

create index if not exists idx_differentiation_runs_source_culture_id
  on public.differentiation_runs(source_culture_id);

create index if not exists idx_differentiation_runs_source_vessel_id
  on public.differentiation_runs(source_vessel_id);

create index if not exists idx_differentiation_run_wells_vessel_id
  on public.differentiation_run_wells(vessel_id);

create index if not exists idx_differentiation_events_run_id
  on public.differentiation_events(differentiation_run_id);

alter table public.cell_lines enable row level security;
alter table public.projects enable row level security;
alter table public.cultures enable row level security;
alter table public.culture_events enable row level security;
alter table public.culture_vessels enable row level security;
alter table public.vessel_wells enable row level security;
alter table public.vessel_cultures enable row level security;
alter table public.cryo_boxes enable row level security;
alter table public.cryo_vials enable row level security;
alter table public.differentiation_protocols enable row level security;
alter table public.differentiation_protocol_tasks enable row level security;
alter table public.differentiation_runs enable row level security;
alter table public.differentiation_run_wells enable row level security;
alter table public.differentiation_events enable row level security;

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

create policy "Prototype public read cell lines"
  on public.cell_lines for select
  using (true);

create policy "Prototype public insert cell lines"
  on public.cell_lines for insert
  with check (true);

create policy "Prototype public update cell lines"
  on public.cell_lines for update
  using (true)
  with check (true);

create policy "Prototype public delete cell lines"
  on public.cell_lines for delete
  using (true);

create policy "Prototype public read projects"
  on public.projects for select
  using (true);

create policy "Prototype public insert projects"
  on public.projects for insert
  with check (true);

create policy "Prototype public update projects"
  on public.projects for update
  using (true)
  with check (true);

create policy "Prototype public delete projects"
  on public.projects for delete
  using (true);

create policy "Prototype public read cultures"
  on public.cultures for select
  using (true);

create policy "Prototype public insert cultures"
  on public.cultures for insert
  with check (true);

create policy "Prototype public update cultures"
  on public.cultures for update
  using (true)
  with check (true);

create policy "Prototype public delete cultures"
  on public.cultures for delete
  using (true);

create policy "Prototype public read culture events"
  on public.culture_events for select
  using (true);

create policy "Prototype public insert culture events"
  on public.culture_events for insert
  with check (true);

create policy "Prototype public update culture events"
  on public.culture_events for update
  using (true)
  with check (true);

create policy "Prototype public delete culture events"
  on public.culture_events for delete
  using (true);

create policy "Prototype public read culture vessels"
  on public.culture_vessels for select
  using (true);

create policy "Prototype public insert culture vessels"
  on public.culture_vessels for insert
  with check (true);

create policy "Prototype public update culture vessels"
  on public.culture_vessels for update
  using (true)
  with check (true);

create policy "Prototype public delete culture vessels"
  on public.culture_vessels for delete
  using (true);

create policy "Prototype public read vessel wells"
  on public.vessel_wells for select
  using (true);

create policy "Prototype public insert vessel wells"
  on public.vessel_wells for insert
  with check (true);

create policy "Prototype public update vessel wells"
  on public.vessel_wells for update
  using (true)
  with check (true);

create policy "Prototype public delete vessel wells"
  on public.vessel_wells for delete
  using (true);

create policy "Prototype public read vessel cultures"
  on public.vessel_cultures for select
  using (true);

create policy "Prototype public insert vessel cultures"
  on public.vessel_cultures for insert
  with check (true);

create policy "Prototype public update vessel cultures"
  on public.vessel_cultures for update
  using (true)
  with check (true);

create policy "Prototype public delete vessel cultures"
  on public.vessel_cultures for delete
  using (true);

create policy "Prototype public read cryo boxes"
  on public.cryo_boxes for select
  using (true);

create policy "Prototype public insert cryo boxes"
  on public.cryo_boxes for insert
  with check (true);

create policy "Prototype public update cryo boxes"
  on public.cryo_boxes for update
  using (true)
  with check (true);

create policy "Prototype public delete cryo boxes"
  on public.cryo_boxes for delete
  using (true);

create policy "Prototype public read cryo vials"
  on public.cryo_vials for select
  using (true);

create policy "Prototype public insert cryo vials"
  on public.cryo_vials for insert
  with check (true);

create policy "Prototype public update cryo vials"
  on public.cryo_vials for update
  using (true)
  with check (true);

create policy "Prototype public delete cryo vials"
  on public.cryo_vials for delete
  using (true);

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

create policy "Prototype public delete differentiation protocols"
  on public.differentiation_protocols for delete
  using (true);

create policy "Prototype public read differentiation protocol tasks"
  on public.differentiation_protocol_tasks for select
  using (true);

create policy "Prototype public insert differentiation protocol tasks"
  on public.differentiation_protocol_tasks for insert
  with check (true);

create policy "Prototype public update differentiation protocol tasks"
  on public.differentiation_protocol_tasks for update
  using (true)
  with check (true);

create policy "Prototype public delete differentiation protocol tasks"
  on public.differentiation_protocol_tasks for delete
  using (true);

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

create policy "Prototype public delete differentiation runs"
  on public.differentiation_runs for delete
  using (true);

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

create policy "Prototype public delete differentiation run wells"
  on public.differentiation_run_wells for delete
  using (true);

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

create policy "Prototype public delete differentiation events"
  on public.differentiation_events for delete
  using (true);

insert into public.projects (name, color)
values
  ('TBCK', '#176f64'),
  ('APOE-TAU', '#8c4f9f')
on conflict (name) do nothing;

insert into public.projects (name)
select distinct project
from (
  select project from public.cultures
  union
  select project from public.differentiation_protocols
  union
  select project from public.differentiation_runs
) existing_projects
where project is not null and btrim(project) <> ''
on conflict (name) do nothing;

-- Optional photo bucket. Run this after creating the project.
insert into storage.buckets (id, name, public)
values ('culture-photos', 'culture-photos', true)
on conflict (id) do nothing;

drop policy if exists "Prototype public read culture photos" on storage.objects;
drop policy if exists "Prototype public upload culture photos" on storage.objects;

create policy "Prototype public read culture photos"
  on storage.objects for select
  using (bucket_id = 'culture-photos');

create policy "Prototype public upload culture photos"
  on storage.objects for insert
  with check (bucket_id = 'culture-photos');
