-- User-specified aggregation details. Run after the protocol seed migrations.
-- Notes only: preserve task IDs, titles, scheduling and completion history.
begin;

with details as (
  select task.id,
    case when lower(btrim(protocol.name)) = 'trujillo_200'
      then 'Centrifugation during aggregation: 300 g for 1 min, with brake.'
      else 'Centrifugation during aggregation: 100 g for 3 min.'
    end as en,
    case when lower(btrim(protocol.name)) = 'trujillo_200'
      then 'Centrifugação na agregação: 300 g por 1 min, com freio.'
      else 'Centrifugação na agregação: 100 g por 3 min.'
    end as pt
  from public.differentiation_protocol_tasks task
  join public.differentiation_protocols protocol on protocol.id = task.protocol_id
  where (lower(btrim(protocol.name)) = 'trujillo_200' and task.task_day = 0)
    or (
      concat_ws(' ', task.title, task.title_pt) ~* '(aggregat|agregar|agregação)'
      and concat_ws(' ', protocol.name, protocol.notes, protocol.notes_pt,
                    task.title, task.title_pt, task.notes, task.notes_pt) ilike '%aggrewell%'
    )
)
update public.differentiation_protocol_tasks task
set notes = case when strpos(coalesce(task.notes, ''), details.en) > 0
      then task.notes else concat_ws(E'\n', nullif(task.notes, ''), details.en) end,
    notes_pt = case when strpos(coalesce(task.notes_pt, ''), details.pt) > 0
      then task.notes_pt else concat_ws(E'\n', nullif(task.notes_pt, ''), details.pt) end
from details
where task.id = details.id;

commit;
