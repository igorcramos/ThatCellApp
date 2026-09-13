const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
const index = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const migration = fs.readFileSync(require('node:path').join(__dirname, '../supabase/2026-09-13_multi_vessel_differentiation_runs.sql'), 'utf8');
const helper = app.slice(app.indexOf('function protocolsForSourceWell('), app.indexOf('function startAnotherDifferentiationProtocol('));
const state = {
  differentiationRuns: [
    { id: 'a', source_type: 'wells', source_vessel_id: 'plate', status: 'active' },
    { id: 'b', source_type: 'wells', source_vessel_id: 'plate', status: 'planned' },
    { id: 'old', source_type: 'vessel', source_vessel_id: 'plate', status: 'completed' },
    { id: 'other', source_type: 'vessel', source_vessel_id: 'other', status: 'active' },
  ],
  differentiationRunWells: [
    { differentiation_run_id: 'a', vessel_id: 'plate', well: 'A1' },
    { differentiation_run_id: 'b', vessel_id: 'plate', well: 'A2' },
  ],
};
const context = vm.createContext({
  state,
  cultureIdsForVessel: () => ['culture'],
  vesselIdsForDifferentiationRun: (run) => [run.source_vessel_id],
});
vm.runInContext(helper, context);
const ids = (well, excluded) => Array.from(context.protocolsForSourceWell('plate', well, excluded), run => run.id);
assert.deepEqual(ids('A1'), ['a']);
assert.deepEqual(ids('A2'), ['b']);
assert.deepEqual(ids('A3'), []);
assert.deepEqual(ids('A1', 'a'), []);
state.differentiationRuns.push({ id: 'whole', source_type: 'culture', source_culture_id: 'culture', status: 'paused' });
assert.deepEqual(ids('A3'), ['whole']);
assert.match(index, /id="differentiationVesselCheckboxes"/);
assert.match(app, /getCheckedValues\(els\.differentiationVesselCheckboxes\)/);
assert.match(app, /save_multi_vessel_differentiation_run/);
assert.match(migration, /create table if not exists public\.differentiation_run_vessels/);
assert.match(migration, /source_vessel_ids_arg uuid\[\]/);
assert.match(migration, /array_agg\(distinct source\.cell_line_id\)/);
console.log('Protocol subdivision: independent well selections and existing assignments passed');
