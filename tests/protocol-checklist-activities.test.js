const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
let language = 'en';
const state = { differentiationEvents: [] };
const context = vm.createContext({
  state, window: { getAppLanguage: () => language },
  localizedProtocolTask: task => ({ ...task }),
});
vm.runInContext(app.slice(app.indexOf('function protocolActivityTitles('), app.indexOf('function buildRunSchedule(')), context);
vm.runInContext(app.slice(app.indexOf('function completionEventForItem('), app.indexOf('function runScheduleColor(')), context);
const titles = title => Array.from(context.protocolActivityTitles(title));
assert.deepEqual(titles('Transfer to 10 cm ULA dish + neural induction'), ['Transfer to 10 cm ULA dish', 'neural induction']);
assert.deepEqual(titles('Add EGF / start Medium 2 + FGF2 + EGF'), ['Add EGF', 'start Medium 2 + FGF2 + EGF']);
assert.deepEqual(titles('Neural induction D1 (replace/add 1 mL)'), ['Neural induction D1 (replace/add 1 mL)']);
assert.deepEqual(titles('Medium 2 + FGF2 + EGF'), ['Medium 2 + FGF2 + EGF']);
assert.deepEqual(titles('Transfer; Image\nCollect'), ['Transfer', 'Image', 'Collect']);
const task = { id: 'task', title: 'Transfer / neural induction', title_pt: 'Transferir / indução neural' };
const activities = context.protocolChecklistActivities(task).map(item => ({ ...item, kind: 'task' }));
const run = { id: 'run' };
state.differentiationEvents.push({ id: 'event', differentiation_run_id: 'run', protocol_task_id: 'task', scheduled_activity_index: 1 });
assert.equal(context.completionEventForItem(run, activities[0]), undefined);
assert.equal(context.completionEventForItem(run, activities[1]).id, 'event');
assert.equal(context.completionEventForItem({ id: 'other-run' }, activities[1]), undefined);
language = 'pt';
const translated = context.protocolChecklistActivities(task);
assert.equal(translated[1].title, 'indução neural');
assert.equal(context.completionEventForItem(run, { ...translated[1], kind: 'task' }).id, 'event');
state.differentiationEvents.length = 0;
assert.equal(context.completionEventForItem(run, activities[1]), undefined);
state.differentiationEvents.push({ differentiation_run_id: 'run', protocol_task_id: 'another-task' });
assert.equal(context.completionEventForItem(run, activities[0]), undefined);
// Exercise the actual click handler, including reopening one of two checked items.
Object.assign(context, {
  ensureDb: () => true,
  actionableScheduleItems: () => activities,
  dateValueString: value => value,
  todayValue: () => '2026-09-12',
  protocolDayForDate: () => 0,
  showToast: () => {}, loadAll: async () => {},
  completeScheduledTask: async (selectedRun, item) => {
    state.differentiationEvents.push({ id: `event-${item.scheduled_activity_index}`,
      differentiation_run_id: selectedRun.id, protocol_task_id: item.id,
      scheduled_activity_index: item.scheduled_activity_index });
  },
  db: { from: () => ({ delete: () => ({ eq: async (field, id) => {
    state.differentiationEvents = state.differentiationEvents.filter(event => event.id !== id);
    return {};
  } }) }) },
});
state.differentiationRuns = [run];
activities.forEach(item => { item.task_day = 0; item.date = '2026-09-12'; });
vm.runInContext(app.slice(app.indexOf('async function toggleScheduledTask('), app.indexOf('function openTaskDeferral(')), context);
async function checkClicks() {
  const button = index => ({ dataset: { toggleScheduleTask: 'run', taskKind: 'task', taskId: 'task', taskDay: '0', taskActivity: String(index) } });
  await context.toggleScheduledTask(button(1));
  assert.equal(context.completionEventForItem(run, activities[0]), undefined);
  assert.equal(context.completionEventForItem(run, activities[1]).id, 'event-1');
  await context.toggleScheduledTask(button(0));
  await context.toggleScheduledTask(button(1));
  assert.equal(context.completionEventForItem(run, activities[0]).id, 'event-0');
  assert.equal(context.completionEventForItem(run, activities[1]), undefined);
  console.log('Protocol checklist: splitting, recipes, independent completion, reopening and language identity passed');
}
checkClicks().catch(error => { console.error(error); process.exitCode = 1; });
