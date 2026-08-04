-- Allows one culture batch and one differentiation run to contain multiple cell lines.

create table if not exists public.culture_cell_lines (
  culture_id uuid not null references public.cultures(id) on delete cascade,
  cell_line_id uuid not null references public.cell_lines(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (culture_id, cell_line_id)
);

create table if not exists public.differentiation_run_cell_lines (
  differentiation_run_id uuid not null references public.differentiation_runs(id) on delete cascade,
  cell_line_id uuid not null references public.cell_lines(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (differentiation_run_id, cell_line_id)
);

create index if not exists idx_culture_cell_lines_cell_line
  on public.culture_cell_lines(cell_line_id);

create index if not exists idx_differentiation_run_cell_lines_cell_line
  on public.differentiation_run_cell_lines(cell_line_id);

insert into public.culture_cell_lines (culture_id, cell_line_id)
select id, cell_line_id from public.cultures where cell_line_id is not null
on conflict do nothing;

insert into public.differentiation_run_cell_lines (differentiation_run_id, cell_line_id)
select distinct run.id, culture_lines.cell_line_id
from public.differentiation_runs run
join public.culture_cell_lines culture_lines on culture_lines.culture_id = run.source_culture_id
on conflict do nothing;

alter table public.culture_cell_lines enable row level security;
alter table public.differentiation_run_cell_lines enable row level security;

grant select, insert, update, delete on public.culture_cell_lines to anon, authenticated;
grant select, insert, update, delete on public.differentiation_run_cell_lines to anon, authenticated;

drop policy if exists "Public full access" on public.culture_cell_lines;
drop policy if exists "Public full access" on public.differentiation_run_cell_lines;

create policy "Public full access" on public.culture_cell_lines
  for all using (true) with check (true);

create policy "Public full access" on public.differentiation_run_cell_lines
  for all using (true) with check (true);
