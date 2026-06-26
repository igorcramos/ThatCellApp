-- Projects become editable records while existing tables keep their project text labels.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  notes text,
  created_at timestamptz not null default now()
);

insert into public.projects (name, color)
values
  ('TBCK', '#176f64'),
  ('APOE-TAU', '#8c4f9f')
on conflict (name) do nothing;

insert into public.projects (name)
select distinct project
from (
  select project from public.cultures
  union
  select project from public.differentiation_protocols
  union
  select project from public.differentiation_runs
) existing_projects
where project is not null and btrim(project) <> ''
on conflict (name) do nothing;

alter table public.projects enable row level security;

drop policy if exists "Prototype public read projects" on public.projects;
drop policy if exists "Prototype public insert projects" on public.projects;
drop policy if exists "Prototype public update projects" on public.projects;
drop policy if exists "Prototype public delete projects" on public.projects;

create policy "Prototype public read projects"
  on public.projects for select
  using (true);

create policy "Prototype public insert projects"
  on public.projects for insert
  with check (true);

create policy "Prototype public update projects"
  on public.projects for update
  using (true)
  with check (true);

create policy "Prototype public delete projects"
  on public.projects for delete
  using (true);
