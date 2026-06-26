alter table public.cultures
  add column if not exists project text;

alter table public.differentiation_protocols
  add column if not exists project text;

alter table public.differentiation_runs
  add column if not exists project text;

create index if not exists idx_cultures_project
  on public.cultures(project);

create index if not exists idx_differentiation_protocols_project
  on public.differentiation_protocols(project);

create index if not exists idx_differentiation_runs_project
  on public.differentiation_runs(project);

with inserted_protocol as (
  insert into public.differentiation_protocols (name, project, target_cell_type, version, expected_duration_days, notes)
  select
    'Microglia',
    'Microglia',
    'Microglia',
    'v1.0',
    34,
    'Seeded from Microglia protocol day/step table.'
  where not exists (
    select 1 from public.differentiation_protocols where lower(name) = 'microglia'
  )
  returning id
),
target_protocol as (
  select id from inserted_protocol
  union all
  select id from public.differentiation_protocols where lower(name) = 'microglia'
  limit 1
),
updated_protocol as (
  update public.differentiation_protocols
  set
    project = coalesce(project, 'Microglia'),
    target_cell_type = coalesce(target_cell_type, 'Microglia'),
    expected_duration_days = coalesce(expected_duration_days, 34)
  where id in (select id from target_protocol)
),
task_rows(task_day, title, task_type, notes) as (
  values
    (0, 'EB Aggregation', 'Other', null),
    (1, 'EB plating', 'Replating', 'Matrigel coated plates;'),
    (2, 'StemDiff + Supp A', 'Media change', '2 mL/well (6w pl.); Supp A 1:200'),
    (4, 'StemDiff + Supp A', 'Factor addition', 'Add 1 mL/well StemDiff + Supp A (1:200)'),
    (5, 'StemDiff + Supp B', 'Media change', 'Change media to StemDiff + Supp B (1:200); 2 mL/well'),
    (7, 'StemDiff + Supp B', 'Factor addition', 'Add 1 mL/well StemDiff + Supp B (1:200)'),
    (9, 'StemDiff + Supp B', 'Factor addition', 'Add 1 mL/well StemDiff + Supp B (1:200)'),
    (11, 'StemDiff + Supp B', 'Factor addition', 'Add 1 mL/well StemDiff + Supp B (1:200)'),
    (13, 'Collect HPCs', 'Collection', 'Collect supernatant containing Hematopoietic Progenitor Cells'),
    (13, 'Plate HPCs', 'Replating', 'Plate 200,000 cells/well; uncoated 6w plates; 2 mL iMBM + M-CSF (25 ng/mL - 1:4000) + IL34 (100 ng/mL - 1:1000)'),
    (16, 'iMBM + CSF + IL34', 'Factor addition', 'Add 1 mL/well iMBM + M-CSF (25 ng/mL - 1:4000) + IL34 (100 ng/mL - 1:1000)'),
    (19, 'iMBM + CSF + IL34', 'Factor addition', 'Add 1 mL/well iMBM + M-CSF (25 ng/mL - 1:4000) + IL34 (100 ng/mL - 1:1000)'),
    (22, 'iMBM + CSF + IL34', 'Factor addition', 'Add 1 mL/well iMBM + M-CSF (25 ng/mL - 1:4000) + IL34 (100 ng/mL - 1:1000)'),
    (25, 'iMBM + CSF + IL34', 'Factor addition', 'Add 1 mL/well iMBM + M-CSF (25 ng/mL - 1:4000) + IL34 (100 ng/mL - 1:1000)'),
    (28, 'iMBM + CSF + IL34', 'Factor addition', 'Add 1 mL/well iMBM + M-CSF (25 ng/mL - 1:4000) + IL34 (100 ng/mL - 1:1000)'),
    (31, 'iMBM + CSF + IL34', 'Factor addition', 'Add 1 mL/well iMBM + M-CSF (25 ng/mL - 1:4000) + IL34 (100 ng/mL - 1:1000)'),
    (34, 'iMBM + CSF + IL34', 'Factor addition', 'Add 1 mL/well iMBM + M-CSF (25 ng/mL - 1:4000) + IL34 (100 ng/mL - 1:1000)')
)
insert into public.differentiation_protocol_tasks (protocol_id, task_day, title, task_type, notes)
select target_protocol.id, task_rows.task_day, task_rows.title, task_rows.task_type, task_rows.notes
from target_protocol
cross join task_rows
where not exists (
  select 1
  from public.differentiation_protocol_tasks existing
  where existing.protocol_id = target_protocol.id
    and existing.task_day = task_rows.task_day
    and existing.title = task_rows.title
);
