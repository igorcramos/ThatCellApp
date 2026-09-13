/* The culture board is a view over existing records; selecting plates never mutates them. */
const cultureBoard = { selected: new Set(), filter: '', mode: 'batch', userId: null };

function cultureBoardRuns(vessel) {
  const cultureIds = cultureIdsForVessel(vessel.id);
  return state.differentiationRuns.filter((run) => run.status === 'active' && (vesselIdsForDifferentiationRun(run).includes(vessel.id) || (run.source_type === 'culture' && cultureIds.includes(run.source_culture_id))));
}

function cultureBoardPlates() {
  return state.vessels.filter((vessel) => {
    if (vessel.status && vessel.status !== 'active') return false;
    const cultures = cultureIdsForVessel(vessel.id).map((id) => state.cultures.find((item) => item.id === id)).filter(Boolean);
    const runs = cultureBoardRuns(vessel);
    return !cultures.length || cultures.some((culture) => culture.status === 'active') || runs.length > 0;
  });
}

function cultureBoardGroups(vessel) {
  if (cultureBoard.mode === 'batch') {
    const runs = cultureBoardRuns(vessel);
    if (runs.length) return runs.map((run) => ({ key: `batch:${run.id}`, label: run.run_name || 'Differentiation', color: runScheduleColor(run) }));
    return [{ key: 'batch:maintenance', label: 'Maintenance', color: '#718096' }];
  }
  const lines = uniqueValues(cultureIdsForVessel(vessel.id).flatMap(cellLineIdsForCulture).concat(state.vesselWells.filter((well) => well.vessel_id === vessel.id).flatMap((well) => lineageIdsForMappedWell(well))));
  if (cultureBoard.mode === 'type') {
    const types = uniqueValues(lines.map((id) => state.cellLines.find((line) => line.id === id)?.cell_type || 'Unassigned'));
    return (types.length ? types : ['Unassigned']).map((type) => ({ key: `type:${type}`, label: type, color: projectColor(type) }));
  }
  return lines.length ? lines.map((id) => {
    const line = state.cellLines.find((item) => item.id === id);
    return { key: `line:${id}`, label: line ? cellLineDisplayName(line) : 'Cell line', color: projectColor(id) };
  }) : [{ key: 'line:unknown', label: 'Unassigned', color: '#718096' }];
}

function cultureBoardColors() {
  try { return JSON.parse(localStorage.getItem(`cellapp-board-colors:${currentUserId() || 'guest'}`) || '{}') || {}; } catch { return {}; }
}
function cultureBoardColor(group) {
  const color = cultureBoardColors()[group.key];
  return /^#[0-9a-f]{6}$/i.test(color || '') ? color : (/^#[0-9a-f]{6}$/i.test(group.color || '') ? group.color : '#718096');
}

function renderCultureBoard() {
  const board = document.querySelector('#cultureBoard');
  if (!board) return;
  if (cultureBoard.userId !== currentUserId()) {
    cultureBoard.selected.clear();
    cultureBoard.userId = currentUserId();
  }
  const plates = cultureBoardPlates();
  const available = new Set(plates.map((plate) => plate.id));
  cultureBoard.selected.forEach((id) => { if (!available.has(id)) cultureBoard.selected.delete(id); });
  const visible = plates.filter((plate) => [plate.name, plate.location, ...cultureBoardGroups(plate).map((group) => group.label)].join(' ').toLowerCase().includes(cultureBoard.filter.toLowerCase()));
  const expanded = new Set([...board.querySelectorAll('details[open]')].map((item) => item.dataset.plateDetails));
  const groups = new Map();
  plates.forEach((plate) => cultureBoardGroups(plate).forEach((group) => {
    const entry = groups.get(group.key) || { ...group, count: 0 }; entry.count++; groups.set(group.key, entry);
  }));
  document.querySelector('#cultureBoardCount').textContent = `${plates.length} plates in culture`;
  document.querySelector('#cultureBoardSelection').textContent = `${cultureBoard.selected.size} selected`;
  document.querySelector('#cultureBoardBatch').disabled = !cultureBoard.selected.size;
  document.querySelector('#cultureBoardClear').disabled = !cultureBoard.selected.size;
  document.querySelector('#cultureBoardLegend').innerHTML = [...groups.values()].map((group) => `<label class="culture-board-legend-item"><input type="color" data-board-color="${escapeHtml(group.key)}" value="${cultureBoardColor(group)}" aria-label="Color for ${escapeHtml(group.label)}"><span>${escapeHtml(group.label)}</span><strong>${group.count}</strong></label>`).join('');
  board.innerHTML = visible.length ? visible.map((plate) => {
    const groups = cultureBoardGroups(plate);
    const cultures = cultureIdsForVessel(plate.id).map((id) => state.cultures.find((item) => item.id === id)).filter(Boolean);
    const events = state.events.filter((event) => event.vessel_id === plate.id).sort((a, b) => String(b.event_date).localeCompare(String(a.event_date)));
    return `<article class="culture-board-card${cultureBoard.selected.has(plate.id) ? ' is-selected' : ''}" style="--plate-color:${cultureBoardColor(groups[0])}">
      <label class="culture-board-title"><input type="checkbox" data-board-select="${plate.id}" ${cultureBoard.selected.has(plate.id) ? 'checked' : ''}><strong>${escapeHtml(plate.name)}</strong></label>
      <div class="culture-board-subtitle">${escapeHtml(plate.vessel_type || 'Plate')}${plate.location ? ` · ${escapeHtml(plate.location)}` : ''}</div>
      <div class="culture-board-tags">${groups.map((group) => `<span><i style="background:${cultureBoardColor(group)}" aria-hidden="true"></i>${escapeHtml(group.label)}</span>`).join('')}</div>
      <details data-plate-details="${plate.id}" ${expanded.has(plate.id) ? 'open' : ''}><summary>Details</summary><div class="culture-board-details">
      <p>${cultures.length ? cultures.map(cultureDisplayName).map(escapeHtml).join(' · ') : 'No linked culture'}</p>
      <p>${events.length ? `Last activity: ${escapeHtml(events[0].event_type || 'Observation')} · ${escapeHtml(events[0].event_date || '')}` : 'No plate activity recorded'}</p>
      ${plate.notes ? `<p>${escapeHtml(plate.notes)}</p>` : ''}
      <button type="button" class="secondary-button compact-button" data-board-map="${plate.id}">Open plate</button></div></details>
    </article>`;
  }).join('') : '<div class="empty-state">No plates match this view.</div>';
}

function setupCultureBoard() {
  const panel = document.querySelector('#cultureBoardPanel');
  if (!panel) return;
  document.querySelector('#cultureBoardFilter').addEventListener('input', (event) => { cultureBoard.filter = event.target.value; renderCultureBoard(); });
  document.querySelector('#cultureBoardMode').addEventListener('change', (event) => { cultureBoard.mode = event.target.value; renderCultureBoard(); });
  panel.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-board-select]');
    if (checkbox) { cultureBoard.selected[checkbox.checked ? 'add' : 'delete'](checkbox.dataset.boardSelect); renderCultureBoard();
      panel.querySelector(`[data-board-select="${checkbox.dataset.boardSelect}"]`)?.focus();
    }
    const color = event.target.closest('[data-board-color]');
    if (color) {
      const colors = cultureBoardColors(); colors[color.dataset.boardColor] = color.value;
      try { localStorage.setItem(`cellapp-board-colors:${currentUserId() || 'guest'}`, JSON.stringify(colors)); } catch { showToast('Color could not be saved in this browser.'); }
      renderCultureBoard();
    }
  });
  panel.addEventListener('click', (event) => {
    const map = event.target.closest('[data-board-map]');
    if (map) { setActiveView('culturesView'); state.selectedVesselId = map.dataset.boardMap; resetWellForm(); renderVessels(); els.plateMapPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    if (event.target.closest('#cultureBoardSelectAll')) {
      cultureBoardPlates().filter((plate) => [plate.name, plate.location, ...cultureBoardGroups(plate).map((group) => group.label)].join(' ').toLowerCase().includes(cultureBoard.filter.toLowerCase())).forEach((plate) => cultureBoard.selected.add(plate.id)); renderCultureBoard();
    }
    if (event.target.closest('#cultureBoardClear')) { cultureBoard.selected.clear(); renderCultureBoard(); }
    if (event.target.closest('#cultureBoardBatch') && cultureBoard.selected.size) {
      setActiveView('differentiationsView'); resetDifferentiationRunForm({ keepOpen: true });
      setFieldValue(els.differentiationRunForm, 'source_type', 'vessel');
      setCheckedValues(els.differentiationVesselCheckboxes, [...cultureBoard.selected]);
      syncDifferentiationSourceFields();
      els.differentiationRunForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      els.differentiationRunForm.elements.run_name.focus();
    }
  });
}
setupCultureBoard();
