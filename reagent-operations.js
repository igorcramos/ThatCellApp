const reagentOpsState = {
  purchaseRequests: [],
  importRows: [],
  scannerStream: null,
  scannerTimer: null,
  scannerBusy: false,
  scannerDecoder: null,
  scannerRequestId: 0,
};

const reagentOpsEls = {
  barcodeInput: document.querySelector("#reagentBarcodeInput"),
  barcodeLookup: document.querySelector("#reagentBarcodeLookup"),
  scanStart: document.querySelector("#startReagentScanner"),
  scanStop: document.querySelector("#stopReagentScanner"),
  scanFile: document.querySelector("#reagentBarcodeImage"),
  scanUpload: document.querySelector("#reagentBarcodeImageUpload"),
  scanStage: document.querySelector("#reagentScannerStage"),
  scanVideo: document.querySelector("#reagentScannerVideo"),
  scanStatus: document.querySelector("#reagentScannerStatus"),
  warningDays: document.querySelector("#reagentExpiryWarningDays"),
  alertMetrics: document.querySelector("#reagentAlertMetrics"),
  alertList: document.querySelector("#reagentAlertsList"),
  qualityMetrics: document.querySelector("#reagentQualityMetrics"),
  qualityList: document.querySelector("#reagentQualityList"),
  catalogTools: document.querySelector("#reagentCatalogTools"),
  catalogForm: document.querySelector("#reagentCatalogForm"),
  catalogMessage: document.querySelector("#reagentCatalogFormMessage"),
  csvInput: document.querySelector("#reagentCatalogCsv"),
  importPreview: document.querySelector("#reagentImportPreview"),
  importConfirm: document.querySelector("#reagentImportConfirm"),
  importStatus: document.querySelector("#reagentImportStatus"),
  purchaseForm: document.querySelector("#reagentPurchaseRequestForm"),
  purchaseCatalog: document.querySelector("#reagentPurchaseCatalog"),
  purchaseFilter: document.querySelector("#reagentPurchaseStatusFilter"),
  purchaseList: document.querySelector("#reagentPurchaseList"),
};

function reagentCode(value) {
  return String(value || "").trim();
}

function normalizedReagentCode(value) {
  return reagentCode(value).toLocaleLowerCase();
}

function validGtin(value) {
  const digits = reagentCode(value);
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(digits)) return false;
  const body = digits.slice(0, -1).split("").reverse();
  const sum = body.reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(digits.at(-1));
}

function catalogPairKey(entry) {
  return `${normalizedReagentCode(entry.manufacturer)}|${normalizedReagentCode(entry.catalog_number)}`;
}

function catalogSearchValues(entry) {
  return [entry.name, entry.catalog_number, entry.manufacturer, entry.barcode, entry.gtin, ...(entry.synonyms || [])]
    .map(normalizedReagentCode)
    .filter(Boolean);
}

function metricMarkup(value, label, tone = "") {
  return `<div class="reagent-mini-metric ${tone}"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function showCatalogMessage(message = "") {
  reagentOpsEls.catalogMessage.textContent = message;
  reagentOpsEls.catalogMessage.classList.toggle("is-hidden", !message);
}

function setScannerStatus(message, isError = false) {
  reagentOpsEls.scanStatus.textContent = message;
  reagentOpsEls.scanStatus.classList.toggle("is-error", isError);
}

function scannerIsEmbedded() {
  try {
    return window.self !== window.top;
  } catch (_error) {
    return true;
  }
}

function renderScannerReadiness() {
  const readiness = window.BarcodeScanner?.scannerReadiness(window) || "decoder-unavailable";
  reagentOpsEls.scanStart.disabled = readiness !== "ready";
  reagentOpsEls.scanStop.disabled = true;
  if (readiness === "ready") {
    setScannerStatus("Ready to scan. The browser will ask for camera permission the first time.");
  } else if (readiness === "insecure") {
    setScannerStatus("Live camera needs the secure published app. You can still take or choose a photo, or type the code.", true);
  } else if (readiness === "camera-unavailable") {
    setScannerStatus(scannerIsEmbedded()
      ? "This in-app browser does not provide live camera access. Open the published app directly in Safari or Chrome, take or choose a photo, or type the code."
      : "Live camera access is unavailable here. Take or choose a photo, or type the code.", true);
  } else {
    setScannerStatus("The barcode scanner did not load. Refresh the page, or type the printed code.", true);
  }
}

function cameraFailureStatus(error) {
  const kind = window.BarcodeScanner?.classifyCameraError(error) || "camera-error";
  if (kind === "permission-denied") {
    return "Camera permission was denied. Allow camera access for this site in browser settings, then try again. You can also take or choose a photo.";
  }
  if (kind === "camera-not-found") return "No camera was found on this device. Take or choose an existing photo, or type the code.";
  if (kind === "camera-busy") return "The camera is being used by another app or tab. Close it there and try again, or take or choose a photo.";
  if (kind === "camera-security") return "The browser blocked camera access in this window. Open the published app directly in Safari or Chrome, or take or choose a photo.";
  if (kind === "camera-aborted") return "Camera access was interrupted. Try again, take or choose a photo, or type the code.";
  if (kind === "camera-timeout") return "The camera permission request took too long. Try again and answer the browser prompt, or take or choose a photo.";
  return scannerIsEmbedded()
    ? "The in-app browser could not start the camera. Open the published app directly in Safari or Chrome, or take or choose a photo."
    : `The camera could not start${error?.message ? `: ${error.message}` : "."} Take or choose a photo, or type the code.`;
}

function focusInventoryCode(code, item) {
  reagentEls.inventorySearch.value = code;
  renderReagentInventory();
  reagentEls.inventoryList.scrollIntoView({ behavior: "smooth", block: "start" });
  setScannerStatus(`Found stock container: ${itemCatalog(item).name || "reagent"}.`);
}

function focusCatalogCode(code, catalog) {
  selectCatalogReagent(catalog.id);
  reagentEls.form.scrollIntoView({ behavior: "smooth", block: "start" });
  setScannerStatus(`Found ${reagentCatalogLabel(catalog)}. Complete the lot details below.`);
}

function prepareCatalogForUnknownCode(code) {
  reagentOpsEls.catalogTools.open = true;
  const form = reagentOpsEls.catalogForm;
  if (validGtin(code)) form.elements.gtin.value = code;
  else form.elements.barcode.value = code;
  form.elements.name.focus();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  setScannerStatus("No exact match. The code was copied into the catalog form so you can verify and add the product.", true);
}

function lookupReagentCode(rawValue) {
  const code = reagentCode(rawValue);
  if (!code) {
    setScannerStatus("Enter or scan a code first.", true);
    return;
  }
  reagentOpsEls.barcodeInput.value = code;
  const normalized = normalizedReagentCode(code);
  const inventoryItem = reagentState.items.find((item) => normalizedReagentCode(item.container_barcode) === normalized);
  if (inventoryItem) {
    focusInventoryCode(code, inventoryItem);
    return;
  }
  const exactCatalog = reagentState.catalog.find((entry) =>
    [entry.barcode, entry.gtin, entry.catalog_number].some((value) => normalizedReagentCode(value) === normalized)
  );
  if (exactCatalog) {
    focusCatalogCode(code, exactCatalog);
    return;
  }
  const partialMatches = reagentState.catalog.filter((entry) => catalogSearchValues(entry).some((value) => value.includes(normalized)));
  if (partialMatches.length === 1) {
    focusCatalogCode(code, partialMatches[0]);
    return;
  }
  if (partialMatches.length > 1) {
    reagentEls.librarySearch.value = code;
    renderReagentLibraryResults();
    reagentEls.libraryResults.classList.add("is-open");
    reagentEls.form.scrollIntoView({ behavior: "smooth", block: "start" });
    setScannerStatus(`${partialMatches.length} possible products found. Select one from the library results.`);
    return;
  }
  prepareCatalogForUnknownCode(code);
}

function stopReagentScanner(message = "Camera stopped.") {
  reagentOpsState.scannerRequestId += 1;
  if (reagentOpsState.scannerTimer) window.clearTimeout(reagentOpsState.scannerTimer);
  reagentOpsState.scannerTimer = null;
  reagentOpsState.scannerStream?.getTracks().forEach((track) => track.stop());
  reagentOpsState.scannerStream = null;
  reagentOpsState.scannerDecoder?.dispose?.();
  reagentOpsState.scannerDecoder = null;
  reagentOpsEls.scanVideo.srcObject = null;
  reagentOpsEls.scanStage.classList.add("is-hidden");
  reagentOpsEls.scanStage.classList.remove("is-pending");
  reagentOpsEls.scanStop.disabled = true;
  reagentOpsEls.scanStart.disabled = window.BarcodeScanner?.scannerReadiness(window) !== "ready";
  reagentOpsState.scannerBusy = false;
  if (message) setScannerStatus(message);
}

async function scanVideoFrame(detector) {
  if (!reagentOpsState.scannerStream) return;
  if (!reagentOpsState.scannerBusy && reagentOpsEls.scanVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    reagentOpsState.scannerBusy = true;
    try {
      const results = await detector.detect(reagentOpsEls.scanVideo);
      if (results.length) {
        const code = results[0].rawValue;
        stopReagentScanner("");
        lookupReagentCode(code);
        return;
      }
    } catch (error) {
      stopReagentScanner(`Scanning stopped: ${error.message}`);
      return;
    } finally {
      reagentOpsState.scannerBusy = false;
    }
  }
  reagentOpsState.scannerTimer = window.setTimeout(() => scanVideoFrame(detector), 220);
}

async function startReagentScanner() {
  stopReagentScanner("");
  const readiness = window.BarcodeScanner?.scannerReadiness(window) || "decoder-unavailable";
  if (readiness !== "ready") {
    renderScannerReadiness();
    return;
  }
  const requestId = reagentOpsState.scannerRequestId;
  reagentOpsEls.scanStart.disabled = true;
  reagentOpsEls.scanStop.disabled = false;
  reagentOpsEls.scanStage.classList.add("is-pending");
  reagentOpsEls.scanStage.classList.remove("is-hidden");
  let phase = "decoder";
  try {
    setScannerStatus("Preparing the scanner…");
    const detector = await window.BarcodeScanner.createDecoder(window);
    if (requestId !== reagentOpsState.scannerRequestId) {
      detector.dispose?.();
      return;
    }
    reagentOpsState.scannerDecoder = detector;
    phase = "camera";
    setScannerStatus("Requesting camera access… Approve the browser prompt to continue.");
    const stream = await window.BarcodeScanner.requestCameraStream(navigator.mediaDevices);
    if (requestId !== reagentOpsState.scannerRequestId) {
      stream?.getTracks?.().forEach((track) => track.stop());
      detector.dispose?.();
      return;
    }
    reagentOpsState.scannerStream = stream;
    reagentOpsEls.scanVideo.srcObject = stream;
    reagentOpsEls.scanStage.classList.remove("is-pending");
    phase = "video";
    await reagentOpsEls.scanVideo.play();
    if (requestId !== reagentOpsState.scannerRequestId) return;
    setScannerStatus("Point the rear camera at a barcode or QR code.");
    scanVideoFrame(detector);
  } catch (error) {
    if (requestId !== reagentOpsState.scannerRequestId) return;
    stopReagentScanner("");
    setScannerStatus(phase === "decoder"
      ? "The barcode scanner could not initialize. Refresh the page, take or choose a photo, or type the printed code."
      : cameraFailureStatus(error), true);
  } finally {
    if (requestId === reagentOpsState.scannerRequestId) {
      reagentOpsEls.scanStart.disabled = Boolean(reagentOpsState.scannerStream)
        || window.BarcodeScanner?.scannerReadiness(window) !== "ready";
    }
  }
}

async function scanReagentImage(file) {
  if (!file) return;
  [reagentOpsEls.scanFile, reagentOpsEls.scanUpload].forEach((input) => { input.disabled = true; });
  let imageUrl = "";
  let detector = null;
  try {
    setScannerStatus("Scanning the photo…");
    detector = await window.BarcodeScanner.createDecoder(window);
    imageUrl = URL.createObjectURL(file);
    const imageSource = new Image();
    await new Promise((resolve, reject) => {
      imageSource.onload = resolve;
      imageSource.onerror = () => reject(new Error("The selected image could not be opened."));
      imageSource.src = imageUrl;
    });
    const results = await detector.detect(imageSource);
    if (!results.length) {
      setScannerStatus("No barcode was found in the photo. Try again with the code sharp, close, and well lit, or type the value.", true);
      return;
    }
    lookupReagentCode(results[0].rawValue);
  } catch (error) {
    setScannerStatus(`The photo could not be scanned${error?.message ? `: ${error.message}` : "."} Try another photo or type the printed value.`, true);
  } finally {
    detector?.dispose?.();
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    [reagentOpsEls.scanFile, reagentOpsEls.scanUpload].forEach((input) => {
      input.disabled = false;
      input.value = "";
    });
  }
}

function daysFromToday(dateValue) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.valueOf())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date - today) / 86400000);
}

function renderReagentAlerts() {
  const warningWindow = Math.max(1, Number(reagentOpsEls.warningDays.value) || 30);
  const alerts = [];
  reagentState.items.forEach((item) => {
    const name = itemCatalog(item).name || "Unknown reagent";
    const days = daysFromToday(item.expiration_date);
    const quantity = Number(item.quantity);
    const minimum = Number(item.minimum_quantity || 0);
    if (item.status === "expired" || (days !== null && days < 0)) {
      alerts.push({ severity: "danger", kind: "expired", title: `${name} is expired`, detail: item.expiration_date ? `Expired ${formatDate(item.expiration_date)} · ${item.location}` : item.location });
    } else if (days !== null && days <= warningWindow) {
      alerts.push({ severity: "warning", kind: "expiring", title: `${name} expires in ${days} day${days === 1 ? "" : "s"}`, detail: `${formatDate(item.expiration_date)} · ${item.location}` });
    }
    if (item.status === "depleted" || quantity <= 0) {
      alerts.push({ severity: "danger", kind: "low", title: `${name} is depleted`, detail: item.location });
    } else if (item.status === "low" || (minimum > 0 && quantity <= minimum)) {
      alerts.push({ severity: "warning", kind: "low", title: `${name} is at reorder level`, detail: `${quantity} ${item.unit} available · threshold ${minimum} ${item.unit}` });
    }
  });
  const expired = alerts.filter((entry) => entry.kind === "expired").length;
  const expiring = alerts.filter((entry) => entry.kind === "expiring").length;
  const low = alerts.filter((entry) => entry.kind === "low").length;
  reagentOpsEls.alertMetrics.innerHTML = [
    metricMarkup(expired, "expired", expired ? "is-danger" : ""),
    metricMarkup(expiring, "expiring", expiring ? "is-warning" : ""),
    metricMarkup(low, "low/depleted", low ? "is-warning" : ""),
  ].join("");
  reagentOpsEls.alertList.innerHTML = alerts.length ? alerts.slice(0, 20).map((entry) =>
    `<div class="compact-alert is-${entry.severity}"><strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(entry.detail || "")}</span></div>`
  ).join("") : '<div class="empty-state">No stock alerts.</div>';
}

function renderReagentQuality() {
  const errors = [];
  const warnings = [];
  const pairCounts = new Map();
  const codeOwners = new Map();
  reagentState.catalog.forEach((entry) => {
    const pair = catalogPairKey(entry);
    pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
    [["barcode", entry.barcode], ["GTIN", entry.gtin]].forEach(([label, rawCode]) => {
      const code = normalizedReagentCode(rawCode);
      if (!code) return;
      const previous = codeOwners.get(`${label}:${code}`);
      if (previous && previous !== pair) errors.push(`${label} ${rawCode} is assigned to more than one product.`);
      else codeOwners.set(`${label}:${code}`, pair);
    });
    if (entry.gtin && !validGtin(entry.gtin)) errors.push(`${entry.name}: GTIN ${entry.gtin} has an invalid length or check digit.`);
    if (!entry.manufacturer) warnings.push(`${entry.name}: manufacturer is missing.`);
    if (!entry.category) warnings.push(`${entry.name}: category is missing.`);
    if (!entry.default_storage) warnings.push(`${entry.name}: default storage is missing.`);
  });
  pairCounts.forEach((count, pair) => {
    if (count > 1) errors.push(`Duplicate manufacturer + catalog pair: ${pair.replace("|", " / ")}.`);
  });
  const containerCodes = new Map();
  reagentState.items.forEach((item) => {
    const name = itemCatalog(item).name || "Unknown reagent";
    const code = normalizedReagentCode(item.container_barcode);
    if (code) {
      if (containerCodes.has(code)) errors.push(`Container code ${item.container_barcode} is duplicated.`);
      else containerCodes.set(code, item.id);
    }
    if (!item.lot_number) warnings.push(`${name}: lot number is missing.`);
    if (!item.expiration_date) warnings.push(`${name}: expiration date is missing.`);
    if (item.opened_at && item.expiration_date && item.opened_at > item.expiration_date) errors.push(`${name}: opened date is after expiration.`);
    if (item.reconstituted_at && item.expiration_date && item.reconstituted_at > item.expiration_date) errors.push(`${name}: reconstitution date is after expiration.`);
  });
  reagentOpsEls.qualityMetrics.innerHTML = [
    metricMarkup(errors.length, "invalid/duplicate", errors.length ? "is-danger" : ""),
    metricMarkup(warnings.length, "missing fields", warnings.length ? "is-warning" : ""),
    metricMarkup(reagentState.catalog.length, "catalog products"),
  ].join("");
  const findings = [
    ...errors.map((message) => ({ message, tone: "danger" })),
    ...warnings.map((message) => ({ message, tone: "warning" })),
  ];
  reagentOpsEls.qualityList.innerHTML = findings.length ? findings.slice(0, 20).map((entry) =>
    `<div class="compact-alert is-${entry.tone}"><span>${escapeHtml(entry.message)}</span></div>`
  ).join("") : '<div class="empty-state">No data-quality issues detected.</div>';
}

function populatePurchaseCatalog() {
  const selected = reagentOpsEls.purchaseCatalog.value;
  reagentOpsEls.purchaseCatalog.innerHTML = '<option value="">Select a product</option>' + reagentState.catalog.map((entry) =>
    `<option value="${escapeHtml(entry.id)}">${escapeHtml(reagentCatalogLabel(entry))}</option>`
  ).join("");
  if (reagentState.catalog.some((entry) => entry.id === selected)) reagentOpsEls.purchaseCatalog.value = selected;
}

function catalogFormPayload(form) {
  const data = new FormData(form);
  return {
    name: reagentCode(data.get("name")),
    catalog_number: reagentCode(data.get("catalog_number")),
    manufacturer: reagentCode(data.get("manufacturer")),
    category: valueOrNull(data.get("category")),
    default_storage: valueOrNull(data.get("default_storage")),
    barcode: valueOrNull(data.get("barcode")),
    gtin: valueOrNull(data.get("gtin")),
    supplier_url: valueOrNull(data.get("supplier_url")),
    synonyms: reagentCode(data.get("synonyms")).split(";").map((value) => value.trim()).filter(Boolean),
    notes: valueOrNull(data.get("notes")),
    updated_at: new Date().toISOString(),
  };
}

function catalogPayloadIssue(payload, ignoreCatalogId = null) {
  if (!payload.name || !payload.catalog_number || !payload.manufacturer) return "Name, catalog number, and manufacturer are required.";
  if (payload.gtin && !validGtin(payload.gtin)) return "GTIN must be 8, 12, 13, or 14 digits with a valid check digit.";
  const pair = catalogPairKey(payload);
  if (reagentState.catalog.some((entry) => entry.id !== ignoreCatalogId && catalogPairKey(entry) === pair)) return "This manufacturer + catalog number already exists.";
  for (const field of ["barcode", "gtin"]) {
    if (payload[field] && reagentState.catalog.some((entry) => entry.id !== ignoreCatalogId && normalizedReagentCode(entry[field]) === normalizedReagentCode(payload[field]))) {
      return `This ${field} is already assigned to another catalog product.`;
    }
  }
  return "";
}

async function handleCatalogSubmit(event) {
  event.preventDefault();
  showCatalogMessage();
  const payload = catalogFormPayload(event.currentTarget);
  const issue = catalogPayloadIssue(payload);
  if (issue) {
    showCatalogMessage(issue);
    return;
  }
  const button = event.currentTarget.querySelector('[type="submit"]');
  button.disabled = true;
  const { error } = await db.from("reagent_catalog").insert(payload);
  button.disabled = false;
  if (error) {
    showCatalogMessage(`Could not add the product: ${error.message}. Run the reagent operations migration if these fields are missing.`);
    return;
  }
  event.currentTarget.reset();
  showToast("Catalog product added.");
  await loadReagentInventory();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { value += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(value); value = ""; }
    else if (char === "\n") { row.push(value); rows.push(row); row = []; value = ""; }
    else if (char !== "\r") value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows.filter((cells) => cells.some((cell) => reagentCode(cell)));
}

function csvHeader(value) {
  return reagentCode(value).replace(/^\uFEFF/, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function csvValue(record, ...keys) {
  for (const key of keys) if (record[key] !== undefined) return reagentCode(record[key]);
  return "";
}

function prepareImportRows(text) {
  const data = parseCsv(text);
  if (data.length < 2) throw new Error("The CSV needs a header and at least one data row.");
  const headers = data[0].map(csvHeader);
  const seenPairs = new Set();
  return data.slice(1).map((cells, index) => {
    const record = Object.fromEntries(headers.map((header, column) => [header, cells[column] || ""]));
    const payload = {
      name: csvValue(record, "name", "product_name", "reagent"),
      catalog_number: csvValue(record, "catalog_number", "catalog", "catalog_no", "catalogue_number"),
      manufacturer: csvValue(record, "manufacturer", "supplier", "vendor"),
      category: valueOrNull(csvValue(record, "category", "type")),
      default_storage: valueOrNull(csvValue(record, "default_storage", "storage", "storage_condition")),
      barcode: valueOrNull(csvValue(record, "barcode", "product_barcode")),
      gtin: valueOrNull(csvValue(record, "gtin", "ean", "upc")),
      supplier_url: valueOrNull(csvValue(record, "supplier_url", "url", "product_url")),
      synonyms: csvValue(record, "synonyms", "aliases").split(/[|;]/).map((value) => value.trim()).filter(Boolean),
      notes: valueOrNull(csvValue(record, "notes")),
      updated_at: new Date().toISOString(),
    };
    const existing = reagentState.catalog.find((entry) => catalogPairKey(entry) === catalogPairKey(payload));
    if (existing) {
      payload.catalog_number = existing.catalog_number;
      payload.manufacturer = existing.manufacturer;
    }
    let issue = "";
    if (!payload.name || !payload.catalog_number || !payload.manufacturer) issue = "name, catalog_number, and manufacturer are required";
    else if (payload.gtin && !validGtin(payload.gtin)) issue = "invalid GTIN check digit or length";
    else if (seenPairs.has(catalogPairKey(payload))) issue = "duplicate manufacturer + catalog in this file";
    else {
      for (const field of ["barcode", "gtin"]) {
        const collision = payload[field] && reagentState.catalog.find((entry) => normalizedReagentCode(entry[field]) === normalizedReagentCode(payload[field]) && entry.id !== existing?.id);
        if (collision) issue = `${field} already belongs to ${collision.name}`;
      }
    }
    seenPairs.add(catalogPairKey(payload));
    return { line: index + 2, payload, existing: Boolean(existing), issue };
  });
}

function renderImportPreview() {
  const valid = reagentOpsState.importRows.filter((row) => !row.issue);
  const invalid = reagentOpsState.importRows.filter((row) => row.issue);
  reagentOpsEls.importPreview.innerHTML = reagentOpsState.importRows.slice(0, 30).map((row) =>
    `<div class="import-row ${row.issue ? "is-invalid" : ""}"><span><strong>Line ${row.line}: ${escapeHtml(row.payload.name || "Unnamed")}</strong><br>${escapeHtml([row.payload.manufacturer, row.payload.catalog_number].filter(Boolean).join(" · "))}</span><span>${escapeHtml(row.issue || (row.existing ? "update" : "new"))}</span></div>`
  ).join("");
  reagentOpsEls.importStatus.textContent = `${valid.length} valid row${valid.length === 1 ? "" : "s"}; ${invalid.length} skipped. ${reagentOpsState.importRows.length > 30 ? "Preview shows the first 30 rows." : ""}`;
  reagentOpsEls.importConfirm.textContent = `Import ${valid.length} valid row${valid.length === 1 ? "" : "s"}`;
  reagentOpsEls.importConfirm.classList.toggle("is-hidden", valid.length === 0);
}

async function handleCsvSelection(file) {
  reagentOpsState.importRows = [];
  reagentOpsEls.importConfirm.classList.add("is-hidden");
  reagentOpsEls.importPreview.innerHTML = "";
  if (!file) return;
  try {
    reagentOpsState.importRows = prepareImportRows(await file.text());
    renderImportPreview();
  } catch (error) {
    reagentOpsEls.importStatus.textContent = `Could not read CSV: ${error.message}`;
  }
}

async function importCatalogRows() {
  const rows = reagentOpsState.importRows.filter((row) => !row.issue).map((row) => row.payload);
  if (!rows.length) return;
  reagentOpsEls.importConfirm.disabled = true;
  let imported = 0;
  for (let start = 0; start < rows.length; start += 100) {
    const chunk = rows.slice(start, start + 100);
    const { error } = await db.from("reagent_catalog").upsert(chunk, { onConflict: "catalog_number,manufacturer" });
    if (error) {
      reagentOpsEls.importStatus.textContent = `Stopped after ${imported} rows: ${error.message}`;
      reagentOpsEls.importConfirm.disabled = false;
      return;
    }
    imported += chunk.length;
    reagentOpsEls.importStatus.textContent = `Imported ${imported} of ${rows.length} rows…`;
  }
  reagentOpsEls.importConfirm.disabled = false;
  reagentOpsEls.importConfirm.classList.add("is-hidden");
  reagentOpsEls.importStatus.textContent = `Imported ${imported} catalog rows successfully.`;
  showToast("Catalog import complete.");
  await loadReagentInventory();
}

function purchaseStatusBadge(status) {
  const tone = status === "rejected" || status === "cancelled" ? "danger" : status === "requested" || status === "approved" ? "warning" : "";
  return `<span class="badge ${tone}">${escapeHtml(status)}</span>`;
}

function purchaseActionsMarkup(request) {
  if (request.status === "requested") return `<div class="purchase-actions"><input data-purchase-reviewer placeholder="Reviewer name" aria-label="Reviewer name"><button class="secondary-button purchase-action-button" data-purchase-action="approve" type="button">Approve</button><button class="secondary-button danger-button purchase-action-button" data-purchase-action="reject" type="button">Reject</button><button class="secondary-button purchase-action-button" data-purchase-action="cancel" type="button">Cancel</button></div>`;
  if (request.status === "approved") return `<div class="purchase-actions"><input data-purchase-order placeholder="Order / PO number" aria-label="Order or purchase order number"><button class="secondary-button purchase-action-button" data-purchase-action="order" type="button">Mark ordered</button><button class="secondary-button purchase-action-button" data-purchase-action="cancel" type="button">Cancel</button></div>`;
  if (request.status === "ordered") return `<div class="receipt-fields"><label>Lot<input data-receipt="lot" placeholder="Lot number"></label><label>Expires<input data-receipt="expiration" type="date"></label><label>Quantity<input data-receipt="quantity" type="number" min="0.000001" step="any" value="${escapeHtml(request.approved_quantity || request.requested_quantity)}"></label><label>Unit<input data-receipt="unit" value="${escapeHtml(request.unit)}"></label><label>Location<input data-receipt="location" required placeholder="Fridge / rack / box"></label><label>Container code<input data-receipt="barcode"></label><label>Received by<input data-receipt="receiver" required></label><button class="primary-button purchase-action-button" data-purchase-action="receive" type="button">Receive into stock</button></div>`;
  return "";
}

function renderPurchaseRequests() {
  const status = reagentOpsEls.purchaseFilter.value;
  const requests = reagentOpsState.purchaseRequests.filter((request) => !status || request.status === status);
  reagentOpsEls.purchaseList.innerHTML = requests.length ? requests.map((request) => {
    const catalog = request.reagent_catalog || reagentState.catalog.find((entry) => entry.id === request.catalog_reagent_id) || {};
    const cost = request.estimated_cost == null ? "" : ` · ${escapeHtml(request.currency)} ${escapeHtml(Number(request.estimated_cost).toFixed(2))}`;
    return `<article class="item" data-purchase-id="${escapeHtml(request.id)}"><div><div class="item-title">${escapeHtml(catalog.name || "Unknown reagent")} ${purchaseStatusBadge(request.status)}</div><div class="item-meta"><span>${escapeHtml(`${request.requested_quantity} ${request.unit}`)}</span><span>${escapeHtml(request.requester_name)}</span><span>${escapeHtml(request.priority)} priority${cost}</span><span>${escapeHtml(formatDateTime(request.created_at))}</span>${request.order_number ? `<span>PO ${escapeHtml(request.order_number)}</span>` : ""}</div>${request.justification ? `<p class="event-notes">${escapeHtml(request.justification)}</p>` : ""}${request.review_notes ? `<p class="event-notes">Review: ${escapeHtml(request.review_notes)}</p>` : ""}${purchaseActionsMarkup(request)}</div></article>`;
  }).join("") : '<div class="empty-state">No purchase requests match this filter.</div>';
}

async function loadPurchaseRequests() {
  const { data, error } = await db.from("reagent_purchase_requests").select("*, reagent_catalog(*)").order("created_at", { ascending: false });
  if (error) {
    reagentOpsState.purchaseRequests = [];
    reagentOpsEls.purchaseList.innerHTML = `<div class="empty-state">Purchasing is unavailable. Run <code>2026-08-05_reagent_operations.sql</code> and sign in.<br>${escapeHtml(error.message)}</div>`;
    return;
  }
  reagentOpsState.purchaseRequests = data || [];
  renderPurchaseRequests();
}

async function handlePurchaseSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const requestedQuantity = Number(data.get("requested_quantity"));
  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
    showToast("Enter a requested quantity greater than zero.");
    return;
  }
  const payload = {
    catalog_reagent_id: data.get("catalog_reagent_id"),
    requested_quantity: requestedQuantity,
    unit: reagentCode(data.get("unit")),
    requester_name: reagentCode(data.get("requester_name")),
    vendor: valueOrNull(data.get("vendor")),
    estimated_cost: numberOrNull(data.get("estimated_cost")),
    currency: data.get("currency"),
    priority: data.get("priority"),
    justification: valueOrNull(data.get("justification")),
  };
  const button = event.currentTarget.querySelector('[type="submit"]');
  button.disabled = true;
  const { error } = await db.from("reagent_purchase_requests").insert(payload);
  button.disabled = false;
  if (error) { showToast(`Could not submit request: ${error.message}`); return; }
  event.currentTarget.reset();
  showToast("Purchase request submitted.");
  await loadPurchaseRequests();
}

async function updatePurchaseRequest(id, payload, successMessage) {
  const { error } = await db.from("reagent_purchase_requests").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) { showToast(`Could not update request: ${error.message}`); return false; }
  showToast(successMessage);
  await loadPurchaseRequests();
  return true;
}

async function handlePurchaseAction(event) {
  const button = event.target.closest("[data-purchase-action]");
  if (!button) return;
  const card = button.closest("[data-purchase-id]");
  const id = card.dataset.purchaseId;
  const request = reagentOpsState.purchaseRequests.find((entry) => entry.id === id);
  if (!request) return;
  const action = button.dataset.purchaseAction;
  button.disabled = true;
  if (action === "approve" || action === "reject") {
    const reviewer = reagentCode(card.querySelector("[data-purchase-reviewer]")?.value);
    if (!reviewer) { showToast("Enter the reviewer name."); button.disabled = false; return; }
    await updatePurchaseRequest(id, { status: action === "approve" ? "approved" : "rejected", reviewer_name: reviewer, reviewed_at: new Date().toISOString(), approved_quantity: action === "approve" ? request.requested_quantity : null }, action === "approve" ? "Request approved." : "Request rejected.");
  } else if (action === "cancel") {
    await updatePurchaseRequest(id, { status: "cancelled" }, "Request cancelled.");
  } else if (action === "order") {
    const orderNumber = reagentCode(card.querySelector("[data-purchase-order]")?.value);
    if (!orderNumber) { showToast("Enter an order or PO number."); button.disabled = false; return; }
    await updatePurchaseRequest(id, { status: "ordered", order_number: orderNumber, ordered_at: new Date().toISOString() }, "Request marked as ordered.");
  } else if (action === "receive") {
    const field = (name) => card.querySelector(`[data-receipt="${name}"]`)?.value || "";
    const quantity = Number(field("quantity"));
    if (!Number.isFinite(quantity) || quantity <= 0 || !reagentCode(field("unit")) || !reagentCode(field("location")) || !reagentCode(field("receiver"))) {
      showToast("Quantity, unit, location, and receiver are required.");
      button.disabled = false;
      return;
    }
    const { error } = await db.rpc("receive_reagent_purchase", {
      p_request_id: id,
      p_lot_number: valueOrNull(field("lot")),
      p_expiration_date: valueOrNull(field("expiration")),
      p_quantity: quantity,
      p_unit: reagentCode(field("unit")),
      p_location: reagentCode(field("location")),
      p_container_barcode: valueOrNull(field("barcode")),
      p_receiver_name: reagentCode(field("receiver")),
    });
    if (error) { showToast(`Could not receive item: ${error.message}`); button.disabled = false; return; }
    showToast("Purchase received into stock.");
    await Promise.all([loadPurchaseRequests(), loadReagentInventory()]);
  }
  button.disabled = false;
}

async function fillRequesterFromSession() {
  const input = reagentOpsEls.purchaseForm.elements.requester_name;
  if (input.value || !db?.auth?.getSession) return;
  const { data } = await db.auth.getSession();
  const user = data?.session?.user;
  input.value = user?.user_metadata?.full_name || user?.email || "";
}

function handleReagentsLoaded() {
  renderReagentAlerts();
  renderReagentQuality();
  populatePurchaseCatalog();
  loadPurchaseRequests();
  fillRequesterFromSession();
}

reagentOpsEls.barcodeLookup.addEventListener("click", () => lookupReagentCode(reagentOpsEls.barcodeInput.value));
reagentOpsEls.barcodeInput.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); lookupReagentCode(event.currentTarget.value); } });
reagentOpsEls.scanStart.addEventListener("click", startReagentScanner);
reagentOpsEls.scanStop.addEventListener("click", () => stopReagentScanner());
reagentOpsEls.scanFile.addEventListener("change", (event) => scanReagentImage(event.currentTarget.files?.[0]));
reagentOpsEls.scanUpload.addEventListener("change", (event) => scanReagentImage(event.currentTarget.files?.[0]));
reagentOpsEls.warningDays.addEventListener("input", renderReagentAlerts);
reagentOpsEls.catalogForm.addEventListener("submit", handleCatalogSubmit);
reagentOpsEls.csvInput.addEventListener("change", (event) => handleCsvSelection(event.currentTarget.files?.[0]));
reagentOpsEls.importConfirm.addEventListener("click", importCatalogRows);
reagentOpsEls.purchaseForm.addEventListener("submit", handlePurchaseSubmit);
reagentOpsEls.purchaseFilter.addEventListener("change", renderPurchaseRequests);
reagentOpsEls.purchaseList.addEventListener("click", handlePurchaseAction);
document.addEventListener("reagents:loaded", handleReagentsLoaded);
document.addEventListener("visibilitychange", () => { if (document.hidden && reagentOpsState.scannerStream) stopReagentScanner("Camera stopped because the page was hidden."); });
window.addEventListener("beforeunload", () => stopReagentScanner(""));
window.addEventListener("app:languagechange", () => {
  if (!reagentOpsState.scannerStream) renderScannerReadiness();
  renderReagentAlerts();
  renderReagentQuality();
  populatePurchaseCatalog();
  renderPurchaseRequests();
});

renderScannerReadiness();

if (db?.auth?.onAuthStateChange) {
  db.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => {
      if (session) loadReagentInventory();
      else {
        reagentState.catalog = [];
        reagentState.items = [];
        reagentState.aliquots = [];
        reagentOpsState.purchaseRequests = [];
      }
    }, 0);
  });
}

if (reagentState.catalog.length) handleReagentsLoaded();
