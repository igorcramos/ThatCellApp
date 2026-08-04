const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = {
  console,
  db: null,
  state: { authAvailable: false, session: null },
  document: {
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  },
  window: {
    addEventListener: () => {},
    setTimeout: () => 0,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    getAppLocale: () => "en-US",
  },
  Intl,
  setTimeout: () => 0,
};
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "..", "culture-media.js"), "utf8"),
  context,
  { filename: "culture-media.js" },
);

const calculate = context.window.CultureMediaCalculator.calculateComponent;
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} ≠ ${expected}`);

let result = calculate({
  calculation_mode: "dilution", stock_value: 50, stock_unit: "X", target_value: 1, target_unit: "X",
}, 100, "mL");
closeTo(result.liquidLiters, 0.002);
assert.equal(result.result, "2 mL");

result = calculate({
  calculation_mode: "dilution", stock_value: 10, stock_unit: "mM", target_value: 10, target_unit: "µM",
}, 1, "L");
closeTo(result.liquidLiters, 0.001);
assert.equal(result.result, "1 mL");

result = calculate({ calculation_mode: "percent_vv", target_value: 2 }, 100, "mL");
closeTo(result.liquidLiters, 0.002);
assert.equal(result.result, "2 mL");

result = calculate({ calculation_mode: "percent_wv", target_value: 1 }, 100, "mL");
assert.equal(result.result, "1 g");

result = calculate({
  calculation_mode: "mass_per_volume", rate_value: 5, rate_unit: "mg", reference_value: 100, reference_unit: "mL",
}, 1, "L");
assert.equal(result.result, "50 mg");

result = calculate({
  calculation_mode: "volume_per_volume", rate_value: 1, rate_unit: "mL", reference_value: 100, reference_unit: "mL",
}, 1, "L");
closeTo(result.liquidLiters, 0.01);
assert.equal(result.result, "10 mL");

result = calculate({
  calculation_mode: "dilution", stock_value: 100, stock_unit: "% v/v", target_value: 2, target_unit: "% v/v",
}, 100, "mL");
closeTo(result.liquidLiters, 0.002);

result = calculate({
  calculation_mode: "dilution", stock_value: 10, stock_unit: "mM", target_value: 1, target_unit: "X",
}, 100, "mL");
assert.match(result.error, /incompatible dimensions/);

console.log("culture media calculator: 8 assertions passed");
