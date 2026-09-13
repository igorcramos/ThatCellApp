# VictorLab_Sloan

The shared human cortical spheroid protocol and its six Culture Media recipes
are installed with `supabase/2026-09-13_victorlab_sloan.sql`. Run it after the
existing protocol task/medium, visibility controls and culture media migrations.
It adds records without updating or deleting existing protocols, recipes, runs
or inventory. Re-running it does not duplicate the seeded records.

The source files are `VictorLab_Sloan.docx`, `VictorLab_Sloan.xlsx` and
`VictorLab_Sloan.csv`, generated in LabVictor on 2026-09-12. The source CSV is
retained alongside this note. Its 47 rows match the workbook's “That Cell App”
sheet exactly. Task titles and medium descriptions are preserved; task notes
identify the matching recipe. D1 is recovery without a medium change. D100 is
a continuation review, not an endpoint or medium change.

D0 is the EB transfer/induction date. Aggregation is D−1. The last scheduled
medium change is D99; subsequent changes are D103, D107, then every four days.
The D25–D42 schedule uses two-day intervals. The source's convention of basal
NM alone from D43 and 12 mL/dish during D6–D24 is retained.

| Recipe (all prefixed VictorLab_Sloan) | Base | Additions |
| --- | --- | --- |
| Aggregation D−1 | mTeSR1 | ROCKi 10 µM; Emricasen 1:2000 |
| Induction D0 | mTeSR1 | DM 5 µM; SB 10 µM; ROCKi 10 µM |
| Induction D2–D5 | mTeSR1 | DM 5 µM; SB 10 µM |
| NM + FGF2 + EGF D6–D24 | Prepared basal NM | FGF2 and EGF, 20 ng/mL each |
| NM + BDNF + NT3 D25–D42 | Prepared basal NM | BDNF and NT3, 20 ng/mL each |
| Basal NM / D43 onward | Neurobasal A | B27 2%, GlutaMAX 1%, PenStrep 1%, all v/v |

The growth-factor recipes use **already prepared basal NM** as their solvent;
do not add B27, GlutaMAX or PenStrep again. Prepare basal NM separately and
store at 4 °C for up to one week. Warm the required aliquot at 37 °C for less
than 20 minutes; supplement immediately before use.

Stocks from the source: DM 5 mM, SB 10 mM, ROCKi 10 mM, and each growth factor
20 µg/mL. Emricasen is modeled as 1 µL laboratory stock per 2 mL final medium;
its molarity is not specified. Basal supplements use the stated volume
percentages without assuming stock fold concentrations.

`node tests/victorlab-sloan.test.js` verifies the schedule, phase transitions
and calculator volumes against the document's 2, 10 and 100 mL examples,
including scaled preparations.

The local adaptation cites Sloan et al. (2018), Nature Protocols 13:2062–2085,
reagent setup and steps 17–23 (22A), DOI 10.1038/s41596-018-0032-7.
