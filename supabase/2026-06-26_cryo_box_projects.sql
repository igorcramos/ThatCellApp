-- Run this in the Supabase SQL Editor to add project labels to cryogenic boxes.

alter table public.cryo_boxes
  add column if not exists project text;

create index if not exists idx_cryo_boxes_project
  on public.cryo_boxes(project);
