-- Independent completion for activities grouped in a protocol task title.
begin;

alter table public.differentiation_events
  add column if not exists scheduled_activity_index integer not null default 0
  check (scheduled_activity_index >= 0);

drop index if exists public.idx_completed_protocol_task_per_run;
create unique index if not exists idx_completed_protocol_activity_per_run
  on public.differentiation_events
    (differentiation_run_id, protocol_task_id, scheduled_activity_index)
  where protocol_task_id is not null;

-- A previously checked combined task means all its activities were completed.
-- Copy its historical event metadata to each additional activity exactly once.
do $$
declare
  completion record;
  activity_titles text[];
  activity_index integer;
begin
  for completion in
    select e.*, t.title as protocol_title
    from public.differentiation_events e
    join public.differentiation_protocol_tasks t on t.id = e.protocol_task_id
    where e.scheduled_activity_index = 0
      and e.scheduled_title in (t.title, t.title_pt)
  loop
    select array_agg(btrim(part) order by ordinal) into activity_titles
    from regexp_split_to_table(completion.protocol_title,
      '\s+/\s+|[;\n]+|\s+\+\s+(?=(?:neural induction|indução neural|transfer|transferir|add |adicionar |start |iniciar |collect|coletar|replate|replaquear)\y)', 'i')
      with ordinality as parts(part, ordinal)
    where btrim(part) <> '';
    if cardinality(activity_titles) > 1 then
      for activity_index in 1..cardinality(activity_titles) - 1 loop
        insert into public.differentiation_events
        select (jsonb_populate_record(null::public.differentiation_events,
          (to_jsonb(completion) - 'protocol_title') || jsonb_build_object(
            'id', gen_random_uuid(),
            'scheduled_activity_index', activity_index,
            'scheduled_title', activity_titles[activity_index + 1]
          ))).*
        on conflict do nothing;
      end loop;
      update public.differentiation_events
      set scheduled_title = activity_titles[1]
      where id = completion.id;
    end if;
  end loop;
end $$;

commit;
