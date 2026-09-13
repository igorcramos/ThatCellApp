-- Read-only diagnostics for a deployed database when protocol saves fail.
-- Run in the Supabase SQL editor and compare with repository migrations.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('differentiation_protocols', 'differentiation_protocol_tasks', 'audit_log')
order by table_name, ordinal_position;

select c.relname as table_name, t.tgname,
  pg_get_triggerdef(t.oid) as trigger_definition,
  pg_get_functiondef(t.tgfoid) as trigger_function
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('differentiation_protocols', 'differentiation_protocol_tasks')
  and not t.tgisinternal;

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('differentiation_protocols', 'differentiation_protocol_tasks');

select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('differentiation_protocols', 'differentiation_protocol_tasks');

select p.proname, p.prosecdef as security_definer,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('can_access_protocol', 'can_manage_protocol', 'is_active_user', 'current_user_is_admin');
