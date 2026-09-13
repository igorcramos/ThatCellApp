-- Apply before deploying the explicit Thaw workflow.
-- Keep thawed/discarded records while allowing a new vial in their former slot.
begin;

alter table public.cryo_vials drop constraint if exists cryo_vials_box_id_position_key;
create unique index if not exists cryo_vials_active_slot_key
  on public.cryo_vials (box_id, position)
  where status not in ('thawed', 'discarded');

create or replace function public.save_cryo_vials(vials_arg jsonb)
returns setof public.cryo_vials
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if jsonb_typeof(vials_arg) is distinct from 'array'
    or jsonb_array_length(vials_arg) = 0 then
    raise exception 'Select at least one vial position.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(vials_arg) vial
    where coalesce(vial->>'status', '') not in ('available', 'reserved')
  ) then
    raise exception 'Use Thaw to release a stored vial.';
  end if;

  -- One statement: a failed position rolls back the entire save. RLS remains
  -- active, and existing creator/id/timestamps are preserved during an edit.
  return query
  insert into public.cryo_vials (
    box_id, position, cell_line_id, lineage, cell_type, freeze_date,
    passage_number, status, frozen_by, notes
  )
  select vial.box_id, vial.position, vial.cell_line_id, vial.lineage,
    vial.cell_type, vial.freeze_date, vial.passage_number, vial.status,
    vial.frozen_by, vial.notes
  from jsonb_to_recordset(vials_arg) as vial (
    box_id uuid, position text, cell_line_id uuid, lineage text,
    cell_type text, freeze_date date, passage_number integer,
    status text, frozen_by text, notes text
  )
  on conflict (box_id, position) where status not in ('thawed', 'discarded')
  do update set
    cell_line_id = excluded.cell_line_id,
    lineage = excluded.lineage,
    cell_type = excluded.cell_type,
    freeze_date = excluded.freeze_date,
    passage_number = excluded.passage_number,
    status = excluded.status,
    frozen_by = excluded.frozen_by,
    notes = excluded.notes
  returning cryo_vials.*;
end;
$$;
revoke all on function public.save_cryo_vials(jsonb) from public;
grant execute on function public.save_cryo_vials(jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
