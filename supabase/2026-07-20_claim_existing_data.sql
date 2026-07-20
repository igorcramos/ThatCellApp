-- Claim legacy data after enabling auth.
-- Run this AFTER:
-- 1. You create/sign up your app account.
-- 2. You run supabase/2026-06-29_auth_collaboration.sql.
--
-- Replace the email below with your app login email, then run this whole file.

create temporary table claim_existing_data_user (
  id uuid primary key,
  email text not null
) on commit drop;

insert into claim_existing_data_user (id, email)
select id, email
from auth.users
where email = 'your-email@example.com'
limit 1;

do '
begin
  if not exists (select 1 from claim_existing_data_user) then
    raise exception ''No auth user found. Replace your-email@example.com with the email in Authentication > Users.'';
  end if;
end
';

insert into public.profiles (id, email, full_name, role)
select id, email, split_part(email, '@', 1), 'admin'
from claim_existing_data_user
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    role = 'admin';

update public.cell_lines set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.projects set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.cultures set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.culture_events set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.culture_vessels set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.vessel_wells set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.vessel_cultures set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.cryo_boxes set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.cryo_vials set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.differentiation_protocols set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.differentiation_protocol_tasks set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.differentiation_runs set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.differentiation_run_wells set created_by = (select id from claim_existing_data_user) where created_by is null;
update public.differentiation_events set created_by = (select id from claim_existing_data_user) where created_by is null;

insert into public.projects (name, created_by)
select project_name, (select id from claim_existing_data_user)
from (
  select distinct btrim(project) as project_name from public.cultures where btrim(coalesce(project, '')) <> ''
  union
  select distinct btrim(project) as project_name from public.cryo_boxes where btrim(coalesce(project, '')) <> ''
  union
  select distinct btrim(project) as project_name from public.differentiation_protocols where btrim(coalesce(project, '')) <> ''
  union
  select distinct btrim(project) as project_name from public.differentiation_runs where btrim(coalesce(project, '')) <> ''
) project_names
on conflict (name) do update
set created_by = coalesce(public.projects.created_by, (select id from claim_existing_data_user));

insert into public.project_members (project_id, user_id)
select projects.id, claim_existing_data_user.id
from public.projects
cross join claim_existing_data_user
on conflict do nothing;

insert into public.culture_members (culture_id, user_id)
select cultures.id, claim_existing_data_user.id
from public.cultures
cross join claim_existing_data_user
on conflict do nothing;
