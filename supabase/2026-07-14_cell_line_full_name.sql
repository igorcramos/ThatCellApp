-- Run this in the Supabase SQL Editor if your project was created before
-- the full-name cell line update.

alter table public.cell_lines
add column if not exists full_name text;

update public.cell_lines
set full_name = null
where full_name = '';
