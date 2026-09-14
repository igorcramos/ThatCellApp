const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ScheduleCalendar = require('../schedule-calendar.js');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const functions = source.slice(source.indexOf('function printableScheduleText('), source.indexOf('\nasync function handleDifferentiationRunSubmit('));
const runs = [
  { id: 'a', run_name: 'Batch A', protocol: 'Protocol alpha', color: '#116655', items: [
    { date: '2026-09-15', task_day: 2, title: 'Feed A', medium: 'Medium A', notes: 'Private detailed note' },
    { date: '2026-09-15', task_day: 2, title: 'Collect A' },
  ] },
  { id: 'b', run_name: 'Batch B', protocol: 'Protocol beta', color: '#6655aa', items: [
    { date: '2026-09-15', task_day: 7, title: 'Feed B' },
    { date: '2026-10-01', task_day: 23, title: 'Collect B' },
  ] },
];
let printed = 0;
const context = vm.createContext({
  window: { ScheduleCalendar, print: () => printed++ },
  document: { querySelector: () => ({ checked: false }) },
  buildRunSchedule: run => run.items,
  dateValueString: date => date,
  escapeHtml: value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
  runScheduleColor: run => run.color,
  differentiationRunLabel: run => `${run.run_name} · ${run.protocol}`,
  deviationsForRun: () => [], todayValue: () => '2026-09-01', formatDate: value => value,
  state: { differentiationRuns: runs },
  els: { scheduleRunSelect: { value: 'b' }, calendarRunCheckboxes: {}, printSchedule: {} },
  getCheckedValues: () => ['a', 'b'], showToast: () => assert.fail('unexpected empty-export toast'),
});
vm.runInContext(functions, context);
const combined = context.printableScheduleHtml(runs);
assert.equal((combined.match(/class="print-month"/g) || []).length, 2, 'one shared month per date range, not a calendar per batch');
assert.match(combined, /Protocol alpha/);
assert.match(combined, /Protocol beta/);
assert.match(combined, /Feed A/);
assert.match(combined, /Feed B/);
assert.equal((combined.match(/<h3>Batch A<\/h3>/g) || []).length, 1, 'daily batch heading is shared by its tasks');
assert.doesNotMatch(combined, /Private detailed note/, 'compact export avoids repeating lengthy notes');
assert.match(context.printableScheduleHtml(runs, { includeDetails: true }), /Private detailed note/);
context.printSchedules(false);
assert.equal(printed, 1);
assert.match(context.els.printSchedule.innerHTML, /Feed A/);
assert.match(context.els.printSchedule.innerHTML, /Feed B/);
context.printSchedules(true);
assert.equal(printed, 2);
assert.doesNotMatch(context.els.printSchedule.innerHTML, /Feed A/);
assert.match(context.els.printSchedule.innerHTML, /Feed B/);

const denseEntries = Array.from({ length: 65 }, (_, id) => ({ date: '2026-09-15', id }));
const month = ScheduleCalendar.buildMonths(denseEntries)[0];
const weeks = ScheduleCalendar.buildPrintableWeeks(month);
const days = weeks.flat().filter(cell => cell?.date === '2026-09-15');
assert.equal(days.length, 1, 'crowded days remain in one calendar cell');
assert.deepEqual(days[0].entries.map(entry => entry.id), denseEntries.map(entry => entry.id), 'every activity is preserved exactly once');
assert.equal(weeks.length, month.weeks, 'dense days do not create sparse continuation weeks');
assert.ok(weeks.every(week => week.length === 7), 'weekday alignment is preserved');
assert.equal(month.cells.find(cell => cell?.date === '2026-09-15').entries.length, 65, 'pagination does not mutate source schedules');
const denseRun = { ...runs[0], items: Array.from({ length: 12 }, (_, id) => ({ date: '2026-09-15', task_day: 2, title: `Activity ${id}` })) };
const denseHtml = context.printableScheduleHtml([denseRun]);
assert.equal((denseHtml.match(/datetime="2026-09-15"/g) || []).length, 1, 'export renders the busy date only once');
assert.equal((denseHtml.match(/<strong>Activity /g) || []).length, 12, 'export keeps all tasks in the date');
const stylesheet = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');
assert.match(stylesheet, /\.print-calendar-table thead \{ display: table-header-group;/, 'month, weekdays and legend repeat on printed continuation pages');
assert.doesNotMatch(stylesheet, /height: 145mm/);
console.log('Combined calendar: multi-protocol selection, compact grouping, detail option and whole-day pagination passed');
