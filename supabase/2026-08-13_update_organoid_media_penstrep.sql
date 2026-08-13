-- Update the installed cortical-organoid repertoire.
-- mTeSR1 is already supplemented, so PenStrep is not added to those recipes.

begin;

delete from public.culture_media_components component
using public.culture_media_recipes recipe
where component.recipe_id = recipe.id
  and lower(recipe.name) in (
    lower('2X Pre-Neural Induction Medium'),
    lower('Pre-Neural Induction Medium')
  )
  and lower(component.name) in (
    lower('Penicillin–Streptomycin'),
    lower('PenStrep')
  );

update public.culture_media_components component
set name = 'PenStrep'
from public.culture_media_recipes recipe
where component.recipe_id = recipe.id
  and lower(component.name) = lower('Penicillin–Streptomycin')
  and not exists (
    select 1
    from public.culture_media_components existing
    where existing.recipe_id = component.recipe_id
      and lower(existing.name) = lower('PenStrep')
  )
  and lower(recipe.name) in (
    lower('Medium 1 — Neural Induction'),
    lower('Medium 2 + FGF2 — NPC Expansion'),
    lower('Medium 2 + FGF2 + EGF — NPC Expansion'),
    lower('Medium 3 — Maturation and Gliogenesis'),
    lower('Medium 2 — Organoid Maintenance')
  );

delete from public.culture_media_components component
using public.culture_media_recipes recipe
where component.recipe_id = recipe.id
  and lower(component.name) = lower('Penicillin–Streptomycin')
  and lower(recipe.name) in (
    lower('Medium 1 — Neural Induction'),
    lower('Medium 2 + FGF2 — NPC Expansion'),
    lower('Medium 2 + FGF2 + EGF — NPC Expansion'),
    lower('Medium 3 — Maturation and Gliogenesis'),
    lower('Medium 2 — Organoid Maintenance')
  );

commit;
