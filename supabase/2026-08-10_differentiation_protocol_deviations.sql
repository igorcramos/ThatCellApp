-- Run-specific, reportable deviations from a reusable differentiation protocol.

create table if not exists public.differentiation_run_deviations (
  id uuid primary key default gen_random_uuid(),
  differentiation_run_id uuid not null references public.differentiation_runs(id) on delete cascade,
  deviation_type text not null check (deviation_type in ('extra_day', 'shortened_phase', 'other')),
  after_protocol_day integer not null,
  day_shift integer not null default 0 check (day_shift between -30 and 30),
  reason text not null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_differentiation_run_deviations_run
  on public.differentiation_run_deviations(differentiation_run_id, after_protocol_day);

alter table public.differentiation_run_deviations enable row level security;

drop policy if exists "Members read run deviations" on public.differentiation_run_deviations;
drop policy if exists "Members create run deviations" on public.differentiation_run_deviations;
drop policy if exists "Members update run deviations" on public.differentiation_run_deviations;
drop policy if exists "Members delete run deviations" on public.differentiation_run_deviations;

create policy "Members read run deviations"
  on public.differentiation_run_deviations for select
  using (public.can_access_run(differentiation_run_id));

create policy "Members create run deviations"
  on public.differentiation_run_deviations for insert
  with check (public.can_access_run(differentiation_run_id));

create policy "Members update run deviations"
  on public.differentiation_run_deviations for update
  using (public.can_access_run(differentiation_run_id))
  with check (public.can_access_run(differentiation_run_id));

create policy "Members delete run deviations"
  on public.differentiation_run_deviations for delete
  using (public.can_access_run(differentiation_run_id));

grant select, insert, update, delete on public.differentiation_run_deviations to anon, authenticated;

