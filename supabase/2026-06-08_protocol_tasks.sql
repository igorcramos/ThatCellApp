create table if not exists public.differentiation_protocol_tasks (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.differentiation_protocols(id) on delete cascade,
  task_day integer not null,
  title text not null,
  task_type text,
  estimated_duration_hours numeric,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_differentiation_protocol_tasks_protocol_id
  on public.differentiation_protocol_tasks(protocol_id);

create index if not exists idx_differentiation_protocol_tasks_task_day
  on public.differentiation_protocol_tasks(task_day);

alter table public.differentiation_protocol_tasks enable row level security;

drop policy if exists "Prototype public read differentiation protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public insert differentiation protocol tasks" on public.differentiation_protocol_tasks;
drop policy if exists "Prototype public update differentiation protocol tasks" on public.differentiation_protocol_tasks;

create policy "Prototype public read differentiation protocol tasks"
  on public.differentiation_protocol_tasks for select
  using (true);

create policy "Prototype public insert differentiation protocol tasks"
  on public.differentiation_protocol_tasks for insert
  with check (true);

create policy "Prototype public update differentiation protocol tasks"
  on public.differentiation_protocol_tasks for update
  using (true)
  with check (true);
