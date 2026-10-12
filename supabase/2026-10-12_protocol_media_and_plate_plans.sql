-- Protocol-scoped culture media and per-lineage differentiation plate plans.
begin;

-- Normalize each protocol in one server-side block. Tasks pass through a high
-- temporary day range so equal titles on consecutive days cannot collide with
-- the unique (protocol, day, title) index during the shift. Existing calendar
-- dates remain unchanged because run anchors move by the same offset.
do $normalize_protocol_days$
declare
  protocol_record record;
begin
  for protocol_record in
    select protocol_id, -min(task_day) as day_offset
    from public.differentiation_protocol_tasks
    group by protocol_id
    having min(task_day) < 0
  loop
    update public.differentiation_runs
    set day_zero_date = day_zero_date - protocol_record.day_offset
    where protocol_id = protocol_record.protocol_id;

    update public.differentiation_protocol_tasks
    set task_day = task_day + 100000
    where protocol_id = protocol_record.protocol_id;

    update public.differentiation_protocol_tasks
    set task_day = task_day - 100000 + protocol_record.day_offset
    where protocol_id = protocol_record.protocol_id;
  end loop;
end;
$normalize_protocol_days$;

alter table public.culture_media_recipes
  add column if not exists protocol_id uuid references public.differentiation_protocols(id) on delete set null;

create index if not exists idx_culture_media_recipes_protocol
  on public.culture_media_recipes(protocol_id, name);

alter table public.differentiation_runs
  add column if not exists plate_plan jsonb not null default '[]'::jsonb;

alter table public.differentiation_runs
  add column if not exists schedule_preferences jsonb not null default '{"media_cadence":"preferred"}'::jsonb;

alter table public.differentiation_runs
  drop constraint if exists differentiation_runs_plate_plan_is_array;
alter table public.differentiation_runs
  add constraint differentiation_runs_plate_plan_is_array
  check (jsonb_typeof(plate_plan) = 'array');

comment on column public.culture_media_recipes.protocol_id is
  'Protocol that owns this recipe; null is reserved for general-purpose media.';
comment on column public.differentiation_runs.plate_plan is
  'Per-cell-line destination plate quantity/type selected when the batch is started.';
comment on column public.differentiation_runs.schedule_preferences is
  'Run-specific scheduling choices, including preferred or alternative automatic medium-change cadence.';

commit;
