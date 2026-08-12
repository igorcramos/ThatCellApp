-- Links off-schedule task completion to an automatically detected deviation.

alter table public.differentiation_events
  add column if not exists scheduled_run_day integer;

alter table public.differentiation_run_deviations
  add column if not exists differentiation_event_id uuid references public.differentiation_events(id) on delete cascade,
  add column if not exists protocol_task_id uuid references public.differentiation_protocol_tasks(id) on delete set null,
  add column if not exists planned_date date,
  add column if not exists performed_date date,
  add column if not exists detection_source text not null default 'manual'
    check (detection_source in ('manual', 'automatic'));

create unique index if not exists idx_run_deviation_activity
  on public.differentiation_run_deviations(differentiation_event_id)
  where differentiation_event_id is not null;

create index if not exists idx_run_deviation_protocol_task
  on public.differentiation_run_deviations(protocol_task_id);

