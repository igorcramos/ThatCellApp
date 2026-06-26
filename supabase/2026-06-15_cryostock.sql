-- Run this in the Supabase SQL Editor to add cryogenic box and vial inventory.

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

alter table public.cryo_boxes
  add column if not exists project text;

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

create index if not exists idx_cryo_boxes_freezer
  on public.cryo_boxes(freezer);

create index if not exists idx_cryo_vials_box_id
  on public.cryo_vials(box_id);

create index if not exists idx_cryo_vials_cell_line_id
  on public.cryo_vials(cell_line_id);

alter table public.cryo_boxes enable row level security;
alter table public.cryo_vials enable row level security;

drop policy if exists "Prototype public read cryo boxes" on public.cryo_boxes;
drop policy if exists "Prototype public insert cryo boxes" on public.cryo_boxes;
drop policy if exists "Prototype public update cryo boxes" on public.cryo_boxes;
drop policy if exists "Prototype public delete cryo boxes" on public.cryo_boxes;
drop policy if exists "Prototype public read cryo vials" on public.cryo_vials;
drop policy if exists "Prototype public insert cryo vials" on public.cryo_vials;
drop policy if exists "Prototype public update cryo vials" on public.cryo_vials;
drop policy if exists "Prototype public delete cryo vials" on public.cryo_vials;

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
