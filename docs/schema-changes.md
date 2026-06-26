# Schema Changes

Use SQL migrations when you change the base tables. Avoid changing the app first and hoping the database matches later.

## Recommended workflow

1. Decide which table needs the new field.
2. Add the column with `alter table`.
3. Keep the column nullable unless the app truly cannot work without it.
4. Update `supabase/schema.sql` so a fresh project gets the same structure.
5. Update `index.html` and `app.js` if the field should appear in the interface.
6. Test by adding one record in the app.

## Add an optional column

```sql
alter table public.cell_lines
add column if not exists growth_notes text;
```

## Add an optional numeric column

```sql
alter table public.cell_lines
add column if not exists doubling_time_hours numeric;
```

## Add an optional date column

```sql
alter table public.cultures
add column if not exists last_myco_test_date date;
```

## Rename a column

Renaming affects the app code immediately, so update the JavaScript at the same time.

```sql
alter table public.cultures
rename column vessel_type to vessel;
```

## Remove a column

Only remove a column after confirming the app no longer reads or writes it.

```sql
alter table public.cell_lines
drop column if exists growth_notes;
```

## Good default for this app

For the prototype, most new fields should be nullable. That keeps the forms flexible and matches the idea that only `id` and the cell line `identifier` are required at first.

The current cell line model uses:

- `identifier`: required, such as `HEK293`
- `clone`: optional, such as `C1`
- `name`: stored compatibility/display value generated from identifier plus clone
- `has_crispr`: whether CRISPR details apply
- `has_transgene`: whether transgene expression details apply
