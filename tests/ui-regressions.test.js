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

const reagentOperations = read("reagent-operations.js");
assert.match(reagentOperations, /scannerRequestId:\s*0/);
assert.match(reagentOperations, /requestId !== reagentOpsState\.scannerRequestId/);
assert.match(reagentOperations, /stream\?\.getTracks\?\.\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);

console.log("UI regressions: translations, responsive layout, and scanner cancellation passed");
