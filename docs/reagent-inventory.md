# Reagent inventory, scanning, and purchasing

Run these migrations in order, then refresh the app:

1. `supabase/2026-08-04_reagent_inventory.sql`
2. `supabase/2026-08-05_reagent_operations.sql`
3. `supabase/2026-08-06_secure_passwordless_auth.sql`
4. `supabase/2026-08-07_reagent_checklists.sql`

The migrations create:

- `reagent_catalog`: searchable reagent definitions (name, catalog number, manufacturer, category, default storage).
- `reagent_inventory_items`: physical lots and their quantity, unit, location, status, expiration, and reconstitution details.
- `reagent_aliquots`: labeled aliquots linked to one physical inventory item.
- `reagent_purchase_requests`: requests and their approval, order, and receipt state.
- `reagent_checklists` and `reagent_checklist_items`: editable responsibility
  lists with location, minimum, order, active state, and frequency.
- `reagent_check_sessions` and `reagent_check_entries`: dated weekly history;
  counts and ordered flags never update stock automatically.

The operations migration also adds product barcode, GTIN, synonyms, supplier URL, and ownership fields to the catalog; and container barcode, open date, reorder threshold, and ownership fields to stock. The `receive_reagent_purchase` database function receives an ordered request and creates its stock item atomically.

## Workflow

1. Open **Reagents** and type part of a reagent name, synonym, manufacturer, catalog number, barcode, or GTIN.
2. Select one result from the library.
3. Record the physical lot, container code, current quantity, reorder threshold, unit, and location; optionally record opening and reconstitution.
4. Open **Aliquots** on a saved item and add each labeled aliquot with its own quantity, location, dates, and status.
5. Use the stock filter to find items by reagent, catalog, lot, location, or status.

No workflow in this module subtracts stock automatically. Quantities only change when a user edits a stock record.

## Weekly material lists

The Reagents page can create, edit, assign, deactivate, and delete material
lists. Each list has a responsible person and a configurable interval in days.
The latest check determines the next due date. A weekly check records one count,
an independent ordered flag, calculated low/out status, and an optional note per
active item. A positive count below the minimum is low; zero is out; a count
equal to the minimum remains okay, matching the source sheet's ordering behavior.

The migration seeds `VictorLab TC` with the 14 rows supplied in the source
tracking sheet. There are 13 unique products because Pen/Strep bottles and
Pen/Strep aliquots deliberately use the same catalog product as separate list
items. Nine products were already present in the starter catalog; four were
added: BAMBANKER, STEMCELL ACCUTASE 07920, ReLeSR 100-0483, and Sigma insulin
solution I9278-5ML. The migration imports the 2026-07-29 counts as the first
historical session and assigns the active bootstrap administrator as responsible;
if that profile is unavailable, it falls back to the first active administrator
or member. Responsibility remains editable in the app.

Deleting a list also deletes its check history and therefore requires explicit
confirmation. An item that already appears in history should be marked inactive
instead of deleted. Counts in weekly lists are an independent checklist record;
they do not change `reagent_inventory_items`, aliquots, or purchase requests.

## Product and container scanning

The scanner searches in this order:

1. Exact container barcode/QR in `reagent_inventory_items.container_barcode`.
2. Exact product `barcode`, `gtin`, or `catalog_number` in `reagent_catalog`.
3. A unique partial catalog match.
4. If nothing matches, it opens the manual catalog form and copies the scanned value there for verification.

Manual code entry works in every supported browser. Live camera and image decoding use the browser-native `BarcodeDetector` API. Camera access additionally requires HTTPS or `localhost`, browser permission, and `getUserMedia`. When any capability is unavailable or permission is denied, the UI explains the reason and keeps manual input available. Image scanning also falls back to manual entry when `BarcodeDetector` is unavailable. The scanner requests common QR, EAN, UPC, Code 128, Code 39, and Data Matrix formats that the current browser reports as supported.

The app never sends camera frames or uploaded barcode images to a server. Camera tracks stop after a successful scan, when the user presses **Stop camera**, when the page becomes hidden, or when the page closes.

## Catalog CSV import

Download `docs/reagent-catalog-template.csv` from the Catalog library panel. CSV files must use commas and a header row. Quoted commas, quotes, and line breaks are supported.

| Column | Required | Notes |
| --- | --- | --- |
| `name` | yes | Product/reagent name. Alias: `product_name` or `reagent`. |
| `catalog_number` | yes | Supplier catalog number. Aliases: `catalog`, `catalog_no`, `catalogue_number`. |
| `manufacturer` | yes | Manufacturer or supplier. Aliases: `supplier`, `vendor`. |
| `category` | no | Such as Basal medium, Growth factor, or Small molecule. |
| `default_storage` | no | Human-readable verified storage condition. |
| `barcode` | no | Supplier/product barcode when it is not being represented as GTIN. |
| `gtin` | no | Valid 8, 12, 13, or 14 digit GTIN, including its check digit. |
| `synonyms` | no | Multiple aliases separated by `|` or `;`. |
| `supplier_url` | no | Product page URL. |
| `notes` | no | Free text. |

The browser validates every row before import. Invalid rows are skipped and shown in the preview. A manufacturer + catalog pair already in the database is updated; otherwise a new catalog row is created. Barcode/GTIN collisions with another product are rejected. Imports run in batches of 100 rows. The bundled seed library is a convenience index, not an authoritative purchasing source: verify catalog numbers, formulation, storage, and supplier availability before ordering.

## Alerts and data quality

Stock alerts are calculated in the browser whenever reagent data loads:

- expiration already passed;
- expiration within the configurable warning window (30 days by default);
- quantity at or below `minimum_quantity`;
- item status explicitly marked low, depleted, or expired.

The quality panel reports duplicate catalog pairs, reused product/container codes, invalid GTIN check digits, impossible opening/reconstitution dates, and missing manufacturer, category, storage, lot, or expiration fields. Alerts do not modify a stock status automatically and do not send email or push notifications.

## Request and purchasing flow

The supported state flow is:

```text
requested → approved → ordered → received
          ↘ rejected
requested/approved → cancelled
```

1. Choose a catalog product, quantity, requester, vendor, cost, priority, and justification.
2. A reviewer approves or rejects the request.
3. An approved request is marked ordered with its order/PO number.
4. Receipt requires quantity, unit, location, and receiver; lot, expiration, and container code are optional.
5. Receipt calls `receive_reagent_purchase`, which changes the request to `received` and creates the inventory lot in one database transaction.

The authentication/RLS migration defines who may request, approve, order, or receive. A permission error is shown without pretending the action succeeded.

## Compatibility and limitations

- The bundled library is a broad starter dataset, not a comprehensive or authoritative live vendor catalog. Use the manual/CSV workflow to maintain verified lab-specific products.
- Quantities are stored exactly as entered; the app does not convert units or automatically subtract aliquots from parent stock.
- Barcode support varies by browser and operating system. Manual entry is the universal fallback; no third-party decoder is bundled.
- Low-stock/expiration alerts appear inside the app only. Email, SMS, and push notification delivery are not included.
- Supplier APIs are not queried. A scan resolves only codes already in this Supabase catalog or stock database.
- Approval history is represented by request state, actors, and timestamps. A separate immutable audit-event table is outside this module and can be layered on by the app-wide security/audit migration.
