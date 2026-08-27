-- Bilingual Trujillo_Agg update. Existing run history is retained.
begin;

alter table public.differentiation_protocols
  add column if not exists name_pt text,
  add column if not exists target_cell_type_pt text,
  add column if not exists notes_pt text;
alter table public.differentiation_protocol_tasks
  add column if not exists title_pt text,
  add column if not exists medium_pt text,
  add column if not exists notes_pt text;

with target as (
  select id from public.differentiation_protocols where name = 'Trujillo_Agg' order by created_at limit 1
)
update public.differentiation_protocols protocol
set version = '2026-08-27', expected_duration_days = 90,
    target_cell_type = 'Cortical organoids', target_cell_type_pt = 'Organoides corticais', name_pt = 'Trujillo_Agg',
    notes = 'AggreWell 800 aggregation protocol. Prefer medium changes Monday, Wednesday, and Friday through D31, never on consecutive days. From D32 through D90, maintenance changes occur only Monday and Thursday.',
    notes_pt = 'Protocolo de agregação em AggreWell 800. Favorecer trocas de meio às segundas, quartas e sextas até D31, nunca em dias consecutivos. De D32 a D90, realizar trocas de manutenção somente às segundas e quintas.'
from target where protocol.id = target.id;

with target as (
  select id from public.differentiation_protocols where name = 'Trujillo_Agg' order by created_at limit 1
)
delete from public.differentiation_protocol_tasks task using target
where task.protocol_id = target.id and task.task_day in (1, 2);

with task_seed (task_day, title, title_pt, task_type, medium, medium_pt, notes, notes_pt) as (
  values
    (-1, 'Aggregate in AggreWell 800', 'AGREGAR em AggreWell 800', 'Other', 'mTeSR1 + 20 µM ROCK inhibitor + Emricasan 1:1000', 'mTeSR1 + 20 µM inibidor de ROCK + Emricasan 1:1000', '3 × 10^6 cells/well = 10,000 cells/EB.', '3 × 10^6 células/poço = 10.000 células/EB.'),
    (0, 'Transfer to 10 cm ULA dish + neural induction', 'Transferir para placa ULA de 10 cm + indução neural', 'Replating', 'mTeSR1 + 1 µM Dorsomorphin + 10 µM SB431542 + 10 µM ROCK inhibitor', 'mTeSR1 + 1 µM Dorsomorfina + 10 µM SB431542 + 10 µM inibidor de ROCK', 'Transfer only if EBs look compact; otherwise defer this task by 24 hours.', 'Transferir somente se os EBs estiverem compactos; caso contrário, adiar esta tarefa por 24 horas.'),
    (3, 'Start Medium 1', 'Início do Meio 1', 'Media change', 'Medium 1', 'Meio 1', null, null),
    (10, 'Start Medium 2 + FGF2', 'Início do Meio 2 + FGF2', 'Media change', 'Medium 2 + FGF2', 'Meio 2 + FGF2', null, null),
    (17, 'Add EGF / start Medium 2 + FGF2 + EGF', 'Adicionar EGF / início do Meio 2 + FGF2 + EGF', 'Factor addition', 'Medium 2 + FGF2 + EGF', 'Meio 2 + FGF2 + EGF', null, null),
    (24, 'Start Medium 3', 'Início do Meio 3', 'Media change', 'Medium 3', 'Meio 3', null, null),
    (31, 'Organoids formed / begin maintenance', 'Organoides formados / início da manutenção', 'Endpoint', 'Medium 2 (maintenance)', 'Meio 2 (manutenção)', null, null)
), target as (
  select id from public.differentiation_protocols where name = 'Trujillo_Agg' order by created_at limit 1
)
update public.differentiation_protocol_tasks task
set title = seed.title, title_pt = seed.title_pt, task_type = seed.task_type,
    medium = seed.medium, medium_pt = seed.medium_pt, notes = seed.notes, notes_pt = seed.notes_pt
from task_seed seed, target
where task.protocol_id = target.id and task.task_day = seed.task_day;

with task_seed (task_day, title, title_pt, task_type, medium, medium_pt, notes, notes_pt) as (
  values
    (-1, 'Aggregate in AggreWell 800', 'AGREGAR em AggreWell 800', 'Other', 'mTeSR1 + 20 µM ROCK inhibitor + Emricasan 1:1000', 'mTeSR1 + 20 µM inibidor de ROCK + Emricasan 1:1000', '3 × 10^6 cells/well = 10,000 cells/EB.', '3 × 10^6 células/poço = 10.000 células/EB.'),
    (0, 'Transfer to 10 cm ULA dish + neural induction', 'Transferir para placa ULA de 10 cm + indução neural', 'Replating', 'mTeSR1 + 1 µM Dorsomorphin + 10 µM SB431542 + 10 µM ROCK inhibitor', 'mTeSR1 + 1 µM Dorsomorfina + 10 µM SB431542 + 10 µM inibidor de ROCK', 'Transfer only if EBs look compact; otherwise defer this task by 24 hours.', 'Transferir somente se os EBs estiverem compactos; caso contrário, adiar esta tarefa por 24 horas.'),
    (3, 'Start Medium 1', 'Início do Meio 1', 'Media change', 'Medium 1', 'Meio 1', null, null),
    (10, 'Start Medium 2 + FGF2', 'Início do Meio 2 + FGF2', 'Media change', 'Medium 2 + FGF2', 'Meio 2 + FGF2', null, null),
    (17, 'Add EGF / start Medium 2 + FGF2 + EGF', 'Adicionar EGF / início do Meio 2 + FGF2 + EGF', 'Factor addition', 'Medium 2 + FGF2 + EGF', 'Meio 2 + FGF2 + EGF', null, null),
    (24, 'Start Medium 3', 'Início do Meio 3', 'Media change', 'Medium 3', 'Meio 3', null, null),
    (31, 'Organoids formed / begin maintenance', 'Organoides formados / início da manutenção', 'Endpoint', 'Medium 2 (maintenance)', 'Meio 2 (manutenção)', null, null)
), target as (
  select id from public.differentiation_protocols where name = 'Trujillo_Agg' order by created_at limit 1
)
insert into public.differentiation_protocol_tasks
  (protocol_id, task_day, title, title_pt, task_type, medium, medium_pt, notes, notes_pt)
select target.id, seed.task_day, seed.title, seed.title_pt, seed.task_type, seed.medium, seed.medium_pt, seed.notes, seed.notes_pt
from task_seed seed cross join target
where not exists (
  select 1 from public.differentiation_protocol_tasks existing
  where existing.protocol_id = target.id and existing.task_day = seed.task_day
);

commit;
