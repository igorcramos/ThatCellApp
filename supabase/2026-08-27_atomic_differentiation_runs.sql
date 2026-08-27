-- Atomically save differentiation runs and inherit a lineage snapshot from
-- the selected culture, plate, or wells.

begin;

alter table public.differentiation_runs
  alter column created_by set default auth.uid();

drop policy if exists "Prototype public insert differentiation runs" on public.differentiation_runs;
drop policy if exists "Project members create runs" on public.differentiation_runs;
drop policy if exists "runs member insert" on public.differentiation_runs;
drop policy if exists "Prototype public update differentiation runs" on public.differentiation_runs;
drop policy if exists "Project members update runs" on public.differentiation_runs;
drop policy if exists "runs member update" on public.differentiation_runs;

create policy "runs member insert" on public.differentiation_runs
as permissive for insert to authenticated
with check (
  public.is_active_user()
  and created_by = auth.uid()
  and public.can_access_protocol(protocol_id)
  and (source_culture_id is null or public.can_access_culture(source_culture_id))
  and (source_vessel_id is null or public.can_access_vessel(source_vessel_id))
);

create policy "runs member update" on public.differentiation_runs
as permissive for update to authenticated
using (public.can_access_run(id))
with check (
  public.can_access_run(id)
  and public.can_access_protocol(protocol_id)
  and (source_culture_id is null or public.can_access_culture(source_culture_id))
  and (source_vessel_id is null or public.can_access_vessel(source_vessel_id))
);

create or replace function public.save_differentiation_run(
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
  source_wells_arg text[] default '{}'::text[]
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  saved_run_id uuid := coalesce(run_id_arg, gen_random_uuid());
  safe_source_type text := lower(btrim(coalesce(source_type_arg, 'culture')));
  safe_run_name text := nullif(btrim(coalesce(run_name_arg, '')), '');
  selected_wells text[] := array(
    select distinct btrim(value)
    from unnest(coalesce(source_wells_arg, '{}'::text[])) as requested(value)
    where nullif(btrim(value), '') is not null
  );
  lineage_ids uuid[] := '{}'::uuid[];
  missing_wells text[] := '{}'::text[];
  should_snapshot boolean;
begin
  if auth.uid() is null or not public.is_active_user() then
    raise exception 'Your session is not active. Sign in again.';
  end if;

  if safe_run_name is null then
    raise exception 'Enter a name for the differentiation.';
  end if;

  if protocol_id_arg is null or not public.can_access_protocol(protocol_id_arg) then
    raise exception 'You do not have access to the selected protocol.';
  end if;

  if day_zero_date_arg is null then
    raise exception 'Choose the Day 0 date.';
  end if;

  if safe_source_type not in ('culture', 'vessel', 'wells') then
    raise exception 'Choose a valid differentiation source.';
  end if;

  if safe_source_type = 'culture' then
    if source_culture_id_arg is null or not public.can_access_culture(source_culture_id_arg) then
      raise exception 'You do not have access to the selected culture.';
    end if;
  else
    if source_vessel_id_arg is null or not public.can_access_vessel(source_vessel_id_arg) then
      raise exception 'You do not have access to the selected plate.';
    end if;
    if safe_source_type = 'wells' and cardinality(selected_wells) = 0 then
      raise exception 'Select at least one source well.';
    end if;
  end if;

  if run_id_arg is not null and not public.can_access_run(run_id_arg) then
    raise exception 'You do not have permission to edit this differentiation.';
  end if;

  should_snapshot := run_id_arg is null or not exists (
    select 1
    from public.differentiation_run_cell_lines link
    where link.differentiation_run_id = saved_run_id
  );

  if should_snapshot and safe_source_type = 'culture' then
    select coalesce(array_agg(distinct source.cell_line_id), '{}'::uuid[])
    into lineage_ids
    from (
      select link.cell_line_id
      from public.culture_cell_lines link
      where link.culture_id = source_culture_id_arg
      union
      select culture.cell_line_id
      from public.cultures culture
      where culture.id = source_culture_id_arg
        and culture.cell_line_id is not null
    ) source;
  elsif should_snapshot and safe_source_type = 'wells' then
    select coalesce(array_agg(requested.well), '{}'::text[])
    into missing_wells
    from unnest(selected_wells) as requested(well)
    where not exists (
      select 1
      from public.vessel_wells mapped
      where mapped.vessel_id = source_vessel_id_arg
        and mapped.well = requested.well
    );

    if cardinality(missing_wells) > 0 then
      raise exception 'Map the selected source well(s) before starting: %', array_to_string(missing_wells, ', ');
    end if;

    select coalesce(array_agg(distinct source.cell_line_id), '{}'::uuid[])
    into lineage_ids
    from (
      select mapped.cell_line_id
      from public.vessel_wells mapped
      where mapped.vessel_id = source_vessel_id_arg
        and mapped.well = any(selected_wells)
        and mapped.cell_line_id is not null
      union
      select link.cell_line_id
      from public.vessel_wells mapped
      join public.culture_cell_lines link on link.culture_id = mapped.culture_id
      where mapped.vessel_id = source_vessel_id_arg
        and mapped.well = any(selected_wells)
        and mapped.cell_line_id is null
      union
      select culture.cell_line_id
      from public.vessel_wells mapped
      join public.cultures culture on culture.id = mapped.culture_id
      where mapped.vessel_id = source_vessel_id_arg
        and mapped.well = any(selected_wells)
        and mapped.cell_line_id is null
        and culture.cell_line_id is not null
    ) source;
  elsif should_snapshot and safe_source_type = 'vessel' then
    if exists (select 1 from public.vessel_wells mapped where mapped.vessel_id = source_vessel_id_arg) then
      select coalesce(array_agg(distinct source.cell_line_id), '{}'::uuid[])
      into lineage_ids
      from (
        select mapped.cell_line_id
        from public.vessel_wells mapped
        where mapped.vessel_id = source_vessel_id_arg
          and mapped.cell_line_id is not null
        union
        select link.cell_line_id
        from public.vessel_wells mapped
        join public.culture_cell_lines link on link.culture_id = mapped.culture_id
        where mapped.vessel_id = source_vessel_id_arg
          and mapped.cell_line_id is null
        union
        select culture.cell_line_id
        from public.vessel_wells mapped
        join public.cultures culture on culture.id = mapped.culture_id
        where mapped.vessel_id = source_vessel_id_arg
          and mapped.cell_line_id is null
          and culture.cell_line_id is not null
      ) source;
    else
      select coalesce(array_agg(distinct source.cell_line_id), '{}'::uuid[])
      into lineage_ids
      from (
        select link.cell_line_id
        from public.vessel_cultures vessel_link
        join public.culture_cell_lines link on link.culture_id = vessel_link.culture_id
        where vessel_link.vessel_id = source_vessel_id_arg
        union
        select culture.cell_line_id
        from public.vessel_cultures vessel_link
        join public.cultures culture on culture.id = vessel_link.culture_id
        where vessel_link.vessel_id = source_vessel_id_arg
          and culture.cell_line_id is not null
        union
        select link.cell_line_id
        from public.culture_vessels vessel
        join public.culture_cell_lines link on link.culture_id = vessel.culture_id
        where vessel.id = source_vessel_id_arg
        union
        select culture.cell_line_id
        from public.culture_vessels vessel
        join public.cultures culture on culture.id = vessel.culture_id
        where vessel.id = source_vessel_id_arg
          and culture.cell_line_id is not null
      ) source;
    end if;
  end if;

  if should_snapshot and cardinality(lineage_ids) = 0 then
    raise exception 'No cell line is mapped to this source. Update the culture or plate map first.';
  end if;

  if run_id_arg is null then
    insert into public.differentiation_runs (
      id, protocol_id, run_name, project, day_zero_date, source_type,
      source_culture_id, source_vessel_id, status, schedule_color, notes, created_by
    ) values (
      saved_run_id, protocol_id_arg, safe_run_name, nullif(btrim(coalesce(project_arg, '')), ''),
      day_zero_date_arg, safe_source_type,
      case when safe_source_type = 'culture' then source_culture_id_arg else null end,
      case when safe_source_type in ('vessel', 'wells') then source_vessel_id_arg else null end,
      coalesce(nullif(btrim(coalesce(status_arg, '')), ''), 'active'),
      coalesce(nullif(btrim(coalesce(schedule_color_arg, '')), ''), '#176f64'),
      nullif(btrim(coalesce(notes_arg, '')), ''), auth.uid()
    );
  else
    update public.differentiation_runs
    set protocol_id = protocol_id_arg,
        run_name = safe_run_name,
        project = nullif(btrim(coalesce(project_arg, '')), ''),
        day_zero_date = day_zero_date_arg,
        source_type = safe_source_type,
        source_culture_id = case when safe_source_type = 'culture' then source_culture_id_arg else null end,
        source_vessel_id = case when safe_source_type in ('vessel', 'wells') then source_vessel_id_arg else null end,
        status = coalesce(nullif(btrim(coalesce(status_arg, '')), ''), 'active'),
        schedule_color = coalesce(nullif(btrim(coalesce(schedule_color_arg, '')), ''), '#176f64'),
        notes = nullif(btrim(coalesce(notes_arg, '')), '')
    where id = saved_run_id;

    if not found then
      raise exception 'Differentiation was not found.';
    end if;
  end if;

  delete from public.differentiation_run_wells
  where differentiation_run_id = saved_run_id;

  if safe_source_type = 'wells' then
    insert into public.differentiation_run_wells (differentiation_run_id, vessel_id, well)
    select saved_run_id, source_vessel_id_arg, well
    from unnest(selected_wells) as requested(well);
  end if;

  if should_snapshot then
    delete from public.differentiation_run_cell_lines
    where differentiation_run_id = saved_run_id;

    insert into public.differentiation_run_cell_lines (differentiation_run_id, cell_line_id)
    select saved_run_id, cell_line_id
    from unnest(lineage_ids) as source(cell_line_id);
  end if;

  return saved_run_id;
end;
$$;

revoke all on function public.save_differentiation_run(
  uuid, uuid, text, text, date, text, uuid, uuid, text, text, text, text[]
) from public;
grant execute on function public.save_differentiation_run(
  uuid, uuid, text, text, date, text, uuid, uuid, text, text, text, text[]
) to authenticated;

commit;
