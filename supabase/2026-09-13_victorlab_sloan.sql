-- VictorLab_Sloan: source-preserving D−1 through D100 schedule and six media recipes.
-- Requires the existing protocol tasks/medium, visibility controls, and culture media migrations.
-- Re-runnable: existing records and run history are never updated or deleted.
begin;
select pg_advisory_xact_lock(hashtext('seed:VictorLab_Sloan:2026-09-12'));

do $seed$
declare
  payload jsonb := $victorlab$
{
  "protocol": {
    "name": "VictorLab_Sloan",
    "version": "2026-09-12",
    "target_cell_type": "Human cortical spheroids (hCS)",
    "expected_duration_days": 100,
    "notes": "Human cortical spheroids (hCS). AggreWell 800 aggregation and mTeSR1 induction are Victor Lab adaptations. D0 is the EB transfer/induction date; aggregation is D−1. Incubate at 37 °C and 5% CO2. Let spheroids settle by gravity during medium changes; do not centrifuge. Prevent fusion and separate adhering spheroids gently. Once spheroids exceed 2–3 mm, keep no more than 30 per 10-cm dish. D6–D24 uses 12 mL/dish carried forward from source step 17. D25–D42 uses 2-day intervals, within the source 2–3-day range. Basal NM alone starts on D43 following step 23. The agenda ends on D100, with the last medium change on D99; continue on D103, D107, then every 4 days as required. Prepare basal NM separately without growth factors: 96 mL Neurobasal A + 2 mL B27 + 1 mL GlutaMAX + 1 mL PenStrep per 100 mL. Store at 4 °C for up to 1 week. Warm the required aliquot at 37 °C for less than 20 min and add phase-specific factors immediately before use.\nSource: VictorLab_Sloan.docx, VictorLab_Sloan.xlsx and VictorLab_Sloan.csv (Victor Lab, 2026-09-12). Sloan et al. (2018), Nature Protocols 13:2062–2085, reagent setup and steps 17–23 (22A). https://doi.org/10.1038/s41596-018-0032-7"
  },
  "tasks": [
    {
      "task_day": -1,
      "title": "Aggregate EBs in AggreWell 800; 3.9 million cells/well; 2 mL/well; incubate 24 h",
      "task_type": "Other",
      "medium": "mTeSR1 + ROCKi 10 µM (1:1000) + Emricasen (1:2000)",
      "notes": "Culture Media recipe: VictorLab_Sloan — Aggregation D−1."
    },
    {
      "task_day": 0,
      "title": "Induction: transfer EBs to 10-cm low-attachment dishes; 12 mL/dish; remove Emricasen; retain ROCKi until D2",
      "task_type": "Replating",
      "medium": "mTeSR1 + DM 5 µM + SB 10 µM + ROCKi 10 µM (1:1000)",
      "notes": "Culture Media recipe: VictorLab_Sloan — Induction D0."
    },
    {
      "task_day": 1,
      "title": "Recovery: leave undisturbed; no change",
      "task_type": "Other",
      "medium": "mTeSR1 + DM 5 µM + SB 10 µM + ROCKi 10 µM (D0 medium)",
      "notes": "Culture Media recipe: VictorLab_Sloan — Induction D0."
    },
    {
      "task_day": 2,
      "title": "Medium change: 12 mL/dish; remove ROCKi",
      "task_type": "Media change",
      "medium": "mTeSR1 + DM 5 µM + SB 10 µM",
      "notes": "Culture Media recipe: VictorLab_Sloan — Induction D2–D5."
    },
    {
      "task_day": 3,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "mTeSR1 + DM 5 µM + SB 10 µM",
      "notes": "Culture Media recipe: VictorLab_Sloan — Induction D2–D5."
    },
    {
      "task_day": 4,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "mTeSR1 + DM 5 µM + SB 10 µM",
      "notes": "Culture Media recipe: VictorLab_Sloan — Induction D2–D5."
    },
    {
      "task_day": 5,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "mTeSR1 + DM 5 µM + SB 10 µM",
      "notes": "Culture Media recipe: VictorLab_Sloan — Induction D2–D5."
    },
    {
      "task_day": 6,
      "title": "Medium change: 12 mL/dish; switch to basal NM + FGF2/EGF; remove DM/SB",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 7,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 8,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 9,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 10,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 11,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 12,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 13,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 14,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 15,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 16,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 18,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 20,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 22,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 24,
      "title": "Medium change: 12 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + FGF2 20 ng/mL + EGF 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + FGF2 + EGF D6–D24."
    },
    {
      "task_day": 25,
      "title": "Medium change: 14–15 mL/dish; replace FGF2/EGF with BDNF/NT3",
      "task_type": "Media change",
      "medium": "Basal NM + BDNF 20 ng/mL + NT3 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + BDNF + NT3 D25–D42."
    },
    {
      "task_day": 27,
      "title": "Medium change: 14–15 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + BDNF 20 ng/mL + NT3 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + BDNF + NT3 D25–D42."
    },
    {
      "task_day": 29,
      "title": "Medium change: 14–15 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + BDNF 20 ng/mL + NT3 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + BDNF + NT3 D25–D42."
    },
    {
      "task_day": 31,
      "title": "Medium change: 14–15 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + BDNF 20 ng/mL + NT3 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + BDNF + NT3 D25–D42."
    },
    {
      "task_day": 33,
      "title": "Medium change: 14–15 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + BDNF 20 ng/mL + NT3 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + BDNF + NT3 D25–D42."
    },
    {
      "task_day": 35,
      "title": "Medium change: 14–15 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + BDNF 20 ng/mL + NT3 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + BDNF + NT3 D25–D42."
    },
    {
      "task_day": 37,
      "title": "Medium change: 14–15 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + BDNF 20 ng/mL + NT3 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + BDNF + NT3 D25–D42."
    },
    {
      "task_day": 39,
      "title": "Medium change: 14–15 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + BDNF 20 ng/mL + NT3 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + BDNF + NT3 D25–D42."
    },
    {
      "task_day": 41,
      "title": "Medium change: 14–15 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM + BDNF 20 ng/mL + NT3 20 ng/mL",
      "notes": "Culture Media recipe: VictorLab_Sloan — NM + BDNF + NT3 D25–D42."
    },
    {
      "task_day": 43,
      "title": "Medium change: 17–18 mL/dish; remove BDNF/NT3",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 47,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 51,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 55,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 59,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 63,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 67,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 71,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 75,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 79,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 83,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 87,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 91,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 95,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 99,
      "title": "Medium change: 17–18 mL/dish",
      "task_type": "Media change",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    },
    {
      "task_day": 100,
      "title": "Review culture continuation; next changes D103, D107, then every 4 days",
      "task_type": "Other",
      "medium": "Basal NM; no added growth factors",
      "notes": "Culture Media recipe: VictorLab_Sloan — Basal NM / D43 onward."
    }
  ],
  "recipes": [
    {
      "name": "VictorLab_Sloan — Aggregation D−1",
      "version": "1.0",
      "solvent_name": "mTeSR1",
      "description": "D−1: 2 mL per AggreWell 800 well; 3.9 million cells/well; incubate 24 h. ROCKi 10 µM + Emricasen 1:2000.",
      "notes": "For 2 mL final: 1,997 µL mTeSR1 + 2 µL ROCKi + 1 µL Emricasen. Remove Emricasen on D0.\nSource: VictorLab_Sloan.docx, VictorLab_Sloan.xlsx and VictorLab_Sloan.csv (Victor Lab, 2026-09-12). Sloan et al. (2018), Nature Protocols 13:2062–2085, reagent setup and steps 17–23 (22A). https://doi.org/10.1038/s41596-018-0032-7",
      "components": [
        {
          "name": "ROCKi",
          "calculation_mode": "dilution",
          "stock_value": 10,
          "stock_unit": "mM",
          "target_value": 10,
          "target_unit": "µM",
          "sort_order": 1
        },
        {
          "name": "Emricasen",
          "calculation_mode": "volume_per_volume",
          "rate_value": 1,
          "rate_unit": "µL",
          "reference_value": 2,
          "reference_unit": "mL",
          "notes": "Laboratory stock diluted 1:2000. Aggregation only; remove on D0. Stock molarity is not specified in the source.",
          "sort_order": 2
        }
      ]
    },
    {
      "name": "VictorLab_Sloan — Induction D0",
      "version": "1.0",
      "solvent_name": "mTeSR1",
      "description": "D0: 12 mL per 10-cm ultra-low-attachment dish. DM 5 µM + SB 10 µM + ROCKi 10 µM. Leave undisturbed on D1; remove ROCKi on D2.",
      "notes": "For 10 mL final: 9.97 mL mTeSR1 + 10 µL each of DM, SB and ROCKi. ROCKi remains for 48 h after induction starts.\nSource: VictorLab_Sloan.docx, VictorLab_Sloan.xlsx and VictorLab_Sloan.csv (Victor Lab, 2026-09-12). Sloan et al. (2018), Nature Protocols 13:2062–2085, reagent setup and steps 17–23 (22A). https://doi.org/10.1038/s41596-018-0032-7",
      "components": [
        {
          "name": "DM (dorsomorphin)",
          "calculation_mode": "dilution",
          "stock_value": 5,
          "stock_unit": "mM",
          "target_value": 5,
          "target_unit": "µM",
          "sort_order": 1
        },
        {
          "name": "SB (SB-431542)",
          "calculation_mode": "dilution",
          "stock_value": 10,
          "stock_unit": "mM",
          "target_value": 10,
          "target_unit": "µM",
          "sort_order": 2
        },
        {
          "name": "ROCKi",
          "calculation_mode": "dilution",
          "stock_value": 10,
          "stock_unit": "mM",
          "target_value": 10,
          "target_unit": "µM",
          "sort_order": 3
        }
      ]
    },
    {
      "name": "VictorLab_Sloan — Induction D2–D5",
      "version": "1.0",
      "solvent_name": "mTeSR1",
      "description": "D2–D5: daily medium changes, 12 mL/dish. DM 5 µM + SB 10 µM; no ROCKi or Emricasen.",
      "notes": "For 10 mL final: 9.98 mL mTeSR1 + 10 µL DM + 10 µL SB.\nSource: VictorLab_Sloan.docx, VictorLab_Sloan.xlsx and VictorLab_Sloan.csv (Victor Lab, 2026-09-12). Sloan et al. (2018), Nature Protocols 13:2062–2085, reagent setup and steps 17–23 (22A). https://doi.org/10.1038/s41596-018-0032-7",
      "components": [
        {
          "name": "DM (dorsomorphin)",
          "calculation_mode": "dilution",
          "stock_value": 5,
          "stock_unit": "mM",
          "target_value": 5,
          "target_unit": "µM",
          "sort_order": 1
        },
        {
          "name": "SB (SB-431542)",
          "calculation_mode": "dilution",
          "stock_value": 10,
          "stock_unit": "mM",
          "target_value": 10,
          "target_unit": "µM",
          "sort_order": 2
        }
      ]
    },
    {
      "name": "VictorLab_Sloan — NM + FGF2 + EGF D6–D24",
      "version": "1.0",
      "solvent_name": "Prepared VictorLab_Sloan basal NM",
      "description": "D6–D24: FGF2 and EGF, 20 ng/mL each. Use prepared basal NM; add factors immediately before use. Daily changes D6–D15, then D16, D18, D20, D22 and D24; 12 mL/dish.",
      "notes": "For 10 mL final: 9.98 mL prepared basal NM + 10 µL FGF2 + 10 µL EGF. Both stocks: 20 µg/mL. Do not add the basal supplements again. Prepare basal NM separately without growth factors: 96 mL Neurobasal A + 2 mL B27 + 1 mL GlutaMAX + 1 mL PenStrep per 100 mL. Store at 4 °C for up to 1 week. Warm the required aliquot at 37 °C for less than 20 min and add phase-specific factors immediately before use.\nSource: VictorLab_Sloan.docx, VictorLab_Sloan.xlsx and VictorLab_Sloan.csv (Victor Lab, 2026-09-12). Sloan et al. (2018), Nature Protocols 13:2062–2085, reagent setup and steps 17–23 (22A). https://doi.org/10.1038/s41596-018-0032-7",
      "components": [
        {
          "name": "FGF2",
          "calculation_mode": "dilution",
          "stock_value": 20,
          "stock_unit": "µg/mL",
          "target_value": 20,
          "target_unit": "ng/mL",
          "sort_order": 1
        },
        {
          "name": "EGF",
          "calculation_mode": "dilution",
          "stock_value": 20,
          "stock_unit": "µg/mL",
          "target_value": 20,
          "target_unit": "ng/mL",
          "sort_order": 2
        }
      ]
    },
    {
      "name": "VictorLab_Sloan — NM + BDNF + NT3 D25–D42",
      "version": "1.0",
      "solvent_name": "Prepared VictorLab_Sloan basal NM",
      "description": "D25–D42: BDNF and NT3, 20 ng/mL each. Use prepared basal NM; add factors immediately before use. Change every 2 days in the app; 14–15 mL/dish.",
      "notes": "For 10 mL final: 9.98 mL prepared basal NM + 10 µL BDNF + 10 µL NT3. Both stocks: 20 µg/mL. Remove FGF2/EGF on D25. Do not add the basal supplements again. Prepare basal NM separately without growth factors: 96 mL Neurobasal A + 2 mL B27 + 1 mL GlutaMAX + 1 mL PenStrep per 100 mL. Store at 4 °C for up to 1 week. Warm the required aliquot at 37 °C for less than 20 min and add phase-specific factors immediately before use.\nSource: VictorLab_Sloan.docx, VictorLab_Sloan.xlsx and VictorLab_Sloan.csv (Victor Lab, 2026-09-12). Sloan et al. (2018), Nature Protocols 13:2062–2085, reagent setup and steps 17–23 (22A). https://doi.org/10.1038/s41596-018-0032-7",
      "components": [
        {
          "name": "BDNF",
          "calculation_mode": "dilution",
          "stock_value": 20,
          "stock_unit": "µg/mL",
          "target_value": 20,
          "target_unit": "ng/mL",
          "sort_order": 1
        },
        {
          "name": "NT3",
          "calculation_mode": "dilution",
          "stock_value": 20,
          "stock_unit": "µg/mL",
          "target_value": 20,
          "target_unit": "ng/mL",
          "sort_order": 2
        }
      ]
    },
    {
      "name": "VictorLab_Sloan — Basal NM / D43 onward",
      "version": "1.0",
      "solvent_name": "Neurobasal A",
      "description": "Basal NM: B27 2% v/v, GlutaMAX 1% v/v and PenStrep 1% v/v. Prepare separately for supplemented media. From D43 use alone, without growth factors; change every 4 days, 17–18 mL/dish. Store at 4 °C for up to 1 week.",
      "notes": "Prepare basal NM separately without growth factors: 96 mL Neurobasal A + 2 mL B27 + 1 mL GlutaMAX + 1 mL PenStrep per 100 mL. Store at 4 °C for up to 1 week. Warm the required aliquot at 37 °C for less than 20 min and add phase-specific factors immediately before use. Remove BDNF/NT3 on D43.\nSource: VictorLab_Sloan.docx, VictorLab_Sloan.xlsx and VictorLab_Sloan.csv (Victor Lab, 2026-09-12). Sloan et al. (2018), Nature Protocols 13:2062–2085, reagent setup and steps 17–23 (22A). https://doi.org/10.1038/s41596-018-0032-7",
      "components": [
        {
          "name": "B27",
          "calculation_mode": "percent_vv",
          "target_value": 2,
          "target_unit": "% v/v",
          "sort_order": 1
        },
        {
          "name": "GlutaMAX",
          "calculation_mode": "percent_vv",
          "target_value": 1,
          "target_unit": "% v/v",
          "sort_order": 2
        },
        {
          "name": "PenStrep",
          "calculation_mode": "percent_vv",
          "target_value": 1,
          "target_unit": "% v/v",
          "sort_order": 3
        }
      ]
    }
  ]
}
$victorlab$::jsonb;
  protocol_uuid uuid;
  recipe_uuid uuid;
  recipe jsonb;
begin
  select id into protocol_uuid from public.differentiation_protocols
  where lower(btrim(name)) = lower(payload->'protocol'->>'name')
    and version = payload->'protocol'->>'version' and is_shared
  order by created_at limit 1;

  if protocol_uuid is null then
    insert into public.differentiation_protocols
      (name, version, target_cell_type, expected_duration_days, notes, is_shared)
    values (payload->'protocol'->>'name', payload->'protocol'->>'version',
      payload->'protocol'->>'target_cell_type', (payload->'protocol'->>'expected_duration_days')::integer,
      payload->'protocol'->>'notes', true)
    returning id into protocol_uuid;
  end if;

  insert into public.differentiation_protocol_tasks
    (protocol_id, task_day, title, task_type, medium, notes)
  select protocol_uuid, task_day, title, task_type, medium, notes
  from jsonb_to_recordset(payload->'tasks') as t
    (task_day integer, title text, task_type text, medium text, notes text)
  on conflict (protocol_id, task_day, title) do nothing;

  for recipe in select value from jsonb_array_elements(payload->'recipes') loop
    insert into public.culture_media_recipes
      (name, version, solvent_name, description, notes)
    values (recipe->>'name', recipe->>'version', recipe->>'solvent_name',
      recipe->>'description', recipe->>'notes')
    on conflict do nothing;

    select id into strict recipe_uuid from public.culture_media_recipes
    where lower(name) = lower(recipe->>'name') and lower(version) = lower(recipe->>'version');

    insert into public.culture_media_components
      (recipe_id, name, calculation_mode, stock_value, stock_unit, target_value,
       target_unit, rate_value, rate_unit, reference_value, reference_unit, sort_order, notes)
    select recipe_uuid, name, calculation_mode, stock_value, stock_unit, target_value,
      target_unit, rate_value, rate_unit, reference_value, reference_unit, sort_order, notes
    from jsonb_to_recordset(recipe->'components') as c
      (name text, calculation_mode text, stock_value numeric, stock_unit text,
       target_value numeric, target_unit text, rate_value numeric, rate_unit text,
       reference_value numeric, reference_unit text, sort_order integer, notes text)
    on conflict (recipe_id, name) do nothing;
  end loop;
end;
$seed$;

commit;
