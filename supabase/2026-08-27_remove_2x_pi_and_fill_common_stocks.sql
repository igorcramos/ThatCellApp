-- Removes the retired 2X pre-induction recipe and fills editable common stocks.
begin;

delete from public.culture_media_recipes
where lower(name) in (
  lower('2X Pre-Neural Induction Medium'),
  lower('Meio Pré-Neuroindução 2x'),
  lower('Meio Pre-Neuroinducao 2x')
);

update public.culture_media_components component
set calculation_mode = 'dilution',
    stock_value = 100,
    stock_unit = 'X',
    target_value = 1,
    target_unit = 'X',
    notes = case
      when lower(coalesce(component.notes, '')) = lower('Stock concentration pending.') then null
      else component.notes
    end
from public.culture_media_recipes recipe
where component.recipe_id = recipe.id
  and lower(component.name) in (
    lower('B27'), lower('N2'), lower('GlutaMAX'),
    lower('MEM-NEAA'), lower('PenStrep')
  )
  and lower(recipe.name) in (
    lower('Medium 1 — Neural Induction'),
    lower('Medium 2 + FGF2 — NPC Expansion'),
    lower('Medium 2 + FGF2 + EGF — NPC Expansion'),
    lower('Medium 3 — Maturation and Gliogenesis'),
    lower('Medium 2 — Organoid Maintenance')
  );

commit;
