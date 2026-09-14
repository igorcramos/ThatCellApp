const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const ctx = vm.createContext({});
vm.runInContext(app.slice(app.indexOf('function addDateValueDays('), app.indexOf('function dateValueString(')), ctx);
for (const [start, zero] of [['2026-09-13', '2026-09-14'], ['2026-12-31', '2027-01-01'], ['2028-02-29', '2028-03-01']]) {
  assert.equal(ctx.protocolDayZeroFromStart(start), zero);
  assert.equal(ctx.protocolStartFromDayZero(zero), start);
  assert.equal(ctx.protocolDayForDate(zero, start), -1);
  assert.equal(ctx.protocolDayForDate(zero, zero), 0);
  assert.equal(ctx.addDateValueDays(zero, -1), start);
}
assert.equal(ctx.protocolDayZeroFromStart(''), null);
assert.equal(ctx.protocolStartFromDayZero(null), '');
assert.match(app, /day_zero_date_arg: protocolDayZeroFromStart\(valueOrNull\(data.get\("start_date"\)\)\)/);
assert.match(app, /setFieldValue\(form, "start_date", protocolStartFromDayZero\(run.day_zero_date\)\)/);
console.log('Protocol start date: aggregation, calendar boundaries and edit round trips passed.');
