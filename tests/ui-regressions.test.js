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
assert.match(mediaCss, /\.media-workspace\s*\{[^}]*min-width:\s*0;/s);
assert.match(mediaCss, /\.media-results-wrap\s*\{[^}]*max-width:\s*100%;[^}]*overflow-x:\s*auto;/s);

const appCss = read("styles.css");
assert.match(appCss, /body\s*\{[^}]*overflow-x:\s*clip;/s, "the app shell must not overflow the viewport");
assert.match(appCss, /@media \(max-width: 760px\)[\s\S]*?\.tabs\s*\{[^}]*flex-wrap:\s*wrap;[^}]*overflow-x:\s*clip;/s,
  "mobile navigation must wrap instead of requiring horizontal scrolling");
assert.match(appCss, /@media \(max-width: 760px\)[\s\S]*?\.schedule-task\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  "schedule cards must use one column on narrow screens");

const reagentOperations = read("reagent-operations.js");
assert.match(reagentOperations, /scannerRequestId:\s*0/);
assert.match(reagentOperations, /requestId !== reagentOpsState\.scannerRequestId/);
assert.match(reagentOperations, /stream\?\.getTracks\?\.\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);

const reagentChecklists = read("reagent-checklists.js");
assert.match(reagentChecklists, /data-check-quantity type="number" inputmode="decimal"/);
assert.match(reagentChecklists, /reagentChecklistTranslate\("Order item"\)/);
assert.match(reagentChecklists, /<details class="reagent-weekly-notes"/);

const index = read("index.html");
const app = read("app.js");
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

console.log("UI regressions: translations, responsive layout, and scanner cancellation passed");
