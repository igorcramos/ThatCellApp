const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const library = require("../shared-library.js");

const cellLines = [
  { id: "1", identifier: "8Ø", clone: "C1", full_name: "TBCK control", cell_type: "iPSC" },
  { id: "2", identifier: "HEK293", clone: null, source: "ATCC" },
];
assert.deepEqual(library.filterCellLines(cellLines, "tbck").map((line) => line.id), ["1"]);
assert.deepEqual(library.filterCellLines(cellLines, "atcc").map((line) => line.id), ["2"]);
assert.equal(library.findDuplicateCellLine(cellLines, { identifier: " 8ø ", clone: "c1" })?.id, "1");
assert.equal(library.findDuplicateCellLine(cellLines, { identifier: "8Ø", clone: "C1" }, "1"), undefined);

const protocols = [
  { id: "p1", name: "Microglia", version: "v1", project: "TBCK", target_cell_type: "Microglia" },
  { id: "p2", name: "Organoid", version: "2026", notes: "Neural induction" },
  { id: "p3", name: "Microglia (adaptation)", version: "v1 adaptation" },
];
assert.deepEqual(library.filterProtocols(protocols, "neural").map((protocol) => protocol.id), ["p2"]);
assert.equal(library.findDuplicateProtocol(protocols, { name: "microglia", version: "V1" })?.id, "p1");
assert.equal(library.nextAdaptationName("Organoid", protocols), "Organoid (adaptation)");
assert.equal(library.nextAdaptationName("Microglia", protocols), "Microglia (adaptation) 2");

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "supabase/2026-08-12_shared_protocol_cell_line_library.sql"), "utf8");
assert.match(migration, /protocols shared library read/);
assert.match(migration, /can_manage_protocol/);
assert.match(migration, /clone_shared_protocol/);
assert.match(migration, /security invoker/);
const runAccessFunction = migration.match(/create or replace function public\.can_access_run[\s\S]+?\$\$;/)?.[0] || "";
assert.doesNotMatch(runAccessFunction, /can_access_protocol/, "sharing a protocol must not expose its runs");
assert.match(runAccessFunction, /run\.created_by = auth\.uid\(\)/);

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert(index.indexOf("shared-library.js") < index.indexOf("app.js?v="), "shared library helpers must load before the app");
assert.match(index, /id="cellLineLibrarySearch"/);
assert.match(index, /id="protocolLibrarySearch"/);

const translations = fs.readFileSync(path.join(root, "i18n.js"), "utf8");
assert.match(translations, /"Shared cell line library": "Biblioteca compartilhada de linhagens celulares"/);
assert.match(translations, /"Shared protocol library": "Biblioteca compartilhada de protocolos"/);

console.log("shared library: search, duplicates, cloning, and privacy checks passed");
