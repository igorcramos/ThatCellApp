const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const sql = fs.readFileSync(path.join(root, 'supabase/2026-09-13_victorlab_sloan.sql'), 'utf8');
const seed = JSON.parse(sql.split('$victorlab$')[1]);
const context = {
  console, db: null, state: { authAvailable: false, session: null },
  document: { querySelector: () => null, querySelectorAll: () => [], addEventListener() {} },
  window: { addEventListener() {}, setTimeout: () => 0,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, getAppLocale: () => 'en-US' },
  Intl, setTimeout: () => 0,
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'culture-media.js'), 'utf8'), context);
const calculate = context.window.CultureMediaCalculator.calculateComponent;
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

// Independent reference volumes from the working-media table in VictorLab_Sloan.docx.
const examples = [
  { final: 2, additions: [0.002, 0.001], base: 1.997 },
  { final: 10, additions: [0.010, 0.010, 0.010], base: 9.97 },
  { final: 10, additions: [0.010, 0.010], base: 9.98 },
  { final: 10, additions: [0.010, 0.010], base: 9.98 },
  { final: 10, additions: [0.010, 0.010], base: 9.98 },
  { final: 100, additions: [2, 1, 1], base: 96 },
];
assert.equal(seed.recipes.length, examples.length);
seed.recipes.forEach((recipe, i) => {
  const example = examples[i];
  assert.equal(recipe.components.length, example.additions.length);
  for (const scale of [1, 1.2, 10]) {
    let added = 0;
    recipe.components.forEach((component, j) => {
      const result = calculate(component, example.final * scale, 'mL');
      assert.ok(!result.error, `${recipe.name}: ${result.error}`);
      const mL = result.liquidLiters * 1000;
      near(mL, example.additions[j] * scale);
      added += mL;
    });
    near(example.final * scale - added, example.base * scale);
  }
});
assert.equal(seed.protocol.expected_duration_days, 100);
assert.deepEqual(seed.tasks.map(t => t.task_day), [
  -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  16, 18, 20, 22, 24, 25, 27, 29, 31, 33, 35, 37, 39, 41,
  43, 47, 51, 55, 59, 63, 67, 71, 75, 79, 83, 87, 91, 95, 99, 100,
]);
const task = day => seed.tasks.find(t => t.task_day === day);
assert.equal(task(1).task_type, 'Other');
assert.match(task(1).title, /no change/);
assert.doesNotMatch(task(2).medium, /ROCKi|Emricasen/);
assert.doesNotMatch(task(6).medium, /DM |SB /);
assert.doesNotMatch(task(25).medium, /FGF2|EGF/);
assert.equal(task(43).medium, 'Basal NM; no added growth factors');
assert.equal(task(100).task_type, 'Other');
assert.match(task(100).title, /D103, D107/);
seed.tasks.forEach(t => assert.ok(seed.recipes.some(r => t.notes === `Culture Media recipe: ${r.name}.`)));
assert.ok(seed.recipes[3].solvent_name.includes('Prepared'));
assert.ok(seed.recipes[4].solvent_name.includes('Prepared'));
assert.equal(seed.recipes[5].solvent_name, 'Neurobasal A');
console.log('VictorLab_Sloan: 47 scheduled days, phase transitions and all six calculator recipes verified.');
