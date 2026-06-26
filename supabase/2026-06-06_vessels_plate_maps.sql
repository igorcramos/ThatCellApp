-- Run this in the Supabase SQL Editor to add physical vessels and well maps.

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

create index if not exists idx_culture_vessels_culture_id
  on public.culture_vessels(culture_id);

create index if not exists idx_vessel_wells_vessel_id
  on public.vessel_wells(vessel_id);

alter table public.culture_vessels enable row level security;
alter table public.vessel_wells enable row level security;

drop policy if exists "Prototype public read culture vessels" on public.culture_vessels;
drop policy if exists "Prototype public insert culture vessels" on public.culture_vessels;
drop policy if exists "Prototype public update culture vessels" on public.culture_vessels;
drop policy if exists "Prototype public read vessel wells" on public.vessel_wells;
drop policy if exists "Prototype public insert vessel wells" on public.vessel_wells;
drop policy if exists "Prototype public update vessel wells" on public.vessel_wells;

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
