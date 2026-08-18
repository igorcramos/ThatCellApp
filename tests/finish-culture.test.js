const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "supabase/2026-08-18_finish_culture.sql"), "utf8");

assert.match(migration, /create or replace function public\.finish_culture/);
assert.match(migration, /can_manage_culture_members\(culture_id_arg\)/,
  "only an administrator, creator, or current responsible person may finish a culture");
assert.match(migration, /update public\.cultures[\s\S]*set status = 'discarded'[\s\S]*status = 'active'/,
  "the culture must transition from active to discarded");
assert.match(migration, /insert into public\.culture_events[\s\S]*'Culture discarded'/,
  "the discard must be recorded in activity history");
assert.match(migration, /update public\.differentiation_runs[\s\S]*source_culture_id = culture_id_arg[\s\S]*status = 'active'/,
  "directly linked active runs must be stopped");
assert.match(migration, /grant execute on function public\.finish_culture[\s\S]*to authenticated/,
  "authenticated collaborators must be able to invoke the operation");

console.log("finish culture: authorization, history, and task interruption checks passed");
