# Differentiation and Plate Map Design

## Core idea

A culture should be allowed to split into multiple child workflows.

Example:

- Parent culture: `KOLF E2 P20`
- Branch 1: frozen stock, 3 vials
- Branch 2: continued maintenance culture
- Branch 3: differentiation protocol, day 0

This avoids forcing the entire culture into a single status.

## Recommended tables

### `culture_batches`

Use this when a culture is split into portions.

- `id`
- `parent_culture_id`
- `batch_name`
- `batch_type`: `maintenance`, `frozen_stock`, `differentiation`, `experiment`, `discarded`
- `started_at`
- `passage_number`
- `notes`
- `created_at`

### `differentiation_protocols`

Reusable protocol templates.

- `id`
- `name`
- `target_cell_type`
- `version`
- `notes`
- `created_at`

### `differentiation_runs`

One actual differentiation instance.

- `id`
- `source_culture_id`
- `source_batch_id`
- `protocol_id`
- `run_name`
- `day_zero_date`
- `current_day`
- `status`: `active`, `paused`, `completed`, `failed`, `discarded`
- `notes`
- `created_at`

### `differentiation_events`

Timeline for the differentiation.

- `id`
- `differentiation_run_id`
- `event_day`
- `event_date`
- `event_type`
- `notes`
- `photo_url`
- `created_at`

### `plate_maps`

One plate layout attached to a culture, batch, or differentiation run.

- `id`
- `culture_id`
- `batch_id`
- `differentiation_run_id`
- `vessel_type`
- `name`
- `created_at`

### `plate_wells`

One record per well.

- `id`
- `plate_map_id`
- `well`
- `cell_line_id`
- `culture_id`
- `condition_label`
- `treatment`
- `dose`
- `medium`
- `notes`

## Plate map behavior

For multiwell vessels, the app can show a visual grid:

- `6 well`: 2 x 3
- `12 well`: 3 x 4
- `24 well`: 4 x 6
- `96 well`: 8 x 12

Each well can optionally store:

- condition
- cell line
- culture
- treatment
- dose
- medium
- notes

The plate map supports selecting multiple wells and applying the same condition, cell line, culture, treatment, dose, medium, and notes to all selected wells in one save.

For dishes such as `60mm`, `100mm`, and `150mm`, the app should skip the grid and use a single-condition layout.

## Current implementation

The app now has a `Vessels` section before protocol start. A vessel can link to multiple cultures through `vessel_cultures`, and multiwell vessel types can store well-level condition maps.

The app also has a `Differentiations` section with protocol templates and differentiation runs. A run can start from one culture, a whole vessel, or selected wells.

Supported multiwell layouts:

- `6 well`: 2 x 3
- `12 well`: 3 x 4
- `24 well`: 4 x 6
- `96 well`: 8 x 12

Supported single-condition vessels:

- `60mm`
- `100mm`
- `150mm`

## Suggested next implementation

Build differentiation event tracking on top of existing runs.

Minimum useful version:

1. Add differentiation events with optional photos.
2. Track event day automatically from day 0.
3. Add planned protocol schedules.
4. Add run completion/endpoint summaries.
