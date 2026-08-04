-- Searchable culture-reagent library and physical inventory.
create table if not exists public.reagent_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  catalog_number text not null,
  manufacturer text,
  category text,
  default_storage text,
  notes text,
  created_at timestamptz not null default now(),
  unique (catalog_number, manufacturer)
);

create table if not exists public.reagent_inventory_items (
  id uuid primary key default gen_random_uuid(),
  catalog_reagent_id uuid not null references public.reagent_catalog(id) on delete restrict,
  lot_number text,
  expiration_date date,
  quantity numeric not null check (quantity >= 0),
  unit text not null,
  location text not null,
  status text not null default 'available' check (status in ('available', 'low', 'depleted', 'expired', 'quarantined')),
  reconstituted_at date,
  reconstitution_solvent text,
  reconstitution_concentration numeric check (reconstitution_concentration is null or reconstitution_concentration >= 0),
  reconstitution_concentration_unit text,
  reconstitution_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reagent_aliquots (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.reagent_inventory_items(id) on delete cascade,
  label text not null,
  quantity numeric not null check (quantity >= 0),
  unit text not null,
  location text not null,
  prepared_at date,
  expiration_date date,
  status text not null default 'available' check (status in ('available', 'used', 'discarded')),
  notes text,
  created_at timestamptz not null default now(),
  unique (inventory_item_id, label)
);

create index if not exists idx_reagent_catalog_name_lower on public.reagent_catalog (lower(name));
create index if not exists idx_reagent_catalog_number_lower on public.reagent_catalog (lower(catalog_number));
create index if not exists idx_reagent_inventory_catalog on public.reagent_inventory_items(catalog_reagent_id);
create index if not exists idx_reagent_aliquots_item on public.reagent_aliquots(inventory_item_id);

insert into public.reagent_catalog (name, catalog_number, manufacturer, category, default_storage)
values
  ('DMEM, high glucose', '11965092', 'Gibco', 'Basal medium', '2–8 °C'),
  ('DMEM/F-12', '11320033', 'Gibco', 'Basal medium', '2–8 °C'),
  ('Neurobasal Medium', '21103049', 'Gibco', 'Basal medium', '2–8 °C'),
  ('B-27 Supplement (50X)', '17504044', 'Gibco', 'Supplement', '-20 °C'),
  ('N-2 Supplement (100X)', '17502048', 'Gibco', 'Supplement', '-20 °C'),
  ('GlutaMAX Supplement', '35050061', 'Gibco', 'Supplement', '2–8 °C'),
  ('Penicillin-Streptomycin', '15140122', 'Gibco', 'Antibiotic', '-20 °C'),
  ('TrypLE Express Enzyme', '12604013', 'Gibco', 'Dissociation reagent', 'Room temperature'),
  ('DPBS, no calcium, no magnesium', '14190144', 'Gibco', 'Buffer', 'Room temperature'),
  ('Matrigel Growth Factor Reduced', '354230', 'Corning', 'Extracellular matrix', '-20 °C'),
  ('Y-27632 dihydrochloride', '1254', 'Tocris', 'Small molecule', '-20 °C'),
  ('Dorsomorphin dihydrochloride', '3093', 'Tocris', 'Small molecule', '-20 °C'),
  ('SB 431542', '1614', 'Tocris', 'Small molecule', '-20 °C'),
  ('Recombinant Human FGF-basic', '100-18B', 'PeproTech', 'Growth factor', '-20 °C'),
  ('Recombinant Human EGF', 'AF-100-15', 'PeproTech', 'Growth factor', '-20 °C')
on conflict (catalog_number, manufacturer) do nothing;

alter table public.reagent_catalog enable row level security;
alter table public.reagent_inventory_items enable row level security;
alter table public.reagent_aliquots enable row level security;

drop policy if exists "prototype reagent catalog access" on public.reagent_catalog;
drop policy if exists "prototype reagent inventory access" on public.reagent_inventory_items;
drop policy if exists "prototype reagent aliquot access" on public.reagent_aliquots;
create policy "prototype reagent catalog access" on public.reagent_catalog for all using (true) with check (true);
create policy "prototype reagent inventory access" on public.reagent_inventory_items for all using (true) with check (true);
create policy "prototype reagent aliquot access" on public.reagent_aliquots for all using (true) with check (true);
