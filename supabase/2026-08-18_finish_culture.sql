-- Atomically closes a discarded culture, records why, and stops directly linked work.
-- Run after 2026-08-18_shared_culture_responsibility.sql.

create or replace function public.finish_culture(
  culture_id_arg uuid,
  ended_on_arg date,
  outcome_arg text,
  notes_arg text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  safe_outcome text := nullif(btrim(coalesce(outcome_arg, '')), '');
begin
  if not public.can_manage_culture_members(culture_id_arg) then
    raise exception 'You do not have permission to finish this culture.';
  end if;

  if safe_outcome is null then
    raise exception 'Choose why the culture is being finished.';
  end if;

  update public.cultures
  set status = 'discarded'
  where id = culture_id_arg
    and status = 'active';

  if not found then
    raise exception 'Culture is not active or was not found.';
  end if;

  insert into public.culture_events (culture_id, event_type, event_date, notes, performed_by)
  values (
    culture_id_arg,
    'Culture discarded',
    coalesce(ended_on_arg, current_date),
    concat('Outcome: ', safe_outcome, case when nullif(btrim(coalesce(notes_arg, '')), '') is not null then E'\n' || btrim(notes_arg) else '' end),
    coalesce((select full_name from public.profiles where id = auth.uid()), auth.uid()::text)
  );

  update public.differentiation_runs
  set status = 'discarded'
  where source_culture_id = culture_id_arg
    and status = 'active';
end;
$$;

revoke all on function public.finish_culture(uuid, date, text, text) from public;
grant execute on function public.finish_culture(uuid, date, text, text) to authenticated;
