-- Cortical organoid media repertoire adapted for the new laboratory.
-- E8 is replaced by mTeSR1; Normocin is replaced by Penicillin–Streptomycin.
-- Unknown stock concentrations are intentionally left null.

begin;

do $$
declare
  recipe_id uuid;
begin
  insert into public.culture_media_recipes (name, version, solvent_name, description, notes, is_active)
  values ('2X Pre-Neural Induction Medium', '1.0', 'mTeSR1', 'Two-fold pre-neural induction formulation.', 'After adding the 2X medium, the final culture concentrations must be 10 µM SB431542 and 1 µM Dorsomorphin.', true)
  on conflict do nothing;
  select id into recipe_id from public.culture_media_recipes where lower(name) = lower('2X Pre-Neural Induction Medium') and lower(version) = '1.0';
  insert into public.culture_media_components (recipe_id, name, calculation_mode, stock_value, stock_unit, target_value, target_unit, sort_order, notes)
  values
    (recipe_id, 'Penicillin–Streptomycin', 'dilution', 100, 'X', 1, 'X', 1, null),
    (recipe_id, 'SB431542', 'dilution', null, null, 20, 'µM', 2, 'Stock concentration pending.'),
    (recipe_id, 'Dorsomorphin', 'dilution', null, null, 2, 'µM', 3, 'Stock concentration pending.')
  on conflict (recipe_id, name) do update set target_value = excluded.target_value, target_unit = excluded.target_unit, stock_value = excluded.stock_value, stock_unit = excluded.stock_unit, sort_order = excluded.sort_order, notes = excluded.notes;

  insert into public.culture_media_recipes (name, version, solvent_name, description, is_active)
  values ('Pre-Neural Induction Medium', '1.0', 'mTeSR1', 'Pre-neural induction formulation.', true)
  on conflict do nothing;
  select id into recipe_id from public.culture_media_recipes where lower(name) = lower('Pre-Neural Induction Medium') and lower(version) = '1.0';
  insert into public.culture_media_components (recipe_id, name, calculation_mode, stock_value, stock_unit, target_value, target_unit, sort_order, notes)
  values
    (recipe_id, 'Penicillin–Streptomycin', 'dilution', 100, 'X', 1, 'X', 1, null),
    (recipe_id, 'SB431542', 'dilution', null, null, 10, 'µM', 2, 'Stock concentration pending.'),
    (recipe_id, 'Dorsomorphin', 'dilution', null, null, 1, 'µM', 3, 'Stock concentration pending.')
  on conflict (recipe_id, name) do update set target_value = excluded.target_value, target_unit = excluded.target_unit, stock_value = excluded.stock_value, stock_unit = excluded.stock_unit, sort_order = excluded.sort_order, notes = excluded.notes;

  insert into public.culture_media_recipes (name, version, solvent_name, description, is_active)
  values ('Medium 1 — Neural Induction', '1.0', 'Neurobasal medium', 'Neural induction medium.', true)
  on conflict do nothing;
  select id into recipe_id from public.culture_media_recipes where lower(name) = lower('Medium 1 — Neural Induction') and lower(version) = '1.0';
  insert into public.culture_media_components (recipe_id, name, calculation_mode, stock_value, stock_unit, target_value, target_unit, sort_order, notes)
  values
    (recipe_id, 'GlutaMAX', 'dilution', null, null, 1, 'X', 1, 'Stock concentration pending.'),
    (recipe_id, 'B27', 'percent_vv', null, null, 1, '% v/v', 2, null),
    (recipe_id, 'N2', 'percent_vv', null, null, 1, '% v/v', 3, null),
    (recipe_id, 'MEM-NEAA', 'dilution', null, null, 1, 'X', 4, 'Stock concentration pending.'),
    (recipe_id, 'Penicillin–Streptomycin', 'dilution', 100, 'X', 1, 'X', 5, null),
    (recipe_id, 'SB431542', 'dilution', null, null, 10, 'µM', 6, 'Stock concentration pending.'),
    (recipe_id, 'Dorsomorphin', 'dilution', null, null, 1, 'µM', 7, 'Stock concentration pending.')
  on conflict (recipe_id, name) do update set calculation_mode = excluded.calculation_mode, target_value = excluded.target_value, target_unit = excluded.target_unit, stock_value = excluded.stock_value, stock_unit = excluded.stock_unit, sort_order = excluded.sort_order, notes = excluded.notes;

  insert into public.culture_media_recipes (name, version, solvent_name, description, is_active)
  values ('Medium 2 + FGF2 — NPC Expansion', '1.0', 'Neurobasal medium', 'Neural progenitor cell expansion medium.', true)
  on conflict do nothing;
  select id into recipe_id from public.culture_media_recipes where lower(name) = lower('Medium 2 + FGF2 — NPC Expansion') and lower(version) = '1.0';
  insert into public.culture_media_components (recipe_id, name, calculation_mode, stock_value, stock_unit, target_value, target_unit, sort_order, notes)
  values
    (recipe_id, 'B27', 'percent_vv', null, null, 1, '% v/v', 1, null),
    (recipe_id, 'GlutaMAX', 'dilution', null, null, 1, 'X', 2, 'Stock concentration pending.'),
    (recipe_id, 'MEM-NEAA', 'dilution', null, null, 1, 'X', 3, 'Stock concentration pending.'),
    (recipe_id, 'Penicillin–Streptomycin', 'dilution', 100, 'X', 1, 'X', 4, null),
    (recipe_id, 'FGF2', 'dilution', null, null, 20, 'ng/mL', 5, 'Stock concentration pending.')
  on conflict (recipe_id, name) do update set calculation_mode = excluded.calculation_mode, target_value = excluded.target_value, target_unit = excluded.target_unit, stock_value = excluded.stock_value, stock_unit = excluded.stock_unit, sort_order = excluded.sort_order, notes = excluded.notes;

  insert into public.culture_media_recipes (name, version, solvent_name, description, is_active)
  values ('Medium 2 + FGF2 + EGF — NPC Expansion', '1.0', 'Neurobasal medium', 'Neural progenitor cell expansion medium with FGF2 and EGF.', true)
  on conflict do nothing;
  select id into recipe_id from public.culture_media_recipes where lower(name) = lower('Medium 2 + FGF2 + EGF — NPC Expansion') and lower(version) = '1.0';
  insert into public.culture_media_components (recipe_id, name, calculation_mode, stock_value, stock_unit, target_value, target_unit, sort_order, notes)
  values
    (recipe_id, 'B27', 'percent_vv', null, null, 1, '% v/v', 1, null),
    (recipe_id, 'GlutaMAX', 'dilution', null, null, 1, 'X', 2, 'Stock concentration pending.'),
    (recipe_id, 'MEM-NEAA', 'dilution', null, null, 1, 'X', 3, 'Stock concentration pending.'),
    (recipe_id, 'Penicillin–Streptomycin', 'dilution', 100, 'X', 1, 'X', 4, null),
    (recipe_id, 'FGF2', 'dilution', null, null, 20, 'ng/mL', 5, 'Stock concentration pending.'),
    (recipe_id, 'EGF', 'dilution', null, null, 20, 'ng/mL', 6, 'Stock concentration pending.')
  on conflict (recipe_id, name) do update set calculation_mode = excluded.calculation_mode, target_value = excluded.target_value, target_unit = excluded.target_unit, stock_value = excluded.stock_value, stock_unit = excluded.stock_unit, sort_order = excluded.sort_order, notes = excluded.notes;

  insert into public.culture_media_recipes (name, version, solvent_name, description, is_active)
  values ('Medium 3 — Maturation and Gliogenesis', '1.0', 'Neurobasal medium', 'Maturation, gliogenesis, and promotion of neural activity.', true)
  on conflict do nothing;
  select id into recipe_id from public.culture_media_recipes where lower(name) = lower('Medium 3 — Maturation and Gliogenesis') and lower(version) = '1.0';
  insert into public.culture_media_components (recipe_id, name, calculation_mode, stock_value, stock_unit, target_value, target_unit, sort_order, notes)
  values
    (recipe_id, 'B27', 'percent_vv', null, null, 1, '% v/v', 1, null),
    (recipe_id, 'GlutaMAX', 'dilution', null, null, 1, 'X', 2, 'Stock concentration pending.'),
    (recipe_id, 'MEM-NEAA', 'dilution', null, null, 1, 'X', 3, 'Stock concentration pending.'),
    (recipe_id, 'Penicillin–Streptomycin', 'dilution', 100, 'X', 1, 'X', 4, null),
    (recipe_id, 'BDNF', 'dilution', null, null, 10, 'ng/mL', 5, 'Stock concentration pending.'),
    (recipe_id, 'GDNF', 'dilution', null, null, 10, 'ng/mL', 6, 'Stock concentration pending.'),
    (recipe_id, 'NT-3', 'dilution', null, null, 10, 'ng/mL', 7, 'Stock concentration pending.'),
    (recipe_id, 'Ascorbic acid', 'dilution', null, null, 200, 'µM', 8, 'Stock concentration pending.'),
    (recipe_id, 'Dibutyryl-cAMP', 'dilution', null, null, 1, 'mM', 9, 'Stock concentration pending.')
  on conflict (recipe_id, name) do update set calculation_mode = excluded.calculation_mode, target_value = excluded.target_value, target_unit = excluded.target_unit, stock_value = excluded.stock_value, stock_unit = excluded.stock_unit, sort_order = excluded.sort_order, notes = excluded.notes;

  insert into public.culture_media_recipes (name, version, solvent_name, description, is_active)
  values ('Medium 2 — Organoid Maintenance', '1.0', 'Neurobasal medium', 'Cortical organoid maintenance medium.', true)
  on conflict do nothing;
  select id into recipe_id from public.culture_media_recipes where lower(name) = lower('Medium 2 — Organoid Maintenance') and lower(version) = '1.0';
  insert into public.culture_media_components (recipe_id, name, calculation_mode, stock_value, stock_unit, target_value, target_unit, sort_order, notes)
  values
    (recipe_id, 'B27', 'percent_vv', null, null, 1, '% v/v', 1, null),
    (recipe_id, 'GlutaMAX', 'dilution', null, null, 1, 'X', 2, 'Stock concentration pending.'),
    (recipe_id, 'MEM-NEAA', 'dilution', null, null, 1, 'X', 3, 'Stock concentration pending.'),
    (recipe_id, 'Penicillin–Streptomycin', 'dilution', 100, 'X', 1, 'X', 4, null)
  on conflict (recipe_id, name) do update set calculation_mode = excluded.calculation_mode, target_value = excluded.target_value, target_unit = excluded.target_unit, stock_value = excluded.stock_value, stock_unit = excluded.stock_unit, sort_order = excluded.sort_order, notes = excluded.notes;
end;
$$;

commit;
