# ThatCellApp

Simple web app for cell culture tracking using Supabase.

## How to prepare Supabase

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run `supabase/schema.sql`.
4. Run the dated feature migrations needed by the app through `supabase/2026-08-03_task_completion_and_print.sql`, in date order. The older `2026-06-29_auth_collaboration.sql`, `2026-07-20_claim_existing_data.sql`, and `2026-08-03_remove_login.sql` files are historical transitions and are not part of a new secure installation.
5. Run `supabase/2026-08-04_reagent_inventory.sql` to add the searchable reagent library, inventory, reconstitution, and aliquots.
6. Run `supabase/2026-08-05_reagent_operations.sql` for barcodes, alerts, catalog expansion, and purchase requests.
7. Confirm that these tables were created:
   - `cell_lines`
   - `cultures`
   - `culture_events`
   - `cryo_boxes`
   - `cryo_vials`
   - `profiles`
   - `project_members`
   - `culture_members`
   - `reagent_catalog`
   - `reagent_inventory_items`
   - `reagent_aliquots`
   - `reagent_purchase_requests`
8. Confirm that the `culture-photos` bucket exists in Storage.
9. When redirects and the first administrator email are ready, follow
    `docs/passwordless-auth-rollout.md` and run
    `supabase/2026-08-06_secure_passwordless_auth.sql`.
10. Run `supabase/2026-08-07_reagent_checklists.sql` to add editable weekly
    material lists, the seeded `VictorLab TC` responsibility list, and its
    imported 2026-07-29 check.
11. Run `supabase/2026-08-08_culture_media.sql` to add reusable culture-medium
    recipes, dimensionally validated components, RLS, and auditing. See
    `docs/culture-media.md` for supported formulas and units.
12. Run `supabase/2026-08-09_set_admin_display_name.sql` to set the configured
    administrator's app-visible name to `igorcramos`. This does not change the
    login email or the GitHub Pages URL.

## Login options

The secure mode uses Supabase Auth with Google sign-in as the primary path, plus
email magic links or optional one-time codes as a backup. The app does not
request or store passwords. Sessions persist on the current device, and new
users remain pending until an administrator assigns project access.

Google sign-in also requires provider setup outside this repo:

- Supabase Dashboard > Authentication > Providers > Google: enable Google and
  add the Google OAuth Client ID and Client Secret.
- Supabase Dashboard > Authentication > URL Configuration:
  - Site URL: `https://igorcramos.github.io/ThatCellApp/`
  - Redirect URLs: `https://igorcramos.github.io/ThatCellApp/` and
    `http://localhost:5173/**`
- Google Cloud OAuth Client:
  - Authorized JavaScript origins:
    `https://igorcramos.github.io` and `http://localhost:5173`
  - Authorized redirect URI: the Supabase callback URL shown on the Google
    provider page, usually
    `https://rqvpzurlaxlopmhxivcn.supabase.co/auth/v1/callback`

## How to open locally

Use a simple local server:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Published app

The `main` branch is deployed automatically with GitHub Pages:

```text
https://igorcramos.github.io/ThatCellApp/
```

Supabase Auth must allow this exact production URL for magic links. Keep `http://localhost:5173/**` as an additional redirect URL for local development.

## What this first version does

- Saves available cell lines.
- Starts cultures from a cell line.
- Creates physical vessels and multiwell plate maps.
- Maps project-linked cryogenic boxes and vial positions in -80 storage.
- Saves differentiation protocol templates and starts differentiation runs.
- Imports CSV/TSV protocols, clones them for adaptation, generates run schedules, and records collections.
- Records events in the history.
- Allows optional photos in events.
- Shows a quick overview of active cultures.
- Tracks culture-reagent lots, barcodes/QR codes, alerts, catalog CSV imports, and purchase requests through receipt.
- Creates editable reagent/material lists with assigned responsibility,
  configurable frequency, weekly count history, and ordered flags without
  changing physical stock automatically.
- Creates and edits culture-medium recipes and scales dilutions, percentages,
  mass/volume, volume/volume, and fixed-per-volume components without changing
  reagent inventory.

## Security note

The historical schema used prototype public access. For shared use, follow
`docs/passwordless-auth-rollout.md`. The final security migration replaces all
prototype policies with passwordless login, active-member/project RLS, private
photos, and an administrator-only audit trail. Never rerun
`supabase/2026-08-03_remove_login.sql` after secure mode is active.

## Changing table columns

See `docs/schema-changes.md` for the recommended workflow and SQL examples.

## Interface language

Use the language selector in the header to switch between English and Brazilian
Portuguese. The preference is stored in the browser and applies to navigation,
forms, authentication, inventory, scanning, alerts, purchasing, culture-medium
calculations, dates, and dynamic status messages. Laboratory product names, user-entered data, catalog
identifiers, and database error details remain in their original form.
