const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/2026-08-18_shared_culture_responsibility.sql"), "utf8");

assert.match(index, /<div class="field-label">Responsible people<\/div>/);
assert.doesNotMatch(index, /admin-only[^>]*>[\s\S]{0,100}Culture members/);
assert.match(app, /db\.rpc\("set_culture_members"/);
assert.match(app, /syncCultureResponsibilities\([\s\S]+getCheckedValues\(els\.cultureMemberCheckboxes\)/);
assert.match(migration, /create or replace function public\.can_manage_culture_members/);
assert.match(migration, /culture\.created_by = auth\.uid\(\)/);
assert.match(migration, /member\.user_id = auth\.uid\(\)/);
assert.match(migration, /array_append\(requested_user_ids, culture_creator_id\)/);
assert.match(migration, /on conflict \(culture_id, user_id\) do nothing/);
assert.match(migration, /grant execute on function public\.set_culture_members\(uuid, uuid\[\]\) to authenticated/);

console.log("shared cultures: collaborator management and creator retention checks passed");
