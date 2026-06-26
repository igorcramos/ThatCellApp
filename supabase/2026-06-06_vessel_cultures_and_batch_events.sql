-- Run this in the Supabase SQL Editor to allow multiple cultures per vessel.
-- Batch history events use the existing culture_events table and do not need a new table.

create table if not exists public.vessel_cultures (
  vessel_id uuid not null references public.culture_vessels(id) on delete cascade,
  culture_id uuid not null references public.cultures(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (vessel_id, culture_id)
);

insert into public.vessel_cultures (vessel_id, culture_id)
select id, culture_id
from public.culture_vessels
where culture_id is not null
on conflict do nothing;

create index if not exists idx_vessel_cultures_culture_id
  on public.vessel_cultures(culture_id);

alter table public.vessel_cultures enable row level security;

drop policy if exists "Prototype public read vessel cultures" on public.vessel_cultures;
drop policy if exists "Prototype public insert vessel cultures" on public.vessel_cultures;
drop policy if exists "Prototype public update vessel cultures" on public.vessel_cultures;
drop policy if exists "Prototype public delete vessel cultures" on public.vessel_cultures;

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
