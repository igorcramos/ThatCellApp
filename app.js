const SUPABASE_URL = "https://rqvpzurlaxlopmhxivcn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdnB6dXJsYXhsb3BtaHhpdmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzU3NzgsImV4cCI6MjA5NjM1MTc3OH0.ylM3vX5hHKMmT_nkc4_FifCkpePUQyRm4TPx6MwCKBo";
const PHOTO_BUCKET = "culture-photos";

const supabaseClient = window.supabase || (typeof supabase !== "undefined" ? supabase : null);
const db = supabaseClient?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY) || null;

const state = {
  projects: [],
  cellLines: [],
  cultures: [],
  events: [],
  vessels: [],
  vesselWells: [],
  vesselCultures: [],
  cryoBoxes: [],
  cryoVials: [],
  differentiationProtocols: [],
  protocolTasks: [],
  differentiationRuns: [],
  differentiationRunWells: [],
  differentiationEvents: [],
  selectedVesselId: null,
  selectedWells: new Set(),
  selectedCryoBoxId: null,
  selectedCryoPositions: new Set(),
  cultureNameEdited: false,
};

const plateLayouts = {
  "6 well": { rows: ["A", "B"], columns: 3 },
  "12 well": { rows: ["A", "B", "C"], columns: 4 },
  "24 well": { rows: ["A", "B", "C", "D"], columns: 6 },
  "96 well": { rows: ["A", "B", "C", "D", "E", "F", "G", "H"], columns: 12 },
};

const statusLabels = {
  active: "Active",
  paused: "Paused",
  frozen: "Frozen",
  discarded: "Discarded",
  contaminated: "Contaminated",
  completed: "Completed",
};

const statusClass = {
  contaminated: "danger",
  discarded: "warning",
  frozen: "warning",
};

const defaultProjects = ["TBCK", "APOE-TAU"];

const projectColors = {
  TBCK: "#176f64",
  "APOE-TAU": "#8c4f9f",
};

const els = {
  connectionStatus: document.querySelector("#connectionStatus"),
  lastUpdated: document.querySelector("#lastUpdated"),
  cellLineForm: document.querySelector("#cellLineForm"),
  cultureForm: document.querySelector("#cultureForm"),
  vesselForm: document.querySelector("#vesselForm"),
  protocolForm: document.querySelector("#protocolForm"),
  protocolTaskForm: document.querySelector("#protocolTaskForm"),
  differentiationRunForm: document.querySelector("#differentiationRunForm"),
  eventForm: document.querySelector("#eventForm"),
  cellLinesList: document.querySelector("#cellLinesList"),
  culturesList: document.querySelector("#culturesList"),
  vesselsList: document.querySelector("#vesselsList"),
  protocolsList: document.querySelector("#protocolsList"),
  protocolTasksList: document.querySelector("#protocolTasksList"),
  differentiationRunsList: document.querySelector("#differentiationRunsList"),
  projectsList: document.querySelector("#projectsList"),
  activeCulturesList: document.querySelector("#activeCulturesList"),
  eventsList: document.querySelector("#eventsList"),
  cultureCellLineSelect: document.querySelector("#cultureCellLineSelect"),
  vesselCultureSelect: document.querySelector("#vesselCultureSelect"),
  vesselCultureCheckboxes: document.querySelector("#vesselCultureCheckboxes"),
  wellCellLineSelect: document.querySelector("#wellCellLineSelect"),
  wellCultureSelect: document.querySelector("#wellCultureSelect"),
  cryoBoxForm: document.querySelector("#cryoBoxForm"),
  cryoVialForm: document.querySelector("#cryoVialForm"),
  cryoBoxesList: document.querySelector("#cryoBoxesList"),
  cryoMapPanel: document.querySelector("#cryoMapPanel"),
  cryoMapTitle: document.querySelector("#cryoMapTitle"),
  cryoMapSubtitle: document.querySelector("#cryoMapSubtitle"),
  cryoMapGrid: document.querySelector("#cryoMapGrid"),
  cryoCellLineSelect: document.querySelector("#cryoCellLineSelect"),
  cryoCellTypeSelect: document.querySelector("#cryoCellTypeSelect"),
  customCryoCellTypeLabel: document.querySelector("#customCryoCellTypeLabel"),
  cryoProjectSelect: document.querySelector("#cryoProjectSelect"),
  customCryoProjectLabel: document.querySelector("#customCryoProjectLabel"),
  cryoSearchInput: document.querySelector("#cryoSearchInput"),
  cryoSearchResults: document.querySelector("#cryoSearchResults"),
  cryoLookupBody: document.querySelector("#cryoLookupBody"),
  toggleCryoLookup: document.querySelector("#toggleCryoLookup"),
  cryoBoxSubmitButton: document.querySelector("#cryoBoxSubmitButton"),
  cancelCryoBoxEdit: document.querySelector("#cancelCryoBoxEdit"),
  cryoVialSubmitButton: document.querySelector("#cryoVialSubmitButton"),
  clearCryoSelection: document.querySelector("#clearCryoSelection"),
  deleteSelectedVials: document.querySelector("#deleteSelectedVials"),
  differentiationProtocolSelect: document.querySelector("#differentiationProtocolSelect"),
  taskProtocolSelect: document.querySelector("#taskProtocolSelect"),
  differentiationSourceType: document.querySelector("#differentiationSourceType"),
  differentiationCultureLabel: document.querySelector("#differentiationCultureLabel"),
  differentiationCultureSelect: document.querySelector("#differentiationCultureSelect"),
  differentiationVesselLabel: document.querySelector("#differentiationVesselLabel"),
  differentiationVesselSelect: document.querySelector("#differentiationVesselSelect"),
  differentiationWellsPanel: document.querySelector("#differentiationWellsPanel"),
  differentiationWellCheckboxes: document.querySelector("#differentiationWellCheckboxes"),
  differentiationEventDate: document.querySelector("#differentiationEventDate"),
  activityTargetTypeSelect: document.querySelector("#activityTargetTypeSelect"),
  eventCulturesPanel: document.querySelector("#eventCulturesPanel"),
  eventPassageLabel: document.querySelector("#eventPassageLabel"),
  eventVesselLabel: document.querySelector("#eventVesselLabel"),
  eventVesselSelect: document.querySelector("#eventVesselSelect"),
  performedBySelect: document.querySelector("#performedBySelect"),
  customPerformedByLabel: document.querySelector("#customPerformedByLabel"),
  eventCultureSelect: document.querySelector("#eventCultureSelect"),
  eventCultureCheckboxes: document.querySelector("#eventCultureCheckboxes"),
  historyProjectFilter: document.querySelector("#historyProjectFilter"),
  historyCultureFilter: document.querySelector("#historyCultureFilter"),
  protocolTaskProjectFilter: document.querySelector("#protocolTaskProjectFilter"),
  projectViewFilter: document.querySelector("#projectViewFilter"),
  cultureProjectSelect: document.querySelector("#cultureProjectSelect"),
  customCultureProjectLabel: document.querySelector("#customCultureProjectLabel"),
  initialCellTypeSelect: document.querySelector("#initialCellTypeSelect"),
  customInitialCellTypeLabel: document.querySelector("#customInitialCellTypeLabel"),
  createPlateFromCultureButton: document.querySelector("#createPlateFromCultureButton"),
  addPlateButton: document.querySelector("#addPlateButton"),
  protocolProjectSelect: document.querySelector("#protocolProjectSelect"),
  customProtocolProjectLabel: document.querySelector("#customProtocolProjectLabel"),
  runProjectSelect: document.querySelector("#runProjectSelect"),
  customRunProjectLabel: document.querySelector("#customRunProjectLabel"),
  projectForm: document.querySelector("#projectForm"),
  projectSubmitButton: document.querySelector("#projectSubmitButton"),
  cancelProjectEdit: document.querySelector("#cancelProjectEdit"),
  eventTypeSelect: document.querySelector("#eventTypeSelect"),
  plateMapPanel: document.querySelector("#plateMapPanel"),
  plateMapTitle: document.querySelector("#plateMapTitle"),
  plateMapSubtitle: document.querySelector("#plateMapSubtitle"),
  plateMapGrid: document.querySelector("#plateMapGrid"),
  wellForm: document.querySelector("#wellForm"),
  clearWellForm: document.querySelector("#clearWellForm"),
  deleteSelectedWells: document.querySelector("#deleteSelectedWells"),
  lineCount: document.querySelector("#lineCount"),
  activeCultureCount: document.querySelector("#activeCultureCount"),
  vesselCount: document.querySelector("#vesselCount"),
  cryoVialCount: document.querySelector("#cryoVialCount"),
  differentiationCount: document.querySelector("#differentiationCount"),
  eventCount: document.querySelector("#eventCount"),
  refreshToday: document.querySelector("#refreshToday"),
  toast: document.querySelector("#toast"),
  cellLineSubmitButton: document.querySelector("#cellLineSubmitButton"),
  cancelCellLineEdit: document.querySelector("#cancelCellLineEdit"),
  cultureSubmitButton: document.querySelector("#cultureSubmitButton"),
  cancelCultureEdit: document.querySelector("#cancelCultureEdit"),
  vesselSubmitButton: document.querySelector("#vesselSubmitButton"),
  cancelVesselEdit: document.querySelector("#cancelVesselEdit"),
  protocolSubmitButton: document.querySelector("#protocolSubmitButton"),
  cancelProtocolEdit: document.querySelector("#cancelProtocolEdit"),
  protocolTaskSubmitButton: document.querySelector("#protocolTaskSubmitButton"),
  cancelProtocolTaskEdit: document.querySelector("#cancelProtocolTaskEdit"),
  differentiationRunSubmitButton: document.querySelector("#differentiationRunSubmitButton"),
  cancelDifferentiationRunEdit: document.querySelector("#cancelDifferentiationRunEdit"),
  eventSubmitButton: document.querySelector("#eventSubmitButton"),
  cancelEventEdit: document.querySelector("#cancelEventEdit"),
  speciesSelect: document.querySelector("#speciesSelect"),
  customSpeciesLabel: document.querySelector("#customSpeciesLabel"),
  cellTypeSelect: document.querySelector("#cellTypeSelect"),
  customCellTypeLabel: document.querySelector("#customCellTypeLabel"),
  crisprCheckbox: document.querySelector("#crisprCheckbox"),
  crisprFields: document.querySelector("#crisprFields"),
  transgeneCheckbox: document.querySelector("#transgeneCheckbox"),
  transgeneFields: document.querySelector("#transgeneFields"),
  fluorescenceSelect: document.querySelector("#fluorescenceSelect"),
  customFluorescenceLabel: document.querySelector("#customFluorescenceLabel"),
};

function valueOrNull(value) {
  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed === "" ? null : trimmed;
}

function numberOrNull(value) {
  return value === "" || value === null ? null : Number(value);
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function composedCellLineName(identifier, clone) {
  return [identifier, clone].filter(Boolean).join(" - ");
}

function valueFromSelectWithCustom(data, selectName, customName) {
  const selected = valueOrNull(data.get(selectName));
  if (selected !== "__add") return selected;
  return valueOrNull(data.get(customName));
}

function setFieldValue(form, name, value) {
  const field = form.elements[name];
  if (!field) return;
  if (field.type === "checkbox") {
    field.checked = Boolean(value);
    return;
  }
  field.value = value ?? "";
}

function setSelectOrCustom(select, customInput, value) {
  const normalized = valueOrNull(value);
  if (!normalized) {
    select.value = "";
    customInput.value = "";
    return;
  }

  const hasOption = Array.from(select.options).some((option) => option.value === normalized);
  if (hasOption) {
    select.value = normalized;
    customInput.value = "";
    return;
  }

  select.value = "__add";
  customInput.value = normalized;
}

function setMultiSelectValues(select, values) {
  const selected = new Set((values || []).filter(Boolean));
  Array.from(select.options).forEach((option) => {
    option.selected = selected.has(option.value);
  });
}

function getCheckedValues(container) {
  return Array.from(container.querySelectorAll("input[type='checkbox']:checked"))
    .map((input) => input.value)
    .filter(Boolean);
}

function setCheckedValues(container, values) {
  const selected = new Set((values || []).filter(Boolean));
  container.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function setDefaultDate(form, name) {
  const field = form.elements[name];
  if (field && !field.value) field.value = todayValue();
}

function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function projectValues() {
  return uniqueValues([
    ...defaultProjects,
    ...state.projects.map((project) => project.name),
    ...state.cultures.map((culture) => culture.project),
    ...state.cryoBoxes.map((box) => box.project),
    ...state.differentiationProtocols.map((protocol) => protocol.project),
    ...state.differentiationRuns.map((run) => run.project),
  ]).sort((a, b) => a.localeCompare(b));
}

function projectRecord(name) {
  return state.projects.find((project) => project.name === name);
}

function projectColor(project) {
  if (!project) return "#68756d";
  const savedProject = projectRecord(project);
  if (savedProject?.color) return savedProject.color;
  if (projectColors[project]) return projectColors[project];
  let hash = 0;
  for (const char of project) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return `hsl(${hash}, 45%, 42%)`;
}

function projectBadge(project) {
  if (!project) return "";
  const color = projectColor(project);
  return `<span class="project-chip" style="--project-color: ${escapeHtml(color)}">${escapeHtml(project)}</span>`;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.setTimeout(() => els.toast.classList.remove("is-visible"), 3200);
}

function setStatus(kind, label) {
  els.connectionStatus.textContent = label;
  els.connectionStatus.classList.toggle("is-ok", kind === "ok");
  els.connectionStatus.classList.toggle("is-error", kind === "error");
}

function setLastUpdated() {
  els.lastUpdated.textContent = `Last updated: ${formatDateTime(new Date().toISOString())}`;
}

function setLastChecked() {
  els.lastUpdated.textContent = `Last checked: ${formatDateTime(new Date().toISOString())}`;
}

function setLoadIssue(message) {
  els.lastUpdated.textContent = `Last checked: ${formatDateTime(new Date().toISOString())} | ${message}`;
  console.error(message);
}

function ensureDb() {
  if (db) return true;
  setStatus("error", "Offline");
  setLastChecked();
  showToast("Database library did not load. Try the localhost URL or refresh the page.");
  return false;
}

function withTimeout(promise, ms, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function addDays(dateValue, days) {
  if (!dateValue || days === null) return null;
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + Number(days));
  return date;
}

function formatEstimatedCompletion(dayZeroDate, taskDay, durationHours) {
  const start = addDays(dayZeroDate, taskDay);
  if (!start) return null;
  const dueDate = formatDate(start.toISOString().slice(0, 10));
  if (durationHours === null) return `Due ${dueDate}`;
  const end = new Date(start.getTime() + Number(durationHours) * 3600000);
  return `Due ${dueDate}; est. done ${formatDateTime(end.toISOString())}`;
}

function cultureDisplayName(culture) {
  if (!culture) return "Culture";
  const lineName = culture.cell_lines?.name || "Cell line";
  return culture.culture_name || `${lineName}${culture.passage_number !== null ? ` P${culture.passage_number}` : ""}`;
}

function cellLineDisplayName(line) {
  return line?.name || composedCellLineName(line?.identifier, line?.clone) || "Cell line";
}

function isMultiwell(vesselType) {
  return Boolean(plateLayouts[vesselType]);
}

function wellsForVesselType(vesselType) {
  const layout = plateLayouts[vesselType];
  if (!layout) return [];
  return layout.rows.flatMap((row) =>
    Array.from({ length: layout.columns }, (_, index) => `${row}${index + 1}`)
  );
}

function vesselDisplayName(vessel) {
  if (!vessel) return "Plate";
  return `${vessel.name}${vessel.vessel_type ? ` (${vessel.vessel_type})` : ""}`;
}

function cryoBoxDisplayName(box) {
  if (!box) return "Cryobox";
  return `${box.name}${box.freezer ? ` (${box.freezer})` : ""}`;
}

function cryoBoxLocation(box) {
  return [box?.freezer, box?.rack, box?.shelf, box?.drawer, box?.box_position].filter(Boolean).join(" / ");
}

function cryoVialLineage(vial) {
  return vial?.cell_lines?.name || vial?.lineage || "Unlabeled cell line";
}

function cryoVialSlotLabel(vial) {
  if (!vial) return "";
  return [cryoVialLineage(vial), vial.cell_type].filter(Boolean).join(" - ");
}

function cryoVialSearchText(vial, box) {
  return [
    cryoVialLineage(vial),
    vial?.cell_type,
    vial?.cell_lines?.name,
    box?.name,
    cryoBoxLocation(box),
    vial?.position,
  ].filter(Boolean).join(" ").toLowerCase();
}

function cryoRows(count) {
  return Array.from({ length: Math.max(1, Number(count || 9)) }, (_, index) =>
    String.fromCharCode(65 + index)
  );
}

function cryoPositionsForBox(box) {
  const rows = cryoRows(box?.rows_count || 9);
  const columns = Math.max(1, Number(box?.columns_count || 9));
  return rows.flatMap((row) =>
    Array.from({ length: columns }, (_, index) => `${row}${index + 1}`)
  );
}

function cultureIdsForVessel(vesselId) {
  const vessel = state.vessels.find((item) => item.id === vesselId);
  return uniqueValues([
    ...state.vesselCultures
      .filter((link) => link.vessel_id === vesselId)
      .map((link) => link.culture_id),
    vessel?.culture_id,
    ...state.vesselWells
      .filter((well) => well.vessel_id === vesselId)
      .map((well) => well.culture_id),
  ]);
}

function projectForVessel(vesselId) {
  const cultureId = cultureIdsForVessel(vesselId)[0];
  const culture = state.cultures.find((item) => item.id === cultureId);
  return culture?.project || null;
}

function basePlateName(culture, fallbackCellLineId) {
  const line = culture?.cell_lines || state.cellLines.find((item) => item.id === fallbackCellLineId);
  return cultureDisplayName(culture) || line?.name || "Culture";
}

function suggestedCultureName() {
  const cellLineId = els.cultureForm.elements.cell_line_id.value;
  const line = state.cellLines.find((item) => item.id === cellLineId);
  const date = els.cultureForm.elements.start_date.value || todayValue();
  return [line ? cellLineDisplayName(line) : "Culture", formatDate(date)].join(" - ");
}

function syncCultureNameSuggestion(force = false) {
  const field = els.cultureForm.elements.culture_name;
  if (els.cultureForm.elements.id.value && !force) return;
  if (!force && state.cultureNameEdited) return;
  field.value = suggestedCultureName();
}

async function createPlatesForCulture(culture, options) {
  const plateType = valueOrNull(options.plateType);
  const plateCount = Math.max(0, Number(options.plateCount || 0));
  if (!plateType || plateCount === 0) return [];

  const baseName = basePlateName(culture, culture.cell_line_id);
  const plates = Array.from({ length: plateCount }, (_, index) => ({
    name: plateCount === 1 ? `${baseName} plate` : `${baseName} plate ${index + 1}`,
    vessel_type: plateType,
    culture_id: culture.id,
    location: culture.location || null,
    status: "active",
    notes: options.wholePlate ? "Whole plate same condition." : "Map wells for specific conditions.",
  }));

  const { data: savedPlates, error } = await db
    .from("culture_vessels")
    .insert(plates)
    .select("id, vessel_type");

  if (error) throw error;

  const links = (savedPlates || []).map((plate) => ({
    vessel_id: plate.id,
    culture_id: culture.id,
  }));
  if (links.length > 0) {
    const { error: linkError } = await db.from("vessel_cultures").insert(links);
    if (linkError) throw linkError;
  }

  return savedPlates || [];
}

async function handleCreatePlateFromCulture() {
  if (!ensureDb()) return;
  const form = els.cultureForm;
  const cultureId = valueOrNull(form.elements.id.value);
  if (!cultureId) {
    showToast("Save the culture before creating plates from it.");
    return;
  }

  const culture = state.cultures.find((item) => item.id === cultureId);
  if (!culture) {
    showToast("Culture not found. Refresh and try again.");
    return;
  }

  const plateType = valueOrNull(form.elements.vessel_type.value);
  if (!plateType) {
    showToast("Choose an initial plate type first.");
    return;
  }

  const plateCountValue = numberOrNull(form.elements.plate_count.value);
  const plateCount = plateCountValue === null ? 1 : plateCountValue;
  const wholePlate = form.elements.whole_plate.checked;
  try {
    const createdPlates = await createPlatesForCulture(
      {
        ...culture,
        culture_name: valueOrNull(form.elements.culture_name.value) || culture.culture_name,
        location: valueOrNull(form.elements.location.value) || culture.location,
      },
      { plateType, plateCount, wholePlate }
    );
    showToast(createdPlates.length ? `${createdPlates.length} plate${createdPlates.length === 1 ? "" : "s"} created.` : "No plates created.");
    await loadAll();
    if (!wholePlate && createdPlates.length > 0 && isMultiwell(createdPlates[0].vessel_type)) {
      state.selectedVesselId = createdPlates[0].id;
      renderVessels();
    }
  } catch (error) {
    showToast(`Error creating plate: ${error.message}`);
  }
}

function daysSince(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  const start = new Date(`${dateValue}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  return Math.round((today - start) / 86400000);
}

function daysBetween(startValue, endValue) {
  if (!startValue || !endValue) return null;
  const start = new Date(`${startValue}T00:00:00`);
  const end = new Date(`${endValue}T00:00:00`);
  return Math.round((end - start) / 86400000);
}

function differentiationSourceLabel(run) {
  if (run.source_type === "culture") {
    return cultureDisplayName(state.cultures.find((culture) => culture.id === run.source_culture_id));
  }
  if (run.source_type === "vessel") {
    return vesselDisplayName(state.vessels.find((vessel) => vessel.id === run.source_vessel_id));
  }
  const wells = state.differentiationRunWells
    .filter((well) => well.differentiation_run_id === run.id)
    .map((well) => well.well)
    .sort();
  return `${vesselDisplayName(state.vessels.find((vessel) => vessel.id === run.source_vessel_id))}: ${wells.join(", ") || "selected wells"}`;
}

function differentiationRunLabel(run) {
  if (!run) return "Differentiation run";
  const protocol = state.differentiationProtocols.find((item) => item.id === run.protocol_id);
  return [run.run_name, protocol?.name].filter(Boolean).join(" - ");
}

function projectForDifferentiationRun(run) {
  const protocol = state.differentiationProtocols.find((item) => item.id === run?.protocol_id);
  return run?.project || protocol?.project || null;
}

function computeDifferentiationEventDay(runId, eventDate) {
  const run = state.differentiationRuns.find((item) => item.id === runId);
  return daysBetween(run?.day_zero_date, eventDate);
}

function renderOptions() {
  const lineOptions = state.cellLines
    .map((line) => `<option value="${line.id}">${escapeHtml(cellLineDisplayName(line))}</option>`)
    .join("");

  els.cultureCellLineSelect.innerHTML = lineOptions || '<option value="">Add a cell line first</option>';
  els.cultureCellLineSelect.disabled = state.cellLines.length === 0;
  els.wellCellLineSelect.innerHTML = [
    '<option value="">Not specified</option>',
    lineOptions,
  ].join("");
  els.cryoCellLineSelect.innerHTML = [
    '<option value="">Select cell line</option>',
    lineOptions,
  ].join("");
  els.cryoCellLineSelect.disabled = state.cellLines.length === 0;

  const cultureOptions = state.cultures
    .map((culture) => `<option value="${culture.id}">${escapeHtml(cultureDisplayName(culture))}</option>`)
    .join("");

  els.eventCultureSelect.innerHTML = cultureOptions || '<option value="">Start a culture first</option>';
  els.eventCultureSelect.disabled = state.cultures.length === 0;
  els.differentiationCultureSelect.innerHTML = cultureOptions || '<option value="">Start a culture first</option>';
  els.eventCultureCheckboxes.innerHTML = state.cultures.length
    ? state.cultures
      .map((culture) => `
        <label class="checkbox-label">
          <input type="checkbox" value="${culture.id}">
          ${escapeHtml(cultureDisplayName(culture))}
        </label>
      `)
      .join("")
    : '<div class="empty-state">Start a culture first.</div>';
  els.vesselCultureSelect.innerHTML = cultureOptions || '<option value="">Start a culture first</option>';
  els.vesselCultureCheckboxes.innerHTML = state.cultures.length
    ? state.cultures
      .map((culture) => `
        <label class="checkbox-label">
          <input type="checkbox" value="${culture.id}">
          ${escapeHtml(cultureDisplayName(culture))}
        </label>
      `)
      .join("")
    : '<div class="empty-state">Start a culture first.</div>';
  els.wellCultureSelect.innerHTML = [
    '<option value="">Not specified</option>',
    cultureOptions,
  ].join("");

  els.historyCultureFilter.innerHTML = [
    '<option value="">All cultures</option>',
    cultureOptions,
  ].join("");

  const selectedHistoryProject = els.historyProjectFilter.value;
  const selectedTaskProject = els.protocolTaskProjectFilter.value;
  const selectedProjectView = els.projectViewFilter.value;
  const projectOptions = projectValues()
    .map((project) => `<option value="${escapeHtml(project)}">${escapeHtml(project)}</option>`)
    .join("");
  els.historyProjectFilter.innerHTML = [
    '<option value="">All projects</option>',
    projectOptions,
  ].join("");
  els.protocolTaskProjectFilter.innerHTML = [
    '<option value="">All projects</option>',
    projectOptions,
  ].join("");
  els.projectViewFilter.innerHTML = [
    '<option value="">All projects</option>',
    projectOptions,
  ].join("");
  const cryoSelectedProject = els.cryoProjectSelect.value;
  els.cryoProjectSelect.innerHTML = [
    '<option value="">Not specified</option>',
    projectOptions,
    '<option value="__add">Add...</option>',
  ].join("");
  els.historyProjectFilter.value = selectedHistoryProject;
  els.protocolTaskProjectFilter.value = selectedTaskProject;
  els.projectViewFilter.value = selectedProjectView;
  els.cryoProjectSelect.value = cryoSelectedProject;

  const vesselOptions = state.vessels
    .map((vessel) => {
      const linkedCultures = cultureIdsForVessel(vessel.id)
        .map((cultureId) => state.cultures.find((culture) => culture.id === cultureId))
        .filter(Boolean)
        .map(cultureDisplayName);
      const label = linkedCultures.length
        ? `${vesselDisplayName(vessel)} - ${linkedCultures.join(", ")}`
        : vesselDisplayName(vessel);
      return `<option value="${vessel.id}">${escapeHtml(label)}</option>`;
    })
    .join("");
  els.differentiationVesselSelect.innerHTML = vesselOptions || '<option value="">Create a plate first</option>';
  els.eventVesselSelect.innerHTML = [
    '<option value="">No plate</option>',
    vesselOptions,
  ].join("");

  const protocolOptions = state.differentiationProtocols
    .map((protocol) => `<option value="${protocol.id}">${escapeHtml(protocol.name)}</option>`)
    .join("");
  els.differentiationProtocolSelect.innerHTML = protocolOptions || '<option value="">Save a protocol first</option>';
  els.differentiationProtocolSelect.disabled = state.differentiationProtocols.length === 0;
  els.taskProtocolSelect.innerHTML = protocolOptions || '<option value="">Save a protocol first</option>';
  els.taskProtocolSelect.disabled = state.differentiationProtocols.length === 0;

  renderDifferentiationWellCheckboxes();
  syncCultureNameSuggestion();
}

function renderCellLines() {
  if (state.cellLines.length === 0) {
    els.cellLinesList.innerHTML = '<div class="empty-state">No cell lines saved yet.</div>';
    return;
  }

  els.cellLinesList.innerHTML = state.cellLines
    .map((line) => {
      const title = line.name || composedCellLineName(line.identifier, line.clone);
      const modifications = [
        line.has_crispr ? "CRISPR" : null,
        line.has_transgene ? "Transgene" : null,
        line.fluorescence ? `${line.fluorescence} fluorescence` : null,
      ].filter(Boolean);
      const meta = [line.species, line.cell_type, line.source, ...modifications].filter(Boolean);
      return `
        <article class="item">
          <div>
            <div class="item-title">${escapeHtml(title)}</div>
            <div class="item-meta">
              ${meta.length ? meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("") : "<span>No additional details</span>"}
            </div>
          </div>
          <div class="item-actions">
            <button class="icon-button edit-button" data-edit-cell-line="${line.id}" type="button" title="Edit cell line" aria-label="Edit cell line">&#9998;</button>
            <button class="icon-button danger-button" data-delete-cell-line="${line.id}" type="button" title="Delete cell line" aria-label="Delete cell line">&#128465;</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCultures() {
  if (state.cultures.length === 0) {
    els.culturesList.innerHTML = '<div class="empty-state">No cultures started yet.</div>';
  } else {
    els.culturesList.innerHTML = state.cultures.map(renderCultureItem).join("");
  }

  const activeCultures = state.cultures.filter((culture) => culture.status === "active");
  els.activeCulturesList.innerHTML = activeCultures.length
    ? activeCultures.map(renderCultureItem).join("")
    : '<div class="empty-state">No active cultures right now.</div>';
}

function renderVessels() {
  if (state.vessels.length === 0) {
    els.vesselsList.innerHTML = '<div class="empty-state">No plates saved yet.</div>';
    renderPlateMap();
    return;
  }

  els.vesselsList.innerHTML = state.vessels
    .map((vessel) => {
      const wellCount = state.vesselWells.filter((well) => well.vessel_id === vessel.id).length;
      const linkedCultures = state.vesselCultures
        .filter((link) => link.vessel_id === vessel.id)
        .map((link) => (link.cultures ? cultureDisplayName(link.cultures) : null))
        .filter(Boolean);
      const meta = [
        vessel.vessel_type,
        linkedCultures.length ? `Cultures: ${linkedCultures.join(", ")}` : vessel.cultures ? `Culture: ${cultureDisplayName(vessel.cultures)}` : null,
        vessel.location,
        isMultiwell(vessel.vessel_type) ? `${wellCount} wells mapped` : "Whole plate condition",
      ].filter(Boolean);
      const activeClass = vessel.id === state.selectedVesselId ? " selected" : "";
      const expanded = vessel.id === state.selectedVesselId;
      const vesselProject = projectForVessel(vessel.id);
      return `
        <article class="item project-card${activeClass}" style="--project-color: ${escapeHtml(projectColor(vesselProject))}">
          <div>
            <div class="item-title">${escapeHtml(vessel.name)}</div>
            <div class="item-meta">
              ${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>
          </div>
          <div class="item-actions">
            <button class="icon-button edit-button" data-edit-vessel="${vessel.id}" type="button" title="Edit plate" aria-label="Edit plate">&#9998;</button>
            <button class="icon-button" data-open-vessel="${vessel.id}" type="button" title="${expanded ? "Hide map" : "Show map"}" aria-label="${expanded ? "Hide map" : "Show map"}">${expanded ? "&#9662;" : "&#9656;"}</button>
            <button class="icon-button danger-button" data-delete-vessel="${vessel.id}" type="button" title="Delete plate" aria-label="Delete plate">&#128465;</button>
          </div>
        </article>
      `;
    })
    .join("");

  renderPlateMap();
}

function renderCryoBoxes() {
  if (state.cryoBoxes.length === 0) {
    els.cryoBoxesList.innerHTML = '<div class="empty-state">No cryogenic boxes saved yet.</div>';
    renderCryoMap();
    return;
  }

  els.cryoBoxesList.innerHTML = state.cryoBoxes
    .map((box) => {
      const vialCount = state.cryoVials.filter((vial) => vial.box_id === box.id && vial.status !== "discarded").length;
      const totalPositions = (box.rows_count || 9) * (box.columns_count || 9);
      const meta = [
        box.project,
        cryoBoxLocation(box),
        `${box.rows_count || 9} x ${box.columns_count || 9}`,
        `${vialCount}/${totalPositions} positions filled`,
      ].filter(Boolean);
      const activeClass = box.id === state.selectedCryoBoxId ? " selected" : "";
      const expanded = box.id === state.selectedCryoBoxId;
      return `
        <article class="item project-card${activeClass}" style="--project-color: ${escapeHtml(projectColor(box.project))}">
          <div>
            <div class="item-title">${projectBadge(box.project)} ${escapeHtml(box.name)}</div>
            <div class="item-meta">
              ${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>
            ${box.notes ? `<p class="event-notes">${escapeHtml(box.notes)}</p>` : ""}
          </div>
          <div class="item-actions">
            <button class="icon-button edit-button" data-edit-cryo-box="${box.id}" type="button" title="Edit cryobox" aria-label="Edit cryobox">&#9998;</button>
            <button class="icon-button" data-open-cryo-box="${box.id}" type="button" title="${expanded ? "Hide map" : "Show map"}" aria-label="${expanded ? "Hide map" : "Show map"}">${expanded ? "&#9662;" : "&#9656;"}</button>
            <button class="icon-button danger-button" data-delete-cryo-box="${box.id}" type="button" title="Delete cryobox" aria-label="Delete cryobox">&#128465;</button>
          </div>
        </article>
      `;
    })
    .join("");

  renderCryoMap();
}

function renderCryoSearchResults() {
  const query = (els.cryoSearchInput.value || "").trim().toLowerCase();
  const filteredVials = state.cryoVials
    .map((vial) => ({
      vial,
      box: state.cryoBoxes.find((item) => item.id === vial.box_id),
    }))
    .filter(({ vial, box }) => {
      if (vial.status === "discarded") return false;
      if (!query) return true;
      return cryoVialSearchText(vial, box).includes(query);
    });

  if (filteredVials.length === 0) {
    els.cryoSearchResults.innerHTML = state.cryoVials.length
      ? '<div class="empty-state">No vials match this search.</div>'
      : '<div class="empty-state">No cryovials saved yet.</div>';
    return;
  }

  const groups = filteredVials.reduce((acc, item) => {
    const key = [cryoVialLineage(item.vial), item.vial.cell_type].filter(Boolean).join(" | ");
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(item);
    return acc;
  }, new Map());

  els.cryoSearchResults.innerHTML = Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lineage, items]) => {
      const locations = items
        .sort((a, b) => {
          const boxCompare = (a.box?.name || "").localeCompare(b.box?.name || "");
          if (boxCompare !== 0) return boxCompare;
          return String(a.vial.position || "").localeCompare(String(b.vial.position || ""));
        })
        .map(({ vial, box }) => {
          const location = cryoBoxLocation(box) || "No freezer location";
          const details = [
            box?.name || "Unknown box",
            vial.position,
            vial.freeze_date ? `Frozen: ${formatDate(vial.freeze_date)}` : null,
            vial.passage_number !== null ? `P${vial.passage_number}` : null,
            vial.status && vial.status !== "available" ? vial.status : null,
          ].filter(Boolean);
          return `
            <div class="search-result-row">
              <div>
                <strong>${escapeHtml(details.join(" - "))}</strong>
                <span>${escapeHtml(location)}</span>
              </div>
              <button class="icon-button" data-open-cryo-vial="${escapeHtml(vial.id)}" type="button" title="Show vial position" aria-label="Show vial position">&#9656;</button>
            </div>
          `;
        })
        .join("");

      return `
        <article class="item search-result-group">
          <div>
            <div class="item-title">${escapeHtml(lineage)}</div>
            <div class="item-meta"><span>${items.length} vial${items.length === 1 ? "" : "s"}</span></div>
            <div class="search-result-locations">${locations}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDifferentiationProtocols() {
  if (state.differentiationProtocols.length === 0) {
    els.protocolsList.innerHTML = '<div class="empty-state">No protocols saved yet.</div>';
    return;
  }

  els.protocolsList.innerHTML = state.differentiationProtocols
    .map((protocol) => {
      const taskCount = state.protocolTasks.filter((task) => task.protocol_id === protocol.id).length;
      const meta = [
        protocol.project,
        protocol.target_cell_type,
        protocol.version,
        protocol.expected_duration_days !== null ? `${protocol.expected_duration_days} days` : null,
        taskCount ? `${taskCount} planned task${taskCount === 1 ? "" : "s"}` : null,
      ].filter(Boolean);
      return `
        <article class="item project-card" style="--project-color: ${escapeHtml(projectColor(protocol?.project))}">
          <div>
            <div class="item-title">${escapeHtml(protocol.name)}</div>
            <div class="item-meta">
              ${meta.length ? meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("") : "<span>No additional details</span>"}
            </div>
          </div>
          <div class="item-actions">
            <span class="badge">Protocol</span>
            <button class="icon-button edit-button" data-edit-protocol="${protocol.id}" type="button" title="Edit protocol" aria-label="Edit protocol">&#9998;</button>
            <button class="icon-button danger-button" data-delete-protocol="${protocol.id}" type="button" title="Delete protocol" aria-label="Delete protocol">&#128465;</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderProtocolTasks() {
  const projectFilter = els.protocolTaskProjectFilter.value;
  const tasks = state.protocolTasks.filter((task) => {
    if (!projectFilter) return true;
    const protocol = state.differentiationProtocols.find((item) => item.id === task.protocol_id);
    return protocol?.project === projectFilter;
  });

  if (tasks.length === 0) {
    els.protocolTasksList.innerHTML = '<div class="empty-state">No protocol tasks saved yet.</div>';
    return;
  }

  els.protocolTasksList.innerHTML = tasks
    .map((task) => {
      const protocol = state.differentiationProtocols.find((item) => item.id === task.protocol_id);
      const meta = [
        protocol?.project,
        protocol?.name,
        task.task_day !== null ? `D${task.task_day}` : null,
        task.task_type,
        task.estimated_duration_hours !== null ? `${task.estimated_duration_hours} h` : null,
      ].filter(Boolean);
      return `
        <article class="item project-card" style="--project-color: ${escapeHtml(projectColor(protocol?.project))}">
          <div>
            <div class="item-title">${escapeHtml(task.title)}</div>
            <div class="item-meta">
              ${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>
            ${task.notes ? `<p class="event-notes">${escapeHtml(task.notes)}</p>` : ""}
          </div>
          <div class="item-actions">
            <button class="icon-button edit-button" data-edit-protocol-task="${task.id}" type="button" title="Edit task" aria-label="Edit task">&#9998;</button>
            <button class="icon-button danger-button" data-delete-protocol-task="${task.id}" type="button" title="Delete task" aria-label="Delete task">&#128465;</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDifferentiationRuns() {
  if (state.differentiationRuns.length === 0) {
    els.differentiationRunsList.innerHTML = '<div class="empty-state">No differentiation runs started yet.</div>';
    return;
  }

  els.differentiationRunsList.innerHTML = state.differentiationRuns
    .map((run) => {
      const protocol = state.differentiationProtocols.find((item) => item.id === run.protocol_id);
      const currentDay = daysSince(run.day_zero_date);
      const meta = [
        projectForDifferentiationRun(run),
        protocol?.name,
        differentiationSourceLabel(run),
        run.day_zero_date ? `Day 0: ${formatDate(run.day_zero_date)}` : null,
        currentDay !== null ? `D${currentDay}` : null,
      ].filter(Boolean);
      const scheduledTasks = state.protocolTasks
        .filter((task) => task.protocol_id === run.protocol_id)
        .sort((a, b) => (a.task_day ?? 0) - (b.task_day ?? 0))
        .slice(0, 5);
      return `
        <article class="item">
          <div>
            <div class="item-title">${escapeHtml(run.run_name)}</div>
            <div class="item-meta">
              ${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>
            ${scheduledTasks.length ? `
              <div class="task-preview">
                ${scheduledTasks.map((task) => `
                  <div>
                    <strong>${escapeHtml(`D${task.task_day}: ${task.title}`)}</strong>
                    <span>${escapeHtml(formatEstimatedCompletion(run.day_zero_date, task.task_day, task.estimated_duration_hours) || "No estimate")}</span>
                  </div>
                `).join("")}
              </div>
            ` : ""}
          </div>
          <div class="item-actions">
            <span class="badge">${escapeHtml(run.status || "active")}</span>
            <button class="icon-button edit-button" data-edit-differentiation-run="${run.id}" type="button" title="Edit differentiation" aria-label="Edit differentiation">&#9998;</button>
            <button class="icon-button danger-button" data-delete-differentiation-run="${run.id}" type="button" title="Delete differentiation" aria-label="Delete differentiation">&#128465;</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDifferentiationWellCheckboxes() {
  const sourceType = els.differentiationSourceType.value;
  const vesselId = els.differentiationVesselSelect.value;
  const vessel = state.vessels.find((item) => item.id === vesselId);
  const showVessel = sourceType === "vessel" || sourceType === "wells";

  els.differentiationCultureLabel.classList.toggle("is-hidden", sourceType !== "culture");
  els.differentiationVesselLabel.classList.toggle("is-hidden", !showVessel);
  els.differentiationWellsPanel.classList.toggle("is-hidden", sourceType !== "wells");

  if (sourceType !== "wells") {
    els.differentiationWellCheckboxes.innerHTML = "";
    return;
  }

  if (!vessel || !isMultiwell(vessel.vessel_type)) {
    els.differentiationWellCheckboxes.innerHTML = '<div class="empty-state">Choose a multiwell plate.</div>';
    return;
  }

  const mappedWells = new Map(
    state.vesselWells
      .filter((well) => well.vessel_id === vessel.id)
      .map((well) => [well.well, well])
  );

  els.differentiationWellCheckboxes.innerHTML = wellsForVesselType(vessel.vessel_type)
    .map((wellName) => {
      const well = mappedWells.get(wellName);
      const label = well?.condition_label || well?.cell_lines?.name || "Empty";
      return `
        <label class="checkbox-label">
          <input type="checkbox" value="${wellName}">
          ${escapeHtml(`${wellName} - ${label}`)}
        </label>
      `;
    })
    .join("");
}

function renderCultureItem(culture) {
  const label = statusLabels[culture.status] || culture.status || "No status";
  const badgeClass = statusClass[culture.status] || "";
  const meta = [
    culture.project,
    culture.cell_lines?.name,
    culture.initial_cell_type,
    culture.start_date ? `Started: ${formatDate(culture.start_date)}` : null,
    culture.passage_number !== null ? `P${culture.passage_number}` : null,
    culture.vessel_type,
    culture.location,
  ].filter(Boolean);

  return `
    <article class="item project-card" style="--project-color: ${escapeHtml(projectColor(culture.project))}">
      <div>
        <div class="item-title">${escapeHtml(cultureDisplayName(culture))}</div>
        <div class="item-meta">
          ${meta.length ? meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("") : "<span>No additional details</span>"}
        </div>
      </div>
      <div class="item-actions">
        <span class="badge ${badgeClass}">${escapeHtml(label)}</span>
        <button class="icon-button edit-button" data-edit-culture="${culture.id}" type="button" title="Edit culture" aria-label="Edit culture">&#9998;</button>
        <button class="icon-button danger-button" data-delete-culture="${culture.id}" type="button" title="Delete culture" aria-label="Delete culture">&#128465;</button>
      </div>
    </article>
  `;
}

function renderPlateMap() {
  const vessel = state.vessels.find((item) => item.id === state.selectedVesselId);
  if (!vessel) {
    els.plateMapPanel.classList.add("is-hidden");
    resetWellForm();
    return;
  }

  els.plateMapPanel.classList.remove("is-hidden");
  els.plateMapTitle.textContent = vessel.name;

  if (!isMultiwell(vessel.vessel_type)) {
    els.plateMapSubtitle.textContent = `${vessel.vessel_type} uses a single-condition layout. Use notes on the plate or activity feed for details.`;
    els.plateMapGrid.innerHTML = '<div class="empty-state">No well map is needed for this plate type.</div>';
    resetWellForm();
    return;
  }

  const layout = plateLayouts[vessel.vessel_type];
  const wells = wellsForVesselType(vessel.vessel_type);
  const wellRecords = new Map(
    state.vesselWells
      .filter((well) => well.vessel_id === vessel.id)
      .map((well) => [well.well, well])
  );

  els.plateMapSubtitle.textContent = `${vessel.vessel_type} plate map`;
  els.plateMapGrid.style.setProperty("--plate-columns", layout.columns);
  els.plateMapGrid.innerHTML = wells
    .map((wellName) => {
      const record = wellRecords.get(wellName);
      const label = record?.condition_label || record?.cell_lines?.name || record?.cultures?.culture_name || "";
      const selected = state.selectedWells.has(wellName) ? " is-selected" : "";
      const filled = record ? " is-filled" : "";
      return `
        <button class="well${filled}${selected}" data-well="${wellName}" type="button">
          <strong>${escapeHtml(wellName)}</strong>
          <span>${escapeHtml(label || "Empty")}</span>
        </button>
      `;
    })
    .join("");
}

function resetWellForm() {
  els.wellForm.reset();
  els.wellForm.classList.add("is-hidden");
  state.selectedWells.clear();
}

function renderCryoMap() {
  const box = state.cryoBoxes.find((item) => item.id === state.selectedCryoBoxId);
  if (!box) {
    els.cryoMapPanel.classList.add("is-hidden");
    resetCryoVialForm();
    return;
  }

  const columns = Math.max(1, Number(box.columns_count || 9));
  const positions = cryoPositionsForBox(box);
  const vialRecords = new Map(
    state.cryoVials
      .filter((vial) => vial.box_id === box.id)
      .map((vial) => [vial.position, vial])
  );

  els.cryoMapPanel.classList.remove("is-hidden");
  els.cryoMapTitle.textContent = box.name;
  els.cryoMapSubtitle.textContent = cryoBoxLocation(box) || "No freezer location set";
  els.cryoMapGrid.style.setProperty("--cryo-columns", columns);
  els.cryoMapGrid.innerHTML = positions
    .map((position) => {
      const record = vialRecords.get(position);
      const label = cryoVialSlotLabel(record);
      const selected = state.selectedCryoPositions.has(position) ? " is-selected" : "";
      const filled = record ? " is-filled" : "";
      const status = record?.status && record.status !== "available" ? ` ${record.status}` : "";
      return `
        <button class="cryo-slot${filled}${selected}" data-cryo-position="${position}" type="button">
          <strong>${escapeHtml(position)}</strong>
          <span>${escapeHtml(label || "Empty")}</span>
          ${status ? `<small>${escapeHtml(status)}</small>` : ""}
        </button>
      `;
    })
    .join("");
}

function resetCryoVialForm() {
  els.cryoVialForm.reset();
  els.cryoVialForm.classList.add("is-hidden");
  state.selectedCryoPositions.clear();
  syncConditionalFields();
}

function renderEvents() {
  const cultureFilter = els.historyCultureFilter.value;
  const projectFilter = els.historyProjectFilter.value;
  const cultureFeedItems = state.events
    .filter((event) => {
      const culture = event.cultures;
      const fullCulture = state.cultures.find((item) => item.id === event.culture_id);
      const project = fullCulture?.project || culture?.project;
      if (cultureFilter && event.culture_id !== cultureFilter) return false;
      if (projectFilter && project !== projectFilter) return false;
      return true;
    })
    .map((event) => {
      const culture = event.cultures;
      const fullCulture = state.cultures.find((item) => item.id === event.culture_id);
      const project = fullCulture?.project || culture?.project;
      return {
        id: event.id,
        kind: "culture",
        project,
        date: event.event_date,
        createdAt: event.created_at,
        title: event.event_type || "Culture event",
        badge: "Culture",
        editAttribute: `data-edit-event="${event.id}"`,
        photoUrl: event.photo_url,
        notes: event.notes,
        meta: uniqueValues([
          project,
          culture ? cultureDisplayName(culture) : null,
          event.vessel_id ? vesselDisplayName(state.vessels.find((vessel) => vessel.id === event.vessel_id)) : null,
          culture?.cell_lines?.name,
          event.passage_number !== null ? `P${event.passage_number}` : null,
          event.performed_by ? `By ${event.performed_by}` : null,
        ]),
      };
    });

  const differentiationFeedItems = cultureFilter ? [] : state.differentiationEvents
  .filter((event) => {
    const run = state.differentiationRuns.find((item) => item.id === event.differentiation_run_id);
    const project = projectForDifferentiationRun(run);
    return !projectFilter || project === projectFilter;
  })
  .map((event) => {
    const run = state.differentiationRuns.find((item) => item.id === event.differentiation_run_id);
    return {
      id: event.id,
      kind: "differentiation",
      project: projectForDifferentiationRun(run),
      date: event.event_date,
      createdAt: event.created_at,
      title: event.event_type || "Differentiation event",
      badge: "Differentiation",
      editAttribute: `data-edit-differentiation-event="${event.id}"`,
      photoUrl: event.photo_url,
      notes: event.notes,
      meta: uniqueValues([
        projectForDifferentiationRun(run),
        run ? differentiationRunLabel(run) : null,
        event.event_day !== null ? `D${event.event_day}` : null,
        event.performed_by ? `By ${event.performed_by}` : null,
      ]),
    };
  });

  const feedItems = [...cultureFeedItems, ...differentiationFeedItems].sort((a, b) => {
    const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
    if (dateCompare !== 0) return dateCompare;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });

  if (feedItems.length === 0) {
    els.eventsList.innerHTML = '<div class="empty-state">No events recorded yet.</div>';
    return;
  }

  const groups = feedItems.reduce((acc, item) => {
    const key = item.date || "No date";
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(item);
    return acc;
  }, new Map());

  els.eventsList.innerHTML = Array.from(groups.entries())
    .map(([date, items]) => `
      <section class="feed-day">
        <h4>${escapeHtml(date === "No date" ? "No date" : formatDate(date))}</h4>
        <div class="feed-day-events">
          ${items.map((item) => `
            <article class="event project-card ${item.kind === "differentiation" ? "event-differentiation" : ""}" style="--project-color: ${escapeHtml(projectColor(item.project))}">
              <div class="event-header">
                <div>
                  <div class="event-title">${escapeHtml(item.title)}</div>
                  <div class="item-meta">${item.meta.map((meta) => `<span>${escapeHtml(meta)}</span>`).join("")}</div>
                </div>
                <div class="item-actions">
                  <span class="badge">${escapeHtml(item.badge)}</span>
                  ${item.kind === "culture" ? `<button class="icon-button edit-button" ${item.editAttribute} type="button" title="Edit activity" aria-label="Edit activity">&#9998;</button>` : ""}
                  <button class="icon-button danger-button" data-delete-${item.kind === "differentiation" ? "differentiation-event" : "event"}="${item.id}" type="button" title="Delete activity" aria-label="Delete activity">&#128465;</button>
                </div>
              </div>
              ${item.notes ? `<p class="event-notes">${escapeHtml(item.notes)}</p>` : ""}
              ${item.photoUrl ? `<img class="event-photo" src="${escapeHtml(item.photoUrl)}" alt="Event photo">` : ""}
            </article>
          `).join("")}
        </div>
      </section>
    `)
    .join("");
}

function renderProjects() {
  const selectedProject = els.projectViewFilter.value;
  const projects = projectValues().filter((project) => !selectedProject || project === selectedProject);

  if (projects.length === 0) {
    els.projectsList.innerHTML = '<div class="empty-state">No projects yet.</div>';
    return;
  }

  els.projectsList.innerHTML = projects
    .map((project) => {
      const savedProject = projectRecord(project);
      const cultures = state.cultures.filter((culture) => culture.project === project);
      const activeCultures = cultures.filter((culture) => culture.status === "active");
      const cultureIds = new Set(cultures.map((culture) => culture.id));
      const vessels = state.vessels.filter((vessel) => {
        const vesselCultureIds = cultureIdsForVessel(vessel.id);
        return vesselCultureIds.some((cultureId) => cultureIds.has(cultureId));
      });
      const protocols = state.differentiationProtocols.filter((protocol) => protocol.project === project);
      const runs = state.differentiationRuns.filter((run) => projectForDifferentiationRun(run) === project);
      const activities = state.events
        .filter((event) => cultureIds.has(event.culture_id) || vessels.some((vessel) => vessel.id === event.vessel_id))
        .sort((a, b) => String(b.event_date || "").localeCompare(String(a.event_date || "")))
        .slice(0, 5);

      const meta = [
        `${activeCultures.length} active culture${activeCultures.length === 1 ? "" : "s"}`,
        `${vessels.length} plate${vessels.length === 1 ? "" : "s"}`,
        `${protocols.length} protocol${protocols.length === 1 ? "" : "s"}`,
        `${runs.length} differentiation run${runs.length === 1 ? "" : "s"}`,
      ];
      const culturesByProject = cultures.length
        ? cultures
          .map((culture) => {
            const linkedVessels = vessels.filter((vessel) => cultureIdsForVessel(vessel.id).includes(culture.id));
            const vesselNames = linkedVessels.map(vesselDisplayName).join(", ") || "No plates linked";
            return `${cultureDisplayName(culture)}: ${vesselNames}`;
          })
          .join("; ")
        : "No cultures assigned";

      return `
        <article class="item project-card" style="--project-color: ${escapeHtml(projectColor(project))}">
          <div>
            <div class="item-title">${projectBadge(project)}</div>
            <div class="item-meta">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
            ${savedProject?.notes ? `<p class="event-notes">${escapeHtml(savedProject.notes)}</p>` : ""}
            <div class="project-section">
              <strong>Cultures > Plates</strong>
              <span>${escapeHtml(culturesByProject)}</span>
            </div>
            <div class="project-section">
              <strong>Recent activity</strong>
              <span>${escapeHtml(activities.map((activity) => `${formatDate(activity.event_date)} ${activity.event_type || "Activity"}`).join("; ") || "No activity recorded")}</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="icon-button edit-button" data-edit-project="${escapeHtml(project)}" type="button" title="Edit project" aria-label="Edit project">&#9998;</button>
            <button class="icon-button danger-button" data-delete-project="${escapeHtml(project)}" type="button" title="Delete project" aria-label="Delete project">&#128465;</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMetrics() {
  els.lineCount.textContent = state.cellLines.length;
  els.activeCultureCount.textContent = state.cultures.filter((culture) => culture.status === "active").length;
  els.vesselCount.textContent = state.vessels.length;
  els.cryoVialCount.textContent = state.cryoVials.filter((vial) => vial.status !== "discarded").length;
  els.differentiationCount.textContent = state.differentiationRuns.filter((run) => run.status === "active").length;
  els.eventCount.textContent = state.events.length + state.differentiationEvents.length;
}

function renderAll() {
  renderOptions();
  renderCellLines();
  renderCultures();
  renderVessels();
  renderCryoBoxes();
  renderCryoSearchResults();
  renderDifferentiationProtocols();
  renderProtocolTasks();
  renderDifferentiationRuns();
  renderEvents();
  renderProjects();
  renderMetrics();
}

async function loadAll() {
  setStatus("loading", "Loading");
  setLastChecked();

  if (!ensureDb()) {
    renderAll();
    return;
  }

  try {

  const [cellLinesResult, culturesResult, eventsResult] = await withTimeout(Promise.all([
    db.from("cell_lines").select("*").order("name", { ascending: true }),
    db
      .from("cultures")
      .select("*, cell_lines(name)")
      .order("created_at", { ascending: false }),
    db
      .from("culture_events")
      .select("*, cultures(culture_name, passage_number, cell_lines(name))")
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]), 15000, "Database request timed out.");

  const baseError = cellLinesResult.error || culturesResult.error || eventsResult.error;
  if (baseError) {
    setStatus("error", "Error");
    setLoadIssue(baseError.message);
    showToast(`Error loading data: ${baseError.message}`);
    return;
  }

  const [projectsResult, vesselsResult, wellsResult, vesselCulturesResult, cryoBoxesResult, cryoVialsResult, protocolsResult, protocolTasksResult, differentiationRunsResult, differentiationRunWellsResult, differentiationEventsResult] = await withTimeout(Promise.all([
    db
      .from("projects")
      .select("*")
      .order("name", { ascending: true }),
    db
      .from("culture_vessels")
      .select("*")
      .order("created_at", { ascending: false }),
    db
      .from("vessel_wells")
      .select("*, cell_lines(name, identifier, clone), cultures(culture_name, passage_number, cell_lines(name))")
      .order("well", { ascending: true }),
    db
      .from("vessel_cultures")
      .select("*, cultures(culture_name, passage_number, cell_lines(name))"),
    db
      .from("cryo_boxes")
      .select("*")
      .order("freezer", { ascending: true })
      .order("name", { ascending: true }),
    db
      .from("cryo_vials")
      .select("*, cell_lines(name, identifier, clone)")
      .order("position", { ascending: true }),
    db
      .from("differentiation_protocols")
      .select("*")
      .order("name", { ascending: true }),
    db
      .from("differentiation_protocol_tasks")
      .select("*")
      .order("task_day", { ascending: true })
      .order("created_at", { ascending: true }),
    db
      .from("differentiation_runs")
      .select("*")
      .order("created_at", { ascending: false }),
    db
      .from("differentiation_run_wells")
      .select("*"),
    db
      .from("differentiation_events")
      .select("*")
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]), 15000, "Database request timed out.");

  state.cellLines = cellLinesResult.data || [];
  state.cultures = culturesResult.data || [];
  state.events = eventsResult.data || [];
  const projectsMissing = projectsResult.error?.code === "PGRST205";
  state.projects = projectsMissing
    ? defaultProjects.map((name) => ({ name, color: projectColors[name] }))
    : projectsResult.data || [];
  const vesselTablesMissing =
    vesselsResult.error?.code === "PGRST205" ||
    wellsResult.error?.code === "PGRST205";
  const vesselCultureLinksUnavailable = vesselCulturesResult.error?.code === "PGRST205";
  state.vessels = vesselTablesMissing ? [] : vesselsResult.data || [];
  state.vesselWells = vesselTablesMissing ? [] : wellsResult.data || [];
  state.vesselCultures = vesselTablesMissing || vesselCultureLinksUnavailable ? [] : vesselCulturesResult.data || [];
  const cryoTablesMissing =
    cryoBoxesResult.error?.code === "PGRST205" ||
    cryoVialsResult.error?.code === "PGRST205";
  state.cryoBoxes = cryoTablesMissing ? [] : cryoBoxesResult.data || [];
  state.cryoVials = cryoTablesMissing ? [] : cryoVialsResult.data || [];
  const protocolTasksMissing = protocolTasksResult.error?.code === "PGRST205";
  const differentiationTablesMissing =
    protocolsResult.error?.code === "PGRST205" ||
    differentiationRunsResult.error?.code === "PGRST205" ||
    differentiationRunWellsResult.error?.code === "PGRST205" ||
    differentiationEventsResult.error?.code === "PGRST205";
  state.differentiationProtocols = differentiationTablesMissing ? [] : protocolsResult.data || [];
  state.protocolTasks = differentiationTablesMissing || protocolTasksMissing ? [] : protocolTasksResult.data || [];
  state.differentiationRuns = differentiationTablesMissing ? [] : differentiationRunsResult.data || [];
  state.differentiationRunWells = differentiationTablesMissing ? [] : differentiationRunWellsResult.data || [];
  state.differentiationEvents = differentiationTablesMissing ? [] : differentiationEventsResult.data || [];
  if (state.selectedVesselId && !state.vessels.some((vessel) => vessel.id === state.selectedVesselId)) {
    state.selectedVesselId = null;
  }
  if (state.selectedCryoBoxId && !state.cryoBoxes.some((box) => box.id === state.selectedCryoBoxId)) {
    state.selectedCryoBoxId = null;
  }
  renderAll();
  if (projectsMissing) {
    setStatus("error", "Migration needed");
    setLoadIssue("Projects table is missing.");
    showToast("Run the projects migration in Supabase to enable editable projects.");
    return;
  }
  if (vesselTablesMissing) {
    setStatus("error", "Migration needed");
    setLoadIssue("Vessel tables are missing.");
    showToast("Run the plates migration in Supabase to enable plate maps.");
    return;
  }
  if (differentiationTablesMissing) {
    setStatus("error", "Migration needed");
    setLoadIssue("Differentiation tables are missing.");
    showToast("Run the differentiations migration in Supabase to enable protocols and runs.");
    return;
  }
  if (protocolTasksMissing) {
    setStatus("error", "Migration needed");
    setLoadIssue("Protocol task table is missing.");
    showToast("Run the protocol tasks migration in Supabase to enable planned tasks.");
    return;
  }
  if (cryoTablesMissing) {
    setStatus("error", "Migration needed");
    setLoadIssue("Cryostock tables are missing.");
    showToast("Run the cryostock migration in Supabase to enable freezer inventory.");
    return;
  }
  const vesselError =
    projectsResult.error ||
    vesselsResult.error ||
    wellsResult.error ||
    (vesselCultureLinksUnavailable ? null : vesselCulturesResult.error) ||
    cryoBoxesResult.error ||
    cryoVialsResult.error ||
    protocolsResult.error ||
    (protocolTasksMissing ? null : protocolTasksResult.error) ||
    differentiationRunsResult.error ||
    differentiationRunWellsResult.error ||
    differentiationEventsResult.error;
  if (vesselError) {
    setStatus("error", "Error");
    setLoadIssue(vesselError.message);
    showToast(`Error loading data: ${vesselError.message}`);
    return;
  }
  setStatus("ok", "Online");
  setLastUpdated();
  } catch (error) {
    setStatus("error", "Error");
    setLoadIssue(error.message);
    renderAll();
    showToast(`Error loading data: ${error.message}`);
  }
}

async function uploadPhoto(file) {
  if (!file) return null;
  if (!ensureDb()) throw new Error("Database is not connected.");

  const compressed = await compressImage(file);
  const extension = file.type.includes("png") ? "png" : "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await db.storage.from(PHOTO_BUCKET).upload(path, compressed, {
    contentType: compressed.type,
    upsert: false,
  });

  if (error) throw error;

  const { data } = db.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxSize = 1200;
      const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * ratio);
      canvas.height = Math.round(image.height * ratio);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("The photo could not be compressed."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.78
      );
    };
    image.onerror = () => reject(new Error("The photo could not be read."));
    image.src = URL.createObjectURL(file);
  });
}

async function deleteRecord(table, id, label) {
  if (!id) return;
  if (!ensureDb()) return;
  if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;

  const { error } = await db.from(table).delete().eq("id", id);
  if (error) {
    showToast(`Error deleting ${label}: ${error.message}`);
    return;
  }

  showToast(`${label} deleted.`);
  await loadAll();
}

async function handleProjectSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;

  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);
  const editingId = valueOrNull(data.get("id"));
  const originalName = valueOrNull(data.get("original_name"));
  const name = valueOrNull(data.get("name"));

  if (!name) {
    showToast("Project name is required.");
    return;
  }

  submit.disabled = true;
  const payload = {
    name,
    color: valueOrNull(data.get("color")) || projectColor(name),
    notes: valueOrNull(data.get("notes")),
  };

  const query = editingId
    ? db.from("projects").update(payload).eq("id", editingId)
    : db.from("projects").insert(payload);
  const { error } = await query;

  if (error) {
    submit.disabled = false;
    showToast(`Error saving project: ${error.message}`);
    return;
  }

  if (editingId && originalName && originalName !== name) {
    const renameTargets = [
      db.from("cultures").update({ project: name }).eq("project", originalName),
      db.from("cryo_boxes").update({ project: name }).eq("project", originalName),
      db.from("differentiation_protocols").update({ project: name }).eq("project", originalName),
      db.from("differentiation_runs").update({ project: name }).eq("project", originalName),
    ];
    const results = await Promise.all(renameTargets);
    const renameError = results.find((result) => result.error)?.error;
    if (renameError) {
      submit.disabled = false;
      showToast(`Project saved, but linked records were not renamed: ${renameError.message}`);
      return;
    }
  }

  submit.disabled = false;
  resetProjectForm();
  showToast(editingId ? "Project updated." : "Project saved.");
  await loadAll();
}

async function deleteProject(projectName) {
  if (!projectName || !ensureDb()) return;
  const project = projectRecord(projectName);
  if (!window.confirm(`Delete project ${projectName}? Cultures, plates, protocols, and activity will be kept, but this project label will be cleared.`)) return;

  const clearTargets = [
    db.from("cultures").update({ project: null }).eq("project", projectName),
    db.from("cryo_boxes").update({ project: null }).eq("project", projectName),
    db.from("differentiation_protocols").update({ project: null }).eq("project", projectName),
    db.from("differentiation_runs").update({ project: null }).eq("project", projectName),
  ];
  const results = await Promise.all(clearTargets);
  const clearError = results.find((result) => result.error)?.error;
  if (clearError) {
    showToast(`Error clearing project links: ${clearError.message}`);
    return;
  }

  if (project?.id) {
    const { error } = await db.from("projects").delete().eq("id", project.id);
    if (error) {
      showToast(`Error deleting project: ${error.message}`);
      return;
    }
  }

  showToast("Project deleted.");
  resetProjectForm();
  await loadAll();
}

async function handleCellLineSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);

  submit.disabled = true;
  const identifier = valueOrNull(data.get("identifier"));
  const clone = valueOrNull(data.get("clone"));
  const hasCrispr = data.get("has_crispr") === "on";
  const hasTransgene = data.get("has_transgene") === "on";
  const payload = {
    identifier,
    clone,
    name: composedCellLineName(identifier, clone),
    species: valueFromSelectWithCustom(data, "species", "custom_species"),
    cell_type: valueFromSelectWithCustom(data, "cell_type", "custom_cell_type"),
    source: valueOrNull(data.get("source")),
    has_crispr: hasCrispr,
    crispr_target: hasCrispr ? valueOrNull(data.get("crispr_target")) : null,
    crispr_sgrna: hasCrispr ? valueOrNull(data.get("crispr_sgrna")) : null,
    crispr_variant: hasCrispr ? valueOrNull(data.get("crispr_variant")) : null,
    crispr_hcmg: hasCrispr ? valueOrNull(data.get("crispr_hcmg")) : null,
    has_transgene: hasTransgene,
    transgene: hasTransgene ? valueOrNull(data.get("transgene")) : null,
    fluorescence: hasTransgene ? valueFromSelectWithCustom(data, "fluorescence", "custom_fluorescence") : null,
    marker_of: hasTransgene ? valueOrNull(data.get("marker_of")) : null,
    plasmid: hasTransgene ? valueOrNull(data.get("plasmid")) : null,
    transgene_notes: hasTransgene ? valueOrNull(data.get("transgene_notes")) : null,
    notes: valueOrNull(data.get("notes")),
  };

  const editingId = valueOrNull(data.get("id"));
  const query = editingId
    ? db.from("cell_lines").update(payload).eq("id", editingId)
    : db.from("cell_lines").insert(payload);
  const { error } = await query;
  submit.disabled = false;

  if (error) {
    showToast(`Error saving cell line: ${error.message}`);
    return;
  }

  resetCellLineForm();
  showToast(editingId ? "Cell line updated." : "Cell line saved.");
  await loadAll();
}

async function handleCultureSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);

  submit.disabled = true;
  const payload = {
    cell_line_id: data.get("cell_line_id"),
    culture_name: valueOrNull(data.get("culture_name")),
    project: valueFromSelectWithCustom(data, "project", "custom_project"),
    start_date: valueOrNull(data.get("start_date")),
    passage_number: numberOrNull(data.get("passage_number")),
    initial_cell_type: valueFromSelectWithCustom(data, "initial_cell_type", "custom_initial_cell_type"),
    vessel_type: valueOrNull(data.get("vessel_type")),
    medium: valueOrNull(data.get("medium")),
    status: valueOrNull(data.get("status")) || "active",
    location: valueOrNull(data.get("location")),
    notes: valueOrNull(data.get("notes")),
  };

  const editingId = valueOrNull(data.get("id"));
  const plateCountValue = numberOrNull(data.get("plate_count"));
  const plateCount = payload.vessel_type ? (plateCountValue === null ? 1 : plateCountValue) : 0;
  const wholePlate = data.get("whole_plate") === "on";
  const query = editingId
    ? db.from("cultures").update(payload).eq("id", editingId).select("*, cell_lines(name)").single()
    : db.from("cultures").insert(payload).select("*, cell_lines(name)").single();
  const { data: savedCulture, error } = await query;
  submit.disabled = false;

  if (error) {
    showToast(`Error starting culture: ${error.message}`);
    return;
  }

  let createdPlates = [];
  if (!editingId && savedCulture) {
    try {
      createdPlates = await createPlatesForCulture(savedCulture, {
        plateType: payload.vessel_type,
        plateCount,
        wholePlate,
      });
    } catch (plateError) {
      showToast(`Culture saved, but plates failed: ${plateError.message}`);
    }
  }

  resetCultureForm();
  if (!wholePlate && createdPlates.length > 0 && isMultiwell(createdPlates[0].vessel_type)) {
    state.selectedVesselId = createdPlates[0].id;
  }
  showToast(editingId ? "Culture updated." : createdPlates.length ? `Culture started with ${createdPlates.length} plate${createdPlates.length === 1 ? "" : "s"}.` : "Culture started.");
  await loadAll();
  if (!wholePlate && createdPlates.length > 0 && isMultiwell(createdPlates[0].vessel_type)) {
    state.selectedVesselId = createdPlates[0].id;
    renderVessels();
    els.plateMapPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function handleVesselSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);

  submit.disabled = true;
  const cultureIds = getCheckedValues(els.vesselCultureCheckboxes);
  const payload = {
    name: valueOrNull(data.get("name")),
    vessel_type: valueOrNull(data.get("vessel_type")),
    culture_id: cultureIds[0] || null,
    location: valueOrNull(data.get("location")),
    status: valueOrNull(data.get("status")) || "active",
    notes: valueOrNull(data.get("notes")),
  };

  const editingId = valueOrNull(data.get("id"));
  const query = editingId
    ? db.from("culture_vessels").update(payload).eq("id", editingId).select("id").single()
    : db.from("culture_vessels").insert(payload).select("id").single();
  const { data: saved, error } = await query;
  submit.disabled = false;

  if (error) {
    showToast(`Error creating plate: ${error.message}`);
    return;
  }

  await db.from("vessel_cultures").delete().eq("vessel_id", saved.id);
  if (cultureIds.length > 0) {
    const links = cultureIds.map((cultureId) => ({
      vessel_id: saved.id,
      culture_id: cultureId,
    }));
    const { error: linkError } = await db.from("vessel_cultures").insert(links);
    if (linkError) {
      showToast(`Plate saved, but culture links failed: ${linkError.message}`);
    }
  }

  resetVesselForm();
  state.selectedVesselId = saved.id;
  showToast(editingId ? "Plate updated." : "Plate created.");
  await loadAll();
}

async function handleWellSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);
  const vesselId = valueOrNull(data.get("vessel_id"));
  const wells = valueOrNull(data.get("wells"))
    ?.split(",")
    .map((well) => well.trim())
    .filter(Boolean) || [];

  if (!vesselId || wells.length === 0) {
    showToast("Select at least one well first.");
    return;
  }

  submit.disabled = true;
  const payload = wells.map((well) => ({
    vessel_id: vesselId,
    well,
    cell_line_id: valueOrNull(data.get("cell_line_id")),
    culture_id: valueOrNull(data.get("culture_id")),
    condition_label: valueOrNull(data.get("condition_label")),
    treatment: valueOrNull(data.get("treatment")),
    dose: valueOrNull(data.get("dose")),
    medium: valueOrNull(data.get("medium")),
    notes: valueOrNull(data.get("notes")),
  }));

  const { error: deleteError } = await db
    .from("vessel_wells")
    .delete()
    .eq("vessel_id", vesselId)
    .in("well", wells);

  if (deleteError) {
    submit.disabled = false;
    showToast(`Error preparing wells: ${deleteError.message}`);
    return;
  }

  const { error } = await db.from("vessel_wells").insert(payload);
  submit.disabled = false;

  if (error) {
    showToast(`Error saving well: ${error.message}`);
    return;
  }

  showToast(`${wells.length} well${wells.length === 1 ? "" : "s"} saved.`);
  await loadAll();
  state.selectedWells = new Set(wells);
  syncWellFormSelection();
  renderPlateMap();
}

async function handleDeleteSelectedWells() {
  if (!ensureDb()) return;
  const vesselId = valueOrNull(els.wellForm.elements.vessel_id.value);
  const wells = valueOrNull(els.wellForm.elements.wells.value)
    ?.split(",")
    .map((well) => well.trim())
    .filter(Boolean) || [];

  if (!vesselId || wells.length === 0) {
    showToast("Select at least one well first.");
    return;
  }
  if (!window.confirm(`Delete ${wells.length} selected well${wells.length === 1 ? "" : "s"}? This cannot be undone.`)) return;

  const { error } = await db
    .from("vessel_wells")
    .delete()
    .eq("vessel_id", vesselId)
    .in("well", wells);

  if (error) {
    showToast(`Error deleting wells: ${error.message}`);
    return;
  }

  showToast(`${wells.length} well${wells.length === 1 ? "" : "s"} deleted.`);
  resetWellForm();
  await loadAll();
}

async function handleCryoBoxSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);

  submit.disabled = true;
  const payload = {
    name: valueOrNull(data.get("name")),
    freezer: valueOrNull(data.get("freezer")),
    project: valueFromSelectWithCustom(data, "project", "custom_project"),
    rack: valueOrNull(data.get("rack")),
    shelf: valueOrNull(data.get("shelf")),
    drawer: valueOrNull(data.get("drawer")),
    box_position: valueOrNull(data.get("box_position")),
    rows_count: numberOrNull(data.get("rows_count")) || 9,
    columns_count: numberOrNull(data.get("columns_count")) || 9,
    notes: valueOrNull(data.get("notes")),
  };

  const editingId = valueOrNull(data.get("id"));
  const query = editingId
    ? db.from("cryo_boxes").update(payload).eq("id", editingId).select("id").single()
    : db.from("cryo_boxes").insert(payload).select("id").single();
  const { data: saved, error } = await query;
  submit.disabled = false;

  if (error) {
    showToast(`Error saving cryobox: ${error.message}`);
    return;
  }

  resetCryoBoxForm();
  state.selectedCryoBoxId = saved.id;
  showToast(editingId ? "Cryobox updated." : "Cryobox saved.");
  await loadAll();
}

async function handleCryoVialSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);
  const boxId = valueOrNull(data.get("box_id"));
  const positions = valueOrNull(data.get("positions"))
    ?.split(",")
    .map((position) => position.trim())
    .filter(Boolean) || [];

  if (!boxId || positions.length === 0) {
    showToast("Select at least one box position first.");
    return;
  }

  const cellLineId = valueOrNull(data.get("cell_line_id"));
  const selectedLine = state.cellLines.find((line) => line.id === cellLineId);
  if (!cellLineId || !selectedLine) {
    showToast("Select a cell line for the selected vial positions.");
    return;
  }

  submit.disabled = true;
  const payload = positions.map((position) => ({
    box_id: boxId,
    position,
    cell_line_id: cellLineId,
    lineage: cellLineDisplayName(selectedLine),
    cell_type: valueFromSelectWithCustom(data, "cell_type", "custom_cell_type"),
    freeze_date: valueOrNull(data.get("freeze_date")),
    passage_number: numberOrNull(data.get("passage_number")),
    status: valueOrNull(data.get("status")) || "available",
    frozen_by: valueOrNull(data.get("frozen_by")),
    notes: valueOrNull(data.get("notes")),
  }));

  const { error: deleteError } = await db
    .from("cryo_vials")
    .delete()
    .eq("box_id", boxId)
    .in("position", positions);

  if (deleteError) {
    submit.disabled = false;
    showToast(`Error preparing positions: ${deleteError.message}`);
    return;
  }

  const { error } = await db.from("cryo_vials").insert(payload);
  submit.disabled = false;

  if (error) {
    showToast(`Error saving cryovials: ${error.message}`);
    return;
  }

  showToast(`${positions.length} vial${positions.length === 1 ? "" : "s"} saved.`);
  await loadAll();
  resetCryoVialForm();
  renderCryoMap();
}

async function handleDeleteSelectedVials() {
  if (!ensureDb()) return;
  const boxId = valueOrNull(els.cryoVialForm.elements.box_id.value);
  const positions = valueOrNull(els.cryoVialForm.elements.positions.value)
    ?.split(",")
    .map((position) => position.trim())
    .filter(Boolean) || [];

  if (!boxId || positions.length === 0) {
    showToast("Select at least one vial first.");
    return;
  }
  if (!window.confirm(`Delete ${positions.length} selected vial${positions.length === 1 ? "" : "s"}? This cannot be undone.`)) return;

  const { error } = await db
    .from("cryo_vials")
    .delete()
    .eq("box_id", boxId)
    .in("position", positions);

  if (error) {
    showToast(`Error deleting vials: ${error.message}`);
    return;
  }

  showToast(`${positions.length} vial${positions.length === 1 ? "" : "s"} deleted.`);
  resetCryoVialForm();
  await loadAll();
}

async function handleProtocolSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);

  submit.disabled = true;
  const payload = {
    name: valueOrNull(data.get("name")),
    project: valueFromSelectWithCustom(data, "project", "custom_project"),
    target_cell_type: valueOrNull(data.get("target_cell_type")),
    version: valueOrNull(data.get("version")),
    expected_duration_days: numberOrNull(data.get("expected_duration_days")),
    notes: valueOrNull(data.get("notes")),
  };

  const editingId = valueOrNull(data.get("id"));
  const query = editingId
    ? db.from("differentiation_protocols").update(payload).eq("id", editingId)
    : db.from("differentiation_protocols").insert(payload);
  const { error } = await query;
  submit.disabled = false;

  if (error) {
    showToast(`Error saving protocol: ${error.message}`);
    return;
  }

  resetProtocolForm();
  showToast(editingId ? "Protocol updated." : "Protocol saved.");
  await loadAll();
}

async function handleProtocolTaskSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);

  submit.disabled = true;
  const payload = {
    protocol_id: valueOrNull(data.get("protocol_id")),
    task_day: numberOrNull(data.get("task_day")),
    title: valueOrNull(data.get("title")),
    task_type: valueOrNull(data.get("task_type")),
    estimated_duration_hours: numberOrNull(data.get("estimated_duration_hours")),
    notes: valueOrNull(data.get("notes")),
  };

  const editingId = valueOrNull(data.get("id"));
  const query = editingId
    ? db.from("differentiation_protocol_tasks").update(payload).eq("id", editingId)
    : db.from("differentiation_protocol_tasks").insert(payload);
  const { error } = await query;
  submit.disabled = false;

  if (error) {
    showToast(`Error saving protocol task: ${error.message}`);
    return;
  }

  resetProtocolTaskForm();
  showToast(editingId ? "Protocol task updated." : "Protocol task saved.");
  await loadAll();
}

async function handleDifferentiationRunSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);
  const sourceType = valueOrNull(data.get("source_type")) || "culture";
  const sourceVesselId = sourceType === "vessel" || sourceType === "wells"
    ? valueOrNull(data.get("source_vessel_id"))
    : null;
  const selectedWells = sourceType === "wells"
    ? getCheckedValues(els.differentiationWellCheckboxes)
    : [];

  if (sourceType === "wells" && selectedWells.length === 0) {
    showToast("Select at least one source well.");
    return;
  }

  submit.disabled = true;
  const payload = {
    protocol_id: valueOrNull(data.get("protocol_id")),
    run_name: valueOrNull(data.get("run_name")),
    project: valueFromSelectWithCustom(data, "project", "custom_project"),
    day_zero_date: valueOrNull(data.get("day_zero_date")),
    source_type: sourceType,
    source_culture_id: sourceType === "culture" ? valueOrNull(data.get("source_culture_id")) : null,
    source_vessel_id: sourceVesselId,
    status: valueOrNull(data.get("status")) || "active",
    notes: valueOrNull(data.get("notes")),
  };

  const editingId = valueOrNull(data.get("id"));
  const query = editingId
    ? db.from("differentiation_runs").update(payload).eq("id", editingId).select("id").single()
    : db.from("differentiation_runs").insert(payload).select("id").single();
  const { data: saved, error } = await query;

  if (error) {
    submit.disabled = false;
    showToast(`Error starting differentiation: ${error.message}`);
    return;
  }

  const { error: deleteWellsError } = await db
    .from("differentiation_run_wells")
    .delete()
    .eq("differentiation_run_id", saved.id);

  if (deleteWellsError) {
    submit.disabled = false;
    showToast(`Run saved, but old wells could not be cleared: ${deleteWellsError.message}`);
    return;
  }

  if (sourceType === "wells") {
    const runWells = selectedWells.map((well) => ({
      differentiation_run_id: saved.id,
      vessel_id: sourceVesselId,
      well,
    }));
    const { error: wellsError } = await db.from("differentiation_run_wells").insert(runWells);
    if (wellsError) {
      submit.disabled = false;
      showToast(`Run started, but wells failed: ${wellsError.message}`);
      return;
    }
  }

  submit.disabled = false;
  resetDifferentiationRunForm();
  showToast(editingId ? "Differentiation updated." : "Differentiation started.");
  await loadAll();
}

async function handleEventSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);

  submit.disabled = true;

  try {
    const photo = data.get("photo");
    const existingPhotoUrl = valueOrNull(data.get("photo_url"));
    const photoUrl = photo && photo.size > 0 ? await uploadPhoto(photo) : existingPhotoUrl;
    const editingId = valueOrNull(data.get("id"));
    const targetType = valueOrNull(data.get("activity_target_type")) || "cultures";
    const vesselId = targetType === "vessel" ? valueOrNull(data.get("vessel_id")) : null;
    const cultureIds = targetType === "vessel"
      ? cultureIdsForVessel(vesselId)
      : getCheckedValues(els.eventCultureCheckboxes);
    if (targetType === "vessel" && !vesselId) throw new Error("Select a plate.");
    if (targetType === "cultures" && cultureIds.length === 0) throw new Error("Select at least one culture.");

    const basePayload = {
      event_type: valueOrNull(data.get("event_type")),
      event_date: valueOrNull(data.get("event_date")) || todayValue(),
      vessel_id: vesselId,
      passage_number: valueOrNull(data.get("event_type")) === "Passage" ? numberOrNull(data.get("passage_number")) : null,
      confluence: null,
      performed_by: valueFromSelectWithCustom(data, "performed_by", "custom_performed_by"),
      notes: valueOrNull(data.get("notes")),
      photo_url: photoUrl,
    };

    const payloads = cultureIds.length
      ? cultureIds.map((cultureId) => ({ ...basePayload, culture_id: cultureId }))
      : [{ ...basePayload, culture_id: null }];
    const query = editingId
      ? db.from("culture_events").update({ ...basePayload, culture_id: cultureIds[0] || null }).eq("id", editingId)
      : db.from("culture_events").insert(payloads);

    const { error } = await query;
    if (error) throw error;

    resetEventForm();
    const targetCount = cultureIds.length || 1;
    showToast(editingId ? "Event updated." : `${targetCount} event${targetCount === 1 ? "" : "s"} recorded.`);
    await loadAll();
  } catch (error) {
    showToast(`Error recording event: ${error.message}`);
  } finally {
    submit.disabled = false;
  }
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveView(tab.dataset.view);
    });
  });
}

function setActiveView(viewId) {
  document.querySelectorAll(".tab").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === viewId);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === viewId);
  });
}

function setupForms() {
  els.projectForm.addEventListener("submit", handleProjectSubmit);
  els.cellLineForm.addEventListener("submit", handleCellLineSubmit);
  els.cultureForm.addEventListener("submit", handleCultureSubmit);
  els.vesselForm.addEventListener("submit", handleVesselSubmit);
  els.wellForm.addEventListener("submit", handleWellSubmit);
  els.cryoBoxForm.addEventListener("submit", handleCryoBoxSubmit);
  els.cryoVialForm.addEventListener("submit", handleCryoVialSubmit);
  els.protocolForm.addEventListener("submit", handleProtocolSubmit);
  els.protocolTaskForm.addEventListener("submit", handleProtocolTaskSubmit);
  els.differentiationRunForm.addEventListener("submit", handleDifferentiationRunSubmit);
  els.eventForm.addEventListener("submit", handleEventSubmit);
  els.historyProjectFilter.addEventListener("change", renderEvents);
  els.historyCultureFilter.addEventListener("change", renderEvents);
  els.protocolTaskProjectFilter.addEventListener("change", renderProtocolTasks);
  els.projectViewFilter.addEventListener("change", renderProjects);
  els.cryoSearchInput.addEventListener("input", renderCryoSearchResults);
  els.toggleCryoLookup.addEventListener("click", toggleCryoLookup);
  els.refreshToday.addEventListener("click", loadAll);
  els.addPlateButton.addEventListener("click", openPlateForm);
  els.createPlateFromCultureButton.addEventListener("click", handleCreatePlateFromCulture);
  els.cultureForm.elements.culture_name.addEventListener("input", () => {
    state.cultureNameEdited = true;
  });
  els.cultureCellLineSelect.addEventListener("change", () => syncCultureNameSuggestion());
  els.cultureForm.elements.start_date.addEventListener("change", () => syncCultureNameSuggestion());
  els.cellLinesList.addEventListener("click", handleCellLineListClick);
  els.culturesList.addEventListener("click", handleCulturesListClick);
  els.activeCulturesList.addEventListener("click", handleCulturesListClick);
  els.vesselsList.addEventListener("click", handleVesselsListClick);
  els.cryoBoxesList.addEventListener("click", handleCryoBoxesListClick);
  els.cryoSearchResults.addEventListener("click", handleCryoSearchResultsClick);
  els.protocolsList.addEventListener("click", handleProtocolsListClick);
  els.protocolTasksList.addEventListener("click", handleProtocolTasksListClick);
  els.differentiationRunsList.addEventListener("click", handleDifferentiationRunsListClick);
  els.eventsList.addEventListener("click", handleEventsListClick);
  els.projectsList.addEventListener("click", handleProjectsListClick);
  els.plateMapGrid.addEventListener("click", handlePlateMapClick);
  els.cryoMapGrid.addEventListener("click", handleCryoMapClick);
  els.clearWellForm.addEventListener("click", () => {
    resetWellForm();
    renderPlateMap();
  });
  els.deleteSelectedWells.addEventListener("click", handleDeleteSelectedWells);
  els.clearCryoSelection.addEventListener("click", () => {
    resetCryoVialForm();
    renderCryoMap();
  });
  els.deleteSelectedVials.addEventListener("click", handleDeleteSelectedVials);
  els.cancelCellLineEdit.addEventListener("click", resetCellLineForm);
  els.cancelCultureEdit.addEventListener("click", resetCultureForm);
  els.cancelVesselEdit.addEventListener("click", resetVesselForm);
  els.cancelCryoBoxEdit.addEventListener("click", resetCryoBoxForm);
  els.cancelProtocolEdit.addEventListener("click", resetProtocolForm);
  els.cancelProtocolTaskEdit.addEventListener("click", resetProtocolTaskForm);
  els.cancelDifferentiationRunEdit.addEventListener("click", resetDifferentiationRunForm);
  els.cancelEventEdit.addEventListener("click", resetEventForm);
  els.cancelProjectEdit.addEventListener("click", resetProjectForm);
  els.speciesSelect.addEventListener("change", syncConditionalFields);
  els.cellTypeSelect.addEventListener("change", syncConditionalFields);
  els.initialCellTypeSelect.addEventListener("change", syncConditionalFields);
  els.crisprCheckbox.addEventListener("change", syncConditionalFields);
  els.transgeneCheckbox.addEventListener("change", syncConditionalFields);
  els.fluorescenceSelect.addEventListener("change", syncConditionalFields);
  els.cryoCellTypeSelect.addEventListener("change", syncConditionalFields);
  els.cryoProjectSelect.addEventListener("change", syncConditionalFields);
  els.cultureProjectSelect.addEventListener("change", syncConditionalFields);
  els.protocolProjectSelect.addEventListener("change", syncConditionalFields);
  els.runProjectSelect.addEventListener("change", syncConditionalFields);
  els.differentiationSourceType.addEventListener("change", syncDifferentiationSourceFields);
  els.differentiationVesselSelect.addEventListener("change", renderDifferentiationWellCheckboxes);
  els.activityTargetTypeSelect.addEventListener("change", syncActivityTargetFields);
  els.performedBySelect.addEventListener("change", syncConditionalFields);
  els.eventTypeSelect.addEventListener("change", syncActivityEventFields);
}

function syncDifferentiationSourceFields() {
  renderDifferentiationWellCheckboxes();
}

function syncActivityTargetFields() {
  const useVessel = els.activityTargetTypeSelect.value === "vessel";
  els.eventCulturesPanel.classList.toggle("is-hidden", useVessel);
  els.eventVesselLabel.classList.toggle("is-hidden", !useVessel);
  if (useVessel) {
    setCheckedValues(els.eventCultureCheckboxes, []);
  } else {
    els.eventVesselSelect.value = "";
  }
}

function syncActivityEventFields() {
  const showPassage = els.eventTypeSelect.value === "Passage";
  els.eventPassageLabel.classList.toggle("is-hidden", !showPassage);
  if (!showPassage) {
    setFieldValue(els.eventForm, "passage_number", "");
  }
}

function toggleCryoLookup() {
  const isOpening = els.cryoLookupBody.classList.contains("is-hidden");
  els.cryoLookupBody.classList.toggle("is-hidden", !isOpening);
  els.toggleCryoLookup.textContent = isOpening ? "Hide lookup" : "Show lookup";
  els.toggleCryoLookup.setAttribute("aria-expanded", String(isOpening));
  if (isOpening) renderCryoSearchResults();
}

function handleProtocolsListClick(event) {
  const deleteButton = event.target.closest("[data-delete-protocol]");
  if (deleteButton) {
    deleteRecord("differentiation_protocols", deleteButton.dataset.deleteProtocol, "protocol");
    return;
  }

  const button = event.target.closest("[data-edit-protocol]");
  if (!button) return;

  const protocol = state.differentiationProtocols.find((item) => item.id === button.dataset.editProtocol);
  if (!protocol) return;

  fillProtocolForm(protocol);
}

function handleProtocolTasksListClick(event) {
  const deleteButton = event.target.closest("[data-delete-protocol-task]");
  if (deleteButton) {
    deleteRecord("differentiation_protocol_tasks", deleteButton.dataset.deleteProtocolTask, "protocol task");
    return;
  }

  const button = event.target.closest("[data-edit-protocol-task]");
  if (!button) return;

  const task = state.protocolTasks.find((item) => item.id === button.dataset.editProtocolTask);
  if (!task) return;

  fillProtocolTaskForm(task);
}

function handleDifferentiationRunsListClick(event) {
  const deleteButton = event.target.closest("[data-delete-differentiation-run]");
  if (deleteButton) {
    deleteRecord("differentiation_runs", deleteButton.dataset.deleteDifferentiationRun, "differentiation run");
    return;
  }

  const button = event.target.closest("[data-edit-differentiation-run]");
  if (!button) return;

  const run = state.differentiationRuns.find((item) => item.id === button.dataset.editDifferentiationRun);
  if (!run) return;

  fillDifferentiationRunForm(run);
}

function handleEventsListClick(event) {
  const deleteDifferentiationButton = event.target.closest("[data-delete-differentiation-event]");
  if (deleteDifferentiationButton) {
    deleteRecord("differentiation_events", deleteDifferentiationButton.dataset.deleteDifferentiationEvent, "activity");
    return;
  }

  const deleteButton = event.target.closest("[data-delete-event]");
  if (deleteButton) {
    deleteRecord("culture_events", deleteButton.dataset.deleteEvent, "activity");
    return;
  }

  const differentiationButton = event.target.closest("[data-edit-differentiation-event]");
  if (differentiationButton) {
    const differentiationEvent = state.differentiationEvents.find((item) => item.id === differentiationButton.dataset.editDifferentiationEvent);
    if (!differentiationEvent) return;

    setActiveView("eventsView");
    fillDifferentiationEventForm(differentiationEvent);
    return;
  }

  const button = event.target.closest("[data-edit-event]");
  if (!button) return;

  const cultureEvent = state.events.find((item) => item.id === button.dataset.editEvent);
  if (!cultureEvent) return;

  setActiveView("eventsView");
  fillEventForm(cultureEvent);
}

function handleVesselsListClick(event) {
  const deleteButton = event.target.closest("[data-delete-vessel]");
  if (deleteButton) {
    deleteRecord("culture_vessels", deleteButton.dataset.deleteVessel, "plate");
    return;
  }

  const editButton = event.target.closest("[data-edit-vessel]");
  if (editButton) {
    const vessel = state.vessels.find((item) => item.id === editButton.dataset.editVessel);
    if (vessel) fillVesselForm(vessel);
    return;
  }

  const button = event.target.closest("[data-open-vessel]");
  if (!button) return;

  state.selectedVesselId = state.selectedVesselId === button.dataset.openVessel ? null : button.dataset.openVessel;
  resetWellForm();
  renderVessels();
  if (state.selectedVesselId) {
    els.plateMapPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function handleCryoBoxesListClick(event) {
  const deleteButton = event.target.closest("[data-delete-cryo-box]");
  if (deleteButton) {
    deleteRecord("cryo_boxes", deleteButton.dataset.deleteCryoBox, "cryobox");
    return;
  }

  const editButton = event.target.closest("[data-edit-cryo-box]");
  if (editButton) {
    const box = state.cryoBoxes.find((item) => item.id === editButton.dataset.editCryoBox);
    if (box) fillCryoBoxForm(box);
    return;
  }

  const button = event.target.closest("[data-open-cryo-box]");
  if (!button) return;

  state.selectedCryoBoxId = state.selectedCryoBoxId === button.dataset.openCryoBox ? null : button.dataset.openCryoBox;
  resetCryoVialForm();
  renderCryoBoxes();
  if (state.selectedCryoBoxId) {
    els.cryoMapPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function handleCryoSearchResultsClick(event) {
  const button = event.target.closest("[data-open-cryo-vial]");
  if (!button) return;

  const vial = state.cryoVials.find((item) => item.id === button.dataset.openCryoVial);
  if (!vial) return;

  state.selectedCryoBoxId = vial.box_id;
  state.selectedCryoPositions = new Set([vial.position]);
  renderCryoBoxes();
  syncCryoVialFormSelection();
  els.cryoMapPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleCulturesListClick(event) {
  const deleteButton = event.target.closest("[data-delete-culture]");
  if (deleteButton) {
    deleteRecord("cultures", deleteButton.dataset.deleteCulture, "culture");
    return;
  }

  const button = event.target.closest("[data-edit-culture]");
  if (!button) return;

  const culture = state.cultures.find((item) => item.id === button.dataset.editCulture);
  if (!culture) return;

  setActiveView("culturesView");
  fillCultureForm(culture);
}

function handlePlateMapClick(event) {
  const button = event.target.closest("[data-well]");
  if (!button) return;
  toggleWellSelection(button.dataset.well);
}

function handleCryoMapClick(event) {
  const button = event.target.closest("[data-cryo-position]");
  if (!button) return;
  toggleCryoPositionSelection(button.dataset.cryoPosition);
}

function toggleWellSelection(wellName) {
  if (state.selectedWells.has(wellName)) {
    state.selectedWells.delete(wellName);
  } else {
    state.selectedWells.add(wellName);
  }
  syncWellFormSelection();
  renderPlateMap();
}

function syncWellFormSelection() {
  const vessel = state.vessels.find((item) => item.id === state.selectedVesselId);
  if (!vessel) return;

  const selected = Array.from(state.selectedWells).sort();
  if (selected.length === 0) {
    els.wellForm.reset();
    els.wellForm.classList.add("is-hidden");
    return;
  }

  els.wellForm.classList.remove("is-hidden");
  setFieldValue(els.wellForm, "vessel_id", vessel.id);
  setFieldValue(els.wellForm, "wells", selected.join(", "));

  if (selected.length === 1) {
    const record = state.vesselWells.find(
      (well) => well.vessel_id === vessel.id && well.well === selected[0]
    );
    setFieldValue(els.wellForm, "cell_line_id", record?.cell_line_id);
    setFieldValue(els.wellForm, "culture_id", record?.culture_id);
    setFieldValue(els.wellForm, "condition_label", record?.condition_label);
    setFieldValue(els.wellForm, "treatment", record?.treatment);
    setFieldValue(els.wellForm, "dose", record?.dose);
    setFieldValue(els.wellForm, "medium", record?.medium);
    setFieldValue(els.wellForm, "notes", record?.notes);
  }

  els.wellForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function toggleCryoPositionSelection(position) {
  if (state.selectedCryoPositions.has(position)) {
    state.selectedCryoPositions.delete(position);
  } else {
    state.selectedCryoPositions.add(position);
  }
  syncCryoVialFormSelection();
  renderCryoMap();
}

function syncCryoVialFormSelection() {
  const box = state.cryoBoxes.find((item) => item.id === state.selectedCryoBoxId);
  if (!box) return;

  const selected = Array.from(state.selectedCryoPositions).sort();
  if (selected.length === 0) {
    els.cryoVialForm.reset();
    els.cryoVialForm.classList.add("is-hidden");
    return;
  }

  els.cryoVialForm.classList.remove("is-hidden");
  setFieldValue(els.cryoVialForm, "box_id", box.id);
  setFieldValue(els.cryoVialForm, "positions", selected.join(", "));

  if (selected.length === 1) {
    const record = state.cryoVials.find(
      (vial) => vial.box_id === box.id && vial.position === selected[0]
    );
    setFieldValue(els.cryoVialForm, "cell_line_id", record?.cell_line_id);
    setSelectOrCustom(els.cryoCellTypeSelect, els.cryoVialForm.elements.custom_cell_type, record?.cell_type);
    setFieldValue(els.cryoVialForm, "freeze_date", record?.freeze_date);
    setFieldValue(els.cryoVialForm, "passage_number", record?.passage_number);
    setFieldValue(els.cryoVialForm, "status", record?.status || "available");
    setFieldValue(els.cryoVialForm, "frozen_by", record?.frozen_by);
    setFieldValue(els.cryoVialForm, "notes", record?.notes);
  } else {
    setDefaultDate(els.cryoVialForm, "freeze_date");
  }

  syncConditionalFields();
}

function handleCellLineListClick(event) {
  const deleteButton = event.target.closest("[data-delete-cell-line]");
  if (deleteButton) {
    deleteRecord("cell_lines", deleteButton.dataset.deleteCellLine, "cell line");
    return;
  }

  const button = event.target.closest("[data-edit-cell-line]");
  if (!button) return;

  const line = state.cellLines.find((item) => item.id === button.dataset.editCellLine);
  if (!line) return;

  fillCellLineForm(line);
}

function handleProjectsListClick(event) {
  const deleteButton = event.target.closest("[data-delete-project]");
  if (deleteButton) {
    deleteProject(deleteButton.dataset.deleteProject);
    return;
  }

  const button = event.target.closest("[data-edit-project]");
  if (!button) return;

  fillProjectForm(button.dataset.editProject);
}

function fillProjectForm(projectName) {
  const form = els.projectForm;
  const project = projectRecord(projectName);
  setFieldValue(form, "id", project?.id);
  setFieldValue(form, "original_name", projectName);
  setFieldValue(form, "name", projectName);
  const color = projectColor(projectName);
  setFieldValue(form, "color", color.startsWith("#") ? color : "#176f64");
  setFieldValue(form, "notes", project?.notes);
  els.projectSubmitButton.textContent = "Update project";
  els.cancelProjectEdit.classList.remove("is-hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetProjectForm() {
  els.projectForm.reset();
  els.projectForm.elements.id.value = "";
  els.projectForm.elements.original_name.value = "";
  els.projectForm.elements.color.value = "#176f64";
  els.projectSubmitButton.textContent = "Save project";
  els.cancelProjectEdit.classList.add("is-hidden");
}

function fillCellLineForm(line) {
  const form = els.cellLineForm;
  setFieldValue(form, "id", line.id);
  setFieldValue(form, "identifier", line.identifier || line.name);
  setFieldValue(form, "clone", line.clone);
  setSelectOrCustom(els.speciesSelect, form.elements.custom_species, line.species);
  setSelectOrCustom(els.cellTypeSelect, form.elements.custom_cell_type, line.cell_type);
  setFieldValue(form, "source", line.source);
  setFieldValue(form, "has_crispr", line.has_crispr);
  setFieldValue(form, "crispr_target", line.crispr_target);
  setFieldValue(form, "crispr_sgrna", line.crispr_sgrna);
  setFieldValue(form, "crispr_variant", line.crispr_variant);
  setFieldValue(form, "crispr_hcmg", line.crispr_hcmg);
  setFieldValue(form, "has_transgene", line.has_transgene);
  setFieldValue(form, "transgene", line.transgene);
  setSelectOrCustom(els.fluorescenceSelect, form.elements.custom_fluorescence, line.fluorescence);
  setFieldValue(form, "marker_of", line.marker_of);
  setFieldValue(form, "plasmid", line.plasmid);
  setFieldValue(form, "transgene_notes", line.transgene_notes);
  setFieldValue(form, "notes", line.notes);
  els.cellLineSubmitButton.textContent = "Update cell line";
  els.cancelCellLineEdit.classList.remove("is-hidden");
  syncConditionalFields();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetCellLineForm() {
  els.cellLineForm.reset();
  els.cellLineForm.elements.id.value = "";
  els.cellLineSubmitButton.textContent = "Save cell line";
  els.cancelCellLineEdit.classList.add("is-hidden");
  syncConditionalFields();
}

function fillProtocolForm(protocol) {
  const form = els.protocolForm;
  setFieldValue(form, "id", protocol.id);
  setFieldValue(form, "name", protocol.name);
  setSelectOrCustom(els.protocolProjectSelect, form.elements.custom_project, protocol.project);
  setFieldValue(form, "target_cell_type", protocol.target_cell_type);
  setFieldValue(form, "version", protocol.version);
  setFieldValue(form, "expected_duration_days", protocol.expected_duration_days);
  setFieldValue(form, "notes", protocol.notes);
  els.protocolSubmitButton.textContent = "Update protocol";
  els.cancelProtocolEdit.classList.remove("is-hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetProtocolForm() {
  els.protocolForm.reset();
  els.protocolForm.elements.id.value = "";
  els.protocolSubmitButton.textContent = "Save protocol";
  els.cancelProtocolEdit.classList.add("is-hidden");
}

function fillProtocolTaskForm(task) {
  const form = els.protocolTaskForm;
  setFieldValue(form, "id", task.id);
  setFieldValue(form, "protocol_id", task.protocol_id);
  setFieldValue(form, "task_day", task.task_day);
  setFieldValue(form, "title", task.title);
  setFieldValue(form, "task_type", task.task_type || "Other");
  setFieldValue(form, "estimated_duration_hours", task.estimated_duration_hours);
  setFieldValue(form, "notes", task.notes);
  els.protocolTaskSubmitButton.textContent = "Update task";
  els.cancelProtocolTaskEdit.classList.remove("is-hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetProtocolTaskForm() {
  els.protocolTaskForm.reset();
  els.protocolTaskForm.elements.id.value = "";
  els.protocolTaskSubmitButton.textContent = "Save task";
  els.cancelProtocolTaskEdit.classList.add("is-hidden");
}

function fillDifferentiationRunForm(run) {
  const form = els.differentiationRunForm;
  setFieldValue(form, "id", run.id);
  setFieldValue(form, "run_name", run.run_name);
  setSelectOrCustom(els.runProjectSelect, form.elements.custom_project, run.project || projectForDifferentiationRun(run));
  setFieldValue(form, "protocol_id", run.protocol_id);
  setFieldValue(form, "day_zero_date", run.day_zero_date);
  setFieldValue(form, "source_type", run.source_type || "culture");
  setFieldValue(form, "source_culture_id", run.source_culture_id);
  setFieldValue(form, "source_vessel_id", run.source_vessel_id);
  setFieldValue(form, "status", run.status || "active");
  setFieldValue(form, "notes", run.notes);
  renderDifferentiationWellCheckboxes();

  const runWells = state.differentiationRunWells
    .filter((well) => well.differentiation_run_id === run.id)
    .map((well) => well.well);
  setCheckedValues(els.differentiationWellCheckboxes, runWells);

  els.differentiationRunSubmitButton.textContent = "Update differentiation";
  els.cancelDifferentiationRunEdit.classList.remove("is-hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetDifferentiationRunForm() {
  els.differentiationRunForm.reset();
  els.differentiationRunForm.elements.id.value = "";
  setDefaultDate(els.differentiationRunForm, "day_zero_date");
  setCheckedValues(els.differentiationWellCheckboxes, []);
  els.differentiationRunSubmitButton.textContent = "Start differentiation";
  els.cancelDifferentiationRunEdit.classList.add("is-hidden");
  syncDifferentiationSourceFields();
}

function fillDifferentiationEventForm(differentiationEvent) {
  showToast("Old differentiation events can be deleted from the feed. Record new differentiation work as culture or plate activity.");
}

function fillEventForm(cultureEvent) {
  const form = els.eventForm;
  setFieldValue(form, "id", cultureEvent.id);
  setFieldValue(form, "record_kind", "culture");
  setFieldValue(form, "photo_url", cultureEvent.photo_url);
  setFieldValue(form, "activity_target_type", cultureEvent.vessel_id ? "vessel" : "cultures");
  setFieldValue(form, "vessel_id", cultureEvent.vessel_id);
  setCheckedValues(els.eventCultureCheckboxes, cultureEvent.vessel_id ? [] : [cultureEvent.culture_id]);
  setFieldValue(form, "event_type", cultureEvent.event_type || "Observation");
  setFieldValue(form, "event_date", cultureEvent.event_date);
  setFieldValue(form, "passage_number", cultureEvent.passage_number);
  setSelectOrCustom(els.performedBySelect, form.elements.custom_performed_by, cultureEvent.performed_by);
  setFieldValue(form, "notes", cultureEvent.notes);
  els.eventSubmitButton.textContent = "Update event";
  els.cancelEventEdit.classList.remove("is-hidden");
  syncActivityTargetFields();
  syncActivityEventFields();
  syncConditionalFields();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetEventForm() {
  els.eventForm.reset();
  els.eventForm.elements.id.value = "";
  els.eventForm.elements.record_kind.value = "";
  els.eventForm.elements.photo_url.value = "";
  setCheckedValues(els.eventCultureCheckboxes, []);
  setFieldValue(els.eventForm, "activity_target_type", "cultures");
  setFieldValue(els.eventForm, "vessel_id", "");
  setDefaultDate(els.eventForm, "event_date");
  els.eventSubmitButton.textContent = "Record event";
  els.cancelEventEdit.classList.add("is-hidden");
  syncActivityTargetFields();
  syncActivityEventFields();
  syncConditionalFields();
}

function fillCultureForm(culture) {
  const form = els.cultureForm;
  setFieldValue(form, "id", culture.id);
  setFieldValue(form, "cell_line_id", culture.cell_line_id);
  setFieldValue(form, "culture_name", culture.culture_name);
  setSelectOrCustom(els.cultureProjectSelect, form.elements.custom_project, culture.project);
  setFieldValue(form, "start_date", culture.start_date);
  setFieldValue(form, "passage_number", culture.passage_number);
  setSelectOrCustom(els.initialCellTypeSelect, form.elements.custom_initial_cell_type, culture.initial_cell_type);
  setFieldValue(form, "vessel_type", culture.vessel_type);
  setFieldValue(form, "plate_count", "");
  setFieldValue(form, "whole_plate", true);
  setFieldValue(form, "medium", culture.medium);
  setFieldValue(form, "status", culture.status || "active");
  setFieldValue(form, "location", culture.location);
  setFieldValue(form, "notes", culture.notes);
  state.cultureNameEdited = true;
  els.cultureSubmitButton.textContent = "Update culture";
  els.createPlateFromCultureButton.classList.remove("is-hidden");
  els.cancelCultureEdit.classList.remove("is-hidden");
  syncConditionalFields();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetCultureForm() {
  els.cultureForm.reset();
  els.cultureForm.elements.id.value = "";
  setDefaultDate(els.cultureForm, "start_date");
  setFieldValue(els.cultureForm, "whole_plate", true);
  state.cultureNameEdited = false;
  syncCultureNameSuggestion(true);
  els.cultureSubmitButton.textContent = "Start culture";
  els.createPlateFromCultureButton.classList.add("is-hidden");
  els.cancelCultureEdit.classList.add("is-hidden");
  syncConditionalFields();
}

function fillVesselForm(vessel) {
  const form = els.vesselForm;
  const linkedCultureIds = state.vesselCultures
    .filter((link) => link.vessel_id === vessel.id)
    .map((link) => link.culture_id);
  setFieldValue(form, "id", vessel.id);
  setFieldValue(form, "name", vessel.name);
  setFieldValue(form, "vessel_type", vessel.vessel_type);
  setMultiSelectValues(els.vesselCultureSelect, linkedCultureIds.length ? linkedCultureIds : [vessel.culture_id]);
  setCheckedValues(els.vesselCultureCheckboxes, linkedCultureIds.length ? linkedCultureIds : [vessel.culture_id]);
  setFieldValue(form, "location", vessel.location);
  setFieldValue(form, "status", vessel.status || "active");
  setFieldValue(form, "notes", vessel.notes);
  els.vesselForm.classList.remove("is-hidden");
  els.vesselSubmitButton.textContent = "Update plate";
  els.cancelVesselEdit.classList.remove("is-hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openPlateForm() {
  resetVesselForm({ keepOpen: true });
  els.vesselForm.classList.remove("is-hidden");
  els.vesselForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetVesselForm(options = {}) {
  els.vesselForm.reset();
  els.vesselForm.elements.id.value = "";
  setCheckedValues(els.vesselCultureCheckboxes, []);
  els.vesselSubmitButton.textContent = "Create plate";
  els.cancelVesselEdit.classList.add("is-hidden");
  if (!options.keepOpen) {
    els.vesselForm.classList.add("is-hidden");
  }
}

function fillCryoBoxForm(box) {
  const form = els.cryoBoxForm;
  setFieldValue(form, "id", box.id);
  setFieldValue(form, "name", box.name);
  setFieldValue(form, "freezer", box.freezer);
  setSelectOrCustom(els.cryoProjectSelect, form.elements.custom_project, box.project);
  setFieldValue(form, "rack", box.rack);
  setFieldValue(form, "shelf", box.shelf);
  setFieldValue(form, "drawer", box.drawer);
  setFieldValue(form, "box_position", box.box_position);
  setFieldValue(form, "rows_count", box.rows_count || 9);
  setFieldValue(form, "columns_count", box.columns_count || 9);
  setFieldValue(form, "notes", box.notes);
  els.cryoBoxSubmitButton.textContent = "Update box";
  els.cancelCryoBoxEdit.classList.remove("is-hidden");
  syncConditionalFields();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetCryoBoxForm() {
  els.cryoBoxForm.reset();
  els.cryoBoxForm.elements.id.value = "";
  setFieldValue(els.cryoBoxForm, "rows_count", 9);
  setFieldValue(els.cryoBoxForm, "columns_count", 9);
  els.cryoBoxSubmitButton.textContent = "Save box";
  els.cancelCryoBoxEdit.classList.add("is-hidden");
  syncConditionalFields();
}

function syncConditionalFields() {
  els.customSpeciesLabel.classList.toggle("is-hidden", els.speciesSelect.value !== "__add");
  els.customCellTypeLabel.classList.toggle("is-hidden", els.cellTypeSelect.value !== "__add");
  els.customCryoCellTypeLabel.classList.toggle("is-hidden", els.cryoCellTypeSelect.value !== "__add");
  els.customCryoProjectLabel.classList.toggle("is-hidden", els.cryoProjectSelect.value !== "__add");
  els.crisprFields.classList.toggle("is-hidden", !els.crisprCheckbox.checked);
  els.transgeneFields.classList.toggle("is-hidden", !els.transgeneCheckbox.checked);
  els.customFluorescenceLabel.classList.toggle("is-hidden", els.fluorescenceSelect.value !== "__add");
  els.customInitialCellTypeLabel.classList.toggle("is-hidden", els.initialCellTypeSelect.value !== "__add");
  els.customPerformedByLabel.classList.toggle("is-hidden", els.performedBySelect.value !== "__add");
  els.customCultureProjectLabel.classList.toggle("is-hidden", els.cultureProjectSelect.value !== "__add");
  els.customProtocolProjectLabel.classList.toggle("is-hidden", els.protocolProjectSelect.value !== "__add");
  els.customRunProjectLabel.classList.toggle("is-hidden", els.runProjectSelect.value !== "__add");
}

setupTabs();
setupForms();
syncConditionalFields();
setDefaultDate(els.cultureForm, "start_date");
setDefaultDate(els.differentiationRunForm, "day_zero_date");
setDefaultDate(els.eventForm, "event_date");
setDefaultDate(els.cryoVialForm, "freeze_date");
syncActivityTargetFields();
syncActivityEventFields();
renderAll();
loadAll();
