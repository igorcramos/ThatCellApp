const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

const i18n = read("i18n.js");
const mapSource = i18n.slice(i18n.indexOf("Object.entries({"), i18n.indexOf("}));"));
const keys = [...mapSource.matchAll(/^\s+"((?:\\.|[^"])*)":/gm)].map((match) => match[1]);
const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
assert.deepEqual(duplicates, [], "translation keys must be unique");

[
  "Choose batches & export",
  "Active components",
  "Protocol adjustments",
  "Task completed off schedule",
  "No plate",
  "New cell line",
  "New culture",
  "New cryobox",
  "New project",
  "New differentiation",
  "Record activity",
  "New protocol",
  "New task",
  "Reagent workspace",
  "Add reagent",
].forEach((key) => assert(keys.includes(key), `missing Portuguese translation for: ${key}`));

assert.match(i18n, /\^Minimum \(\\d\+/, "inventory minimum translation must require a numeric value");
assert.doesNotMatch(i18n, /\^Minimum \(\.\+\)\$/, "reagent names beginning with Minimum must not be translated");

class FakeElement {}
const body = new FakeElement();
body.nodeType = 1;
body.querySelectorAll = () => [];
body.hasAttribute = () => false;
const languageWindow = {
  localStorage: { getItem: () => "pt", setItem: () => {} },
  dispatchEvent: () => {},
};
const languageDocument = {
  body,
  documentElement: {},
  querySelector: () => null,
  createTreeWalker: () => ({ nextNode: () => null }),
};
vm.runInNewContext(i18n, {
  window: languageWindow,
  document: languageDocument,
  navigator: { language: "pt-BR" },
  Node: { ELEMENT_NODE: 1, TEXT_NODE: 3, DOCUMENT_NODE: 9 },
  NodeFilter: { SHOW_TEXT: 4 },
  Element: FakeElement,
  MutationObserver: class { observe() {} },
  CustomEvent: class {},
});
assert.equal(languageWindow.translateAppText("Minimum Essential Medium"), "Minimum Essential Medium");
assert.equal(languageWindow.translateAppText("Minimum 3 bottles"), "Mínimo 3 bottles");
assert.equal(languageWindow.translateAppText("2 active cultures"), "2 culturas ativas");
assert.equal(languageWindow.translateAppText("Members: igorcramos"), "Membros: igorcramos");

const reagentCss = read("reagent-operations.css");
assert.match(reagentCss, /\.scanner-stage\.is-hidden\s*\{\s*display:\s*none;/s);
assert.match(reagentCss, /\.scanner-stage\.is-pending video\s*\{\s*display:\s*none;/s);

const mediaCss = read("culture-media.css");
const index = read("index.html");
assert.match(mediaCss, /\.media-workspace\s*\{[^}]*min-width:\s*0;/s);
assert.match(mediaCss, /\.media-results-wrap\s*\{[^}]*max-width:\s*100%;[^}]*overflow-x:\s*auto;/s);

const appCss = read("styles.css");
assert.match(appCss, /body\s*\{[^}]*overflow-x:\s*clip;/s, "the app shell must not overflow the viewport");
assert.match(appCss, /@media \(max-width: 760px\)[\s\S]*?\.tabs\s*\{[^}]*position:\s*fixed;[^}]*flex-direction:\s*column;[^}]*overflow-x:\s*hidden;/s,
  "mobile navigation must use a vertical off-canvas menu without horizontal scrolling");
assert.match(appCss, /@media \(max-width: 760px\)[\s\S]*?\.nav-group-tabs\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  "mobile navigation options must be listed vertically");
assert.match(mediaCss, /@media \(max-width: 620px\)[\s\S]*?\.media-results,[\s\S]*?display:\s*block;/s,
  "culture media results must become readable cards on phones");
assert.doesNotMatch(index, /<th>Formula \/ basis<\/th>/,
  "culture media results must not expose the calculation formula");
assert.match(index, /<th>Stock concentration<\/th><th>Final concentration<\/th><th>Required volume<\/th>/,
  "culture media results must show stock, final concentration, and required volume");
assert.match(appCss, /\.cryo-map\s*\{[^}]*grid-template-columns:\s*repeat\(var\(--cryo-columns\),/s,
  "cryobox maps must preserve their configured column count");
assert.match(appCss, /\.cryo-slot span\s*\{[^}]*display:\s*none;/s,
  "cryobox slots must keep details hidden at overview zoom");
assert.match(appCss, /@media \(max-width: 760px\)[\s\S]*?\.schedule-task\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  "schedule cards must use one column on narrow screens");

const reagentOperations = read("reagent-operations.js");
const reagentInventory = read("reagent-inventory.js");
assert.match(reagentOperations, /scannerRequestId:\s*0/);
assert.match(reagentOperations, /requestId !== reagentOpsState\.scannerRequestId/);
assert.match(reagentOperations, /stream\?\.getTracks\?\.\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);

const reagentChecklists = read("reagent-checklists.js");
assert.match(reagentChecklists, /data-check-quantity type="number" inputmode="decimal"/);
assert.match(reagentChecklists, /reagentChecklistTranslate\("Order item"\)/);
assert.match(reagentChecklists, /<details class="reagent-weekly-notes"/);
assert.match(reagentChecklists, /class="reagent-weekly-controls"/);
assert.match(reagentCss, /@media \(max-width: 760px\)[\s\S]*?\.reagent-weekly-section\s*\{\s*order:\s*-1;/s,
  "the weekly check must appear before list administration on mobile");
assert.match(reagentCss, /@media \(max-width: 760px\)[\s\S]*?\.reagent-weekly-row\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s,
  "weekly rows must collapse to accessible cards on mobile");
assert.match(reagentCss, /@media \(max-width: 420px\)[\s\S]*?\.reagent-weekly-controls\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  "weekly inputs must use one column on narrow phones");
assert.match(reagentCss, /@media \(max-width: 760px\)[\s\S]*?\.reagent-checklist-summary\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s,
  "the mobile checklist summary must stay compact enough to expose the form");
assert.doesNotMatch(reagentCss, /#reagentWeeklyCheckForm > \.form-actions\s*\{[^}]*position:\s*sticky;/s,
  "the save action must not cover mobile checklist fields");

const app = read("app.js");
const indexIds = [...index.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = indexIds.filter((id, position) => indexIds.indexOf(id) !== position);
assert.deepEqual(duplicateIds, [], "HTML ids must stay unique after reorganizing the views");

[
  ["cellLineForm", "newCellLineButton"],
  ["cultureForm", "newCultureButton"],
  ["cryoBoxForm", "newCryoBoxButton"],
  ["projectForm", "newProjectButton"],
  ["differentiationRunForm", "newDifferentiationRunButton"],
  ["eventForm", "newEventButton"],
  ["protocolForm", "newProtocolButton"],
  ["protocolTaskForm", "newProtocolTaskButton"],
].forEach(([formId, buttonId]) => {
  assert.match(index, new RegExp(`<form class="[^"]*collapsible-editor[^"]*is-hidden[^"]*" id="${formId}"`), `${formId} must start closed`);
  assert.match(index, new RegExp(`id="${buttonId}"[^>]*data-open-editor="${formId}"[^>]*aria-expanded="false"`), `${buttonId} must disclose ${formId}`);
});
assert.equal([...index.matchAll(/data-reagent-section=/g)].length, 5, "reagents must expose five internal navigation tabs");
assert.equal([...index.matchAll(/data-reagent-panel=/g)].length, 5, "reagents must expose five matching panels");
const reagentStockMarkup = index.slice(index.indexOf('id="reagentStockPanel"'), index.indexOf('id="reagentCatalogPanel"'));
assert(reagentStockMarkup.indexOf("Current stock") < reagentStockMarkup.indexOf('id="reagentItemForm"'), "current stock must appear before the reagent editor");
assert.match(reagentStockMarkup, /id="newReagentItem"[^>]*aria-controls="reagentItemForm"[^>]*aria-expanded="false"/, "reagent stock needs an explicit add action");
assert.match(reagentStockMarkup, /<form class="form-grid is-hidden" id="reagentItemForm">/, "the reagent editor must start closed");
assert.match(app, /function setCollapsibleEditorOpen\(form, isOpen\)/, "shared editor disclosure must update form visibility");
assert.match(app, /const formId = form\.getAttribute\("id"\);/, "editor disclosure must not be shadowed by form controls named id");
assert.match(app, /resetterForCollapsibleEditor\(formId\)\?\.\(\{ keepOpen: true \}\)/, "new actions must reset editors before opening");
assert.match(app, /els\.newProtocolTaskButton\.disabled = manageableProtocols\.length === 0;/, "new protocol tasks must require an editable protocol");
assert.match(index, /name="schedule_action" type="radio" value="planned"/,
  "off-schedule completion must offer the original scheduled date");
assert.match(index, /I forgot to mark it/,
  "retroactive completion choice must explain its purpose");
assert.match(app, /scheduleAction === "planned"[\s\S]*actualDate: pending\.plannedDate/,
  "retroactive completion must persist the activity on the planned date");
assert.match(app, /elements\.reason\.required = !isRetroactive/,
  "retroactive completion must not require a deviation reason");
assert.match(index, /id="endCultureDialog"[\s\S]*Discard &amp; finish culture/,
  "active cultures must have an explicit discard workflow");
assert.match(app, /db\.rpc\("finish_culture"[\s\S]*await loadData\(\)/,
  "finishing a culture must use the transactional database operation and reload state");
assert.match(reagentOperations, /setReagentSection\("stock"\)/, "scanner matches must open reagent stock");
assert.match(reagentOperations, /setReagentSection\("catalog"\)/, "unknown scanner matches must open the reagent catalog");
assert.match(reagentInventory, /function setReagentFormOpen\(open, \{ scroll = true \} = \{\}\)/, "reagent editor visibility must be controlled centrally");
assert.match(reagentInventory, /function editReagentItem[\s\S]*openReagentForm\(\);/, "editing a reagent must reveal the editor");

console.log("UI regressions: translations, responsive layout, and scanner cancellation passed");
