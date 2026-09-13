const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const sql = fs.readFileSync(path.join(root, 'supabase/2026-09-13_trujillo_200.sql'), 'utf8');
const seed = JSON.parse(sql.split('$trujillo$')[1]);
const rows = fs.readFileSync(path.join(root, 'docs/protocols/Trujillo_200.csv'), 'utf8').trim().split(/\r?\n/).slice(1).map(row => row.split(','));
assert.equal(seed.protocol.expected_duration_days, Number(rows.at(-1)[1]));
const explicit = rows.filter(row => row[2] !== '-');
assert.equal(seed.tasks.length, explicit.length);
seed.tasks.forEach((task, i) => {
  assert.equal(task.task_day, Number(explicit[i][1]));
  assert.equal(task.title_pt, explicit[i][2].replace(' // ', ' / ').replace('uL', ' µL'));
  assert.equal(task.medium_pt, explicit[i][3].replaceAll('uM', ' µM'));
});
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const protocol = { id: 'p', ...seed.protocol, automatic_media_changes: false };
const state = { differentiationProtocols: [protocol], protocolTasks: seed.tasks.map((task, i) => ({ ...task, id: String(i), protocol_id: 'p' })), differentiationEvents: [] };
let language = 'en';
const ctx = vm.createContext({ state, window: { getAppLanguage: () => language },
  localizedProtocolTask: task => ({ ...task }),
  adjustedRunDay: (_, day) => day,
  addDateValueDays: (date, day) => new Date(Date.parse(date) + day * 86400000).toISOString().slice(0, 10),
  deviationsForRun: () => [], dateValueString: value => value,
  automaticMediumForRunDay: () => 'legacy medium',
});
vm.runInContext(app.slice(app.indexOf('function automaticMediumForDay('), app.indexOf('function completionEventForItem(')), ctx);
for (const lang of ['en', 'pt']) {
  language = lang;
  const schedule = ctx.buildRunSchedule({ id: 'r', protocol_id: 'p', day_zero_date: '2026-09-13' });
  assert.equal(schedule.filter(item => item.kind === 'automatic').length, 0);
  assert.deepEqual([...new Set(Array.from(schedule, item => item.task_day))], [0, 1, 2, 3, 4, 11, 18, 25, 32]);
  assert.equal(schedule.filter(item => item.task_day === 4).length, 2);
  assert.equal(schedule.filter(item => item.task_day === 11).length, 2);
}
delete protocol.automatic_media_changes;
assert.ok(ctx.buildRunSchedule({ id: 'r', protocol_id: 'p', day_zero_date: '2026-09-13' }).some(item => item.kind === 'automatic'));
assert.match(sql, /source\.automatic_media_changes/);
assert.match(sql, /task\.title_pt/);
console.log('Trujillo_200: CSV fidelity, bilingual checklist, explicit agenda and legacy scheduling passed.');
