-- Removes the login requirement and restores direct public access.
-- Anyone with the app URL can read and change lab data after this migration.

do $$
declare
  table_name text;
  existing_policy record;
  tables text[] := array[
    'profiles', 'project_members', 'culture_members', 'cell_lines', 'projects',
    'cultures', 'culture_events', 'culture_vessels', 'vessel_wells',
    'vessel_cultures', 'cryo_boxes', 'cryo_vials',
    'differentiation_protocols', 'differentiation_protocol_tasks',
    'differentiation_runs', 'differentiation_run_wells', 'differentiation_events'
  ];
begin
  foreach table_name in array tables loop
    for existing_policy in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = table_name
    loop
      execute format('drop policy if exists %I on public.%I', existing_policy.policyname, table_name);
    end loop;

    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for all using (true) with check (true)',
      'Public full access', table_name
    );
  end loop;
end $$;

drop policy if exists "Public culture photo read" on storage.objects;
drop policy if exists "Public culture photo upload" on storage.objects;
drop policy if exists "Public culture photo update" on storage.objects;
drop policy if exists "Public culture photo delete" on storage.objects;

create policy "Public culture photo read"
  on storage.objects for select
  using (bucket_id = 'culture-photos');

create policy "Public culture photo upload"
  on storage.objects for insert
  with check (bucket_id = 'culture-photos');

create policy "Public culture photo update"
  on storage.objects for update
  using (bucket_id = 'culture-photos')
  with check (bucket_id = 'culture-photos');

create policy "Public culture photo delete"
  on storage.objects for delete
  using (bucket_id = 'culture-photos');
