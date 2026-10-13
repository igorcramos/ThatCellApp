-- Documents the fixed Trujillo_200 medium phases used by the schedule engine.
begin;

update public.differentiation_protocols
set notes = 'Source: Trujillo_200.csv, D0–D90. D0 is aggregation; neural induction D0 is protocol D1. Fixed medium phases: Medium 1 on D4–D10; Medium 2 + FGF2 on D11–D17; Medium 2 + FGF2 + EGF on D18–D24; Medium 3 on D25–D31; and Medium 2 maintenance from D32 onward. Before maintenance, prefer changes Monday, Wednesday and Friday without consecutive-day changes. From D32 onward, change on Monday and Thursday. D2/D3 retain the source −/+130 µL notation.',
    notes_pt = 'Fonte: Trujillo_200.csv, D0–D90. D0 é a agregação; D0 da indução neural corresponde ao D1 do protocolo. Fases fixas: Meio 1 de D4–D10; Meio 2 + FGF2 de D11–D17; Meio 2 + FGF2 + EGF de D18–D24; Meio 3 de D25–D31; e Meio 2 de manutenção a partir de D32. Antes da manutenção, priorizar trocas às segundas, quartas e sextas, sem trocas em dias consecutivos. A partir de D32, trocar às segundas e quintas. D2/D3 preservam a notação −/+130 µL.',
    automatic_media_changes = true
where lower(btrim(name)) = 'trujillo_200';

commit;
