-- Source-preserving bilingual Trujillo_200; safe to rerun.
-- Requires 2026-08-12_visibility_controls and 2026-08-27_trujillo_agg_bilingual_update.
begin;
alter table public.differentiation_protocols
  add column if not exists automatic_media_changes boolean not null default true;
select pg_advisory_xact_lock(hashtext('seed:Trujillo_200:2026-09-13'));
do $seed$
declare
  payload jsonb := $trujillo$
{
  "protocol": {
    "name": "Trujillo_200",
    "version": "2026-09-13",
    "expected_duration_days": 90,
    "notes": "Source: Trujillo_200.csv, D0–D90. D0 is aggregation; neural induction D0 is protocol D1. Only explicit source tasks are scheduled. Dash rows specify no task, not an instruction to skip care. Medium-change frequency, SF/Medium 1–3 compositions and FGF2/EGF doses are not supplied. D2/D3 retain the source −/+130 µL notation.",
    "notes_pt": "Fonte: Trujillo_200.csv, D0–D90. D0 é a agregação; D0 da indução neural corresponde ao D1 do protocolo. Somente as tarefas explícitas da fonte são agendadas. Linhas com traço não especificam tarefa e não orientam omitir cuidados. A fonte não informa frequência de troca, composição de SF/Meios 1–3 ou doses de FGF2/EGF. D2/D3 preservam a notação −/+130 µL."
  },
  "tasks": [
    {
      "task_day": 0,
      "title": "Aggregate",
      "title_pt": "AGREGAR",
      "task_type": "Other",
      "medium": "SF + 20 µM Rocki",
      "medium_pt": "SF + 20 µM Rocki"
    },
    {
      "task_day": 1,
      "title": "Neural induction D0 (+100 µL)",
      "title_pt": "Indução Neural D0 (+100 µL)",
      "task_type": "Media change",
      "medium": "SF + 2 µM Dorso + 20 µM SB",
      "medium_pt": "SF + 2 µM Dorso + 20 µM SB"
    },
    {
      "task_day": 2,
      "title": "Neural induction D1 (−/+130 µL)",
      "title_pt": "Indução Neural D1 (- + 130 µL)",
      "task_type": "Media change",
      "medium": "SF + 1 µM Dorso + 10 µM SB",
      "medium_pt": "SF + 1 µM Dorso + 10 µM SB"
    },
    {
      "task_day": 3,
      "title": "Neural induction D2 (−/+130 µL)",
      "title_pt": "Indução Neural D2 (- + 130 µL)",
      "task_type": "Media change",
      "medium": "SF + 1 µM Dorso + 10 µM SB",
      "medium_pt": "SF + 1 µM Dorso + 10 µM SB"
    },
    {
      "task_day": 4,
      "title": "Transfer ~10 CtO/well / start Medium 1",
      "title_pt": "Transferir ~10 CtO/well / Início Meio 1",
      "task_type": "Replating",
      "medium": "Medium 1",
      "medium_pt": "Meio 1"
    },
    {
      "task_day": 11,
      "title": "Plate 5 CtO/well / start Medium 2 + FGF2",
      "title_pt": "Plaquear 5 CtO/Well / Início Meio 2+FGF2",
      "task_type": "Replating",
      "medium": "Medium 2 + FGF2",
      "medium_pt": "Meio 2 + FGF2"
    },
    {
      "task_day": 18,
      "title": "Add EGF / start Medium 2 + FGF2 + EGF",
      "title_pt": "Adicionar EGF / Início Meio 2+FGF2+EGF",
      "task_type": "Factor addition",
      "medium": "Medium 2 + FGF2+EGF",
      "medium_pt": "Meio 2 + FGF2+EGF"
    },
    {
      "task_day": 25,
      "title": "Start Medium 3",
      "title_pt": "Início Meio 3",
      "task_type": "Media change",
      "medium": "Medium 3",
      "medium_pt": "Meio 3"
    },
    {
      "task_day": 32,
      "title": "Organoids formed / maintenance",
      "title_pt": "Organoides Formados! / Manutenção",
      "task_type": "Endpoint",
      "medium": "Medium 2 (maintenance)",
      "medium_pt": "Meio 2 (Manutenção)"
    }
  ]
}
$trujillo$::jsonb;
  protocol_uuid uuid;
begin
  select id into protocol_uuid from public.differentiation_protocols
  where lower(btrim(name)) = 'trujillo_200' and version = '2026-09-13' and is_shared
  order by created_at limit 1;
  if protocol_uuid is null then
    insert into public.differentiation_protocols
      (name, name_pt, version, target_cell_type, target_cell_type_pt,
       expected_duration_days, notes, notes_pt, is_shared, automatic_media_changes)
    values ('Trujillo_200', 'Trujillo_200', '2026-09-13', 'Cortical organoids',
      'Organoides corticais', 90, payload->'protocol'->>'notes',
      payload->'protocol'->>'notes_pt', true, false)
    returning id into protocol_uuid;
  end if;
  insert into public.differentiation_protocol_tasks
    (protocol_id, task_day, title, title_pt, task_type, medium, medium_pt)
  select protocol_uuid, task_day, title, title_pt, task_type, medium, medium_pt
  from jsonb_to_recordset(payload->'tasks') as t
    (task_day integer, title text, title_pt text, task_type text, medium text, medium_pt text)
  on conflict (protocol_id, task_day, title) do nothing;
end;
$seed$;

-- Preserve scheduling and translations in Clone & adapt.
create or replace function public.clone_shared_protocol(
  source_protocol_id uuid,
  cloned_name text,
  cloned_version text default null,
  cloned_project text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  cloned_protocol_id uuid;
begin
  if not public.can_access_protocol(source_protocol_id) then
    raise exception 'The protocol is unavailable.';
  end if;
  if nullif(btrim(cloned_name), '') is null then
    raise exception 'A name is required for the cloned protocol.';
  end if;
  if not public.is_project_name_member(cloned_project) then
    raise exception 'You cannot add a protocol to this project.';
  end if;

  insert into public.differentiation_protocols (
    name, project, target_cell_type, version, expected_duration_days, notes, is_shared, automatic_media_changes, name_pt, target_cell_type_pt, notes_pt, created_by
  )
  select
    btrim(cloned_name),
    nullif(btrim(cloned_project), ''),
    source.target_cell_type,
    nullif(btrim(cloned_version), ''),
    source.expected_duration_days,
    source.notes,
    false,
    source.automatic_media_changes,
    btrim(cloned_name),
    source.target_cell_type_pt,
    source.notes_pt,
    auth.uid()
  from public.differentiation_protocols source
  where source.id = source_protocol_id
  returning id into cloned_protocol_id;

  insert into public.differentiation_protocol_tasks (
    protocol_id, task_day, title, task_type, estimated_duration_hours, medium, notes, title_pt, medium_pt, notes_pt, created_by
  )
  select
    cloned_protocol_id,
    task.task_day,
    task.title,
    task.task_type,
    task.estimated_duration_hours,
    task.medium,
    task.notes,
    task.title_pt,
    task.medium_pt,
    task.notes_pt,
    auth.uid()
  from public.differentiation_protocol_tasks task
  where task.protocol_id = source_protocol_id;

  return cloned_protocol_id;
end;
$$;

commit;
