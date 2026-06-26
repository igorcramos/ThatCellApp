-- Run this in the Supabase SQL Editor to add cell line modification fields.

alter table public.cell_lines
add column if not exists has_crispr boolean not null default false,
add column if not exists crispr_target text,
add column if not exists crispr_sgrna text,
add column if not exists crispr_variant text,
add column if not exists crispr_hcmg text,
add column if not exists has_transgene boolean not null default false,
add column if not exists transgene text,
add column if not exists fluorescence text,
add column if not exists marker_of text,
add column if not exists plasmid text,
add column if not exists transgene_notes text;
