-- Remove erroneous Trujillo Medium 1/2/3 tasks that were previously associated with Microglia.
-- Microglia medium changes are generated from its own iMBM + M-CSF + IL34 protocol steps.
begin;

delete from public.differentiation_protocol_tasks task
using public.differentiation_protocols protocol
where task.protocol_id = protocol.id
  and lower(btrim(protocol.name)) like 'microglia%'
  and (
    coalesce(task.medium, '') ~* '^medium\\s*[123]\\s*$'
    or coalesce(task.medium_pt, '') ~* '^meio\\s*[123]\\s*$'
    or coalesce(task.title, '') ~* '^(start\\s+)?medium\\s*[123]\\s*$'
    or coalesce(task.title_pt, '') ~* '^(in[ií]cio\\s+(do\\s+)?)?meio\\s*[123]\\s*$'
  );

commit;
