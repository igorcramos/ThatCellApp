const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const protocol = { id: 'microglia', name: 'Microglia (adaptation)', project: 'TBCK', target_cell_type: 'Microglia', expected_duration_days: 34, automatic_media_changes: true };
const protocolTasks = [
  { id: 'collect', protocol_id: 'microglia', task_day: 13, title: 'Harvest HPC', task_type: 'Collection' },
  { id: 'plate', protocol_id: 'microglia', task_day: 13, title: 'Plate HPCs', task_type: 'Replating', medium: 'iMBM + M-CSF + IL34' },
  { id: 'legacy', protocol_id: 'microglia', task_day: 16, title: 'iMBM + CSF + IL34', task_type: 'Factor addition' },
];
const state = { differentiationProtocols: [protocol], protocolTasks, differentiationEvents: [] };
const deviations = [];
const ctx = vm.createContext({
  state,
  window: { getAppLanguage: () => 'en' },
  localizedProtocolTask: task => ({ ...task }),
  adjustedRunDay: (_, day) => day,
  addDateValueDays: (date, day) => new Date(Date.parse(date) + day * 86400000).toISOString().slice(0, 10),
  deviationsForRun: () => deviations,
  deviationTypeLabel: type => type,
  dateValueString: value => value,
  automaticMediumForRunDay: () => 'fallback medium',
});
vm.runInContext(app.slice(app.indexOf('function automaticMediumForDay('), app.indexOf('function completionEventForItem(')), ctx);

const schedule = ctx.buildRunSchedule({ id: 'run', protocol_id: 'microglia', day_zero_date: '2026-09-01' });
const changes = schedule.filter(item => item.kind === 'automatic');
assert.ok(changes.length > 0);
assert.ok(changes.every(item => [2, 5].includes(new Date(`${item.date}T12:00:00Z`).getUTCDay())), 'all post-HPC changes use Tuesday or Friday');
assert.ok(changes.every(item => item.task_day > 13), 'automatic changes begin after HPC collection');
assert.ok(changes.every(item => item.medium === 'iMBM + M-CSF + IL34'), 'the plated HPC medium is carried forward');
assert.equal(schedule.some(item => item.id === 'legacy'), false, 'fixed every-three-day additions are replaced by the weekday cadence');
assert.ok(changes.every((item, index) => index === 0 || item.task_day - changes[index - 1].task_day <= 4), 'there are at most three full days between changes');

const original = changes[0];
deviations.push({ planned_date: original.date, day_shift: -1, after_protocol_day: original.task_day - 1 });
const anticipated = ctx.buildRunSchedule({ id: 'run', protocol_id: 'microglia', day_zero_date: '2026-09-01' })
  .find(item => item.kind === 'automatic' && item.title === original.title && item.task_day === original.task_day - 1);
assert.equal(anticipated.date, ctx.addDateValueDays(original.date, -1), 'an automatic task can be moved earlier');

console.log('protocol media schedules: Microglia cadence and automatic-task anticipation passed.');
