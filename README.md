# ThatCellApp

Simple web app for cell culture tracking using Supabase.

## How to prepare Supabase

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/2026-06-29_auth_collaboration.sql` to enable login, roles, and collaborator access.
5. Confirm that these tables were created:
   - `cell_lines`
   - `cultures`
   - `culture_events`
   - `cryo_boxes`
   - `cryo_vials`
   - `profiles`
   - `project_members`
   - `culture_members`
6. Confirm that the `culture-photos` bucket exists in Storage.
7. Create your account in the app, then make yourself admin in the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

8. In Supabase Auth settings, choose whether sign-ups should stay open or whether you prefer inviting/creating users yourself.

## Login options

The app supports email/password accounts created in Supabase Auth. If you do not already have a user there, use **Create account** in the app or create/invite a user from the Supabase Dashboard.

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

Supabase Auth must allow this exact production URL for email confirmations, magic links, and password recovery. Keep `http://localhost:5173/**` as an additional redirect URL for local development.

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

The initial schema was prototype mode. For shared use, run `supabase/2026-06-29_auth_collaboration.sql`; it removes public read/write policies, requires login, and lets admins assign multiple users to each project or culture.

## Changing table columns

See `docs/schema-changes.md` for the recommended workflow and SQL examples.
