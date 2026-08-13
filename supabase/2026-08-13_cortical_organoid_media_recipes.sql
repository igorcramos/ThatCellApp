-- Cortical organoid media repertoire adapted for the new laboratory.
-- E8 is replaced by mTeSR1; Normocin is replaced by Penicillin–Streptomycin.
-- Unknown stock concentrations are intentionally left null.

begin;

insert into public.culture_media_recipes
  (name, version, solvent_name, description, notes, is_active)
values
  ('2X Pre-Neural Induction Medium', '1.0', 'mTeSR1', 'Two-fold pre-neural induction formulation.', 'After adding the 2X medium, the final culture concentrations must be 10 µM SB431542 and 1 µM Dorsomorphin.', true),
  ('Pre-Neural Induction Medium', '1.0', 'mTeSR1', 'Pre-neural induction formulation.', null, true),
  ('Medium 1 — Neural Induction', '1.0', 'Neurobasal medium', 'Neural induction medium.', null, true),
  ('Medium 2 + FGF2 — NPC Expansion', '1.0', 'Neurobasal medium', 'Neural progenitor cell expansion medium.', null, true),
  ('Medium 2 + FGF2 + EGF — NPC Expansion', '1.0', 'Neurobasal medium', 'Neural progenitor cell expansion medium with FGF2 and EGF.', null, true),
  ('Medium 3 — Maturation and Gliogenesis', '1.0', 'Neurobasal medium', 'Maturation, gliogenesis, and promotion of neural activity.', null, true),
  ('Medium 2 — Organoid Maintenance', '1.0', 'Neurobasal medium', 'Cortical organoid maintenance medium.', null, true)
on conflict do nothing;

with component_seed (
  recipe_name, component_name, calculation_mode, stock_value, stock_unit,
  target_value, target_unit, sort_order, notes
) as (
  values
    ('2X Pre-Neural Induction Medium', 'Penicillin–Streptomycin', 'dilution', 100::numeric, 'X', 1::numeric, 'X', 1, null),
    ('2X Pre-Neural Induction Medium', 'SB431542', 'dilution', null::numeric, null, 20::numeric, 'µM', 2, 'Stock concentration pending.'),
    ('2X Pre-Neural Induction Medium', 'Dorsomorphin', 'dilution', null::numeric, null, 2::numeric, 'µM', 3, 'Stock concentration pending.'),

    ('Pre-Neural Induction Medium', 'Penicillin–Streptomycin', 'dilution', 100::numeric, 'X', 1::numeric, 'X', 1, null),
    ('Pre-Neural Induction Medium', 'SB431542', 'dilution', null::numeric, null, 10::numeric, 'µM', 2, 'Stock concentration pending.'),
    ('Pre-Neural Induction Medium', 'Dorsomorphin', 'dilution', null::numeric, null, 1::numeric, 'µM', 3, 'Stock concentration pending.'),

    ('Medium 1 — Neural Induction', 'GlutaMAX', 'dilution', null::numeric, null, 1::numeric, 'X', 1, 'Stock concentration pending.'),
    ('Medium 1 — Neural Induction', 'B27', 'percent_vv', null::numeric, null, 1::numeric, '% v/v', 2, null),
    ('Medium 1 — Neural Induction', 'N2', 'percent_vv', null::numeric, null, 1::numeric, '% v/v', 3, null),
    ('Medium 1 — Neural Induction', 'MEM-NEAA', 'dilution', null::numeric, null, 1::numeric, 'X', 4, 'Stock concentration pending.'),
    ('Medium 1 — Neural Induction', 'Penicillin–Streptomycin', 'dilution', 100::numeric, 'X', 1::numeric, 'X', 5, null),
    ('Medium 1 — Neural Induction', 'SB431542', 'dilution', null::numeric, null, 10::numeric, 'µM', 6, 'Stock concentration pending.'),
    ('Medium 1 — Neural Induction', 'Dorsomorphin', 'dilution', null::numeric, null, 1::numeric, 'µM', 7, 'Stock concentration pending.'),

    ('Medium 2 + FGF2 — NPC Expansion', 'B27', 'percent_vv', null::numeric, null, 1::numeric, '% v/v', 1, null),
    ('Medium 2 + FGF2 — NPC Expansion', 'GlutaMAX', 'dilution', null::numeric, null, 1::numeric, 'X', 2, 'Stock concentration pending.'),
    ('Medium 2 + FGF2 — NPC Expansion', 'MEM-NEAA', 'dilution', null::numeric, null, 1::numeric, 'X', 3, 'Stock concentration pending.'),
    ('Medium 2 + FGF2 — NPC Expansion', 'Penicillin–Streptomycin', 'dilution', 100::numeric, 'X', 1::numeric, 'X', 4, null),
    ('Medium 2 + FGF2 — NPC Expansion', 'FGF2', 'dilution', null::numeric, null, 20::numeric, 'ng/mL', 5, 'Stock concentration pending.'),

    ('Medium 2 + FGF2 + EGF — NPC Expansion', 'B27', 'percent_vv', null::numeric, null, 1::numeric, '% v/v', 1, null),
    ('Medium 2 + FGF2 + EGF — NPC Expansion', 'GlutaMAX', 'dilution', null::numeric, null, 1::numeric, 'X', 2, 'Stock concentration pending.'),
    ('Medium 2 + FGF2 + EGF — NPC Expansion', 'MEM-NEAA', 'dilution', null::numeric, null, 1::numeric, 'X', 3, 'Stock concentration pending.'),
    ('Medium 2 + FGF2 + EGF — NPC Expansion', 'Penicillin–Streptomycin', 'dilution', 100::numeric, 'X', 1::numeric, 'X', 4, null),
    ('Medium 2 + FGF2 + EGF — NPC Expansion', 'FGF2', 'dilution', null::numeric, null, 20::numeric, 'ng/mL', 5, 'Stock concentration pending.'),
    ('Medium 2 + FGF2 + EGF — NPC Expansion', 'EGF', 'dilution', null::numeric, null, 20::numeric, 'ng/mL', 6, 'Stock concentration pending.'),

    ('Medium 3 — Maturation and Gliogenesis', 'B27', 'percent_vv', null::numeric, null, 1::numeric, '% v/v', 1, null),
    ('Medium 3 — Maturation and Gliogenesis', 'GlutaMAX', 'dilution', null::numeric, null, 1::numeric, 'X', 2, 'Stock concentration pending.'),
    ('Medium 3 — Maturation and Gliogenesis', 'MEM-NEAA', 'dilution', null::numeric, null, 1::numeric, 'X', 3, 'Stock concentration pending.'),
    ('Medium 3 — Maturation and Gliogenesis', 'Penicillin–Streptomycin', 'dilution', 100::numeric, 'X', 1::numeric, 'X', 4, null),
    ('Medium 3 — Maturation and Gliogenesis', 'BDNF', 'dilution', null::numeric, null, 10::numeric, 'ng/mL', 5, 'Stock concentration pending.'),
    ('Medium 3 — Maturation and Gliogenesis', 'GDNF', 'dilution', null::numeric, null, 10::numeric, 'ng/mL', 6, 'Stock concentration pending.'),
    ('Medium 3 — Maturation and Gliogenesis', 'NT-3', 'dilution', null::numeric, null, 10::numeric, 'ng/mL', 7, 'Stock concentration pending.'),
    ('Medium 3 — Maturation and Gliogenesis', 'Ascorbic acid', 'dilution', null::numeric, null, 200::numeric, 'µM', 8, 'Stock concentration pending.'),
    ('Medium 3 — Maturation and Gliogenesis', 'Dibutyryl-cAMP', 'dilution', null::numeric, null, 1::numeric, 'mM', 9, 'Stock concentration pending.'),

    ('Medium 2 — Organoid Maintenance', 'B27', 'percent_vv', null::numeric, null, 1::numeric, '% v/v', 1, null),
    ('Medium 2 — Organoid Maintenance', 'GlutaMAX', 'dilution', null::numeric, null, 1::numeric, 'X', 2, 'Stock concentration pending.'),
    ('Medium 2 — Organoid Maintenance', 'MEM-NEAA', 'dilution', null::numeric, null, 1::numeric, 'X', 3, 'Stock concentration pending.'),
    ('Medium 2 — Organoid Maintenance', 'Penicillin–Streptomycin', 'dilution', 100::numeric, 'X', 1::numeric, 'X', 4, null)
)
insert into public.culture_media_components (
  recipe_id, name, calculation_mode, stock_value, stock_unit,
  target_value, target_unit, sort_order, notes
)
select
  recipe.id, component.component_name, component.calculation_mode,
  component.stock_value, component.stock_unit, component.target_value,
  component.target_unit, component.sort_order, component.notes
from component_seed component
join public.culture_media_recipes recipe
  on lower(recipe.name) = lower(component.recipe_name)
 and lower(recipe.version) = '1.0'
on conflict (recipe_id, name) do update set
  calculation_mode = excluded.calculation_mode,
  stock_value = excluded.stock_value,
  stock_unit = excluded.stock_unit,
  target_value = excluded.target_value,
  target_unit = excluded.target_unit,
  sort_order = excluded.sort_order,
  notes = excluded.notes;

commit;
