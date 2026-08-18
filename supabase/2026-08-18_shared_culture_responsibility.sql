-- Lets culture owners and assigned collaborators maintain a shared responsibility list.
-- The creator is always retained so a culture can never become orphaned.
-- Run this after 2026-08-06_secure_passwordless_auth.sql.

create or replace function public.can_manage_culture_members(culture_id_arg uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_active_user() and (
    public.current_user_is_admin()
    or exists (
      select 1
      from public.cultures culture
      where culture.id = culture_id_arg
        and (
          culture.created_by = auth.uid()
          or exists (
            select 1
            from public.culture_members member
            where member.culture_id = culture.id
              and member.user_id = auth.uid()
          )
        )
    )
  );
$$;

create or replace function public.set_culture_members(
  culture_id_arg uuid,
  user_ids_arg uuid[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_user_ids uuid[];
  culture_creator_id uuid;
begin
  if not public.can_manage_culture_members(culture_id_arg) then
    raise exception 'You do not have permission to change responsible people for this culture.';
  end if;

  select created_by
    into culture_creator_id
  from public.cultures
  where id = culture_id_arg;

  if not found then
    raise exception 'Culture not found.';
  end if;

  select coalesce(array_agg(distinct requested_id), '{}'::uuid[])
    into requested_user_ids
  from unnest(coalesce(user_ids_arg, '{}'::uuid[])) as requested(requested_id)
  join public.profiles profile on profile.id = requested_id
  where profile.is_active;

  if culture_creator_id is not null then
    requested_user_ids := array_append(requested_user_ids, culture_creator_id);
  end if;

  delete from public.culture_members member
  where member.culture_id = culture_id_arg
    and not (member.user_id = any(requested_user_ids));

  insert into public.culture_members (culture_id, user_id)
  select culture_id_arg, requested_id
  from unnest(requested_user_ids) as requested(requested_id)
  on conflict (culture_id, user_id) do nothing;
end;
$$;

revoke all on function public.can_manage_culture_members(uuid) from public;
revoke all on function public.set_culture_members(uuid, uuid[]) from public;
grant execute on function public.can_manage_culture_members(uuid) to authenticated;
grant execute on function public.set_culture_members(uuid, uuid[]) to authenticated;
