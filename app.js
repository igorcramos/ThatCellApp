const SUPABASE_URL = "https://rqvpzurlaxlopmhxivcn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdnB6dXJsYXhsb3BtaHhpdmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzU3NzgsImV4cCI6MjA5NjM1MTc3OH0.ylM3vX5hHKMmT_nkc4_FifCkpePUQyRm4TPx6MwCKBo";
const PHOTO_BUCKET = "culture-photos";
const PUBLISHED_APP_URL = "https://igorcramos.github.io/ThatCellApp/";

const supabaseClient = window.supabase || (typeof supabase !== "undefined" ? supabase : null);
const db = supabaseClient?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY) || null;

const state = {
  session: null,
  user: null,
  authAvailable: false,
  profile: null,
  profiles: [],
  projectMembers: [],
  cultureMembers: [],
  projects: [],
  cellLines: [],
  cultures: [],
  cultureCellLines: [],
  events: [],
  vessels: [],
  vesselWells: [],
  vesselCultures: [],
  cryoBoxes: [],
  cryoVials: [],
  differentiationProtocols: [],
  protocolTasks: [],
  differentiationRuns: [],
  differentiationRunCellLines: [],
  differentiationRunDeviations: [],
  differentiationRunWells: [],
  differentiationEvents: [],
  signedPhotoUrls: new Map(),
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

const differentiationBatchColors = Object.freeze([
  "#176f64",
  "#2f6b9a",
  "#6b5ca5",
  "#a45178",
  "#c0603e",
  "#b47a16",
  "#4f7a3b",
  "#447c86",
  "#7a5a43",
  "#5c6670",
]);

const els = {
  authPanel: document.querySelector("#authPanel"),
  authForm: document.querySelector("#authForm"),
  authOtpForm: document.querySelector("#authOtpForm"),
  authMessage: document.querySelector("#authMessage"),
  authFileWarning: document.querySelector("#authFileWarning"),
  googleSignInButton: document.querySelector("#googleSignInButton"),
  magicLinkButton: document.querySelector("#magicLinkButton"),
  verifyOtpButton: document.querySelector("#verifyOtpButton"),
  userStrip: document.querySelector("#userStrip"),
  currentUserLabel: document.querySelector("#currentUserLabel"),
  signOutButton: document.querySelector("#signOutButton"),
  connectionStatus: document.querySelector("#connectionStatus"),
  lastUpdated: document.querySelector("#lastUpdated"),
  appIssues: document.querySelector("#appIssues"),
  cellLineForm: document.querySelector("#cellLineForm"),
  cultureForm: document.querySelector("#cultureForm"),
  vesselForm: document.querySelector("#vesselForm"),
  protocolForm: document.querySelector("#protocolForm"),
  protocolTaskForm: document.querySelector("#protocolTaskForm"),
  differentiationRunForm: document.querySelector("#differentiationRunForm"),
  differentiationColorPalette: document.querySelector("#differentiationColorPalette"),
  differentiationCustomColor: document.querySelector("#differentiationCustomColor"),
  differentiationColorPreview: document.querySelector("#differentiationColorPreview"),
  differentiationColorPreviewName: document.querySelector("#differentiationColorPreviewName"),
  collectionForm: document.querySelector("#collectionForm"),
  eventForm: document.querySelector("#eventForm"),
  cellLinesList: document.querySelector("#cellLinesList"),
  culturesList: document.querySelector("#culturesList"),
  vesselsList: document.querySelector("#vesselsList"),
  protocolsList: document.querySelector("#protocolsList"),
  protocolTasksList: document.querySelector("#protocolTasksList"),
  differentiationRunsList: document.querySelector("#differentiationRunsList"),
  runDeviationForm: document.querySelector("#runDeviationForm"),
  runDeviationSummary: document.querySelector("#runDeviationSummary"),
  deviationTypeSelect: document.querySelector("#deviationTypeSelect"),
  deviationDayShift: document.querySelector("#deviationDayShift"),
  protocolImportInput: document.querySelector("#protocolImportInput"),
  scheduleRunSelect: document.querySelector("#scheduleRunSelect"),
  collectionRunSelect: document.querySelector("#collectionRunSelect"),
  collectionDate: document.querySelector("#collectionDate"),
  collectionDay: document.querySelector("#collectionDay"),
  runSchedule: document.querySelector("#runSchedule"),
  projectsList: document.querySelector("#projectsList"),
  activeCulturesList: document.querySelector("#activeCulturesList"),
  todayDifferentiationTasks: document.querySelector("#todayDifferentiationTasks"),
  printAllSchedules: document.querySelector("#printAllSchedules"),
  printRunSchedule: document.querySelector("#printRunSchedule"),
  printSchedule: document.querySelector("#printSchedule"),
  calendarRunCheckboxes: document.querySelector("#calendarRunCheckboxes"),
  calendarExportDialog: document.querySelector("#calendarExportDialog"),
  confirmCalendarExport: document.querySelector("#confirmCalendarExport"),
  lateTaskDialog: document.querySelector("#lateTaskDialog"),
  lateTaskForm: document.querySelector("#lateTaskForm"),
  lateTaskSummary: document.querySelector("#lateTaskSummary"),
  deferTaskDialog: document.querySelector("#deferTaskDialog"),
  deferTaskForm: document.querySelector("#deferTaskForm"),
  deferTaskSummary: document.querySelector("#deferTaskSummary"),
  eventsList: document.querySelector("#eventsList"),
  cultureCellLineCheckboxes: document.querySelector("#cultureCellLineCheckboxes"),
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
  downloadCryoCsv: document.querySelector("#downloadCryoCsv"),
  downloadCryoXls: document.querySelector("#downloadCryoXls"),
  downloadCryoPdf: document.querySelector("#downloadCryoPdf"),
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
  differentiationCellLineCheckboxes: document.querySelector("#differentiationCellLineCheckboxes"),
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
  addPlateSetup: document.querySelector("#addPlateSetup"),
  plateSetupList: document.querySelector("#plateSetupList"),
  protocolProjectSelect: document.querySelector("#protocolProjectSelect"),
  customProtocolProjectLabel: document.querySelector("#customProtocolProjectLabel"),
  runProjectSelect: document.querySelector("#runProjectSelect"),
  customRunProjectLabel: document.querySelector("#customRunProjectLabel"),
  projectForm: document.querySelector("#projectForm"),
  projectSubmitButton: document.querySelector("#projectSubmitButton"),
  projectMemberCheckboxes: document.querySelector("#projectMemberCheckboxes"),
  cultureMemberCheckboxes: document.querySelector("#cultureMemberCheckboxes"),
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

let pendingOffScheduleCompletion = null;
let pendingTaskDeferral = null;

function valueOrNull(value) {
  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed === "" ? null : trimmed;
}

function numberOrNull(value) {
  return value === "" || value === null ? null : Number(value);
}

function todayValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function protocolDayForDate(dayZeroDate, dateValue) {
  if (!dayZeroDate || !dateValue) return null;
  return Math.round((new Date(`${dateValue}T12:00:00Z`) - new Date(`${dayZeroDate}T12:00:00Z`)) / 86400000);
}

function dateValueString(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function composedCellLineName(identifier, clone) {
  return [identifier, clone].filter(Boolean).join(" - ");
}

function preferredCellLineName(line) {
  return valueOrNull(line?.full_name) || composedCellLineName(line?.identifier, line?.clone) || valueOrNull(line?.name);
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

function currentUserId() {
  return state.user?.id || null;
}

function isAdmin() {
  return state.profile?.role === "admin";
}

function profileName(profile) {
  return profile?.full_name || profile?.email || "";
}

function memberCheckboxesHtml(selectedIds = []) {
  const selected = new Set(selectedIds.filter(Boolean));
  if (!state.profiles.length) {
    return '<div class="empty-state">No users available yet.</div>';
  }

  return state.profiles
    .map((profile) => `
      <label class="checkbox-label">
        <input type="checkbox" value="${profile.id}" ${selected.has(profile.id) ? "checked" : ""}>
        ${escapeHtml(profileName(profile) || "Unnamed user")}
      </label>
    `)
    .join("");
}

function projectMemberIds(projectId) {
  if (!projectId) return currentUserId() ? [currentUserId()] : [];
  return state.projectMembers
    .filter((member) => member.project_id === projectId)
    .map((member) => member.user_id);
}

function cultureMemberIds(cultureId) {
  if (!cultureId) return currentUserId() ? [currentUserId()] : [];
  return state.cultureMembers
    .filter((member) => member.culture_id === cultureId)
    .map((member) => member.user_id);
}

function memberNames(ids) {
  const names = ids
    .map((id) => state.profiles.find((profile) => profile.id === id))
    .filter(Boolean)
    .map(profileName);
  return names.join(", ");
}

function renderMemberSelectors() {
  const currentProjectId = valueOrNull(els.projectForm.elements.id.value);
  const currentCultureId = valueOrNull(els.cultureForm.elements.id.value);
  if (els.projectMemberCheckboxes) {
    els.projectMemberCheckboxes.innerHTML = memberCheckboxesHtml(projectMemberIds(currentProjectId));
  }
  if (els.cultureMemberCheckboxes) {
    els.cultureMemberCheckboxes.innerHTML = memberCheckboxesHtml(cultureMemberIds(currentCultureId));
  }
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.classList.toggle("is-hidden", !isAdmin());
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
  const starterProjects = state.session ? [] : defaultProjects;
  return uniqueValues([
    ...starterProjects,
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

function showLoadIssues(issues = []) {
  if (!els.appIssues) return;
  const uniqueIssues = [...new Set(issues.filter(Boolean))];
  els.appIssues.classList.toggle("is-hidden", uniqueIssues.length === 0);
  els.appIssues.innerHTML = uniqueIssues.length
    ? `<strong>Some sections could not be loaded.</strong><ul>${uniqueIssues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>`
    : "";
}

async function moduleRequest(label, request) {
  try {
    const result = await withTimeout(Promise.resolve(request), 15000, `${label} request timed out.`);
    return { ...(result || {}), moduleLabel: label };
  } catch (error) {
    return { data: null, error, moduleLabel: label };
  }
}

function loadIssueFor(result) {
  return result?.error ? `${result.moduleLabel}: ${result.error.message || "Unknown error"}` : null;
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
  return new Intl.DateTimeFormat(window.getAppLocale?.() || "en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat(window.getAppLocale?.() || "en-US", {
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
  const lineName = cellLinesForCulture(culture.id).map(cellLineDisplayName).join(" + ") || preferredCellLineName(culture.cell_lines) || "Cell line";
  return culture.culture_name || `${lineName}${culture.passage_number !== null ? ` P${culture.passage_number}` : ""}`;
}

function cellLineIdsForCulture(cultureId) {
  const culture = state.cultures.find((item) => item.id === cultureId);
  return uniqueValues([
    ...state.cultureCellLines.filter((link) => link.culture_id === cultureId).map((link) => link.cell_line_id),
    culture?.cell_line_id,
  ]);
}

function cellLinesForCulture(cultureId) {
  return cellLineIdsForCulture(cultureId)
    .map((id) => state.cellLines.find((line) => line.id === id))
    .filter(Boolean);
}

function cellLineIdsForRun(runId) {
  const run = state.differentiationRuns.find((item) => item.id === runId);
  return uniqueValues([
    ...state.differentiationRunCellLines.filter((link) => link.differentiation_run_id === runId).map((link) => link.cell_line_id),
    ...(run?.source_culture_id ? cellLineIdsForCulture(run.source_culture_id) : []),
  ]);
}

function cellLineDisplayName(line) {
  return preferredCellLineName(line) || "Cell line";
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
  return preferredCellLineName(vial?.cell_lines) || vial?.lineage || "Unlabeled cell line";
}

function cryoVialSlotLabel(vial) {
  if (!vial) return "";
  return [cryoVialLineage(vial), vial.cell_type].filter(Boolean).join(" - ");
}

function cryoVialSearchText(vial, box) {
  return [
    cryoVialLineage(vial),
    vial?.cell_type,
    preferredCellLineName(vial?.cell_lines),
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

function safeFileName(value) {
  return String(value || "cryostock")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "cryostock";
}

function downloadTextFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function xlsCell(value) {
  return escapeHtml(value === null || value === undefined ? "" : String(value));
}

function cryoExportRows(box) {
  const vials = new Map(
    state.cryoVials
      .filter((vial) => vial.box_id === box.id)
      .map((vial) => [vial.position, vial])
  );
  const columns = Math.max(1, Number(box.columns_count || 9));
  return cryoPositionsForBox(box).map((position) => {
    const vial = vials.get(position);
    const rowLabel = position.match(/^[A-Z]+/)?.[0] || "";
    const columnLabel = position.replace(/^[A-Z]+/, "");
    return {
      box: box.name,
      project: box.project,
      freezer: box.freezer,
      rack: box.rack,
      shelf: box.shelf,
      drawer: box.drawer,
      box_position: box.box_position,
      position,
      row: rowLabel,
      column: columnLabel,
      grid_column: Number(columnLabel) || columns,
      lineage: vial ? cryoVialLineage(vial) : "",
      cell_type: vial?.cell_type,
      freeze_date: vial?.freeze_date,
      passage_number: vial?.passage_number,
      status: vial?.status || "empty",
      frozen_by: vial?.frozen_by,
      notes: vial?.notes,
    };
  });
}

function exportCryoCsv(box) {
  const headers = [
    "Box",
    "Project",
    "Freezer",
    "Rack",
    "Shelf",
    "Drawer",
    "Box position",
    "Position",
    "Row",
    "Column",
    "Lineage",
    "Cell type",
    "Freeze date",
    "Passage",
    "Status",
    "Frozen by",
    "Notes",
  ];
  const keys = ["box", "project", "freezer", "rack", "shelf", "drawer", "box_position", "position", "row", "column", "lineage", "cell_type", "freeze_date", "passage_number", "status", "frozen_by", "notes"];
  const lines = [
    headers.map(csvCell).join(","),
    ...cryoExportRows(box).map((row) => keys.map((key) => csvCell(row[key])).join(",")),
  ];
  downloadTextFile(`${safeFileName(box.name)}-cryostock.csv`, lines.join("\n"), "text/csv;charset=utf-8");
}

function exportCryoXls(box) {
  const rows = cryoExportRows(box);
  const rowsByLabel = cryoRows(box.rows_count || 9);
  const columns = Math.max(1, Number(box.columns_count || 9));
  const rowMap = new Map(rows.map((row) => [row.position, row]));
  const mapRows = rowsByLabel.map((rowLabel) => {
    const cells = Array.from({ length: columns }, (_, index) => {
      const position = `${rowLabel}${index + 1}`;
      const row = rowMap.get(position);
      const label = row?.lineage ? `${position}\n${row.lineage}${row.cell_type ? `\n${row.cell_type}` : ""}` : position;
      return `<td>${xlsCell(label).replace(/\n/g, "<br>")}</td>`;
    }).join("");
    return `<tr><th>${xlsCell(rowLabel)}</th>${cells}</tr>`;
  }).join("");
  const detailRows = rows.map((row) => `
    <tr>
      <td>${xlsCell(row.position)}</td>
      <td>${xlsCell(row.lineage)}</td>
      <td>${xlsCell(row.cell_type)}</td>
      <td>${xlsCell(row.freeze_date)}</td>
      <td>${xlsCell(row.passage_number)}</td>
      <td>${xlsCell(row.status)}</td>
      <td>${xlsCell(row.frozen_by)}</td>
      <td>${xlsCell(row.notes)}</td>
    </tr>
  `).join("");
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; margin-bottom: 18px; }
    th, td { border: 1px solid #999; padding: 6px; vertical-align: top; }
    th { background: #e8efeb; }
  </style>
</head>
<body>
  <h1>${xlsCell(box.name)}</h1>
  <p>${xlsCell(cryoBoxLocation(box) || "No freezer location set")}</p>
  <table>
    <tr><th></th>${Array.from({ length: columns }, (_, index) => `<th>${index + 1}</th>`).join("")}</tr>
    ${mapRows}
  </table>
  <table>
    <tr>
      <th>Position</th><th>Lineage</th><th>Cell type</th><th>Freeze date</th>
      <th>Passage</th><th>Status</th><th>Frozen by</th><th>Notes</th>
    </tr>
    ${detailRows}
  </table>
</body>
</html>`;
  downloadTextFile(`${safeFileName(box.name)}-cryostock.xls`, html, "application/vnd.ms-excel;charset=utf-8");
}

function pdfSafeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/([\\()])/g, "\\$1");
}

function pdfText(x, y, size, value) {
  return `BT /F1 ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${pdfSafeText(value)}) Tj ET`;
}

function pdfWrappedLines(value, maxCharacters, maxLines = 2) {
  const words = String(value ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word.slice(0, maxCharacters);
    }
  });
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(1, maxCharacters - 3))}...`;
  }
  return lines;
}

function buildCryoPdf(box) {
  const rows = cryoExportRows(box);
  const rowLabels = cryoRows(box.rows_count || 9);
  const columnCount = Math.max(1, Number(box.columns_count || 9));
  const byPosition = new Map(rows.map((row) => [row.position, row]));
  const pages = [];
  const pageWidth = 842;
  const pageHeight = 595;

  const map = [
    pdfText(36, 558, 18, box.name),
    pdfText(36, 540, 9, cryoBoxLocation(box) || "No freezer location set"),
  ];
  const left = 52;
  const top = 510;
  const gridWidth = 754;
  const gridHeight = Math.min(390, 36 * rowLabels.length);
  const cellWidth = gridWidth / columnCount;
  const cellHeight = gridHeight / rowLabels.length;
  map.push("0.55 w 0.72 0.78 0.80 RG");
  rowLabels.forEach((rowLabel, rowIndex) => {
    map.push(pdfText(36, top - rowIndex * cellHeight - cellHeight / 2 - 3, 8, rowLabel));
    Array.from({ length: columnCount }, (_, columnIndex) => {
      const position = `${rowLabel}${columnIndex + 1}`;
      const row = byPosition.get(position);
      const x = left + columnIndex * cellWidth;
      const y = top - (rowIndex + 1) * cellHeight;
      map.push(`${x.toFixed(1)} ${y.toFixed(1)} ${cellWidth.toFixed(1)} ${cellHeight.toFixed(1)} re S`);
      map.push(pdfText(x + 3, y + cellHeight - 11, 7, position));
      if (row?.lineage) {
        const maxChars = Math.max(5, Math.floor(cellWidth / 4.3));
        map.push(pdfText(x + 3, y + cellHeight / 2 - 2, 6, row.lineage.slice(0, maxChars)));
        if (row.cell_type) map.push(pdfText(x + 3, y + 5, 5, String(row.cell_type).slice(0, maxChars)));
      }
    });
  });
  Array.from({ length: columnCount }, (_, index) => {
    map.push(pdfText(left + index * cellWidth + cellWidth / 2 - 2, top + 8, 8, index + 1));
  });
  map.push(pdfText(36, 74, 8, `Project: ${box.project || "Not specified"}`));
  map.push(pdfText(36, 58, 8, `Generated: ${new Date().toLocaleString()}`));
  pages.push(map.join("\n"));

  const occupied = rows.filter((row) => row.lineage);
  const tableColumns = [
    { label: "Position", key: "position", width: 48 },
    { label: "Cell line", key: "lineage", width: 142 },
    { label: "Cell type", key: "cell_type", width: 92 },
    { label: "Freeze date", key: "freeze_date", width: 72 },
    { label: "Passage", key: "passage_number", width: 48 },
    { label: "Status", key: "status", width: 62 },
    { label: "Frozen by", key: "frozen_by", width: 88 },
    { label: "Notes", key: "notes", width: 218 },
  ];
  const tableLeft = 36;
  const tableTop = 520;
  const headerHeight = 25;
  const rowHeight = 36;
  for (let start = 0; start < occupied.length; start += 12) {
    const detail = [pdfText(36, 558, 16, `${box.name} - vial details`), "0.35 w 0.65 0.70 0.68 RG"];
    let x = tableLeft;
    tableColumns.forEach((column) => {
      detail.push("0.91 0.94 0.92 rg");
      detail.push(`${x} ${tableTop} ${column.width} ${headerHeight} re B`);
      detail.push("0 0 0 rg");
      detail.push(pdfText(x + 4, tableTop + 9, 7, column.label));
      x += column.width;
    });
    occupied.slice(start, start + 12).forEach((row, rowIndex) => {
      const y = tableTop - (rowIndex + 1) * rowHeight;
      let cellX = tableLeft;
      tableColumns.forEach((column) => {
        detail.push(`${cellX} ${y} ${column.width} ${rowHeight} re S`);
        const maxCharacters = Math.max(4, Math.floor((column.width - 8) / 3.8));
        pdfWrappedLines(row[column.key], maxCharacters).forEach((line, lineIndex) => {
          detail.push(pdfText(cellX + 4, y + rowHeight - 12 - lineIndex * 10, 6.5, line));
        });
        cellX += column.width;
      });
    });
    detail.push(pdfText(752, 35, 7, `Page ${pages.length + 1}`));
    pages.push(detail.join("\n"));
  }

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  const pageRefs = pages.map((_, index) => 4 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  pages.forEach((content, index) => {
    const pageRef = 4 + index * 2;
    const contentRef = pageRef + 1;
    objects[pageRef] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentRef} 0 R >>`;
    objects[contentRef] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  const encoder = new TextEncoder();
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = encoder.encode(pdf).length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return encoder.encode(pdf);
}

function exportCryoPdf(box) {
  const blob = new Blob([buildCryoPdf(box)], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${safeFileName(box.name)}-cryostock.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
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
  const selectedLines = getCheckedValues(els.cultureCellLineCheckboxes)
    .map((id) => state.cellLines.find((item) => item.id === id))
    .filter(Boolean);
  const date = els.cultureForm.elements.start_date.value || todayValue();
  return [selectedLines.length ? selectedLines.map(cellLineDisplayName).join(" + ") : "Culture batch", formatDate(date)].join(" - ");
}

function syncCultureNameSuggestion(force = false) {
  const field = els.cultureForm.elements.culture_name;
  if (els.cultureForm.elements.id.value && !force) return;
  if (!force && state.cultureNameEdited) return;
  field.value = suggestedCultureName();
}

function plateTypeOptionsHtml(selectedValue = "") {
  const options = ["6 well", "12 well", "24 well", "96 well", "60mm", "100mm", "150mm"];
  return [
    '<option value="">No plate</option>',
    ...options.map((option) => `<option value="${option}" ${option === selectedValue ? "selected" : ""}>${option}</option>`),
  ].join("");
}

function plateSetupRowHtml(setup = {}, index = 0) {
  const mode = setup.mode || "whole";
  return `
    <div class="plate-setup-row" data-plate-setup-row>
      <label>
        Plate type
        <select name="plate_setup_type">${plateTypeOptionsHtml(setup.plateType || "")}</select>
      </label>
      <label>
        Quantity
        <input name="plate_setup_count" type="number" min="0" step="1" value="${escapeHtml(setup.count ?? 1)}">
      </label>
      <label>
        Map
        <select name="plate_setup_mode">
          <option value="whole" ${mode === "whole" ? "selected" : ""}>Same condition</option>
          <option value="map" ${mode === "map" ? "selected" : ""}>Map wells</option>
        </select>
      </label>
      <label>
        Name prefix
        <input name="plate_setup_name" value="${escapeHtml(setup.name || "")}" placeholder="Optional">
      </label>
      <button class="icon-button danger-button" data-remove-plate-setup type="button" title="Remove plate setup" aria-label="Remove plate setup">&#128465;</button>
    </div>
  `;
}

function renderPlateSetupRows(setups = [{ count: 1, mode: "whole" }]) {
  els.plateSetupList.innerHTML = setups.map(plateSetupRowHtml).join("");
}

function addPlateSetupRow(setup) {
  els.plateSetupList.insertAdjacentHTML("beforeend", plateSetupRowHtml(setup || { count: 1, mode: "whole" }));
}

function plateSetupsFromForm(form) {
  return Array.from(form.querySelectorAll("[data-plate-setup-row]"))
    .map((row) => ({
      plateType: valueOrNull(row.querySelector('[name="plate_setup_type"]')?.value),
      count: Math.max(0, numberOrNull(row.querySelector('[name="plate_setup_count"]')?.value) ?? 0),
      mode: valueOrNull(row.querySelector('[name="plate_setup_mode"]')?.value) || "whole",
      name: valueOrNull(row.querySelector('[name="plate_setup_name"]')?.value),
    }))
    .filter((setup) => setup.plateType && setup.count > 0);
}

async function createPlatesForCulture(culture, options) {
  const plateSetups = options.plateSetups?.length
    ? options.plateSetups
    : [{
      plateType: valueOrNull(options.plateType),
      count: Math.max(0, Number(options.plateCount || 0)),
      mode: options.wholePlate ? "whole" : "map",
    }];
  const normalizedSetups = plateSetups
    .map((setup) => ({
      ...setup,
      plateType: valueOrNull(setup.plateType),
      count: Math.max(0, Number(setup.count || 0)),
      mapWells: setup.mode === "map" || setup.mapWells === true,
    }))
    .filter((setup) => setup.plateType && setup.count > 0);
  if (normalizedSetups.length === 0) return [];

  const baseName = basePlateName(culture, culture.cell_line_id);
  const plates = normalizedSetups.flatMap((setup, setupIndex) =>
    Array.from({ length: setup.count }, (_, index) => {
      const multipleSetups = normalizedSetups.length > 1;
      const defaultName = multipleSetups ? `${baseName} ${setup.plateType}` : `${baseName} plate`;
      const nameBase = setup.name || defaultName;
      return {
        name: setup.count === 1 ? nameBase : `${nameBase} ${index + 1}`,
        vessel_type: setup.plateType,
        culture_id: culture.id,
        location: culture.location || null,
        status: "active",
        notes: setup.mapWells ? "Map wells for multiple lineages or conditions." : "Whole plate same condition.",
        _mapWells: setup.mapWells,
        _setupIndex: setupIndex,
      };
    })
  );

  const { data: savedPlates, error } = await db
    .from("culture_vessels")
    .insert(plates.map(({ _mapWells, _setupIndex, ...plate }) => plate))
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

  return (savedPlates || []).map((plate, index) => ({
    ...plate,
    mapWells: Boolean(plates[index]?._mapWells),
  }));
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

  const plateSetups = plateSetupsFromForm(form);
  if (plateSetups.length === 0) {
    showToast("Add at least one plate setup first.");
    return;
  }

  try {
    const createdPlates = await createPlatesForCulture(
      {
        ...culture,
        culture_name: valueOrNull(form.elements.culture_name.value) || culture.culture_name,
        location: valueOrNull(form.elements.location.value) || culture.location,
      },
      { plateSetups }
    );
    showToast(createdPlates.length ? `${createdPlates.length} plate${createdPlates.length === 1 ? "" : "s"} created.` : "No plates created.");
    await loadAll();
    const firstMappedPlate = createdPlates.find((plate) => plate.mapWells && isMultiwell(plate.vessel_type));
    if (firstMappedPlate) {
      state.selectedVesselId = firstMappedPlate.id;
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
  const selectedScheduleRun = els.scheduleRunSelect?.value;
  const selectedCollectionRun = els.collectionRunSelect?.value;
  const lineOptions = state.cellLines
    .map((line) => `<option value="${line.id}">${escapeHtml(cellLineDisplayName(line))}</option>`)
    .join("");

  const lineCheckboxes = state.cellLines.length
    ? state.cellLines.map((line) => `<label class="checkbox-label"><input type="checkbox" value="${line.id}">${escapeHtml(cellLineDisplayName(line))}</label>`).join("")
    : '<div class="empty-state">Add a cell line first.</div>';
  els.cultureCellLineCheckboxes.innerHTML = lineCheckboxes;
  els.differentiationCellLineCheckboxes.innerHTML = lineCheckboxes;
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

  const runOptions = state.differentiationRuns
    .map((run) => `<option value="${run.id}">${escapeHtml(differentiationRunLabel(run))}</option>`)
    .join("");
  els.scheduleRunSelect.innerHTML = runOptions || '<option value="">Start a differentiation first</option>';
  els.collectionRunSelect.innerHTML = runOptions || '<option value="">Start a differentiation first</option>';
  els.scheduleRunSelect.disabled = state.differentiationRuns.length === 0;
  els.collectionRunSelect.disabled = state.differentiationRuns.length === 0;
  if (state.differentiationRuns.some((run) => run.id === selectedScheduleRun)) els.scheduleRunSelect.value = selectedScheduleRun;
  if (state.differentiationRuns.some((run) => run.id === selectedCollectionRun)) els.collectionRunSelect.value = selectedCollectionRun;

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
      const title = cellLineDisplayName(line);
      const modifications = [
        line.has_crispr ? "CRISPR" : null,
        line.has_transgene ? "Transgene" : null,
        line.fluorescence ? `${line.fluorescence} fluorescence` : null,
      ].filter(Boolean);
      const meta = [
        line.full_name ? composedCellLineName(line.identifier, line.clone) : null,
        line.species,
        line.cell_type,
        line.source,
        ...modifications,
      ].filter(Boolean);
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
            <button class="secondary-button compact-button" data-clone-protocol="${protocol.id}" type="button">Clone & adapt</button>
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
            ${task.medium ? `<p class="task-medium"><strong>Medium:</strong> ${escapeHtml(task.medium)}</p>` : ""}
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

function normalizedBatchColor(value, fallback = "#176f64") {
  const color = String(value || "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(color) ? color : fallback;
}

function nextDifferentiationBatchColor(excludeRunId = null) {
  const usedColors = state.differentiationRuns
    .filter((run) => run.id !== excludeRunId)
    .map((run) => normalizedBatchColor(run.schedule_color, ""));
  return window.ScheduleCalendar?.nextAvailableColor(differentiationBatchColors, usedColors) || differentiationBatchColors[0];
}

function updateDifferentiationColorPreviewName() {
  if (!els.differentiationColorPreviewName) return;
  els.differentiationColorPreviewName.textContent = valueOrNull(els.differentiationRunForm?.elements.run_name?.value)
    || printableScheduleText("New batch");
}

function syncDifferentiationBatchColor(value, userSelected = false) {
  const color = normalizedBatchColor(value);
  if (els.differentiationCustomColor) els.differentiationCustomColor.value = color;
  if (userSelected && els.differentiationRunForm) els.differentiationRunForm.dataset.colorUserSelected = "true";
  els.differentiationColorPalette?.querySelectorAll("[data-batch-color]").forEach((button) => {
    const selected = button.dataset.batchColor === color;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  if (els.differentiationColorPreview) els.differentiationColorPreview.style.setProperty("--batch-color", color);
  updateDifferentiationColorPreviewName();
}

function renderDifferentiationColorPalette() {
  if (!els.differentiationColorPalette) return;
  els.differentiationColorPalette.innerHTML = differentiationBatchColors.map((color, index) => `
    <button class="batch-color-swatch" data-batch-color="${color}" type="button" aria-pressed="false" aria-label="${escapeHtml(`${printableScheduleText("Color option")} ${index + 1}: ${color}`)}" style="--batch-color:${color}"><span aria-hidden="true"></span></button>
  `).join("");
  syncDifferentiationBatchColor(els.differentiationCustomColor?.value || nextDifferentiationBatchColor());
}

function refreshNewDifferentiationBatchColor() {
  if (valueOrNull(els.differentiationRunForm?.elements.id?.value)) return;
  if (els.differentiationRunForm?.dataset.colorUserSelected === "true") return;
  syncDifferentiationBatchColor(nextDifferentiationBatchColor());
}

function deviationsForRun(runId) {
  return state.differentiationRunDeviations
    .filter((deviation) => deviation.differentiation_run_id === runId)
    .sort((a, b) => Number(a.after_protocol_day) - Number(b.after_protocol_day) || String(a.created_at || "").localeCompare(String(b.created_at || "")));
}

function deviationTypeLabel(type) {
  return {
    extra_day: "Extra day in phase",
    shortened_phase: "Shortened phase",
    other: "Other protocol deviation",
  }[type] || "Protocol deviation";
}

function adjustedRunDay(runId, protocolDay) {
  return Number(protocolDay) + deviationsForRun(runId)
    .filter((deviation) => Number(protocolDay) > Number(deviation.after_protocol_day))
    .reduce((total, deviation) => total + Number(deviation.day_shift || 0), 0);
}

function automaticMediumForRunDay(run, runDay) {
  const thresholds = [31, 24, 17, 10, 3].map((protocolDay) => ({
    protocolDay,
    runDay: adjustedRunDay(run.id, protocolDay),
  }));
  const stage = thresholds.find((threshold) => runDay >= threshold.runDay)?.protocolDay;
  return stage === undefined ? null : automaticMediumForDay(stage);
}

function protocolDeviationFlag(run) {
  const deviations = deviationsForRun(run.id);
  if (!deviations.length) return "";
  const totalShift = deviations.reduce((total, deviation) => total + Number(deviation.day_shift || 0), 0);
  const shiftText = totalShift === 0 ? "documented" : `${totalShift > 0 ? "+" : ""}${totalShift} day${Math.abs(totalShift) === 1 ? "" : "s"}`;
  return `<span class="badge deviation-flag" title="This batch differs from its protocol template">⚑ Protocol deviation · ${escapeHtml(shiftText)}</span>`;
}

function renderDifferentiationRuns() {
  if (state.differentiationRuns.length === 0) {
    els.differentiationRunsList.innerHTML = '<div class="empty-state">No differentiation runs started yet.</div>';
    return;
  }

  els.differentiationRunsList.innerHTML = state.differentiationRuns
    .map((run) => {
      const protocol = state.differentiationProtocols.find((item) => item.id === run.protocol_id);
      const batchColor = runScheduleColor(run);
      const currentDay = daysSince(run.day_zero_date);
      const meta = [
        projectForDifferentiationRun(run),
        protocol?.name,
        `Cell lines: ${cellLineIdsForRun(run.id).map((id) => state.cellLines.find((line) => line.id === id)).filter(Boolean).map(cellLineDisplayName).join(", ") || "Not specified"}`,
        differentiationSourceLabel(run),
        run.day_zero_date ? `Day 0: ${formatDate(run.day_zero_date)}` : null,
        currentDay !== null ? `D${currentDay}` : null,
      ].filter(Boolean);
      const scheduledTasks = state.protocolTasks
        .filter((task) => task.protocol_id === run.protocol_id)
        .sort((a, b) => (a.task_day ?? 0) - (b.task_day ?? 0))
        .slice(0, 5);
      return `
        <article class="item differentiation-run-card" style="--run-color:${escapeHtml(batchColor)}">
          <div>
            <div class="item-title differentiation-run-title"><span aria-hidden="true"></span>${escapeHtml(run.run_name)}</div>
            <div class="item-meta">
              ${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>
            ${scheduledTasks.length ? `
              <div class="task-preview">
                ${scheduledTasks.map((task) => `
                  <div>
                    <strong>${escapeHtml(`D${adjustedRunDay(run.id, task.task_day)}: ${task.title}${adjustedRunDay(run.id, task.task_day) !== Number(task.task_day) ? ` (protocol D${task.task_day})` : ""}`)}</strong>
                    <span>${escapeHtml(formatEstimatedCompletion(run.day_zero_date, adjustedRunDay(run.id, task.task_day), task.estimated_duration_hours) || "No estimate")}</span>
                  </div>
                `).join("")}
              </div>
            ` : ""}
            ${deviationsForRun(run.id).length ? `<div class="run-deviation-callout">${protocolDeviationFlag(run)}<span>${escapeHtml(deviationsForRun(run.id).map((deviation) => `${deviationTypeLabel(deviation.deviation_type)} after D${deviation.after_protocol_day}: ${deviation.reason}`).join("; "))}</span></div>` : ""}
          </div>
          <div class="item-actions">
            <span class="badge differentiation-run-status">${escapeHtml(run.status || "active")}</span>
            <button class="icon-button edit-button" data-edit-differentiation-run="${run.id}" type="button" title="Edit differentiation" aria-label="Edit differentiation">&#9998;</button>
            <button class="icon-button danger-button" data-delete-differentiation-run="${run.id}" type="button" title="Delete differentiation" aria-label="Delete differentiation">&#128465;</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function automaticMediumForDay(day) {
  if (day >= 31) return "Medium 2 (maintenance)";
  if (day >= 24) return "Medium 3";
  if (day >= 17) return "Medium 2 + FGF2 + EGF";
  if (day >= 10) return "Medium 2 + FGF2";
  if (day >= 3) return "Medium 1";
  return null;
}

function hasMeaningfulProtocolValue(value) {
  const normalized = String(value || "").trim();
  return Boolean(normalized && !["-", "–", "—"].includes(normalized));
}

function carriedForwardMedium(tasks, runDay) {
  return tasks
    .filter((task) => Number(task.task_day) <= Number(runDay) && hasMeaningfulProtocolValue(task.medium))
    .sort((a, b) => Number(b.task_day) - Number(a.task_day))[0]?.medium || null;
}

function buildRunSchedule(run) {
  const allProtocolTasks = state.protocolTasks.filter((task) => task.protocol_id === run.protocol_id);
  const tasks = allProtocolTasks
    .filter((task) => hasMeaningfulProtocolValue(task.title))
    .map((task) => {
      const protocolDay = Number(task.task_day);
      const runDay = adjustedRunDay(run.id, protocolDay);
      return { ...task, kind: "task", protocol_day: protocolDay, task_day: runDay, date: addDays(run.day_zero_date, runDay) };
    });
  const isMediumTask = (task) => hasMeaningfulProtocolValue(task.medium)
    || ["Media change", "Factor addition", "Replating"].includes(task.task_type);
  const explicitMediumDays = new Set(tasks.filter(isMediumTask).map((task) => Number(task.task_day)));
  const configuredDuration = Number(state.differentiationProtocols.find((protocol) => protocol.id === run.protocol_id)?.expected_duration_days || 0);
  const importedDuration = Math.max(0, ...allProtocolTasks.map((task) => Number(task.task_day) || 0));
  const hasMaintenancePhase = tasks.some((task) => /maintenance|organoids? formed/i.test(`${task.title || ""} ${task.medium || ""}`));
  const protocolDuration = Math.max(configuredDuration, importedDuration, hasMaintenancePhase ? 90 : 31);
  const duration = adjustedRunDay(run.id, protocolDuration);
  const maintenanceStartDay = adjustedRunDay(run.id, 31);
  const automaticChanges = [];
  for (let day = 3; day <= duration; day += 1) {
    const date = addDays(run.day_zero_date, day);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const isMaintenancePhase = day > maintenanceStartDay;
    const preferredWeekdays = isMaintenancePhase ? [1, 4] : [1, 3, 5];
    const isPreferredDay = preferredWeekdays.includes(weekday);
    const adjacentToExplicitChange = explicitMediumDays.has(day - 1) || explicitMediumDays.has(day + 1);
    const adjacentToAutomaticChange = automaticChanges.some((change) => Math.abs(change.task_day - day) <= 1);
    if (isPreferredDay && !explicitMediumDays.has(day) && !adjacentToExplicitChange && !adjacentToAutomaticChange) {
      automaticChanges.push({ kind: "automatic", task_day: day, date, title: isMaintenancePhase ? "Maintenance medium change" : "Medium change", medium: carriedForwardMedium(tasks, day) || automaticMediumForRunDay(run, day) });
    }
  }
  const deviations = deviationsForRun(run.id).map((deviation) => {
    const markerDay = adjustedRunDay(run.id, Number(deviation.after_protocol_day)) + 1;
    return {
      ...deviation,
      kind: "deviation",
      task_day: markerDay,
      date: addDays(run.day_zero_date, markerDay),
      title: `Protocol deviation: ${deviationTypeLabel(deviation.deviation_type)}`,
      medium: null,
    };
  });
  const collections = state.differentiationEvents
    .filter((event) => event.differentiation_run_id === run.id && event.event_type === "Collection")
    .map((event) => ({ ...event, kind: "collection", task_day: event.event_day ?? protocolDayForDate(run.day_zero_date, event.event_date), date: dateValueString(event.event_date), title: event.experiment || "Collection" }));
  return [...tasks, ...automaticChanges, ...deviations, ...collections].sort((a, b) => dateValueString(a.date).localeCompare(dateValueString(b.date)) || (a.kind === "collection" ? 1 : -1));
}

function completionEventForItem(run, item) {
  return state.differentiationEvents.find((event) => {
    if (event.differentiation_run_id !== run.id) return false;
    if (item.kind === "task" && item.id) return event.protocol_task_id === item.id;
    if (item.kind === "automatic") return Number(event.scheduled_run_day ?? event.event_day) === Number(item.task_day) && event.event_type === "Media change" && event.scheduled_title === item.title;
    return false;
  });
}

function runScheduleColor(run) {
  return normalizedBatchColor(run.schedule_color, projectColor(projectForDifferentiationRun(run)) || "#176f64");
}

function actionableScheduleItems(run) {
  return buildRunSchedule(run).filter((item) => item.kind === "task" || item.kind === "automatic");
}

function scheduleTaskHtml(run, item, compact = false) {
  const completedEvent = completionEventForItem(run, item);
  const detail = item.medium && String(item.medium).trim() !== "-" ? item.medium : item.notes || "";
  const protocolDayNote = item.protocol_day !== undefined && Number(item.protocol_day) !== Number(item.task_day) ? ` · protocol D${item.protocol_day}` : "";
  const overdue = !completedEvent && dateValueString(item.date) < todayValue();
  return `<article class="schedule-task ${completedEvent ? "is-complete" : ""} ${overdue ? "is-overdue" : ""}" style="--run-color:${escapeHtml(runScheduleColor(run))}">
    <div class="schedule-task-actions"><button class="task-check" data-toggle-schedule-task="${escapeHtml(run.id)}" data-task-kind="${escapeHtml(item.kind)}" data-task-id="${escapeHtml(item.id || "")}" data-task-day="${escapeHtml(item.task_day)}" type="button" aria-label="${completedEvent ? "Mark task incomplete" : "Mark task complete"}" aria-pressed="${completedEvent ? "true" : "false"}"><span aria-hidden="true">${completedEvent ? "✓" : ""}</span><em>${completedEvent ? "Completed" : "Complete"}</em></button>${!completedEvent ? `<button class="task-defer-button" data-defer-schedule-task="${escapeHtml(run.id)}" data-task-kind="${escapeHtml(item.kind)}" data-task-id="${escapeHtml(item.id || "")}" data-task-day="${escapeHtml(item.task_day)}" type="button">Defer / shift</button>` : ""}</div>
    <div>
      <div class="schedule-task-heading"><strong>${escapeHtml(item.title)}${overdue ? ' <em class="overdue-label">Overdue</em>' : ""}</strong>${compact ? `<span>${escapeHtml(formatDate(dateValueString(item.date)))}</span>` : `<span>${escapeHtml(formatDate(dateValueString(item.date)))} · run D${escapeHtml(item.task_day)}${escapeHtml(protocolDayNote)}</span>`}</div>
      ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
      <small>${escapeHtml(differentiationRunLabel(run))}</small>
    </div>
  </article>`;
}

function renderTodayDifferentiationTasks() {
  const today = todayValue();
  const due = state.differentiationRuns
    .filter((run) => run.status === "active")
    .flatMap((run) => actionableScheduleItems(run).filter((item) => {
      const plannedDate = dateValueString(item.date);
      return plannedDate === today || (plannedDate < today && !completionEventForItem(run, item));
    }).map((item) => ({ run, item })))
    .sort((a, b) => dateValueString(a.item.date).localeCompare(dateValueString(b.item.date)));
  els.todayDifferentiationTasks.innerHTML = due.length
    ? due.map(({ run, item }) => scheduleTaskHtml(run, item, true)).join("")
    : '<div class="empty-state">No differentiation tasks scheduled for today.</div>';
}

function renderCalendarRunFilters() {
  const wasInitialized = Boolean(els.calendarRunCheckboxes.querySelector("input"));
  const previousSelection = new Set(getCheckedValues(els.calendarRunCheckboxes));
  const runs = state.differentiationRuns.filter((run) => run.status === "active" && buildRunSchedule(run).length > 0);
  els.calendarRunCheckboxes.innerHTML = runs.length
    ? runs.map((run) => `<label class="checkbox-label calendar-run-option" style="--run-color:${escapeHtml(runScheduleColor(run))}"><input type="checkbox" value="${run.id}" ${!wasInitialized || previousSelection.has(run.id) ? "checked" : ""}><i aria-hidden="true"></i>${escapeHtml(differentiationRunLabel(run))}</label>`).join("")
    : '<div class="empty-state">No active batches have scheduled activities.</div>';
}

function renderRunDeviationSummary(run) {
  const deviations = run ? deviationsForRun(run.id) : [];
  if (!run) {
    els.runDeviationSummary.innerHTML = '<div class="empty-state">Start a differentiation before recording adjustments.</div>';
    els.runDeviationForm.querySelectorAll("input, select, textarea, button").forEach((control) => { control.disabled = true; });
    return;
  }
  els.runDeviationForm.querySelectorAll("input, select, textarea, button").forEach((control) => { control.disabled = false; });
  els.runDeviationSummary.innerHTML = deviations.length
    ? `<div class="deviation-summary-header">${protocolDeviationFlag(run)}<strong>${deviations.length} recorded adjustment${deviations.length === 1 ? "" : "s"}</strong></div>${deviations.map((deviation) => `<article class="deviation-record"><div><strong>${escapeHtml(deviationTypeLabel(deviation.deviation_type))}${deviation.detection_source === "automatic" ? ' <em class="auto-detected-label">Auto-detected</em>' : ""}</strong><span>After protocol D${escapeHtml(deviation.after_protocol_day)} · ${Number(deviation.day_shift) > 0 ? "+" : ""}${escapeHtml(deviation.day_shift)} schedule day${Math.abs(Number(deviation.day_shift)) === 1 ? "" : "s"}${deviation.planned_date && deviation.performed_date ? ` · planned ${escapeHtml(formatDate(deviation.planned_date))}, performed ${escapeHtml(formatDate(deviation.performed_date))}` : ""}</span><p>${escapeHtml(deviation.reason)}</p>${deviation.notes ? `<small>${escapeHtml(deviation.notes)}</small>` : ""}</div><button class="icon-button danger-button" data-delete-run-deviation="${deviation.id}" type="button" title="Delete deviation" aria-label="Delete deviation">&#128465;</button></article>`).join("")}`
    : '<div class="empty-state">No protocol deviations recorded for this batch.</div>';
}

function renderRunSchedule() {
  const run = state.differentiationRuns.find((item) => item.id === els.scheduleRunSelect?.value) || state.differentiationRuns[0];
  if (!run) {
    els.runSchedule.innerHTML = '<div class="empty-state">Start a differentiation to generate its schedule.</div>';
    renderRunDeviationSummary(null);
    return;
  }
  if (els.scheduleRunSelect.value !== run.id) els.scheduleRunSelect.value = run.id;
  const today = todayValue();
  const schedule = buildRunSchedule(run);
  renderRunDeviationSummary(run);
  els.runSchedule.innerHTML = schedule.map((item) => {
    if (item.kind === "task" || item.kind === "automatic") return scheduleTaskHtml(run, item);
    const itemDate = dateValueString(item.date);
    const stateClass = itemDate === today ? "is-today" : itemDate < today ? "is-past" : "";
    const kindLabel = item.kind === "deviation" ? "Protocol deviation" : item.kind === "collection" ? "Collection" : item.task_type || "Protocol task";
    const detail = item.kind === "collection"
      ? [item.quantity, item.notes].filter(Boolean).join(" · ")
      : [item.reason, item.notes].filter(Boolean).join(" · ");
    return `<article class="schedule-row ${stateClass} ${item.kind === "deviation" ? "is-deviation" : ""}">
      <div class="schedule-date"><strong>${escapeHtml(formatDate(itemDate))}</strong><span>D${item.task_day}</span></div>
      <div><span class="schedule-kind">${escapeHtml(kindLabel)}</span><h4>${escapeHtml(item.title)}</h4>${detail ? `<p>${escapeHtml(detail)}</p>` : ""}</div>
    </article>`;
  }).join("") || '<div class="empty-state">This protocol has no scheduled tasks.</div>';
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
      const label = well?.condition_label || preferredCellLineName(well?.cell_lines) || "Empty";
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
    `Cell lines: ${cellLinesForCulture(culture.id).map(cellLineDisplayName).join(", ") || preferredCellLineName(culture.cell_lines)}`,
    memberNames(cultureMemberIds(culture.id)) ? `Members: ${memberNames(cultureMemberIds(culture.id))}` : null,
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
      const label = record?.condition_label || preferredCellLineName(record?.cell_lines) || record?.cultures?.culture_name || "";
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
          preferredCellLineName(culture?.cell_lines),
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
      title: event.scheduled_title || event.event_type || "Differentiation event",
      badge: "Differentiation",
      editAttribute: `data-edit-differentiation-event="${event.id}"`,
      photoUrl: event.photo_url,
      notes: [event.medium, event.notes].filter(Boolean).join(" · "),
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
              ${item.photoUrl ? `<img class="event-photo" src="${escapeHtml(displayPhotoUrl(item.photoUrl))}" alt="Event photo">` : ""}
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
        memberNames(projectMemberIds(savedProject?.id)) ? `Members: ${memberNames(projectMemberIds(savedProject?.id))}` : null,
      ].filter(Boolean);
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

function clearData() {
  state.profile = null;
  state.profiles = [];
  state.projectMembers = [];
  state.cultureMembers = [];
  state.projects = [];
  state.cellLines = [];
  state.cultures = [];
  state.cultureCellLines = [];
  state.events = [];
  state.vessels = [];
  state.vesselWells = [];
  state.vesselCultures = [];
  state.cryoBoxes = [];
  state.cryoVials = [];
  state.differentiationProtocols = [];
  state.protocolTasks = [];
  state.differentiationRuns = [];
  state.differentiationRunCellLines = [];
  state.differentiationRunDeviations = [];
  state.differentiationRunWells = [];
  state.differentiationEvents = [];
  state.signedPhotoUrls = new Map();
  state.selectedVesselId = null;
  state.selectedWells = new Set();
  state.selectedCryoBoxId = null;
  state.selectedCryoPositions = new Set();
}

function photoStoragePath(value) {
  if (!value) return null;
  if (!/^https?:\/\//i.test(String(value))) {
    return String(value).replace(new RegExp(`^${PHOTO_BUCKET}/`), "");
  }
  try {
    const pathname = new URL(value).pathname;
    const marker = `/${PHOTO_BUCKET}/`;
    const markerIndex = pathname.indexOf(marker);
    return markerIndex >= 0 ? decodeURIComponent(pathname.slice(markerIndex + marker.length)) : null;
  } catch (_error) {
    return String(value).replace(new RegExp(`^${PHOTO_BUCKET}/`), "");
  }
}

function displayPhotoUrl(value) {
  return state.signedPhotoUrls.get(value) || value;
}

async function refreshSignedPhotoUrls() {
  if (!state.authAvailable || !state.session) return;
  const photoValues = uniqueValues([
    ...state.events.map((event) => event.photo_url),
    ...state.differentiationEvents.map((event) => event.photo_url),
  ]);
  const signedEntries = await Promise.all(photoValues.map(async (value) => {
    const path = photoStoragePath(value);
    if (!path) return [value, value];
    const { data, error } = await db.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600);
    return [value, error ? null : data?.signedUrl || null];
  }));
  state.signedPhotoUrls = new Map(signedEntries.filter(([, signedUrl]) => signedUrl));
}

function renderAuthState() {
  const requiresSignIn = state.authAvailable;
  const signedIn = Boolean(state.session && state.user);
  const accessPending = requiresSignIn && signedIn && state.profile?.is_active === false;
  document.querySelectorAll(".app-shell").forEach((element) => {
    element.classList.toggle("is-hidden", requiresSignIn && (!signedIn || accessPending));
  });
  els.authPanel?.classList.toggle("is-hidden", !requiresSignIn || (signedIn && !accessPending));
  els.userStrip?.classList.toggle("is-hidden", !requiresSignIn || !signedIn);
  els.authForm?.classList.toggle("is-hidden", accessPending);
  els.authOtpForm?.closest(".auth-code-panel")?.classList.toggle("is-hidden", accessPending);
  const authTitle = document.querySelector("#authTitle");
  if (authTitle) authTitle.textContent = accessPending ? "Access pending" : "Sign in with Google";
  if (accessPending) {
    setAuthMessage("Your account is ready, but an administrator still needs to assign project or culture access.");
  } else if (!signedIn && els.authMessage?.textContent.startsWith("Your account is ready")) {
    setAuthMessage("Only approved project members can access lab records.");
  }
  if (els.currentUserLabel) {
    const pendingLabel = accessPending ? " · awaiting access" : "";
    els.currentUserLabel.textContent = signedIn ? `${profileName(state.profile) || state.user.email || "Signed in"}${pendingLabel}` : "";
  }
  if (els.authFileWarning) {
    els.authFileWarning.classList.toggle("is-hidden", window.location.protocol !== "file:");
  }
  renderMemberSelectors();
}

function renderAll() {
  renderAuthState();
  renderOptions();
  renderMemberSelectors();
  renderCellLines();
  renderCultures();
  renderVessels();
  renderCryoBoxes();
  renderCryoSearchResults();
  renderDifferentiationProtocols();
  renderProtocolTasks();
  renderDifferentiationRuns();
  renderRunSchedule();
  renderTodayDifferentiationTasks();
  renderCalendarRunFilters();
  renderEvents();
  renderProjects();
  renderMetrics();
}

async function ensureCurrentProfile() {
  const user = state.user;
  if (!user) return;

  const { data } = await db
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (data?.id) return;

  const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";
  const { error } = await db.from("profiles").insert({
    id: user.id,
    email: user.email,
    full_name: fallbackName,
    role: "member",
  });
  if (error && error.code !== "23505") throw error;
}

function isMissingTableError(error) {
  return error?.code === "PGRST205" || /Could not find the table/i.test(error?.message || "");
}

async function detectAuthTables() {
  const { data: securityStatus, error: statusError } = await db
    .from("app_security_status")
    .select("auth_required")
    .eq("id", 1)
    .maybeSingle();

  if (isMissingTableError(statusError) || !securityStatus?.auth_required) {
    state.authAvailable = false;
    state.session = null;
    state.user = null;
    return;
  }
  if (statusError) throw statusError;

  state.authAvailable = true;
  const { data, error } = await db.auth.getSession();
  if (error) throw error;
  state.session = data.session || null;
  state.user = data.session?.user || null;
}

async function loadAllInternal() {
  setStatus("loading", "Loading");
  setLastChecked();
  showLoadIssues([]);

  if (!ensureDb()) {
    renderAll();
    return;
  }

  try {
  await detectAuthTables();

  if (state.authAvailable && !state.session) {
    clearData();
    setStatus("error", "Sign in");
    setLoadIssue("Sign in to load lab data.");
    renderAll();
    return;
  }

  if (state.authAvailable) await ensureCurrentProfile();

  const authRequests = state.authAvailable
    ? [
      db.from("profiles").select("*").eq("id", currentUserId()).single(),
      db.from("profiles").select("*").order("full_name", { ascending: true }),
      db.from("project_members").select("*"),
      db.from("culture_members").select("*"),
    ]
    : [
      Promise.resolve({ data: null, error: null }),
      Promise.resolve({ data: [], error: null }),
      Promise.resolve({ data: [], error: null }),
      Promise.resolve({ data: [], error: null }),
    ];

  const baseRequests = [
    ...authRequests,
    db.from("cell_lines").select("*").order("name", { ascending: true }),
    db
      .from("cultures")
      .select("*, cell_lines!cultures_cell_line_id_fkey(name, full_name, identifier, clone)")
      .order("created_at", { ascending: false }),
    db
      .from("culture_events")
      .select("*, cultures(culture_name, passage_number, cell_lines!cultures_cell_line_id_fkey(name, full_name, identifier, clone))")
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ];
  const baseLabels = ["Profile", "People", "Project access", "Culture access", "Cell lines", "Cultures", "Activity"];
  const [profileResult, profilesResult, projectMembersResult, cultureMembersResult, cellLinesResult, culturesResult, eventsResult] = await Promise.all(
    baseRequests.map((request, index) => moduleRequest(baseLabels[index], request))
  );

  const authTablesMissing =
    isMissingTableError(profileResult.error) ||
    isMissingTableError(profilesResult.error) ||
    isMissingTableError(projectMembersResult.error) ||
    isMissingTableError(cultureMembersResult.error);
  if (authTablesMissing) {
    state.authAvailable = false;
  }

  const authError = state.authAvailable
    ? profileResult.error || profilesResult.error || projectMembersResult.error || cultureMembersResult.error
    : null;
  const baseError = authError || cellLinesResult.error || culturesResult.error || eventsResult.error;
  if (baseError) {
    setStatus("error", "Error");
    setLoadIssue(baseError.message);
    showToast(`Error loading data: ${baseError.message}`);
    state.cellLines = cellLinesResult.data || [];
    state.cultures = culturesResult.data || [];
    state.events = eventsResult.data || [];
  }

  state.profile = profileResult.data || null;
  state.profiles = profilesResult.data || [];
  state.projectMembers = projectMembersResult.data || [];
  state.cultureMembers = cultureMembersResult.data || [];

  const moduleRequests = [
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
      .select("*, cell_lines!vessel_wells_cell_line_id_fkey(name, full_name, identifier, clone), cultures(culture_name, passage_number, cell_lines!cultures_cell_line_id_fkey(name, full_name, identifier, clone))")
      .order("well", { ascending: true }),
    db
      .from("vessel_cultures")
      .select("*, cultures(culture_name, passage_number, cell_lines!cultures_cell_line_id_fkey(name, full_name, identifier, clone))"),
    db.from("culture_cell_lines").select("*"),
    db
      .from("cryo_boxes")
      .select("*")
      .order("freezer", { ascending: true })
      .order("name", { ascending: true }),
    db
      .from("cryo_vials")
      .select("*, cell_lines!cryo_vials_cell_line_id_fkey(name, full_name, identifier, clone)")
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
    db.from("differentiation_run_cell_lines").select("*"),
    db.from("differentiation_run_deviations").select("*").order("created_at", { ascending: true }),
    db
      .from("differentiation_events")
      .select("*")
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ];
  const moduleLabels = ["Projects", "Plates", "Well maps", "Plate cultures", "Culture cell lines", "Cryoboxes", "Cryovials", "Protocols", "Protocol tasks", "Differentiations", "Differentiation wells", "Differentiation cell lines", "Protocol deviations", "Differentiation activity"];
  const [projectsResult, vesselsResult, wellsResult, vesselCulturesResult, cultureCellLinesResult, cryoBoxesResult, cryoVialsResult, protocolsResult, protocolTasksResult, differentiationRunsResult, differentiationRunWellsResult, differentiationRunCellLinesResult, differentiationRunDeviationsResult, differentiationEventsResult] = await Promise.all(
    moduleRequests.map((request, index) => moduleRequest(moduleLabels[index], request))
  );

  state.cellLines = cellLinesResult.data || [];
  state.cultures = culturesResult.data || [];
  state.cultureCellLines = cultureCellLinesResult.data || [];
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
  const batchCellLineTablesMissing =
    cultureCellLinesResult.error?.code === "PGRST205" ||
    differentiationRunCellLinesResult.error?.code === "PGRST205";
  const differentiationTablesMissing =
    protocolsResult.error?.code === "PGRST205" ||
    differentiationRunsResult.error?.code === "PGRST205" ||
    differentiationRunWellsResult.error?.code === "PGRST205" ||
    differentiationRunCellLinesResult.error?.code === "PGRST205" ||
    differentiationEventsResult.error?.code === "PGRST205";
  state.differentiationProtocols = differentiationTablesMissing ? [] : protocolsResult.data || [];
  state.protocolTasks = differentiationTablesMissing || protocolTasksMissing ? [] : protocolTasksResult.data || [];
  state.differentiationRuns = differentiationTablesMissing ? [] : differentiationRunsResult.data || [];
  refreshNewDifferentiationBatchColor();
  state.differentiationRunWells = differentiationTablesMissing ? [] : differentiationRunWellsResult.data || [];
  state.differentiationRunCellLines = differentiationTablesMissing ? [] : differentiationRunCellLinesResult.data || [];
  state.differentiationRunDeviations = differentiationRunDeviationsResult.error ? [] : differentiationRunDeviationsResult.data || [];
  state.differentiationEvents = differentiationTablesMissing ? [] : differentiationEventsResult.data || [];
  await refreshSignedPhotoUrls();
  if (state.selectedVesselId && !state.vessels.some((vessel) => vessel.id === state.selectedVesselId)) {
    state.selectedVesselId = null;
  }
  if (state.selectedCryoBoxId && !state.cryoBoxes.some((box) => box.id === state.selectedCryoBoxId)) {
    state.selectedCryoBoxId = null;
  }
  renderAll();
  const loadIssues = [...baseLabels.map((_, index) => loadIssueFor([
    profileResult, profilesResult, projectMembersResult, cultureMembersResult, cellLinesResult, culturesResult, eventsResult,
  ][index])), ...moduleLabels.map((_, index) => loadIssueFor([
    projectsResult, vesselsResult, wellsResult, vesselCulturesResult, cultureCellLinesResult, cryoBoxesResult, cryoVialsResult, protocolsResult, protocolTasksResult, differentiationRunsResult, differentiationRunWellsResult, differentiationRunCellLinesResult, differentiationRunDeviationsResult, differentiationEventsResult,
  ][index]))].filter(Boolean);
  showLoadIssues(loadIssues);
  if (batchCellLineTablesMissing) {
    setStatus("error", "Migration needed");
    setLoadIssue("Batch cell-line tables are missing.");
    showToast("Run the multi-cell-line batches migration in Supabase.");
    return;
  }
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
    cultureCellLinesResult.error ||
    differentiationRunCellLinesResult.error ||
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

let activeLoad = null;

function loadAll() {
  if (activeLoad) return activeLoad;
  const refreshButton = els.refreshToday;
  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.setAttribute("aria-busy", "true");
  }
  activeLoad = loadAllInternal().finally(() => {
    activeLoad = null;
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.removeAttribute("aria-busy");
    }
  });
  return activeLoad;
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

  if (state.authAvailable) return path;
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
  const impacts = {
    "cell line": "Cultures, wells, cryovials, and differentiations may still reference it.",
    culture: "Linked plates, scheduled work, and activity may be affected.",
    plate: "Its well map and culture links may also be removed.",
    cryobox: "All mapped vial positions in this box may also be removed.",
    protocol: "Existing differentiation schedules may still refer to this protocol.",
    "protocol task": "Future schedules generated from this protocol will no longer include this task.",
    "differentiation run": "Its well assignments and scheduled work may also be removed.",
    activity: "This removes the history entry only and cannot be undone.",
  };
  const impact = impacts[label] || "Related records may be affected.";
  if (!window.confirm(`Delete this ${label}?\n\n${impact}\n\nThis action cannot be undone.`)) return;

  const { error } = await db.from(table).delete().eq("id", id);
  if (error) {
    showToast(`Error deleting ${label}: ${error.message}`);
    return;
  }

  showToast(`${label} deleted.`);
  await loadAll();
}

async function syncMembership(table, keyColumn, ownerId, userIds) {
  if (!isAdmin() || !ownerId) return null;
  const selected = uniqueValues([currentUserId(), ...(userIds || [])]);
  const { error: deleteError } = await db.from(table).delete().eq(keyColumn, ownerId);
  if (deleteError) return deleteError;
  if (selected.length === 0) return null;

  const rows = selected.map((userId) => ({
    [keyColumn]: ownerId,
    user_id: userId,
  }));
  const { error } = await db.from(table).insert(rows);
  return error || null;
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
    ? db.from("projects").update(payload).eq("id", editingId).select("id").single()
    : db.from("projects").insert(payload).select("id").single();
  const { data: savedProject, error } = await query;

  if (error) {
    submit.disabled = false;
    showToast(`Error saving project: ${error.message}`);
    return;
  }

  const membershipError = await syncMembership(
    "project_members",
    "project_id",
    savedProject?.id || editingId,
    getCheckedValues(els.projectMemberCheckboxes)
  );
  if (membershipError) {
    submit.disabled = false;
    showToast(`Project saved, but members failed: ${membershipError.message}`);
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
  const fullName = valueOrNull(data.get("full_name"));
  const clone = valueOrNull(data.get("clone"));
  const hasCrispr = data.get("has_crispr") === "on";
  const hasTransgene = data.get("has_transgene") === "on";
  const payload = {
    identifier,
    full_name: fullName,
    clone,
    name: fullName || composedCellLineName(identifier, clone),
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
  const cellLineIds = getCheckedValues(els.cultureCellLineCheckboxes);
  if (cellLineIds.length === 0) {
    showToast("Select at least one cell line for this culture batch.");
    return;
  }

  submit.disabled = true;
  const plateSetups = plateSetupsFromForm(form);
  const payload = {
    cell_line_id: cellLineIds[0],
    culture_name: valueOrNull(data.get("culture_name")),
    project: valueFromSelectWithCustom(data, "project", "custom_project"),
    start_date: valueOrNull(data.get("start_date")),
    passage_number: numberOrNull(data.get("passage_number")),
    initial_cell_type: valueFromSelectWithCustom(data, "initial_cell_type", "custom_initial_cell_type"),
    vessel_type: plateSetups[0]?.plateType || null,
    medium: valueOrNull(data.get("medium")),
    status: valueOrNull(data.get("status")) || "active",
    location: valueOrNull(data.get("location")),
    notes: valueOrNull(data.get("notes")),
  };

  const editingId = valueOrNull(data.get("id"));
  const query = editingId
    ? db.from("cultures").update(payload).eq("id", editingId).select("*, cell_lines!cultures_cell_line_id_fkey(name, full_name, identifier, clone)").single()
    : db.from("cultures").insert(payload).select("*, cell_lines!cultures_cell_line_id_fkey(name, full_name, identifier, clone)").single();
  const { data: savedCulture, error } = await query;
  submit.disabled = false;

  if (error) {
    showToast(`Error starting culture: ${error.message}`);
    return;
  }

  const cultureId = savedCulture?.id || editingId;
  const { error: clearLinesError } = await db.from("culture_cell_lines").delete().eq("culture_id", cultureId);
  if (clearLinesError) {
    showToast(`Culture saved, but cell lines could not be updated: ${clearLinesError.message}`);
    return;
  }
  const { error: linkLinesError } = await db.from("culture_cell_lines").insert(cellLineIds.map((cellLineId) => ({ culture_id: cultureId, cell_line_id: cellLineId })));
  if (linkLinesError) {
    showToast(`Culture saved, but cell lines could not be linked: ${linkLinesError.message}`);
    return;
  }

  const membershipError = await syncMembership(
    "culture_members",
    "culture_id",
    savedCulture?.id || editingId,
    getCheckedValues(els.cultureMemberCheckboxes)
  );
  if (membershipError) {
    submit.disabled = false;
    showToast(`Culture saved, but members failed: ${membershipError.message}`);
    return;
  }

  let createdPlates = [];
  if (!editingId && savedCulture) {
    try {
      createdPlates = await createPlatesForCulture(savedCulture, {
        plateSetups,
      });
    } catch (plateError) {
      showToast(`Culture saved, but plates failed: ${plateError.message}`);
    }
  }

  resetCultureForm();
  const firstMappedPlate = createdPlates.find((plate) => plate.mapWells && isMultiwell(plate.vessel_type));
  if (firstMappedPlate) state.selectedVesselId = firstMappedPlate.id;
  showToast(editingId ? "Culture updated." : createdPlates.length ? `Culture started with ${createdPlates.length} plate${createdPlates.length === 1 ? "" : "s"}.` : "Culture started.");
  await loadAll();
  if (firstMappedPlate) {
    state.selectedVesselId = firstMappedPlate.id;
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
  if (!window.confirm(`Delete ${wells.length} selected well${wells.length === 1 ? "" : "s"}?\n\nTheir cell-line and culture assignments will be removed from this plate.\n\nThis action cannot be undone.`)) return;

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

function handleCryoExport(format) {
  const box = state.cryoBoxes.find((item) => item.id === state.selectedCryoBoxId);
  if (!box) {
    showToast("Open a cryobox map before exporting.");
    return;
  }
  if (format === "csv") {
    exportCryoCsv(box);
    showToast("Cryostock CSV downloaded.");
    return;
  }
  if (format === "xls") {
    exportCryoXls(box);
    showToast("Cryostock XLS downloaded.");
    return;
  }
  exportCryoPdf(box);
  showToast("Cryostock PDF downloaded.");
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
  if (!window.confirm(`Delete ${positions.length} selected vial${positions.length === 1 ? "" : "s"}?\n\nThe selected inventory positions will become empty; this does not change the source cell line.\n\nThis action cannot be undone.`)) return;

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
    medium: valueOrNull(data.get("medium")),
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

async function cloneProtocol(protocolId) {
  if (!ensureDb()) return;
  const source = state.differentiationProtocols.find((protocol) => protocol.id === protocolId);
  if (!source) return;
  const { id, created_at, created_by, ...copy } = source;
  const { data: cloned, error } = await db.from("differentiation_protocols")
    .insert({ ...copy, name: `${source.name} (adaptation)`, version: source.version ? `${source.version} copy` : "adaptation" })
    .select("id").single();
  if (error) return showToast(`Error cloning protocol: ${error.message}`);
  const tasks = state.protocolTasks.filter((task) => task.protocol_id === protocolId).map(({ id: taskId, created_at: taskCreated, created_by: taskCreator, ...task }) => ({ ...task, protocol_id: cloned.id }));
  if (tasks.length) {
    const { error: taskError } = await db.from("differentiation_protocol_tasks").insert(tasks);
    if (taskError) return showToast(`Protocol cloned, but its tasks could not be copied: ${taskError.message}`);
  }
  await loadAll();
  const clonedProtocol = state.differentiationProtocols.find((protocol) => protocol.id === cloned.id);
  if (clonedProtocol) fillProtocolForm(clonedProtocol);
  showToast("Protocol cloned. Rename it and adapt any task.");
}

function parseProtocolFile(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("The file needs a header and at least one protocol row.");
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const parseLine = (line) => {
    if (delimiter === "\t") return line.split("\t").map((value) => value.trim());
    const values = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === "," && !quoted) {
        values.push(value.trim());
        value = "";
      } else {
        value += character;
      }
    }
    values.push(value.trim());
    return values;
  };
  const normalize = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const headers = parseLine(lines[0]).map(normalize);
  const findIndex = (...aliases) => headers.findIndex((header) => aliases.map(normalize).includes(header));
  const indexes = {
    name: findIndex("Protocol name", "Nome_Protocolo", "protocol"),
    day: findIndex("Day", "Dia"),
    task: findIndex("Base task", "Tarefa_Base", "Task"),
    medium: findIndex("Medium", "Meio", "Meio_Especifico"),
  };
  if (indexes.name < 0 || indexes.day < 0 || indexes.task < 0) throw new Error("Expected columns: Protocol name, Day, Base task, and Medium.");
  return lines.slice(1).map(parseLine).map((values) => ({
    protocolName: values[indexes.name]?.trim(),
    day: Number(values[indexes.day]),
    title: values[indexes.task]?.trim(),
    medium: indexes.medium >= 0 ? values[indexes.medium]?.trim() : null,
  })).filter((row) => row.protocolName && Number.isInteger(row.day) && row.title && row.title !== "-");
}

async function handleProtocolImport(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file || !ensureDb()) return;
  try {
    const rows = parseProtocolFile(await file.text());
    if (!rows.length) throw new Error("No actionable protocol rows were found.");
    const names = [...new Set(rows.map((row) => row.protocolName))];
    for (const name of names) {
      const existing = state.differentiationProtocols.find((protocol) => protocol.name === name);
      let protocolId = existing?.id;
      if (!protocolId) {
        const { data, error } = await db.from("differentiation_protocols").insert({ name, expected_duration_days: Math.max(...rows.filter((row) => row.protocolName === name).map((row) => row.day)), version: "Imported" }).select("id").single();
        if (error) throw error;
        protocolId = data.id;
      }
      const importedTasks = rows.filter((row) => row.protocolName === name).map((row) => ({ protocol_id: protocolId, task_day: row.day, title: row.title, task_type: /collect/i.test(row.title) ? "Collection" : /medium|induction/i.test(row.title) ? "Media change" : "Other", medium: row.medium && row.medium !== "-" ? row.medium : null }));
      const days = importedTasks.map((task) => task.task_day);
      if (days.length) await db.from("differentiation_protocol_tasks").delete().eq("protocol_id", protocolId).in("task_day", days);
      const { error: taskError } = await db.from("differentiation_protocol_tasks").insert(importedTasks);
      if (taskError) throw taskError;
    }
    showToast(`${names.length} protocol${names.length === 1 ? "" : "s"} imported.`);
    await loadAll();
  } catch (error) {
    showToast(`Error importing protocol: ${error.message}`);
  }
}

async function handleCollectionSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const data = new FormData(event.currentTarget);
  const payload = {
    differentiation_run_id: valueOrNull(data.get("differentiation_run_id")),
    event_date: valueOrNull(data.get("event_date")),
    event_day: numberOrNull(data.get("event_day")),
    event_type: "Collection",
    quantity: valueOrNull(data.get("quantity")),
    experiment: valueOrNull(data.get("experiment")),
    notes: valueOrNull(data.get("notes")),
    performed_by: profileName(state.profile),
  };
  const { error } = await db.from("differentiation_events").insert(payload);
  if (error) return showToast(`Error adding collection: ${error.message}`);
  event.currentTarget.reset();
  els.collectionDate.value = todayValue();
  showToast("Collection added to the run timeline.");
  await loadAll();
}

async function handleRunDeviationSubmit(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const run = state.differentiationRuns.find((item) => item.id === els.scheduleRunSelect.value);
  if (!run) return showToast("Choose a differentiation run first.");
  const data = new FormData(event.currentTarget);
  const deviationType = valueOrNull(data.get("deviation_type")) || "extra_day";
  const dayShift = numberOrNull(data.get("day_shift")) ?? 0;
  if (deviationType === "extra_day" && dayShift <= 0) return showToast("An extra day must use a positive schedule shift.");
  if (deviationType === "shortened_phase" && dayShift >= 0) return showToast("A shortened phase must use a negative schedule shift.");
  const payload = {
    differentiation_run_id: run.id,
    deviation_type: deviationType,
    after_protocol_day: numberOrNull(data.get("after_protocol_day")),
    day_shift: dayShift,
    reason: valueOrNull(data.get("reason")),
    notes: valueOrNull(data.get("notes")),
  };
  const submit = event.currentTarget.querySelector("button[type='submit']");
  submit.disabled = true;
  const { error } = await db.from("differentiation_run_deviations").insert(payload);
  submit.disabled = false;
  if (error) return showToast(`Error recording protocol deviation: ${error.message}`);
  event.currentTarget.reset();
  els.deviationDayShift.value = "1";
  showToast("Protocol deviation flagged and the run schedule was adjusted.");
  await loadAll();
}

async function deleteRunDeviation(deviationId) {
  if (!deviationId || !ensureDb()) return;
  if (!window.confirm("Delete this protocol deviation? The downstream schedule will move back accordingly.")) return;
  const { error } = await db.from("differentiation_run_deviations").delete().eq("id", deviationId);
  if (error) return showToast(`Error deleting protocol deviation: ${error.message}`);
  showToast("Protocol deviation deleted and the schedule was recalculated.");
  await loadAll();
}

async function toggleScheduledTask(button) {
  if (!ensureDb()) return;
  const run = state.differentiationRuns.find((item) => item.id === button.dataset.toggleScheduleTask);
  if (!run) return;
  const taskDay = Number(button.dataset.taskDay);
  const item = actionableScheduleItems(run).find((candidate) =>
    candidate.kind === button.dataset.taskKind &&
    Number(candidate.task_day) === taskDay &&
    (!button.dataset.taskId || candidate.id === button.dataset.taskId)
  );
  if (!item) return;
  const completed = completionEventForItem(run, item);
  button.disabled = true;
  if (completed) {
    const { error } = await db.from("differentiation_events").delete().eq("id", completed.id);
    if (error) {
      button.disabled = false;
      showToast(`Error reopening task: ${error.message}`);
      return;
    }
    showToast("Task reopened and removed from Activity.");
    await loadAll();
    return;
  }
  button.disabled = false;
  const plannedDate = dateValueString(item.date);
  const actualDate = todayValue();
  const dayDifference = protocolDayForDate(plannedDate, actualDate);
  if (dayDifference !== 0) {
    pendingOffScheduleCompletion = { run, item, plannedDate, actualDate, dayDifference };
    const timing = dayDifference > 0
      ? `${dayDifference} day${dayDifference === 1 ? "" : "s"} late`
      : `${Math.abs(dayDifference)} day${Math.abs(dayDifference) === 1 ? "" : "s"} early`;
    els.lateTaskSummary.textContent = `${item.title} was planned for ${formatDate(plannedDate)} and is being completed on ${formatDate(actualDate)} (${timing}).`;
    els.lateTaskForm.reset();
    els.lateTaskDialog.showModal();
    return;
  }
  await completeScheduledTask(run, item, { actualDate });
}

function openTaskDeferral(button) {
  const run = state.differentiationRuns.find((item) => item.id === button.dataset.deferScheduleTask);
  if (!run) return;
  const taskDay = Number(button.dataset.taskDay);
  const item = actionableScheduleItems(run).find((candidate) =>
    candidate.kind === button.dataset.taskKind &&
    Number(candidate.task_day) === taskDay &&
    (!button.dataset.taskId || candidate.id === button.dataset.taskId)
  );
  if (!item) return;
  pendingTaskDeferral = { run, item };
  els.deferTaskForm.reset();
  els.deferTaskForm.elements.day_shift.value = "1";
  els.deferTaskSummary.textContent = `${item.title} is scheduled for ${formatDate(dateValueString(item.date))}. Deferring it will move this task and all later protocol tasks.`;
  els.deferTaskDialog.showModal();
}

async function handleDeferTaskSubmit(event) {
  event.preventDefault();
  if (!pendingTaskDeferral || !ensureDb()) return;
  const data = new FormData(event.currentTarget);
  const dayShift = numberOrNull(data.get("day_shift"));
  const reason = valueOrNull(data.get("reason"));
  if (!dayShift || dayShift < 1) return showToast("Enter at least one additional day.");
  if (!reason) return showToast("Enter the reason for the protocol deviation.");
  const { run, item } = pendingTaskDeferral;
  const protocolDay = Number(item.protocol_day ?? item.task_day);
  const payload = {
    differentiation_run_id: run.id,
    protocol_task_id: item.kind === "task" ? item.id : null,
    deviation_type: "extra_day",
    after_protocol_day: protocolDay - 1,
    day_shift: dayShift,
    reason,
    notes: valueOrNull(data.get("notes")),
    planned_date: dateValueString(item.date),
    detection_source: "automatic",
  };
  const { error } = await db.from("differentiation_run_deviations").insert(payload);
  if (error) return showToast(`Error deferring task: ${error.message}`);
  els.deferTaskDialog.close();
  pendingTaskDeferral = null;
  showToast(`Task deferred by ${dayShift} day${dayShift === 1 ? "" : "s"}; protocol deviation flagged.`);
  await loadAll();
}

async function completeScheduledTask(run, item, { actualDate, deviation = null }) {
  const actualRunDay = protocolDayForDate(run.day_zero_date, actualDate);
  const activityPayload = {
    differentiation_run_id: run.id,
    protocol_task_id: item.kind === "task" ? item.id : null,
    event_date: actualDate,
    event_day: actualRunDay,
    scheduled_run_day: item.task_day,
    event_type: item.kind === "automatic" ? "Media change" : item.task_type || "Other",
    scheduled_title: item.title,
    medium: item.medium || null,
    notes: item.notes || null,
    performed_by: profileName(state.profile),
  };
  const { data: activity, error: activityError } = await db.from("differentiation_events").insert(activityPayload).select("id").single();
  if (activityError) return showToast(`Error completing task: ${activityError.message}`);

  if (deviation) {
    const deviationPayload = {
      differentiation_run_id: run.id,
      differentiation_event_id: activity.id,
      protocol_task_id: item.kind === "task" ? item.id : null,
      deviation_type: deviation.dayShift > 0 ? "extra_day" : deviation.dayShift < 0 ? "shortened_phase" : "other",
      after_protocol_day: Number(item.protocol_day ?? item.task_day),
      day_shift: deviation.dayShift,
      reason: deviation.reason,
      notes: deviation.notes,
      planned_date: deviation.plannedDate,
      performed_date: actualDate,
      detection_source: "automatic",
    };
    const { error: deviationError } = await db.from("differentiation_run_deviations").insert(deviationPayload);
    if (deviationError) {
      await db.from("differentiation_events").delete().eq("id", activity.id);
      return showToast(`Task was not completed because the deviation could not be recorded: ${deviationError.message}`);
    }
    showToast(deviation.dayShift === 0
      ? "Task completed off schedule and flagged; downstream schedule was kept."
      : "Task completed off schedule and flagged; downstream schedule was shifted.");
  } else {
    showToast("Task completed and recorded in Activity.");
  }
  await loadAll();
}

async function handleLateTaskSubmit(event) {
  event.preventDefault();
  if (!pendingOffScheduleCompletion) return;
  const data = new FormData(event.currentTarget);
  const scheduleAction = data.get("schedule_action") || "keep";
  const reason = valueOrNull(data.get("reason"));
  if (!reason) return showToast("Enter the reason for the protocol deviation.");
  const pending = pendingOffScheduleCompletion;
  const deviation = {
    dayShift: scheduleAction === "shift" ? pending.dayDifference : 0,
    reason,
    notes: valueOrNull(data.get("notes")),
    plannedDate: pending.plannedDate,
  };
  els.lateTaskDialog.close();
  pendingOffScheduleCompletion = null;
  await completeScheduledTask(pending.run, pending.item, { actualDate: pending.actualDate, deviation });
}

function printableScheduleText(text) {
  return window.translateAppText?.(text) || text;
}

const SCHEDULE_ENGINE_VERSION = "2026.08.12.1";

function printableScheduleMonthTitle(monthKey) {
  const locale = window.getAppLocale?.() || "en-US";
  const label = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${monthKey}-01T12:00:00Z`));
  return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
}

function printableScheduleWeekdays() {
  return Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(window.getAppLocale?.() || "en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, 7, 2 + index))));
}

function printableScheduleEntryHtml({ run, item }) {
  const detail = item.kind === "deviation"
    ? [item.reason, item.notes].filter(Boolean).join(" · ")
    : item.medium || [item.quantity, item.notes].filter(Boolean).join(" · ");
  const title = printableScheduleText(item.title || item.experiment || "Collection");
  const automaticLabel = item.kind === "automatic" ? `<span class="print-event-source">${escapeHtml(printableScheduleText("Automatic"))}</span>` : "";
  return `<div class="print-calendar-event ${item.kind === "deviation" ? "is-deviation" : ""} ${item.kind === "automatic" ? "is-automatic" : ""}" style="--run-color:${escapeHtml(runScheduleColor(run))}">
    <div><strong>${escapeHtml(run.run_name)}</strong><span>D${escapeHtml(item.task_day)}</span></div>
    <h3>${escapeHtml(title)}${automaticLabel}</h3>
    ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
  </div>`;
}

function printableScheduleHtml(runs) {
  const scheduledRuns = runs.filter((run) => buildRunSchedule(run).length > 0);
  const entries = scheduledRuns.flatMap((run) => buildRunSchedule(run).map((item) => ({
    date: dateValueString(item.date),
    run,
    item,
  }))).sort((a, b) => a.date.localeCompare(b.date));
  const months = window.ScheduleCalendar?.buildMonths(entries) || [];
  const weekdays = printableScheduleWeekdays();
  return months.map((month) => {
    const monthRunIds = new Set(month.cells.filter(Boolean).flatMap((cell) => cell.entries.map((entry) => entry.run.id)));
    const automaticChangeCount = month.cells.filter(Boolean).flatMap((cell) => cell.entries).filter((entry) => entry.item.kind === "automatic").length;
    const legend = scheduledRuns.filter((run) => monthRunIds.has(run.id)).map((run) => `<span style="--run-color:${escapeHtml(runScheduleColor(run))}"><i></i>${deviationsForRun(run.id).length ? "⚑ " : ""}${escapeHtml(differentiationRunLabel(run))}</span>`).join("");
    return `<section class="print-month" style="--calendar-weeks:${month.weeks}">
    <header class="print-month-header">
      <div><p>${escapeHtml(printableScheduleText("Monthly differentiation calendar"))}</p><h1>${escapeHtml(printableScheduleMonthTitle(month.key))}</h1><small>${escapeHtml(printableScheduleText("Generated"))} ${escapeHtml(formatDate(todayValue()))} · ${automaticChangeCount} ${escapeHtml(printableScheduleText("automatic medium changes"))} · Engine ${SCHEDULE_ENGINE_VERSION}</small></div>
      <div class="print-legend">${legend}</div>
    </header>
    <div class="print-calendar-weekdays">${weekdays.map((weekday) => `<span>${escapeHtml(weekday)}</span>`).join("")}</div>
    <div class="print-calendar-grid">${month.cells.map((cell) => cell
      ? `<section class="print-calendar-day"><time datetime="${escapeHtml(cell.date)}">${cell.day}</time><div class="print-calendar-events">${cell.entries.map(printableScheduleEntryHtml).join("")}</div></section>`
      : '<section class="print-calendar-day is-empty" aria-hidden="true"></section>').join("")}</div>
  </section>`;
  }).join("");
}

function printSchedules(onlySelectedRun = false) {
  const runs = onlySelectedRun
    ? state.differentiationRuns.filter((run) => run.id === els.scheduleRunSelect.value)
    : state.differentiationRuns.filter((run) => getCheckedValues(els.calendarRunCheckboxes).includes(run.id));
  if (!runs.length) return showToast("No differentiation runs available to export.");
  const printable = printableScheduleHtml(runs);
  if (!printable) return showToast("No scheduled items available to export.");
  els.printSchedule.innerHTML = printable;
  window.print();
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
  const cellLineIds = getCheckedValues(els.differentiationCellLineCheckboxes);

  if (cellLineIds.length === 0) {
    showToast("Select at least one cell line for this differentiation batch.");
    return;
  }

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
    schedule_color: normalizedBatchColor(data.get("schedule_color")),
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

  const { error: deleteLinesError } = await db.from("differentiation_run_cell_lines").delete().eq("differentiation_run_id", saved.id);
  if (deleteLinesError) {
    submit.disabled = false;
    showToast(`Run saved, but old cell lines could not be cleared: ${deleteLinesError.message}`);
    return;
  }
  const { error: lineLinksError } = await db.from("differentiation_run_cell_lines").insert(cellLineIds.map((cellLineId) => ({ differentiation_run_id: saved.id, cell_line_id: cellLineId })));
  if (lineLinksError) {
    submit.disabled = false;
    showToast(`Run saved, but cell lines failed: ${lineLinksError.message}`);
    return;
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
      performed_by: valueFromSelectWithCustom(data, "performed_by", "custom_performed_by") || profileName(state.profile),
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
  const tabs = [...document.querySelectorAll(".tab")];
  tabs.forEach((tab, index) => {
    const view = document.getElementById(tab.dataset.view);
    tab.id ||= `app-tab-${index + 1}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", tab.dataset.view);
    tab.setAttribute("aria-selected", String(tab.classList.contains("is-active")));
    tab.tabIndex = tab.classList.contains("is-active") ? 0 : -1;
    if (view) {
      view.setAttribute("role", "tabpanel");
      view.setAttribute("aria-labelledby", tab.id);
    }
    tab.addEventListener("click", () => {
      setActiveView(tab.dataset.view);
    });
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const current = tabs.indexOf(tab);
      const next = event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      setActiveView(tabs[next].dataset.view);
    });
  });
  const activeTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
  if (activeTab) setActiveView(activeTab.dataset.view);
}

function setActiveView(viewId) {
  document.querySelectorAll(".tab").forEach((item) => {
    const isActive = item.dataset.view === viewId;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
    item.tabIndex = isActive ? 0 : -1;
  });
  document.querySelectorAll(".nav-group").forEach((group) => {
    group.classList.toggle("has-active-tab", Boolean(group.querySelector('.tab[aria-selected="true"]')));
  });
  document.querySelectorAll(".view").forEach((view) => {
    const isActive = view.id === viewId;
    view.classList.toggle("is-active", isActive);
    view.hidden = !isActive;
  });
}

function bindBusyForm(form, handler) {
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (form.dataset.busy === "true") return;
    const submitter = event.submitter || form.querySelector('[type="submit"]');
    form.dataset.busy = "true";
    form.setAttribute("aria-busy", "true");
    if (submitter) {
      submitter.disabled = true;
      submitter.setAttribute("aria-busy", "true");
    }
    try {
      await handler(event);
    } finally {
      delete form.dataset.busy;
      form.removeAttribute("aria-busy");
      if (submitter) {
        submitter.disabled = false;
        submitter.removeAttribute("aria-busy");
      }
    }
  });
}

function setupProgressiveDisclosure() {
  const form = els.cellLineForm;
  if (!form || form.querySelector(".optional-fields")) return;
  const optionalNodes = [
    form.elements.full_name?.closest("label"),
    form.elements.clone?.closest("label"),
    form.elements.source?.closest("label"),
    form.querySelector("fieldset.form-section"),
    form.elements.notes?.closest("label"),
  ].filter(Boolean);
  if (!optionalNodes.length) return;
  const details = document.createElement("details");
  details.className = "optional-fields wide";
  const summary = document.createElement("summary");
  summary.textContent = "Optional details and modifications";
  const grid = document.createElement("div");
  grid.className = "form-grid optional-fields-grid";
  optionalNodes.forEach((node) => grid.append(node));
  details.append(summary, grid);
  form.querySelector(".form-actions")?.before(details);
}

function authRedirectUrl() {
  if (window.location.protocol === "file:") return PUBLISHED_APP_URL;
  return `${window.location.origin}${window.location.pathname}`;
}

function setAuthMessage(message, isError = false) {
  if (!els.authMessage) return;
  els.authMessage.textContent = message;
  els.authMessage.classList.toggle("is-error", isError);
}

async function handleGoogleSignIn() {
  if (!ensureDb()) return;
  const redirectTo = authRedirectUrl();
  els.googleSignInButton.disabled = true;
  const { error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  if (error) {
    els.googleSignInButton.disabled = false;
    setAuthMessage(`Could not start Google sign-in: ${error.message}`, true);
  }
}

async function handleMagicLink(event) {
  event?.preventDefault();
  if (!ensureDb()) return;
  const email = valueOrNull(els.authForm.elements.email.value);
  if (!email) {
    setAuthMessage("Enter your work email first.", true);
    return;
  }

  const emailRedirectTo = authRedirectUrl();
  els.magicLinkButton.disabled = true;
  const { error } = await db.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
      shouldCreateUser: true,
      data: { full_name: email.split("@")[0] },
    },
  });
  els.magicLinkButton.disabled = false;

  if (error) {
    setAuthMessage(`Could not send the sign-in link: ${error.message}`, true);
    return;
  }
  setAuthMessage(window.location.protocol === "file:"
    ? `Sign-in link sent to ${email}. It will open the secure published app.`
    : `Sign-in link sent to ${email}. You can close this message after opening the link.`);
}

async function handleOtpVerification(event) {
  event.preventDefault();
  if (!ensureDb()) return;
  const email = valueOrNull(els.authForm.elements.email.value);
  const token = valueOrNull(new FormData(event.currentTarget).get("token"));
  if (!email || !token) {
    setAuthMessage("Enter the email that received the message and its six-digit code.", true);
    return;
  }
  els.verifyOtpButton.disabled = true;
  const { error } = await db.auth.verifyOtp({ email, token, type: "email" });
  els.verifyOtpButton.disabled = false;
  setAuthMessage(error ? `Code verification failed: ${error.message}` : "Code verified. Loading your workspace…", Boolean(error));
}

async function handleSignOut() {
  if (!ensureDb()) return;
  const { error } = await db.auth.signOut({ scope: "local" });
  if (error) {
    showToast(`Sign-out error: ${error.message}`);
    return;
  }
  state.session = null;
  state.user = null;
  clearData();
  renderAll();
  setStatus("error", "Sign in");
}

async function initAuth() {
  if (!ensureDb()) {
    renderAll();
    return;
  }
  els.authForm?.addEventListener("submit", handleMagicLink);
  els.authOtpForm?.addEventListener("submit", handleOtpVerification);
  els.googleSignInButton?.addEventListener("click", handleGoogleSignIn);
  els.signOutButton?.addEventListener("click", handleSignOut);
  db.auth.onAuthStateChange((event, session) => {
    if (!state.authAvailable) return;
    state.session = session || null;
    state.user = session?.user || null;
    if (event === "SIGNED_IN") setAuthMessage("Signed in. Loading your workspace…");
    window.setTimeout(async () => {
      await loadAll();
      if (session && typeof loadReagentInventory === "function") await loadReagentInventory();
    }, 0);
  });
  await loadAll();
  if (state.session && typeof loadReagentInventory === "function") await loadReagentInventory();
}

function setupForms() {
  setupProgressiveDisclosure();
  renderDifferentiationColorPalette();
  els.differentiationColorPalette?.addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-batch-color]");
    if (swatch) syncDifferentiationBatchColor(swatch.dataset.batchColor, true);
  });
  els.differentiationCustomColor?.addEventListener("input", (event) => {
    syncDifferentiationBatchColor(event.currentTarget.value, true);
  });
  els.differentiationRunForm?.elements.run_name?.addEventListener("input", updateDifferentiationColorPreviewName);
  bindBusyForm(els.projectForm, handleProjectSubmit);
  bindBusyForm(els.cellLineForm, handleCellLineSubmit);
  bindBusyForm(els.cultureForm, handleCultureSubmit);
  bindBusyForm(els.vesselForm, handleVesselSubmit);
  bindBusyForm(els.wellForm, handleWellSubmit);
  bindBusyForm(els.cryoBoxForm, handleCryoBoxSubmit);
  bindBusyForm(els.cryoVialForm, handleCryoVialSubmit);
  bindBusyForm(els.protocolForm, handleProtocolSubmit);
  bindBusyForm(els.protocolTaskForm, handleProtocolTaskSubmit);
  bindBusyForm(els.differentiationRunForm, handleDifferentiationRunSubmit);
  bindBusyForm(els.collectionForm, handleCollectionSubmit);
  bindBusyForm(els.runDeviationForm, handleRunDeviationSubmit);
  bindBusyForm(els.lateTaskForm, handleLateTaskSubmit);
  bindBusyForm(els.deferTaskForm, handleDeferTaskSubmit);
  bindBusyForm(els.eventForm, handleEventSubmit);
  els.historyProjectFilter.addEventListener("change", renderEvents);
  els.historyCultureFilter.addEventListener("change", renderEvents);
  els.protocolTaskProjectFilter.addEventListener("change", renderProtocolTasks);
  els.protocolImportInput.addEventListener("change", handleProtocolImport);
  els.scheduleRunSelect.addEventListener("change", renderRunSchedule);
  els.deviationTypeSelect.addEventListener("change", () => {
    els.deviationDayShift.value = els.deviationTypeSelect.value === "extra_day" ? "1" : els.deviationTypeSelect.value === "shortened_phase" ? "-1" : "0";
  });
  els.runDeviationSummary.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-run-deviation]");
    if (button) deleteRunDeviation(button.dataset.deleteRunDeviation);
  });
  els.collectionRunSelect.addEventListener("change", () => {
    const run = state.differentiationRuns.find((item) => item.id === els.collectionRunSelect.value);
    if (run && els.collectionDate.value) els.collectionDay.value = protocolDayForDate(run.day_zero_date, els.collectionDate.value);
  });
  els.collectionDate.addEventListener("change", () => {
    const run = state.differentiationRuns.find((item) => item.id === els.collectionRunSelect.value);
    if (run) els.collectionDay.value = protocolDayForDate(run.day_zero_date, els.collectionDate.value);
  });
  els.projectViewFilter.addEventListener("change", renderProjects);
  els.cryoSearchInput.addEventListener("input", renderCryoSearchResults);
  els.toggleCryoLookup.addEventListener("click", toggleCryoLookup);
  els.downloadCryoCsv.addEventListener("click", () => handleCryoExport("csv"));
  els.downloadCryoXls.addEventListener("click", () => handleCryoExport("xls"));
  els.downloadCryoPdf.addEventListener("click", () => handleCryoExport("pdf"));
  els.refreshToday.addEventListener("click", loadAll);
  els.printAllSchedules.addEventListener("click", () => {
    renderCalendarRunFilters();
    els.calendarExportDialog.showModal();
  });
  els.confirmCalendarExport.addEventListener("click", () => {
    if (getCheckedValues(els.calendarRunCheckboxes).length === 0) {
      showToast("Select at least one batch to export.");
      return;
    }
    els.calendarExportDialog.close();
    printSchedules(false);
  });
  els.lateTaskDialog.querySelectorAll("[data-close-late-dialog]").forEach((button) => button.addEventListener("click", () => {
    pendingOffScheduleCompletion = null;
    els.lateTaskDialog.close();
  }));
  els.lateTaskDialog.addEventListener("cancel", () => { pendingOffScheduleCompletion = null; });
  els.deferTaskDialog.querySelectorAll("[data-close-defer-dialog]").forEach((button) => button.addEventListener("click", () => {
    pendingTaskDeferral = null;
    els.deferTaskDialog.close();
  }));
  els.deferTaskDialog.addEventListener("cancel", () => { pendingTaskDeferral = null; });
  els.printRunSchedule.addEventListener("click", () => printSchedules(true));
  [els.todayDifferentiationTasks, els.runSchedule].forEach((container) => container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-toggle-schedule-task]");
    if (button) toggleScheduledTask(button);
    const deferButton = event.target.closest("[data-defer-schedule-task]");
    if (deferButton) openTaskDeferral(deferButton);
  }));
  els.addPlateButton.addEventListener("click", openPlateForm);
  els.addPlateSetup.addEventListener("click", () => addPlateSetupRow());
  els.plateSetupList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-plate-setup]");
    if (!button) return;
    button.closest("[data-plate-setup-row]")?.remove();
    if (!els.plateSetupList.querySelector("[data-plate-setup-row]")) addPlateSetupRow();
  });
  els.createPlateFromCultureButton.addEventListener("click", handleCreatePlateFromCulture);
  els.cultureForm.elements.culture_name.addEventListener("input", () => {
    state.cultureNameEdited = true;
  });
  els.cultureCellLineCheckboxes.addEventListener("change", () => syncCultureNameSuggestion());
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
  els.differentiationCultureSelect.addEventListener("change", () => {
    if (els.differentiationSourceType.value === "culture") {
      setCheckedValues(els.differentiationCellLineCheckboxes, cellLineIdsForCulture(els.differentiationCultureSelect.value));
    }
  });
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
  const cloneButton = event.target.closest("[data-clone-protocol]");
  if (cloneButton) {
    cloneProtocol(cloneButton.dataset.cloneProtocol);
    return;
  }
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
  renderMemberSelectors();
  setCheckedValues(els.projectMemberCheckboxes, projectMemberIds(project?.id));
  els.projectSubmitButton.textContent = "Update project";
  els.cancelProjectEdit.classList.remove("is-hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetProjectForm() {
  els.projectForm.reset();
  els.projectForm.elements.id.value = "";
  els.projectForm.elements.original_name.value = "";
  els.projectForm.elements.color.value = "#176f64";
  renderMemberSelectors();
  els.projectSubmitButton.textContent = "Save project";
  els.cancelProjectEdit.classList.add("is-hidden");
}

function fillCellLineForm(line) {
  const form = els.cellLineForm;
  setFieldValue(form, "id", line.id);
  setFieldValue(form, "identifier", line.identifier || line.name);
  setFieldValue(form, "full_name", line.full_name);
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
  setFieldValue(form, "medium", task.medium);
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
  syncDifferentiationBatchColor(runScheduleColor(run));
  setFieldValue(form, "notes", run.notes);
  setCheckedValues(els.differentiationCellLineCheckboxes, cellLineIdsForRun(run.id));
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
  delete els.differentiationRunForm.dataset.colorUserSelected;
  els.differentiationRunForm.elements.id.value = "";
  setDefaultDate(els.differentiationRunForm, "day_zero_date");
  syncDifferentiationBatchColor(nextDifferentiationBatchColor());
  setCheckedValues(els.differentiationWellCheckboxes, []);
  setCheckedValues(els.differentiationCellLineCheckboxes, []);
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
  setSelectOrCustom(els.performedBySelect, els.eventForm.elements.custom_performed_by, profileName(state.profile));
  els.eventSubmitButton.textContent = "Record event";
  els.cancelEventEdit.classList.add("is-hidden");
  syncActivityTargetFields();
  syncActivityEventFields();
  syncConditionalFields();
}

function fillCultureForm(culture) {
  const form = els.cultureForm;
  setFieldValue(form, "id", culture.id);
  setCheckedValues(els.cultureCellLineCheckboxes, cellLineIdsForCulture(culture.id));
  setFieldValue(form, "culture_name", culture.culture_name);
  setSelectOrCustom(els.cultureProjectSelect, form.elements.custom_project, culture.project);
  setFieldValue(form, "start_date", culture.start_date);
  setFieldValue(form, "passage_number", culture.passage_number);
  setSelectOrCustom(els.initialCellTypeSelect, form.elements.custom_initial_cell_type, culture.initial_cell_type);
  renderPlateSetupRows([{ plateType: culture.vessel_type, count: 1, mode: "whole" }]);
  setFieldValue(form, "medium", culture.medium);
  setFieldValue(form, "status", culture.status || "active");
  setFieldValue(form, "location", culture.location);
  setFieldValue(form, "notes", culture.notes);
  renderMemberSelectors();
  setCheckedValues(els.cultureMemberCheckboxes, cultureMemberIds(culture.id));
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
  setCheckedValues(els.cultureCellLineCheckboxes, []);
  setDefaultDate(els.cultureForm, "start_date");
  renderPlateSetupRows([{ count: 1, mode: "whole" }]);
  renderMemberSelectors();
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
els.collectionDate.value = todayValue();
setDefaultDate(els.eventForm, "event_date");
setDefaultDate(els.cryoVialForm, "freeze_date");
renderPlateSetupRows();
syncActivityTargetFields();
syncActivityEventFields();
renderAll();
initAuth();

window.addEventListener("app:languagechange", () => {
  renderAll();
  renderDifferentiationColorPalette();
  setLastChecked();
});
