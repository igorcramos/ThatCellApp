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
const protocol = { id: 'p', ...seed.protocol, automatic_media_changes: true };
const state = { differentiationProtocols: [protocol], protocolTasks: seed.tasks.map((task, i) => ({ ...task, id: String(i), protocol_id: 'p' })), differentiationEvents: [] };
let language = 'en';
const deviations = [];
const ctx = vm.createContext({ state, window: { getAppLanguage: () => language },
  localizedProtocolTask: task => ({ ...task }),
  adjustedRunDay: (_, day) => Number(day) + deviations.filter(deviation => Number(day) > deviation.after_protocol_day).reduce((total, deviation) => total + deviation.day_shift, 0),
  addDateValueDays: (date, day) => new Date(Date.parse(date) + day * 86400000).toISOString().slice(0, 10),
  deviationsForRun: () => deviations, deviationTypeLabel: type => type, dateValueString: value => value,
});
vm.runInContext(app.slice(app.indexOf('function automaticMediumForDay('), app.indexOf('function completionEventForItem(')), ctx);
for (const lang of ['en', 'pt']) {
  language = lang;
  const schedule = ctx.buildRunSchedule({ id: 'r', protocol_id: 'p', day_zero_date: '2026-09-10' });
  const intermediate = schedule.filter(item => item.kind === 'automatic' && item.task_day <= 31);
  assert.ok(intermediate.length > 0);
  assert.ok(intermediate.every(item => [1, 3, 5].includes(new Date(`${item.date}T12:00:00Z`).getUTCDay())));
  [[4, 11], [11, 18], [18, 25], [25, 32]].forEach(([start, end]) => {
    assert.ok(intermediate.some(item => item.task_day > start && item.task_day < end), `medium ${start}–${end} has an intermediate change`);
  });
  const expectedMedium = day => day >= 32 ? 'Medium 2 (maintenance)'
    : day >= 25 ? 'Medium 3'
      : day >= 18 ? 'Medium 2 + FGF2 + EGF'
        : day >= 11 ? 'Medium 2 + FGF2'
          : 'Medium 1';
  schedule.filter(item => item.kind === 'automatic').forEach(item => {
    assert.equal(item.medium, expectedMedium(item.task_day), `D${item.task_day} uses its fixed protocol phase medium`);
  });
  const maintenance = schedule.filter(item => item.kind === 'automatic' && item.task_day >= 32);
  assert.ok(maintenance.length > 0);
  assert.ok(maintenance.every(item => [1, 4].includes(new Date(`${item.date}T12:00:00Z`).getUTCDay())), 'maintenance uses Monday and Thursday');
  assert.equal(schedule.filter(item => item.task_day === 4).length, 2);
  assert.equal(schedule.filter(item => item.task_day === 11).length, 2);
}
protocol.automatic_media_changes = false;
assert.equal(ctx.buildRunSchedule({ id: 'r', protocol_id: 'p', day_zero_date: '2026-09-10' }).filter(item => item.kind === 'automatic').length, 0);
protocol.automatic_media_changes = true;
const alternativeSchedule = ctx.buildRunSchedule({ id: 'r-alt', protocol_id: 'p', day_zero_date: '2026-09-11', schedule_preferences: { media_cadence: 'alternative' } });
const alternative = alternativeSchedule.filter(item => item.kind === 'automatic' && item.task_day <= 31);
assert.ok(alternative.length > 0);
assert.ok(alternative.every(item => [0, 2, 4].includes(new Date(`${item.date}T12:00:00Z`).getUTCDay())), 'alternative cadence uses Tuesday, Thursday and Sunday');
const mediumDays = [...new Set(alternativeSchedule.filter(item => item.task_day >= 4 && item.task_day <= 31 && item.medium).map(item => item.task_day))].sort((a, b) => a - b);
assert.ok(mediumDays.every((day, index) => index === 0 || day - mediumDays[index - 1] > 1), 'alternative cadence avoids consecutive-day changes');
assert.ok(mediumDays.every((day, index) => index === 0 || day - mediumDays[index - 1] <= 3), 'alternative cadence never leaves more than three days between changes');

const aggProtocol = { ...protocol, id: 'agg', name: 'Trujillo_Agg', automatic_media_changes: true };
state.differentiationProtocols = [aggProtocol];
state.protocolTasks = seed.tasks.map((task, i) => ({ ...task, id: `agg-${i}`, protocol_id: 'agg' }));
const aggSchedule = ctx.buildRunSchedule({ id: 'agg-run', protocol_id: 'agg', day_zero_date: '2026-09-10' });
const expectedAggMedium = day => day >= 32 ? 'Medium 2 (maintenance)'
  : day >= 25 ? 'Medium 3'
    : day >= 18 ? 'Medium 2 + FGF2 + EGF'
      : day >= 11 ? 'Medium 2 + FGF2'
        : 'Medium 1';
aggSchedule.filter(item => item.kind === 'automatic').forEach(item => {
  assert.equal(item.medium, expectedAggMedium(item.task_day), `Trujillo_Agg D${item.task_day} uses its fixed phase medium`);
});
const aggMaintenance = aggSchedule.filter(item => item.kind === 'automatic' && item.task_day >= 32);
assert.ok(aggMaintenance.length > 0);
assert.ok(aggMaintenance.every(item => [1, 4].includes(new Date(`${item.date}T12:00:00Z`).getUTCDay())), 'Trujillo_Agg maintenance uses Monday and Thursday');

for (const cadence of ['preferred', 'alternative']) {
  for (let startOffset = 0; startOffset < 7; startOffset += 1) {
    state.differentiationProtocols = [protocol];
    state.protocolTasks = seed.tasks.map((task, i) => ({ ...task, id: String(i), protocol_id: 'p' }));
    const dayZero = ctx.addDateValueDays('2026-09-07', startOffset);
    const candidate = ctx.buildRunSchedule({ id: `r-${cadence}-${startOffset}`, protocol_id: 'p', day_zero_date: dayZero, schedule_preferences: { media_cadence: cadence } });
    [[4, 10], [11, 17], [18, 24], [25, 31]].forEach(([start, end]) => {
      const changeDays = new Set(candidate
        .filter(item => item.task_day >= start && item.task_day <= end && item.medium)
        .map(item => item.task_day));
      assert.equal(changeDays.size, 3, `${cadence} cadence has three medium changes in D${start}–D${end} when D0 offset is ${startOffset}`);
    });
  }
}

deviations.push({ after_protocol_day: 28, day_shift: -1, deviation_type: 'shortened_phase', reason: 'test' });
const deviatedSchedule = ctx.buildRunSchedule({ id: 'r-deviated', protocol_id: 'p', day_zero_date: '2026-09-10' });
assert.ok(deviatedSchedule.some(item => item.kind === 'task' && item.protocol_day === 32 && item.task_day === 32), 'a deviation does not move fixed D32 maintenance');
assert.equal(deviatedSchedule.find(item => item.kind === 'task' && item.protocol_day === 25)?.task_day, 25, 'a deviation does not move fixed Medium 3');
deviations.length = 0;

assert.match(sql, /source\.automatic_media_changes/);
assert.match(sql, /true, true\)/);
assert.match(sql, /task\.title_pt/);
console.log('Trujillo_200: CSV fidelity, bilingual checklist and intermediate M/W/F changes passed.');
