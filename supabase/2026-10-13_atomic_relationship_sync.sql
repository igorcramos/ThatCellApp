-- Atomically replace relationship sets that were previously synchronized with
-- separate delete and insert requests from the browser.
-- Run after 2026-08-18_shared_culture_responsibility.sql.

begin;

create or replace function public.set_culture_cell_lines(
  culture_id_arg uuid,
  cell_line_ids_arg uuid[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_ids uuid[];
begin
  if not public.can_manage_culture_members(culture_id_arg) then
    raise exception 'You do not have permission to change cell lines for this culture.';
  end if;

  select coalesce(array_agg(valid.requested_id order by valid.first_position), '{}'::uuid[])
    into requested_ids
  from (
    select requested.requested_id, min(requested.position) as first_position
    from unnest(coalesce(cell_line_ids_arg, '{}'::uuid[])) with ordinality
      as requested(requested_id, position)
    join public.cell_lines line on line.id = requested.requested_id
    group by requested.requested_id
  ) valid;

  if cardinality(requested_ids) = 0 then
    raise exception 'Select at least one cell line for this culture.';
  end if;

  if cardinality(requested_ids) <> cardinality(array(
    select distinct requested_id
    from unnest(coalesce(cell_line_ids_arg, '{}'::uuid[])) as requested(requested_id)
  )) then
    raise exception 'One or more selected cell lines no longer exist.';
  end if;

  delete from public.culture_cell_lines link
  where link.culture_id = culture_id_arg
    and not (link.cell_line_id = any(requested_ids));

  insert into public.culture_cell_lines (culture_id, cell_line_id)
  select culture_id_arg, requested_id
  from unnest(requested_ids) as requested(requested_id)
  on conflict (culture_id, cell_line_id) do nothing;

  update public.cultures
  set cell_line_id = requested_ids[1]
  where id = culture_id_arg;
end;
$$;

revoke all on function public.set_culture_cell_lines(uuid, uuid[]) from public;
grant execute on function public.set_culture_cell_lines(uuid, uuid[]) to authenticated;

comment on function public.set_culture_cell_lines(uuid, uuid[]) is
  'Atomically replaces a culture cell-line set while retaining a valid primary lineage.';

commit;
