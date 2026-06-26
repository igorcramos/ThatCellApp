# ThatCellApp

Simple web app for cell culture tracking using Supabase.

## How to prepare Supabase

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run `supabase/schema.sql`.
4. Confirm that these tables were created:
   - `cell_lines`
   - `cultures`
   - `culture_events`
   - `cryo_boxes`
   - `cryo_vials`
5. Confirm that the `culture-photos` bucket exists in Storage.

## How to open locally

Use a simple local server:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## What this first version does

- Saves available cell lines.
- Starts cultures from a cell line.
- Creates physical vessels and multiwell plate maps.
- Maps project-linked cryogenic boxes and vial positions in -80 storage.
- Saves differentiation protocol templates and starts differentiation runs.
- Records events in the history.
- Allows optional photos in events.
- Shows a quick overview of active cultures.

## Security note

This version is in prototype mode, with no login. The Supabase policies in `supabase/schema.sql` allow public read/write access to make early testing easier.

## Changing table columns

See `docs/schema-changes.md` for the recommended workflow and SQL examples.
