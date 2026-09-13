-- Allow one differentiation run to start from several plates, including
-- plates carrying different cell lines. The legacy source_vessel_id remains
-- populated with the first selected plate for backward compatibility.

begin;

create table if not exists public.differentiation_run_vessels (
  differentiation_run_id uuid not null references public.differentiation_runs(id) on delete cascade,
  vessel_id uuid not null references public.culture_vessels(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (differentiation_run_id, vessel_id)
);

alter table public.differentiation_run_vessels enable row level security;

drop policy if exists "run vessels member read" on public.differentiation_run_vessels;
create policy "run vessels member read" on public.differentiation_run_vessels
as permissive for select to authenticated
using (public.can_access_run(differentiation_run_id));

insert into public.differentiation_run_vessels (differentiation_run_id, vessel_id)
select id, source_vessel_id
from public.differentiation_runs
where source_type = 'vessel' and source_vessel_id is not null
on conflict do nothing;

create or replace function public.save_multi_vessel_differentiation_run(
  run_id_arg uuid,
  protocol_id_arg uuid,
  run_name_arg text,
  project_arg text,
  day_zero_date_arg date,
  source_type_arg text,
  source_culture_id_arg uuid,
  source_vessel_id_arg uuid,
  status_arg text,
  schedule_color_arg text,
  notes_arg text,
  source_wells_arg text[] default '{}'::text[],
  source_vessel_ids_arg uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  saved_run_id uuid;
  selected_vessel_ids uuid[] := array(
    select value
    from unnest(coalesce(source_vessel_ids_arg, '{}'::uuid[])) with ordinality as requested(value, position)
    where value is not null
    group by value
    order by min(position)
  );
  lineage_ids uuid[] := '{}'::uuid[];
begin
  if lower(btrim(coalesce(source_type_arg, ''))) <> 'vessel' then
    raise exception 'Multiple plates are only available for a plate source.';
  end if;

  if cardinality(selected_vessel_ids) = 0 then
    raise exception 'Select at least one source plate.';
  end if;

  if exists (
    select 1 from unnest(selected_vessel_ids) selected(vessel_id)
    where not public.can_access_vessel(selected.vessel_id)
  ) then
    raise exception 'You do not have access to one or more selected plates.';
  end if;

  if run_id_arg is not null then
    delete from public.differentiation_run_cell_lines
    where differentiation_run_id = run_id_arg;
  end if;

  saved_run_id := public.save_differentiation_run(
    run_id_arg, protocol_id_arg, run_name_arg, project_arg, day_zero_date_arg,
    'vessel', null, selected_vessel_ids[1], status_arg, schedule_color_arg,
    notes_arg, '{}'::text[]
  );

  delete from public.differentiation_run_vessels
  where differentiation_run_id = saved_run_id;

  insert into public.differentiation_run_vessels (differentiation_run_id, vessel_id)
  select saved_run_id, vessel_id from unnest(selected_vessel_ids) selected(vessel_id);

  select coalesce(array_agg(distinct source.cell_line_id), '{}'::uuid[])
  into lineage_ids
  from (
    select mapped.cell_line_id
    from public.vessel_wells mapped
    where mapped.vessel_id = any(selected_vessel_ids) and mapped.cell_line_id is not null
    union
    select link.cell_line_id
    from public.vessel_wells mapped
    join public.culture_cell_lines link on link.culture_id = mapped.culture_id
    where mapped.vessel_id = any(selected_vessel_ids)
    union
    select culture.cell_line_id
    from public.vessel_wells mapped
    join public.cultures culture on culture.id = mapped.culture_id
    where mapped.vessel_id = any(selected_vessel_ids) and culture.cell_line_id is not null
    union
    select link.cell_line_id
    from public.vessel_cultures vessel_link
    join public.culture_cell_lines link on link.culture_id = vessel_link.culture_id
    where vessel_link.vessel_id = any(selected_vessel_ids)
    union
    select culture.cell_line_id
    from public.vessel_cultures vessel_link
    join public.cultures culture on culture.id = vessel_link.culture_id
    where vessel_link.vessel_id = any(selected_vessel_ids) and culture.cell_line_id is not null
    union
    select link.cell_line_id
    from public.culture_vessels vessel
    join public.culture_cell_lines link on link.culture_id = vessel.culture_id
    where vessel.id = any(selected_vessel_ids)
    union
    select culture.cell_line_id
    from public.culture_vessels vessel
    join public.cultures culture on culture.id = vessel.culture_id
    where vessel.id = any(selected_vessel_ids) and culture.cell_line_id is not null
  ) source;

  if cardinality(lineage_ids) = 0 then
    raise exception 'No cell line is mapped to the selected plates.';
  end if;

  delete from public.differentiation_run_cell_lines
  where differentiation_run_id = saved_run_id;

  insert into public.differentiation_run_cell_lines (differentiation_run_id, cell_line_id)
  select saved_run_id, cell_line_id from unnest(lineage_ids) source(cell_line_id);

  return saved_run_id;
end;
$$;

revoke all on function public.save_multi_vessel_differentiation_run(
  uuid, uuid, text, text, date, text, uuid, uuid, text, text, text, text[], uuid[]
) from public;
grant execute on function public.save_multi_vessel_differentiation_run(
  uuid, uuid, text, text, date, text, uuid, uuid, text, text, text, text[], uuid[]
) to authenticated;

commit;
