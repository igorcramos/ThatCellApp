-- Reusable culture-medium recipes with dimensionally explicit components.
-- Run after 2026-08-06_secure_passwordless_auth.sql.
-- This migration stores recipe definitions only; it never changes reagent stock.

begin;

create table if not exists public.culture_media_recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  version text not null default '1.0' check (length(btrim(version)) > 0),
  solvent_name text not null default 'Base medium / solvent' check (length(btrim(solvent_name)) > 0),
  description text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.culture_media_components (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.culture_media_recipes(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  calculation_mode text not null check (calculation_mode in (
    'dilution', 'percent_vv', 'percent_wv', 'mass_per_volume',
    'volume_per_volume', 'fixed_per_volume'
  )),
  stock_value numeric check (stock_value is null or stock_value > 0),
  stock_unit text,
  target_value numeric check (target_value is null or target_value >= 0),
  target_unit text,
  rate_value numeric check (rate_value is null or rate_value >= 0),
  rate_unit text,
  reference_value numeric check (reference_value is null or reference_value > 0),
  reference_unit text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id, name)
);

create unique index if not exists idx_culture_media_recipe_name_version
  on public.culture_media_recipes(lower(name), lower(version));
create index if not exists idx_culture_media_recipes_owner
  on public.culture_media_recipes(created_by, updated_at desc);
create index if not exists idx_culture_media_components_recipe_order
  on public.culture_media_components(recipe_id, sort_order, name);

create or replace function public.set_culture_media_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists culture_media_recipes_updated_at on public.culture_media_recipes;
create trigger culture_media_recipes_updated_at
before update on public.culture_media_recipes
for each row execute function public.set_culture_media_updated_at();

drop trigger if exists culture_media_components_updated_at on public.culture_media_components;
create trigger culture_media_components_updated_at
before update on public.culture_media_components
for each row execute function public.set_culture_media_updated_at();

create or replace function public.can_manage_culture_media_recipe(p_recipe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and exists (
    select 1
    from public.culture_media_recipes recipe
    where recipe.id = p_recipe_id
      and (public.current_user_is_admin() or recipe.created_by = auth.uid())
  );
$$;

revoke all on function public.can_manage_culture_media_recipe(uuid) from public;
grant execute on function public.can_manage_culture_media_recipe(uuid) to authenticated;

alter table public.culture_media_recipes enable row level security;
alter table public.culture_media_components enable row level security;

drop policy if exists "culture media active read" on public.culture_media_recipes;
drop policy if exists "culture media owner insert" on public.culture_media_recipes;
drop policy if exists "culture media owner update" on public.culture_media_recipes;
drop policy if exists "culture media owner delete" on public.culture_media_recipes;
create policy "culture media active read" on public.culture_media_recipes
for select using (public.is_active_user());
create policy "culture media owner insert" on public.culture_media_recipes
for insert with check (public.is_active_user() and created_by = auth.uid());
create policy "culture media owner update" on public.culture_media_recipes
for update using (public.can_manage_culture_media_recipe(id))
with check (public.can_manage_culture_media_recipe(id));
create policy "culture media owner delete" on public.culture_media_recipes
for delete using (public.can_manage_culture_media_recipe(id));

drop policy if exists "culture media components active read" on public.culture_media_components;
drop policy if exists "culture media components manager insert" on public.culture_media_components;
drop policy if exists "culture media components manager update" on public.culture_media_components;
drop policy if exists "culture media components manager delete" on public.culture_media_components;
create policy "culture media components active read" on public.culture_media_components
for select using (public.is_active_user());
create policy "culture media components manager insert" on public.culture_media_components
for insert with check (public.can_manage_culture_media_recipe(recipe_id));
create policy "culture media components manager update" on public.culture_media_components
for update using (public.can_manage_culture_media_recipe(recipe_id))
with check (public.can_manage_culture_media_recipe(recipe_id));
create policy "culture media components manager delete" on public.culture_media_components
for delete using (public.can_manage_culture_media_recipe(recipe_id));

revoke all on public.culture_media_recipes from anon;
revoke all on public.culture_media_components from anon;
grant select, insert, update, delete on public.culture_media_recipes to authenticated;
grant select, insert, update, delete on public.culture_media_components to authenticated;

drop trigger if exists audit_changes on public.culture_media_recipes;
create trigger audit_changes
after insert or update or delete on public.culture_media_recipes
for each row execute function public.capture_audit_change();

drop trigger if exists audit_changes on public.culture_media_components;
create trigger audit_changes
after insert or update or delete on public.culture_media_components
for each row execute function public.capture_audit_change();

comment on table public.culture_media_recipes is
  'Reusable culture-medium definitions; calculations are performed client-side and do not consume inventory.';
comment on table public.culture_media_components is
  'Dimensionally explicit recipe components used by the Culture Media calculator.';

commit;
