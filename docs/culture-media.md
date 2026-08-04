# Culture Media calculator

The **Culture Media** module stores reusable recipes and scales every active
component to a requested final volume. Run
`supabase/2026-08-08_culture_media.sql` after secure passwordless auth, then
reload the app. Recipe definitions are shared with active users; only the
recipe creator or an administrator can edit or delete a recipe and its
components.

The calculator runs in the browser. It does not reserve, subtract, or otherwise
change reagent inventory.

## Calculation modes

| Mode | Saved definition | Calculation |
| --- | --- | --- |
| Dilution | Stock and final concentration | `V1 = C2 × V2 / C1` |
| Percent v/v | Final `% v/v` | Liquid addition = `% × final volume / 100` |
| Percent w/v | Final `% w/v` | Mass = `% grams × final mL / 100 mL` |
| Mass per volume | Mass and reference volume | Mass × `final volume / reference volume` |
| Volume per volume / ratio | Added volume and reference volume | Added volume × `final volume / reference volume` |
| Fixed amount per reference volume | Any explicit amount unit and reference volume | Amount × `final volume / reference volume` |

Dilution accepts these concentration families and converts prefixes only
inside the same family:

- fold: `X`;
- molarity: `M`, `mM`, `µM`, `nM`;
- mass concentration: `g/L`, `mg/mL`, `mg/L`, `µg/mL`, `µg/L`, `ng/mL`,
  `ng/µL`;
- activity: `U/mL` with `U/L`, or `IU/mL` with `IU/L`;
- stock percentages: `% v/v` or `% w/v` (kept as distinct families).

For example, a `50X` stock at `1X` in `100 mL` requires `2 mL`; a `10 mM`
stock at `10 µM` in `1 L` requires `1 mL`; and a `100% v/v` stock diluted to
`2% v/v` in `100 mL` requires `2 mL`.

The app rejects incompatible dimensions rather than assuming a conversion.
`U` and `IU`, `% v/v` and `% w/v`, fold concentration, molarity, and mass
concentration are intentionally distinct.

## Liquid-volume summary

Dilution results, `% v/v`, volume/volume additions, and fixed additions entered
in `L`, `mL`, or `µL` count toward total liquid additions. The calculator shows
the requested final volume, total liquid additions, and base/solvent remaining.
It warns when additions exceed the final volume. Solids and activity units do
not count toward liquid volume.

## Safe use and limitations

- The result is a scaling aid, not an approved protocol. Verify recipe version,
  units, density assumptions, preparation order, sterility, and lab SOPs.
- `% w/v` follows the conventional `g / 100 mL` definition. It does not model
  density, displacement, hydration, purity, or assay potency.
- Arbitrary units are accepted only in **fixed amount per reference volume**.
  They are scaled without conversion and therefore must be entered consistently.
- The calculator does not model pH adjustment, q.s. steps, significant-figure
  policy, uncertainty, or temperature-dependent volume.
- Deactivating a component preserves it in the recipe but excludes it from
  calculations.

