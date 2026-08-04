# Passwordless authentication rollout

The new login is intentionally dormant until `app_security_status` is created by
`supabase/2026-08-06_secure_passwordless_auth.sql`. Deploying the HTML/JavaScript
first does not interrupt the current public prototype mode.

## Recommended rollout

1. Back up the Supabase database (or confirm point-in-time recovery is active).
2. Deploy the updated app and confirm it still opens normally. At this point the
   security marker does not exist, so the app continues in its current mode.
3. In Supabase **Authentication > URL Configuration**, set:
   - Site URL: `https://igorcramos.github.io/ThatCellApp/`
   - Additional redirect URL: `http://localhost:5173/**`
   - Add any staging URL that will actually be used. Do not add broad production
     wildcards.
4. Keep the email provider enabled. The standard magic-link template works with
   the primary button. The optional six-digit-code form only works when the email
   template also sends the OTP token.
5. Choose the first administrator email. For the strictest onboarding, create
   that user in **Authentication > Users** first and disable open sign-ups after
   the team is provisioned. If sign-ups stay enabled, new accounts are still
   created as inactive and cannot read lab data until an administrator assigns a
   project.
6. Run the migrations in this order:
   1. `supabase/2026-08-04_reagent_inventory.sql` (already run)
   2. `supabase/2026-08-05_reagent_operations.sql`
   3. `supabase/2026-08-06_secure_passwordless_auth.sql`
7. Before running step 6.3, replace both occurrences of
   `YOUR_ADMIN_EMAIL@example.com` with the exact lowercase admin email. The file
   is transactional and stops before activation when the placeholder is left in
   place. If Auth already contains users, it also stops unless the configured
   administrator exists.
8. Reload the app, request a sign-in link, and open it in the same browser. The
   designated account becomes the active administrator. Existing records with no
   owner are claimed by that account and all existing projects/cultures are added
   to it.
9. Test in a private browser window: the login panel should appear and no lab
   records or photos should be available without a session.

## Opening a downloaded/local copy

Opening `index.html` directly creates a `file://` page, which cannot be the final
destination of a Supabase magic link. The app therefore sends sign-in links from
a local file back to `https://igorcramos.github.io/ThatCellApp/` and shows a
direct link to that published version. For local development that must stay on
the current checkout, start `python3 -m http.server 5173` and open
`http://localhost:5173` instead.

## Adding members

1. Have the person request a sign-in link. If open sign-ups are disabled, create
   or invite the Auth user in the Supabase Dashboard first.
2. Their first login creates a pending profile. They can see only the pending
   access message.
3. As an administrator, open **Projects**, edit a project, and select the person
   in its member list. The membership trigger activates the profile immediately.
4. Add direct culture access only when a person needs a culture outside their
   normal projects.

To suspend an account without deleting its history, run:

```sql
update public.profiles
set is_active = false, updated_at = now()
where email = 'person@lab.org';
```

To reactivate it, assign a project again or set `is_active = true` in the SQL
Editor. Removing the last project does not automatically suspend the account;
active lab members can still use shared cell-line and reagent libraries.

## Audit trail

Inserts, updates, and deletes on operational, membership, and reagent tables are
recorded in `public.audit_log`. Only active administrators can select it through
the API. The log captures actor, time, operation, changed fields, and old/new row
snapshots. It is an application audit trail, not an immutable compliance archive;
database owners and service-role processes can still alter it.

## Photos

The activation migration makes `culture-photos` private. The app stores new photo
paths and generates signed URLs valid for one hour. Existing public URLs are
converted to their bucket path in the browser and signed after login. External
image URLs, if any were saved manually, remain external and are not protected by
Supabase Storage.

## Safe rollback

- If the SQL fails, the surrounding transaction rolls back automatically. Fix
  the reported preflight problem and rerun the same new migration; do not edit or
  rerun historical migrations.
- If only the front end has a problem after activation, keep RLS enabled and fix
  or redeploy the front end. Administrators can continue emergency operations in
  the Supabase Table Editor. This preserves data protection.
- Do **not** rerun `2026-08-03_remove_login.sql`; it deliberately restores public
  read/write access and would expose the database.
- For a full database rollback, restore the backup/PITR point made immediately
  before activation. Reopening anonymous policies is not considered a safe
  rollback.

## Verification queries

Run as the SQL Editor/database owner:

```sql
select auth_required, activated_at
from public.app_security_status;

select email, role, is_active
from public.profiles
order by created_at;

select table_name, action, actor_email, occurred_at
from public.audit_log
order by occurred_at desc
limit 25;
```

Also verify from a signed-out browser; SQL Editor results bypass normal client
RLS and are not sufficient by themselves.
