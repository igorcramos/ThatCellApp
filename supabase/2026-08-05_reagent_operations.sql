-- Extended reagent catalog, barcode-ready stock, alerts, and purchasing workflow.
-- Run after 2026-08-04_reagent_inventory.sql.

alter table public.reagent_catalog
  add column if not exists barcode text,
  add column if not exists gtin text,
  add column if not exists synonyms text[] not null default '{}',
  add column if not exists supplier_url text,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.reagent_inventory_items
  add column if not exists container_barcode text,
  add column if not exists minimum_quantity numeric not null default 0
    check (minimum_quantity >= 0),
  add column if not exists opened_at date,
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();

alter table public.reagent_aliquots
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();

create unique index if not exists idx_reagent_catalog_barcode_unique
  on public.reagent_catalog ((lower(barcode)))
  where barcode is not null and btrim(barcode) <> '';
create unique index if not exists idx_reagent_catalog_gtin_unique
  on public.reagent_catalog (gtin)
  where gtin is not null and btrim(gtin) <> '';
create unique index if not exists idx_reagent_inventory_container_barcode_unique
  on public.reagent_inventory_items ((lower(container_barcode)))
  where container_barcode is not null and btrim(container_barcode) <> '';

create table if not exists public.reagent_purchase_requests (
  id uuid primary key default gen_random_uuid(),
  catalog_reagent_id uuid not null references public.reagent_catalog(id) on delete restrict,
  requested_quantity numeric not null check (requested_quantity > 0),
  unit text not null,
  requester_name text not null,
  requested_by uuid references auth.users(id) on delete set null default auth.uid(),
  vendor text,
  estimated_cost numeric check (estimated_cost is null or estimated_cost >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  justification text,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'ordered', 'received', 'cancelled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewer_name text,
  review_notes text,
  reviewed_at timestamptz,
  approved_quantity numeric check (approved_quantity is null or approved_quantity > 0),
  order_number text,
  ordered_at timestamptz,
  received_by uuid references auth.users(id) on delete set null,
  receiver_name text,
  received_at timestamptz,
  received_inventory_item_id uuid references public.reagent_inventory_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reagent_purchase_requests_status
  on public.reagent_purchase_requests(status, created_at desc);
create index if not exists idx_reagent_purchase_requests_catalog
  on public.reagent_purchase_requests(catalog_reagent_id);

alter table public.reagent_purchase_requests enable row level security;

drop policy if exists "authenticated reagent purchase read" on public.reagent_purchase_requests;
drop policy if exists "authenticated reagent purchase insert" on public.reagent_purchase_requests;
drop policy if exists "authenticated reagent purchase update" on public.reagent_purchase_requests;
create policy "authenticated reagent purchase read"
  on public.reagent_purchase_requests for select to authenticated using (true);
create policy "authenticated reagent purchase insert"
  on public.reagent_purchase_requests for insert to authenticated with check (true);
create policy "authenticated reagent purchase update"
  on public.reagent_purchase_requests for update to authenticated using (true) with check (true);

create or replace function public.receive_reagent_purchase(
  p_request_id uuid,
  p_lot_number text,
  p_expiration_date date,
  p_quantity numeric,
  p_unit text,
  p_location text,
  p_container_barcode text,
  p_receiver_name text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_request public.reagent_purchase_requests%rowtype;
  v_inventory_item_id uuid;
begin
  select * into v_request
  from public.reagent_purchase_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Purchase request not found';
  end if;
  if v_request.status <> 'ordered' then
    raise exception 'Only an ordered request can be received';
  end if;
  if p_quantity is null or p_quantity <= 0 or nullif(btrim(p_unit), '') is null or nullif(btrim(p_location), '') is null then
    raise exception 'Quantity, unit, and location are required';
  end if;

  insert into public.reagent_inventory_items (
    catalog_reagent_id, lot_number, expiration_date, quantity, unit, location,
    container_barcode, status, created_by
  ) values (
    v_request.catalog_reagent_id, nullif(btrim(p_lot_number), ''), p_expiration_date,
    p_quantity, btrim(p_unit), btrim(p_location), nullif(btrim(p_container_barcode), ''),
    'available', auth.uid()
  )
  returning id into v_inventory_item_id;

  update public.reagent_purchase_requests
  set status = 'received',
      receiver_name = nullif(btrim(p_receiver_name), ''),
      received_by = auth.uid(),
      received_at = now(),
      received_inventory_item_id = v_inventory_item_id,
      updated_at = now()
  where id = p_request_id;

  return v_inventory_item_id;
end;
$$;

revoke all on function public.receive_reagent_purchase(uuid, text, date, numeric, text, text, text, text) from public;
grant execute on function public.receive_reagent_purchase(uuid, text, date, numeric, text, text, text, text) to authenticated;

-- A broad starter library for common mammalian, stem-cell, neural, and organoid work.
-- Product metadata should still be verified against the vendor before ordering.
insert into public.reagent_catalog
  (name, catalog_number, manufacturer, category, default_storage, synonyms)
values
  ('DMEM, low glucose', '11885084', 'Gibco', 'Basal medium', '2–8 °C', array['Dulbecco''s Modified Eagle Medium', 'DMEM low glucose']),
  ('RPMI 1640 Medium', '11875093', 'Gibco', 'Basal medium', '2–8 °C', array['RPMI']),
  ('Minimum Essential Medium', '11095080', 'Gibco', 'Basal medium', '2–8 °C', array['MEM']),
  ('Minimum Essential Medium Alpha', '12571063', 'Gibco', 'Basal medium', '2–8 °C', array['alpha-MEM', 'α-MEM']),
  ('Iscove''s Modified Dulbecco''s Medium', '12440053', 'Gibco', 'Basal medium', '2–8 °C', array['IMDM']),
  ('Ham''s F-12 Nutrient Mix', '11765054', 'Gibco', 'Basal medium', '2–8 °C', array['Ham F12', 'F-12']),
  ('Advanced DMEM/F-12', '12634010', 'Gibco', 'Basal medium', '2–8 °C', array['Advanced DMEM F12']),
  ('Neurobasal Plus Medium', 'A3582901', 'Gibco', 'Basal medium', '2–8 °C', array['Neurobasal+']),
  ('Essential 8 Medium', 'A1517001', 'Gibco', 'Stem-cell medium', '2–8 °C', array['E8', 'Essential Eight']),
  ('Essential 6 Medium', 'A1516401', 'Gibco', 'Stem-cell medium', '2–8 °C', array['E6', 'Essential Six']),
  ('StemFlex Medium', 'A3349401', 'Gibco', 'Stem-cell medium', '2–8 °C', array['StemFlex']),
  ('Opti-MEM Reduced Serum Medium', '31985070', 'Gibco', 'Basal medium', '2–8 °C', array['OptiMEM']),
  ('HBSS with calcium and magnesium', '14025092', 'Gibco', 'Buffer', 'Room temperature', array['HBSS']),
  ('PBS, pH 7.4', '10010023', 'Gibco', 'Buffer', 'Room temperature', array['phosphate buffered saline']),
  ('Fetal Bovine Serum', '26140079', 'Gibco', 'Serum', '-20 °C', array['FBS', 'fetal calf serum']),
  ('KnockOut Serum Replacement', '10828028', 'Gibco', 'Supplement', '-20 °C', array['KSR', 'KnockOut SR']),
  ('B-27 Supplement minus vitamin A', '12587010', 'Gibco', 'Supplement', '-20 °C', array['B27 minus vitamin A']),
  ('B-27 Plus Supplement', 'A3582801', 'Gibco', 'Supplement', '-20 °C', array['B27 Plus']),
  ('MEM Non-Essential Amino Acids', '11140050', 'Gibco', 'Supplement', '2–8 °C', array['NEAA']),
  ('Sodium Pyruvate 100 mM', '11360070', 'Gibco', 'Supplement', '2–8 °C', array['sodium pyruvate']),
  ('HEPES 1 M', '15630080', 'Gibco', 'Buffer', '2–8 °C', array['HEPES buffer']),
  ('2-Mercaptoethanol', '21985023', 'Gibco', 'Supplement', '2–8 °C', array['beta-mercaptoethanol', 'β-mercaptoethanol', 'BME']),
  ('Insulin-Transferrin-Selenium', '41400045', 'Gibco', 'Supplement', '2–8 °C', array['ITS-G', 'ITS']),
  ('Insulin-Transferrin-Selenium-Ethanolamine', '51500056', 'Gibco', 'Supplement', '2–8 °C', array['ITS-X']),
  ('Gentamicin', '15750060', 'Gibco', 'Antibiotic', '-20 °C', array['gentamycin']),
  ('Amphotericin B', '15290026', 'Gibco', 'Antimycotic', '-20 °C', array['Fungizone']),
  ('Puromycin Dihydrochloride', 'A1113803', 'Gibco', 'Selection antibiotic', '-20 °C', array['puromycin']),
  ('Blasticidin S HCl', 'A1113903', 'Gibco', 'Selection antibiotic', '-20 °C', array['blasticidin']),
  ('Geneticin Selective Antibiotic', '10131035', 'Gibco', 'Selection antibiotic', '-20 °C', array['G418', 'geneticin']),
  ('TrypLE Select Enzyme', '12563011', 'Gibco', 'Dissociation reagent', 'Room temperature', array['TrypLE Select']),
  ('Trypsin-EDTA 0.25%', '25200056', 'Gibco', 'Dissociation reagent', '-20 °C', array['trypsin EDTA']),
  ('StemPro Accutase', 'A1110501', 'Gibco', 'Dissociation reagent', '-20 °C', array['Accutase']),
  ('Collagenase Type IV', '17104019', 'Gibco', 'Dissociation reagent', '2–8 °C', array['collagenase IV']),
  ('Dispase II', '17105041', 'Gibco', 'Dissociation reagent', '2–8 °C', array['dispase']),
  ('Geltrex LDEV-Free Reduced Growth Factor Basement Membrane Matrix', 'A1413202', 'Gibco', 'Extracellular matrix', '-20 °C', array['Geltrex', 'basement membrane matrix']),
  ('Vitronectin Recombinant Human', 'A14700', 'Gibco', 'Extracellular matrix', '-80 °C', array['vitronectin', 'VTN-N']),
  ('Human Plasma Fibronectin', '33016015', 'Gibco', 'Extracellular matrix', '-20 °C', array['fibronectin']),
  ('Laminin-521', 'LN521-02', 'BioLamina', 'Extracellular matrix', '-80 °C', array['LN-521', 'laminin 521']),
  ('Poly-D-Lysine', 'A3890401', 'Gibco', 'Coating reagent', '-20 °C', array['PDL', 'poly D lysine']),
  ('Poly-L-Ornithine solution', 'P4957', 'Sigma-Aldrich', 'Coating reagent', '2–8 °C', array['PLO', 'polyornithine']),
  ('Poly-L-Lysine solution', 'P4707', 'Sigma-Aldrich', 'Coating reagent', '2–8 °C', array['PLL', 'polylysine']),
  ('Recombinant Human BDNF', '450-02', 'PeproTech', 'Growth factor', '-20 °C', array['BDNF']),
  ('Recombinant Human GDNF', '450-10', 'PeproTech', 'Growth factor', '-20 °C', array['GDNF']),
  ('Recombinant Human beta-NGF', '450-01', 'PeproTech', 'Growth factor', '-20 °C', array['NGF', 'beta-NGF']),
  ('Recombinant Human TGF-beta 3', '100-36E', 'PeproTech', 'Growth factor', '-20 °C', array['TGFb3', 'TGF-β3']),
  ('Recombinant Human Noggin', '120-10C', 'PeproTech', 'Growth factor', '-20 °C', array['Noggin']),
  ('Recombinant Human Sonic Hedgehog', '100-45', 'PeproTech', 'Growth factor', '-20 °C', array['SHH', 'Sonic Hedgehog']),
  ('Recombinant Human BMP-4', '120-05ET', 'PeproTech', 'Growth factor', '-20 °C', array['BMP4']),
  ('Recombinant Human Activin A', '120-14E', 'PeproTech', 'Growth factor', '-20 °C', array['Activin A']),
  ('Recombinant Human Wnt-3a', '315-20', 'PeproTech', 'Growth factor', '-20 °C', array['WNT3A']),
  ('Recombinant Human IL-34', '200-34', 'PeproTech', 'Cytokine', '-20 °C', array['IL34']),
  ('Recombinant Human M-CSF', '300-25', 'PeproTech', 'Cytokine', '-20 °C', array['CSF1', 'MCSF']),
  ('Recombinant Human GM-CSF', '300-03', 'PeproTech', 'Cytokine', '-20 °C', array['CSF2', 'GMCSF']),
  ('Recombinant Human CNTF', '450-13', 'PeproTech', 'Growth factor', '-20 °C', array['CNTF']),
  ('CHIR 99021', '4423', 'Tocris', 'Small molecule', '-20 °C', array['CHIR99021', 'GSK3 inhibitor']),
  ('LDN 193189', '6053', 'Tocris', 'Small molecule', '-20 °C', array['LDN193189', 'BMP inhibitor']),
  ('XAV 939', '3748', 'Tocris', 'Small molecule', '-20 °C', array['XAV939', 'tankyrase inhibitor']),
  ('Purmorphamine', '4551', 'Tocris', 'Small molecule', '-20 °C', array['purmorphamine', 'SHH agonist']),
  ('Smoothened Agonist', '4366', 'Tocris', 'Small molecule', '-20 °C', array['SAG']),
  ('IWP 2', '3533', 'Tocris', 'Small molecule', '-20 °C', array['IWP2', 'Wnt inhibitor']),
  ('PD 0325901', '4192', 'Tocris', 'Small molecule', '-20 °C', array['PD0325901', 'MEK inhibitor']),
  ('A 83-01', '2939', 'Tocris', 'Small molecule', '-20 °C', array['A83-01', 'TGF beta inhibitor']),
  ('Thiazovivin', '3845', 'Tocris', 'Small molecule', '-20 °C', array['ROCK inhibitor']),
  ('BMS 493', '3509', 'Tocris', 'Small molecule', '-20 °C', array['BMS493', 'retinoic acid antagonist']),
  ('Cyclopamine', '1623', 'Tocris', 'Small molecule', '-20 °C', array['Hedgehog inhibitor']),
  ('SU 5402', '3300', 'Tocris', 'Small molecule', '-20 °C', array['SU5402', 'FGFR inhibitor']),
  ('Forskolin', 'F6886', 'Sigma-Aldrich', 'Small molecule', '-20 °C', array['forskolin']),
  ('Dibutyryl cyclic AMP sodium salt', 'D0627', 'Sigma-Aldrich', 'Small molecule', '-20 °C', array['dbcAMP', 'dibutyryl cAMP']),
  ('L-Ascorbic acid', 'A4544', 'Sigma-Aldrich', 'Small molecule', '2–8 °C', array['ascorbic acid', 'vitamin C']),
  ('Valproic acid sodium salt', 'P4543', 'Sigma-Aldrich', 'Small molecule', 'Room temperature', array['VPA', 'valproate']),
  ('DAPT', 'D5942', 'Sigma-Aldrich', 'Small molecule', '-20 °C', array['gamma secretase inhibitor']),
  ('All-trans Retinoic Acid', 'R2625', 'Sigma-Aldrich', 'Small molecule', '-20 °C, protect from light', array['retinoic acid', 'ATRA']),
  ('Dimethyl Sulfoxide', 'D2650', 'Sigma-Aldrich', 'Cryopreservation', 'Room temperature', array['DMSO']),
  ('CryoStor CS10', '07930', 'STEMCELL Technologies', 'Cryopreservation', '2–8 °C', array['CS10', 'freezing medium']),
  ('Lipofectamine 3000 Transfection Reagent', 'L3000015', 'Invitrogen', 'Transfection', '2–8 °C', array['Lipofectamine 3000', 'Lipo3000']),
  ('Hoechst 33342', 'H3570', 'Invitrogen', 'Stain', '2–8 °C, protect from light', array['Hoechst']),
  ('DAPI', 'D1306', 'Invitrogen', 'Stain', 'Room temperature, protect from light', array['4'',6-diamidino-2-phenylindole']),
  ('Trypan Blue Solution 0.4%', '15250061', 'Gibco', 'Viability reagent', 'Room temperature', array['trypan blue']),
  ('LIVE/DEAD Viability/Cytotoxicity Kit', 'L3224', 'Invitrogen', 'Viability reagent', '-20 °C', array['Live Dead', 'calcein AM ethidium homodimer']),
  ('Calcein AM', 'C1430', 'Invitrogen', 'Viability reagent', '-20 °C', array['calcein acetoxymethyl ester'])
on conflict (catalog_number, manufacturer) do nothing;
