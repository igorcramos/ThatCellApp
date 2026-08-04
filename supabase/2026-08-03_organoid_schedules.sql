-- Adds structured media and collection fields, then installs the Trujillo_Agg
-- protocol that starts on 2026-08-03 at D-1 (D0 is 2026-08-04).

alter table public.differentiation_protocol_tasks
  add column if not exists medium text;

alter table public.differentiation_events
  add column if not exists quantity text,
  add column if not exists experiment text;

create unique index if not exists idx_protocol_tasks_protocol_day_title
  on public.differentiation_protocol_tasks(protocol_id, task_day, title);

do $$
declare
  protocol_uuid uuid;
begin
  select id into protocol_uuid
  from public.differentiation_protocols
  where name = 'Trujillo_Agg'
  order by created_at
  limit 1;

  if protocol_uuid is null then
    insert into public.differentiation_protocols
      (name, target_cell_type, version, expected_duration_days, notes)
    values
      ('Trujillo_Agg', 'Cortical organoids', '2026-08-03', 90,
       'Aggregation protocol. Automatic medium changes are scheduled Monday, Wednesday, and Friday, never more than three days apart.')
    returning id into protocol_uuid;
  end if;

  insert into public.differentiation_protocol_tasks
    (protocol_id, task_day, title, task_type, medium, notes)
  values
    (protocol_uuid, -1, 'Aggregate', 'Other', 'mTeSR + 20 uM ROCK inhibitor', null),
    (protocol_uuid, 0, 'Neural induction D0 (+1 mL)', 'Media change', 'mTeSR + 2 uM dorsomorphin + 20 uM SB', null),
    (protocol_uuid, 1, 'Neural induction D1 (replace/add 1 mL)', 'Media change', 'mTeSR + 1 uM dorsomorphin + 10 uM SB', null),
    (protocol_uuid, 2, 'Neural induction D2 (replace/add 1 mL)', 'Media change', 'mTeSR + 1 uM dorsomorphin + 10 uM SB', null),
    (protocol_uuid, 3, 'Transfer to 10 cm ULA dish / start Medium 1', 'Replating', 'Medium 1', null),
    (protocol_uuid, 10, 'Start Medium 2 + FGF2', 'Media change', 'Medium 2 + FGF2', null),
    (protocol_uuid, 17, 'Add EGF / start Medium 2 + FGF2 + EGF', 'Factor addition', 'Medium 2 + FGF2 + EGF', null),
    (protocol_uuid, 24, 'Start Medium 3', 'Media change', 'Medium 3', null),
    (protocol_uuid, 31, 'Organoids formed / begin maintenance', 'Endpoint', 'Medium 2 (maintenance)', null)
  on conflict (protocol_id, task_day, title) do update
    set task_type = excluded.task_type,
        medium = excluded.medium,
        notes = excluded.notes;

  if not exists (
    select 1 from public.differentiation_runs
    where protocol_id = protocol_uuid and run_name = 'Trujillo Agg — Aug 2026'
  ) then
    insert into public.differentiation_runs
      (protocol_id, run_name, day_zero_date, source_type, status, notes)
    values
      (protocol_uuid, 'Trujillo Agg — Aug 2026', date '2026-08-04', 'culture', 'active',
       'Started at D-1 on 2026-08-03. Assign the source culture when available.');
  end if;
end $$;
