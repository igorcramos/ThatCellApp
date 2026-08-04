-- Connects scheduled differentiation tasks to automatically recorded activity.

alter table public.differentiation_runs
  add column if not exists schedule_color text default '#176f64';

alter table public.differentiation_events
  add column if not exists protocol_task_id uuid references public.differentiation_protocol_tasks(id) on delete set null,
  add column if not exists scheduled_title text,
  add column if not exists medium text;

create unique index if not exists idx_completed_protocol_task_per_run
  on public.differentiation_events(differentiation_run_id, protocol_task_id)
  where protocol_task_id is not null;

update public.differentiation_runs
set schedule_color = coalesce(schedule_color, '#176f64')
where schedule_color is null;
