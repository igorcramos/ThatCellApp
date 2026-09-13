const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, { textContent: '', innerHTML: '', disabled: false, handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, querySelectorAll() { return []; }, querySelector() { return null; } });
  return elements.get(id);
}
const calls = [];
const storage = new Map();
const state = {
  vessels: [{id:'p1',name:'Alpha',vessel_type:'6 well',culture_id:'active'}, {id:'p2',name:'Beta',culture_id:'ended'}, {id:'p3',name:'Gamma'}, {id:'p4',name:'Delta',culture_id:'ended'}, {id:'p5',name:'Disposed',status:'discarded',culture_id:'active'}],
  cultures: [{id:'active',status:'active'}, {id:'ended',status:'discarded'}],
  differentiationRuns: [{id:'r1',status:'active',source_type:'culture',source_culture_id:'active',run_name:'Batch A'}, {id:'r2',status:'active',source_vessel_id:'p4',run_name:'Batch B'}],
  vesselWells: [], cellLines: [{id:'l1',identifier:'Neuron'}], events: [],
};
let userId = 'user1';
const ctx = { state, document: { querySelector: element }, localStorage:{ getItem:k=>storage.get(k), setItem:(k,v)=>storage.set(k,v) }, currentUserId:()=>userId,
  cultureIdsForVessel:id=>[state.vessels.find(p=>p.id===id)?.culture_id].filter(Boolean), vesselIdsForDifferentiationRun:run=>[run.source_vessel_id].filter(Boolean),
  uniqueValues:values=>[...new Set(values)], cellLineIdsForCulture:()=>['l1'], lineageIdsForMappedWell:()=>[], projectColor:()=> '#176f64', runScheduleColor:()=> '#2266aa', cellLineDisplayName:line=>line.identifier,
  cultureDisplayName:culture=>culture.id, escapeHtml:text=>String(text).replaceAll('<','&lt;'), showToast:message=>calls.push(message),
  setActiveView:view=>calls.push(['view',view]), resetWellForm:()=>{}, renderVessels:()=>{},
  resetDifferentiationRunForm:options=>calls.push(['reset',options.keepOpen]), setFieldValue:(form,key,value)=>calls.push([key,value]),
  setCheckedValues:(el,values)=>calls.push(['plates',Array.from(values)]), syncDifferentiationSourceFields:()=>calls.push(['sync']),
  els:{ differentiationRunForm:{scrollIntoView(){},elements:{run_name:{focus(){}}}}, differentiationVesselCheckboxes:{}, plateMapPanel:{scrollIntoView(){}} },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('culture-panel.js','utf8'),ctx);
assert.deepEqual(Array.from(vm.runInContext('cultureBoardPlates().map(p=>p.id)',ctx)), ['p1','p3','p4']);
assert.equal(vm.runInContext('cultureBoardGroups(state.vessels[0])[0].label',ctx),'Batch A');
vm.runInContext('renderCultureBoard(); cultureBoard.selected.add("p1"); cultureBoard.selected.add("p4"); renderCultureBoard()',ctx);
assert.equal(element('#cultureBoardSelection').textContent,'2 selected');
assert.equal(element('#cultureBoardBatch').disabled,false);
element('#cultureBoardPanel').handlers.click({ target:{ closest:selector=>selector==='#cultureBoardBatch'?{}:null } });
assert.deepEqual(calls.filter(c=>Array.isArray(c)&&c[0]==='plates'),[['plates',['p1','p4']]]);
assert.ok(calls.some(c=>c[0]==='source_type'&&c[1]==='vessel'));
element('#cultureBoardPanel').handlers.click({target:{closest:selector=>selector==='[data-board-map]'?{dataset:{boardMap:'p1'}}:null}});
assert.ok(calls.some(c=>c[0]==='view'&&c[1]==='culturesView'));
vm.runInContext('cultureBoard.selected.add("stale"); renderCultureBoard()',ctx);
assert.equal(vm.runInContext('cultureBoard.selected.has("stale")',ctx),false);
storage.set('cellapp-board-colors:user1',JSON.stringify({'batch:r1':'#abcdef'}));
assert.equal(vm.runInContext('cultureBoardColor(cultureBoardGroups(state.vessels[0])[0])',ctx),'#abcdef');
userId='user2'; vm.runInContext('renderCultureBoard()',ctx);
assert.equal(element('#cultureBoardSelection').textContent,'0 selected');
assert.equal(vm.runInContext('cultureBoardColor(cultureBoardGroups(state.vessels[0])[0])',ctx),'#2266aa');
storage.set('cellapp-board-colors:user2','not json');
assert.equal(vm.runInContext('cultureBoardColor(cultureBoardGroups(state.vessels[0])[0])',ctx),'#2266aa');
console.log('Culture board: active visibility, culture batches, multi-select handoff, navigation, stale selection and user-specific colors passed.');
