-- Editable reagent/material checklists with weekly history.
-- Run after 2026-08-06_secure_passwordless_auth.sql.

begin;

-- Match punctuation-insensitively so reruns do not duplicate catalog products
-- that were previously entered as, for example, BB05 or 1000483.
with missing_products(name, catalog_number, manufacturer, manufacturer_prefix, catalog_keys, category, default_storage, synonyms) as (
  values
    ('BAMBANKER', 'CS-02-002', 'Bulldog Bio', 'bulldog', array['CS02002', 'BB05', 'CS02002BB05']::text[], 'Cryopreservation', '2–8 °C', array['Bambanker freezing medium', 'BB05']::text[]),
    ('ACCUTASE', '07920', 'STEMCELL Technologies', 'stemcell', array['07920']::text[], 'Dissociation reagent', '-20 °C', array['Accutase', 'Stemcell Accutase']::text[]),
    ('ReLeSR', '100-0483', 'STEMCELL Technologies', 'stemcell', array['1000483']::text[], 'Dissociation reagent', '2–8 °C', array['ReLeSR passaging reagent']::text[]),
    ('Insulin Solution, human', 'I9278-5ML', 'Sigma-Aldrich', 'sigma', array['I92785ML']::text[], 'Supplement', '2–8 °C', array['Insulin solution', 'I9278']::text[])
)
insert into public.reagent_catalog
  (name, catalog_number, manufacturer, category, default_storage, synonyms)
select seed.name, seed.catalog_number, seed.manufacturer, seed.category, seed.default_storage, seed.synonyms
from missing_products seed
where not exists (
  select 1
  from public.reagent_catalog catalog
  where regexp_replace(lower(catalog.manufacturer), '[^a-z0-9]', '', 'g') like seed.manufacturer_prefix || '%'
    and regexp_replace(upper(catalog.catalog_number), '[^A-Z0-9]', '', 'g') = any(seed.catalog_keys)
)
on conflict (catalog_number, manufacturer) do nothing;

create table if not exists public.reagent_checklists (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) > 0),
  description text,
  frequency_days integer not null default 7 check (frequency_days between 1 and 365),
  responsible_user_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reagent_checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.reagent_checklists(id) on delete cascade,
  catalog_reagent_id uuid not null references public.reagent_catalog(id) on delete restrict,
  display_name text not null check (length(btrim(display_name)) > 0),
  expected_location text,
  minimum_quantity numeric not null default 0 check (minimum_quantity >= 0),
  unit text not null default 'units' check (length(btrim(unit)) > 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (checklist_id, display_name)
);

create table if not exists public.reagent_check_sessions (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.reagent_checklists(id) on delete cascade,
  checked_on date not null default current_date,
  checked_by uuid references public.profiles(id) on delete set null default auth.uid(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (checklist_id, checked_on)
);

create table if not exists public.reagent_check_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.reagent_check_sessions(id) on delete cascade,
  checklist_item_id uuid not null references public.reagent_checklist_items(id) on delete restrict,
  quantity_observed numeric check (quantity_observed is null or quantity_observed >= 0),
  status text not null default 'not_checked' check (status in ('ok', 'low', 'out', 'not_checked')),
  ordered boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, checklist_item_id)
);

create or replace function public.set_reagent_checklist_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'reagent_checklists', 'reagent_checklist_items',
    'reagent_check_sessions', 'reagent_check_entries'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', target_table);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_reagent_checklist_updated_at()',
      target_table
    );
  end loop;
end $$;

-- Protect item-level history. Whole-list deletion uses the permission-checked
-- function below, which removes entries before cascading the list itself.
alter table public.reagent_check_entries
  drop constraint if exists reagent_check_entries_checklist_item_id_fkey;
alter table public.reagent_check_entries
  add constraint reagent_check_entries_checklist_item_id_fkey
  foreign key (checklist_item_id) references public.reagent_checklist_items(id)
  on delete restrict;

-- Ordering is an independent flag, not a stock-status value. This also repairs
-- rows created by an earlier draft of this migration.
update public.reagent_check_entries entry
set status = case
  when entry.quantity_observed is null then 'not_checked'
  when entry.quantity_observed = 0 then 'out'
  when entry.quantity_observed < item.minimum_quantity then 'low'
  else 'ok'
end
from public.reagent_checklist_items item
where item.id = entry.checklist_item_id
  and entry.status = 'ordered';
alter table public.reagent_check_entries
  drop constraint if exists reagent_check_entries_status_check;
alter table public.reagent_check_entries
  add constraint reagent_check_entries_status_check
  check (status in ('ok', 'low', 'out', 'not_checked'));

create index if not exists idx_reagent_checklists_responsible
  on public.reagent_checklists(responsible_user_id);
create index if not exists idx_reagent_checklist_items_list_order
  on public.reagent_checklist_items(checklist_id, sort_order, display_name);
create index if not exists idx_reagent_checklist_items_catalog
  on public.reagent_checklist_items(catalog_reagent_id);
create index if not exists idx_reagent_check_sessions_list_date
  on public.reagent_check_sessions(checklist_id, checked_on desc);
create index if not exists idx_reagent_check_entries_session
  on public.reagent_check_entries(session_id);

create or replace function public.can_manage_reagent_checklist(p_checklist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and exists (
    select 1
    from public.reagent_checklists checklist
    where checklist.id = p_checklist_id
      and (
        public.current_user_is_admin()
        or checklist.created_by = auth.uid()
        or checklist.responsible_user_id = auth.uid()
      )
  );
$$;

create or replace function public.can_manage_reagent_check_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.reagent_check_sessions session
    where session.id = p_session_id
      and public.can_manage_reagent_checklist(session.checklist_id)
  );
$$;

create or replace function public.delete_reagent_checklist(p_checklist_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.can_manage_reagent_checklist(p_checklist_id) then
    raise exception 'You do not have permission to delete this material list.'
      using errcode = '42501';
  end if;

  -- Item history is protected from accidental item deletion by a restrictive
  -- foreign key. A confirmed whole-list deletion removes history first so the
  -- remaining list, session, and item cascades can complete atomically.
  delete from public.reagent_check_entries entry
  using public.reagent_check_sessions session
  where entry.session_id = session.id
    and session.checklist_id = p_checklist_id;

  delete from public.reagent_checklists where id = p_checklist_id;
end;
$$;

revoke all on function public.can_manage_reagent_checklist(uuid) from public;
revoke all on function public.can_manage_reagent_check_session(uuid) from public;
revoke all on function public.delete_reagent_checklist(uuid) from public;
grant execute on function public.can_manage_reagent_checklist(uuid) to authenticated;
grant execute on function public.can_manage_reagent_check_session(uuid) to authenticated;
grant execute on function public.delete_reagent_checklist(uuid) to authenticated;

alter table public.reagent_checklists enable row level security;
alter table public.reagent_checklist_items enable row level security;
alter table public.reagent_check_sessions enable row level security;
alter table public.reagent_check_entries enable row level security;

drop policy if exists "reagent checklists active read" on public.reagent_checklists;
drop policy if exists "reagent checklists member insert" on public.reagent_checklists;
drop policy if exists "reagent checklists manager update" on public.reagent_checklists;
drop policy if exists "reagent checklists manager delete" on public.reagent_checklists;
create policy "reagent checklists active read" on public.reagent_checklists
for select using (public.is_active_user());
create policy "reagent checklists member insert" on public.reagent_checklists
for insert with check (public.is_active_user() and created_by = auth.uid());
create policy "reagent checklists manager update" on public.reagent_checklists
for update using (public.can_manage_reagent_checklist(id))
with check (public.can_manage_reagent_checklist(id));
create policy "reagent checklists manager delete" on public.reagent_checklists
for delete using (public.can_manage_reagent_checklist(id));

drop policy if exists "reagent checklist items active read" on public.reagent_checklist_items;
drop policy if exists "reagent checklist items manager insert" on public.reagent_checklist_items;
drop policy if exists "reagent checklist items manager update" on public.reagent_checklist_items;
drop policy if exists "reagent checklist items manager delete" on public.reagent_checklist_items;
create policy "reagent checklist items active read" on public.reagent_checklist_items
for select using (public.is_active_user());
create policy "reagent checklist items manager insert" on public.reagent_checklist_items
for insert with check (public.can_manage_reagent_checklist(checklist_id));
create policy "reagent checklist items manager update" on public.reagent_checklist_items
for update using (public.can_manage_reagent_checklist(checklist_id))
with check (public.can_manage_reagent_checklist(checklist_id));
create policy "reagent checklist items manager delete" on public.reagent_checklist_items
for delete using (public.can_manage_reagent_checklist(checklist_id));

drop policy if exists "reagent check sessions active read" on public.reagent_check_sessions;
drop policy if exists "reagent check sessions manager insert" on public.reagent_check_sessions;
drop policy if exists "reagent check sessions manager update" on public.reagent_check_sessions;
drop policy if exists "reagent check sessions manager delete" on public.reagent_check_sessions;
create policy "reagent check sessions active read" on public.reagent_check_sessions
for select using (public.is_active_user());
create policy "reagent check sessions manager insert" on public.reagent_check_sessions
for insert with check (
  checked_by = auth.uid() and public.can_manage_reagent_checklist(checklist_id)
);
create policy "reagent check sessions manager update" on public.reagent_check_sessions
for update using (public.can_manage_reagent_checklist(checklist_id))
with check (public.can_manage_reagent_checklist(checklist_id));
create policy "reagent check sessions manager delete" on public.reagent_check_sessions
for delete using (public.can_manage_reagent_checklist(checklist_id));

drop policy if exists "reagent check entries active read" on public.reagent_check_entries;
drop policy if exists "reagent check entries manager insert" on public.reagent_check_entries;
drop policy if exists "reagent check entries manager update" on public.reagent_check_entries;
drop policy if exists "reagent check entries manager delete" on public.reagent_check_entries;
create policy "reagent check entries active read" on public.reagent_check_entries
for select using (public.is_active_user());
create policy "reagent check entries manager insert" on public.reagent_check_entries
for insert with check (public.can_manage_reagent_check_session(session_id));
create policy "reagent check entries manager update" on public.reagent_check_entries
for update using (public.can_manage_reagent_check_session(session_id))
with check (public.can_manage_reagent_check_session(session_id));
create policy "reagent check entries manager delete" on public.reagent_check_entries
for delete using (public.can_manage_reagent_check_session(session_id));

revoke all on public.reagent_checklists from anon;
revoke all on public.reagent_checklist_items from anon;
revoke all on public.reagent_check_sessions from anon;
revoke all on public.reagent_check_entries from anon;
grant select, insert, update, delete on public.reagent_checklists to authenticated;
grant select, insert, update, delete on public.reagent_checklist_items to authenticated;
grant select, insert, update, delete on public.reagent_check_sessions to authenticated;
grant select, insert, update, delete on public.reagent_check_entries to authenticated;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'reagent_checklists', 'reagent_checklist_items',
    'reagent_check_sessions', 'reagent_check_entries'
  ] loop
    execute format('drop trigger if exists audit_changes on public.%I', target_table);
    execute format(
      'create trigger audit_changes after insert or update or delete on public.%I for each row execute function public.capture_audit_change()',
      target_table
    );
  end loop;
end $$;

do $$
declare
  admin_id uuid;
  checklist_uuid uuid;
  session_uuid uuid;
begin
  select profile.id
  into admin_id
  from public.profiles profile
  left join public.app_auth_bootstrap bootstrap on bootstrap.id = 1
  where profile.is_active
  order by coalesce(lower(profile.email) = bootstrap.admin_email, false) desc,
           (profile.role = 'admin') desc,
           profile.created_at
  limit 1;

  insert into public.reagent_checklists
    (name, description, frequency_days, responsible_user_id, created_by)
  values
    ('VictorLab TC', 'Weekly tissue-culture material check.', 7, admin_id, admin_id)
  on conflict (name) do update
  set frequency_days = excluded.frequency_days,
      responsible_user_id = coalesce(excluded.responsible_user_id, public.reagent_checklists.responsible_user_id),
      updated_at = now()
  returning id into checklist_uuid;

  insert into public.reagent_checklist_items
    (checklist_id, catalog_reagent_id, display_name, expected_location, minimum_quantity, unit, sort_order)
  select checklist_uuid, catalog.id, seed.display_name, seed.expected_location,
         seed.minimum_quantity, seed.unit, seed.sort_order
  from (values
    ('gibco', array['17502048']::text[], 'N2', 'Mini -20°C', 10::numeric, 'units', 1),
    ('gibco', array['17504044']::text[], 'B27', 'Mini -20°C', 10::numeric, 'units', 2),
    ('bulldog', array['CS02002', 'BB05', 'CS02002BB05']::text[], 'Bambanker', 'TC 4°C 1', 3::numeric, 'units', 3),
    ('stemcell', array['07920']::text[], 'Accutase', '-20°C Freezer Room', 3::numeric, 'units', 4),
    ('stemcell', array['1000483']::text[], 'ReLeSR', 'TC Storage Unit', 2::numeric, 'units', 5),
    ('gibco', array['15140122']::text[], 'Pen/Strep bottles', '-20°C Freezer Room', 5::numeric, 'bottles', 6),
    ('gibco', array['15140122']::text[], 'Pen/Strep aliquots', 'Mini -20°C', 5::numeric, 'aliquots', 7),
    ('gibco', array['15630080']::text[], 'HEPES (1M)', 'TC 4°C 1', 1::numeric, 'units', 8),
    ('gibco', array['A3890401']::text[], 'Poly-D-Lysine', 'TC 4°C 1', 2::numeric, 'units', 9),
    ('gibco', array['35050061']::text[], 'Glutamax', 'TC 4°C 1', 3::numeric, 'units', 10),
    ('gibco', array['11140050']::text[], 'MEM-NEAA', 'TC 4°C 1', 3::numeric, 'units', 11),
    ('sigma', array['I92785ML']::text[], 'Insulin solution', 'TC 4°C 1', 2::numeric, 'units', 12),
    ('gibco', array['11360070']::text[], 'Sodium Pyruvate', 'TC 4°C 1', 1::numeric, 'units', 13),
    ('gibco', array['41400045']::text[], 'Insulin Transferrin Selenium', 'TC 4°C 1', 4::numeric, 'units', 14)
  ) as seed(manufacturer_prefix, catalog_keys, display_name, expected_location, minimum_quantity, unit, sort_order)
  join lateral (
    select candidate.id
    from public.reagent_catalog candidate
    where regexp_replace(lower(candidate.manufacturer), '[^a-z0-9]', '', 'g') like seed.manufacturer_prefix || '%'
      and regexp_replace(upper(candidate.catalog_number), '[^A-Z0-9]', '', 'g') = any(seed.catalog_keys)
    order by candidate.created_at, candidate.id
    limit 1
  ) catalog on true
  on conflict (checklist_id, display_name) do update
  set catalog_reagent_id = excluded.catalog_reagent_id,
      expected_location = excluded.expected_location,
      minimum_quantity = excluded.minimum_quantity,
      unit = excluded.unit,
      sort_order = excluded.sort_order,
      updated_at = now();

  insert into public.reagent_check_sessions
    (checklist_id, checked_on, checked_by, notes)
  values
    (checklist_uuid, date '2026-07-29', admin_id, 'Imported from the VictorLab TC tracking sheet.')
  on conflict (checklist_id, checked_on) do update
  set checked_by = coalesce(public.reagent_check_sessions.checked_by, excluded.checked_by),
      notes = excluded.notes,
      updated_at = now()
  returning id into session_uuid;

  insert into public.reagent_check_entries
    (session_id, checklist_item_id, quantity_observed, status, ordered)
  select session_uuid, item.id, seed.quantity_observed,
         case
           when seed.quantity_observed = 0 then 'out'
           when seed.quantity_observed < item.minimum_quantity then 'low'
           else 'ok'
         end,
         seed.ordered
  from (values
    ('N2', 24::numeric, false),
    ('B27', 19::numeric, false),
    ('Bambanker', 2::numeric, true),
    ('Accutase', 6::numeric, false),
    ('ReLeSR', 1::numeric, true),
    ('Pen/Strep bottles', 11::numeric, false),
    ('Pen/Strep aliquots', 18::numeric, false),
    ('HEPES (1M)', 1::numeric, false),
    ('Poly-D-Lysine', 3::numeric, false),
    ('Glutamax', 1::numeric, true),
    ('MEM-NEAA', 0::numeric, true),
    ('Insulin solution', 0::numeric, false),
    ('Sodium Pyruvate', 1::numeric, false),
    ('Insulin Transferrin Selenium', 6::numeric, false)
  ) as seed(display_name, quantity_observed, ordered)
  join public.reagent_checklist_items item
    on item.checklist_id = checklist_uuid and item.display_name = seed.display_name
  on conflict (session_id, checklist_item_id) do update
  set quantity_observed = excluded.quantity_observed,
      status = excluded.status,
      ordered = excluded.ordered,
      updated_at = now();
end $$;

commit;
