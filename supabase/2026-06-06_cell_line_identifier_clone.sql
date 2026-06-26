-- Run this in the Supabase SQL Editor if your project was created before
-- the identifier/clone cell line update.

alter table public.cell_lines
add column if not exists identifier text;

alter table public.cell_lines
add column if not exists clone text;

update public.cell_lines
set identifier = coalesce(identifier, name)
where identifier is null;

alter table public.cell_lines
alter column identifier set not null;

alter table public.cell_lines
drop column if exists tissue_origin;
