const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const sql = fs.readFileSync(path.join(__dirname, '../supabase/2026-09-13_cryo_thaw_slots.sql'), 'utf8');
function source(name, next) {
  const start = app.indexOf(`function ${name}(`);
  return app.slice(app.slice(Math.max(0, start - 6), start) === 'async ' ? start - 6 : start, app.indexOf(next, start));
}
const code = source('isStoredCryoVial', 'function cryoExportRows')
  + source('handleThawSelectedVials', 'async function handleDeleteSelectedVials')
  + source('protocolSaveErrorMessage', 'async function handleProtocolSubmit');
async function thaw({ error = null, selected = ['A1', 'A2', 'A3'], returned = [{ id: 'stored' }] } = {}) {
  const calls = [];
  const builder = {
    update(value) { calls.push(['update', value]); return this; },
    eq(...args) { calls.push(['eq', ...args]); return this; },
    in(...args) { calls.push(['in', ...args]); return this; },
    select() { return Promise.resolve({ data: returned, error }); },
  };
  const context = {
    state: { selectedCryoPositions: new Set(selected), cryoVials: [
      { id: 'stored', box_id: 'box', position: 'A1', status: 'reserved' },
      { id: 'old', box_id: 'box', position: 'A2', status: 'thawed' },
      { id: 'foreign', box_id: 'other', position: 'A3', status: 'available' },
    ] },
    els: { thawSelectedVials: { disabled: false }, cryoVialForm: { elements: { box_id: { value: 'box' } } } },
    db: { from(name) { calls.push(['from', name]); return builder; } },
    ensureDb: () => true, valueOrNull: (v) => v || null,
    showToast: (v) => calls.push(['toast', v]),
    resetCryoVialForm: () => calls.push(['reset']),
    loadAll: async () => calls.push(['load']),
    window: { confirm: () => true },
  };
  vm.createContext(context); vm.runInContext(code, context);
  await context.handleThawSelectedVials();
  assert.equal(context.els.thawSelectedVials.disabled, false);
  return { calls: JSON.parse(JSON.stringify(calls)), context };
}
(async () => {
  const { calls, context } = await thaw();
  assert.deepEqual(calls.find((c) => c[0] === 'in'), ['in', 'id', ['stored']], 'thaw only active selected IDs in current box');
  assert.deepEqual(calls.find((c) => c[0] === 'update'), ['update', { status: 'thawed' }]);
  assert(calls.some((c) => c[0] === 'reset'));
  assert.equal(context.isStoredCryoVial({ status: 'thawed' }), false);
  assert.equal(context.isStoredCryoVial({ status: 'discarded' }), false);
  assert.equal(context.isStoredCryoVial({ status: 'reserved' }), true);
  const failed = await thaw({ error: { message: 'permission denied' } });
  assert(!failed.calls.some((c) => c[0] === 'reset'), 'failed thaw retains selection');
  const missing = await thaw({ returned: [] });
  assert(!missing.calls.some((c) => c[0] === 'reset'), 'zero-row update must not report success');
  const empty = await thaw({ selected: ['A2'] });
  assert(!empty.calls.some((c) => c[0] === 'from'), 'archived vials cannot be thawed again');
  assert.match(context.protocolSaveErrorMessage({ code: 'PGRST116' }), /not saved/);
  assert.match(context.protocolSaveErrorMessage({ code: '42501' }), /ownership.*membership/);
  assert.match(context.protocolSaveErrorMessage({ code: 'PGRST204', message: 'is_shared missing' }), /database setup is incomplete/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /drop constraint if exists cryo_vials_box_id_position_key/);
  assert.match(sql, /on conflict \(box_id, position\) where status not in \('thawed', 'discarded'\)/);
  assert.doesNotMatch(sql, /delete from public.cryo_vials/i, 'slot reuse must preserve archived vials');
  console.log('cryo/protocol workflows: selection, failure recovery, archive-safe reuse, and actionable errors passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
