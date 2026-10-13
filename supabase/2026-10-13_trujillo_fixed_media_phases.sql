-- Documents the fixed Trujillo_200 medium phases used by the schedule engine.
begin;

update public.differentiation_protocols
set notes = concat_ws(E'\n\n', nullif(notes, ''), case when position('Fixed medium phases:' in coalesce(notes, '')) = 0 then 'Fixed medium phases: Medium 1 on D4–D10; Medium 2 + FGF2 on D11–D17; Medium 2 + FGF2 + EGF on D18–D24; Medium 3 on D25–D31; and Medium 2 maintenance from D32 onward. Before maintenance, prefer changes Monday, Wednesday and Friday without consecutive-day changes. From D32 onward, change on Monday and Thursday.' end),
    notes_pt = concat_ws(E'\n\n', nullif(notes_pt, ''), case when position('Fases fixas:' in coalesce(notes_pt, '')) = 0 then 'Fases fixas: Meio 1 de D4–D10; Meio 2 + FGF2 de D11–D17; Meio 2 + FGF2 + EGF de D18–D24; Meio 3 de D25–D31; e Meio 2 de manutenção a partir de D32. Antes da manutenção, priorizar trocas às segundas, quartas e sextas, sem trocas em dias consecutivos. A partir de D32, trocar às segundas e quintas.' end),
    automatic_media_changes = true
where lower(btrim(name)) = 'trujillo_200';

update public.differentiation_protocols
set notes = concat_ws(E'\n\n', nullif(notes, ''), case when position('Fixed medium phases:' in coalesce(notes, '')) = 0 then 'After its distinct aggregation/induction sequence, the normalized schedule uses the same fixed phases as Trujillo_200: Medium 1 on D4–D10; Medium 2 + FGF2 on D11–D17; Medium 2 + FGF2 + EGF on D18–D24; Medium 3 on D25–D31; and Medium 2 maintenance from D32 onward. Before maintenance, prefer changes Monday, Wednesday and Friday without consecutive-day changes. From D32 onward, change on Monday and Thursday.' end),
    notes_pt = concat_ws(E'\n\n', nullif(notes_pt, ''), case when position('Fases fixas:' in coalesce(notes_pt, '')) = 0 then 'Após sua sequência distinta de agregação/indução, o cronograma normalizado usa as mesmas fases fixas do Trujillo_200: Meio 1 de D4–D10; Meio 2 + FGF2 de D11–D17; Meio 2 + FGF2 + EGF de D18–D24; Meio 3 de D25–D31; e Meio 2 de manutenção a partir de D32. Antes da manutenção, priorizar trocas às segundas, quartas e sextas, sem trocas em dias consecutivos. A partir de D32, trocar às segundas e quintas.' end),
    automatic_media_changes = true
where lower(btrim(name)) like 'trujillo%agg%';

update public.differentiation_protocols
set notes = concat_ws(E'\n\n', nullif(notes, ''), case when position('Each seven-day pre-maintenance phase has three medium replacements' in coalesce(notes, '')) = 0 then 'Each seven-day pre-maintenance phase has three medium replacements, counting the phase-start replacement, using the Monday/Wednesday/Friday or Tuesday/Thursday/Sunday cadence while keeping no more than three days between replacements.' end),
    notes_pt = concat_ws(E'\n\n', nullif(notes_pt, ''), case when position('Cada fase de sete dias antes da manutenção tem três trocas de meio' in coalesce(notes_pt, '')) = 0 then 'Cada fase de sete dias antes da manutenção tem três trocas de meio, contando a troca no início da fase, seguindo a cadência segunda/quarta/sexta ou terça/quinta/domingo e mantendo no máximo três dias entre trocas.' end)
where lower(btrim(name)) = 'trujillo_200'
   or lower(btrim(name)) like 'trujillo%agg%';

commit;
