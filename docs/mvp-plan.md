# CellApp MVP

## Goal

Build a simple web app to track cell lines, active cultures, and cell culture events, with optional photos.

## Recommended start

1. Create a free Supabase account.
2. Create a project named `CellApp`.
3. Open the Supabase SQL Editor.
4. Run `supabase/schema.sql`.
5. Build the local web app connected to Supabase.

## Main workflow

### 1. Add cell line

Essential fields:

- Identifier

Optional fields:

- Description
- Species
- Clone
- Cell type
- Source
- CRISPR modification details
- Transgene expression details
- Notes

### 2. Start culture

Choose a saved cell line and create an active culture.

Optional fields:

- Culture name
- Start date
- Current passage
- Vessel type
- Medium
- Location
- Notes

### 3. Record event

Add an entry to the culture history.

Initial event types:

- Observation
- Media change
- Passage
- Plating
- Freezing
- Thawing
- Contamination
- Discard

Optional fields:

- Date
- Passage
- Confluence
- Notes
- Performed by
- Photo

## Initial screens

- Cell lines
- Active cultures
- Vessels
- Plate map
- Culture detail
- Record event
- History

## Important decision

During the prototype, the app will run without login. This makes usage easier, but anyone with the URL and public project keys can read or change data. Because the first version is not intended for sensitive data, this is acceptable for the MVP, but it should be revisited before broader use.
