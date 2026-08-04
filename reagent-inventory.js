const reagentState = { catalog: [], items: [], aliquots: [], selectedItemId: null };

const reagentEls = {
  form: document.querySelector("#reagentItemForm"),
  librarySearch: document.querySelector("#reagentLibrarySearch"),
  libraryResults: document.querySelector("#reagentLibraryResults"),
  inventorySearch: document.querySelector("#reagentInventorySearch"),
  inventoryList: document.querySelector("#reagentInventoryList"),
  refresh: document.querySelector("#refreshReagents"),
  submit: document.querySelector("#reagentItemSubmitButton"),
  cancelEdit: document.querySelector("#cancelReagentEdit"),
  aliquotForm: document.querySelector("#aliquotForm"),
  aliquotTitle: document.querySelector("#aliquotFormTitle"),
  aliquotList: document.querySelector("#aliquotList"),
  closeAliquot: document.querySelector("#closeAliquotForm"),
};

function reagentCatalogLabel(reagent) {
  return [reagent.name, reagent.manufacturer, reagent.catalog_number].filter(Boolean).join(" · ");
}

function normalizedReagentSearch(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function matchingCatalog(query) {
  const term = normalizedReagentSearch(query);
  if (!term) return reagentState.catalog.slice(0, 12);
  return reagentState.catalog.filter((reagent) =>
    [reagent.name, reagent.catalog_number, reagent.manufacturer, reagent.category, reagent.barcode, reagent.gtin, ...(reagent.synonyms || [])]
      .some((value) => normalizedReagentSearch(value).includes(term))
  ).slice(0, 20);
}

function renderReagentLibraryResults() {
  const results = matchingCatalog(reagentEls.librarySearch.value);
  reagentEls.libraryResults.innerHTML = results.length ? results.map((reagent) => `
    <button class="reagent-library-option" type="button" role="option" data-catalog-id="${escapeHtml(reagent.id)}">
      <strong>${escapeHtml(reagent.name)}</strong>
      <span>${escapeHtml([reagent.manufacturer, reagent.catalog_number, reagent.category].filter(Boolean).join(" · "))}</span>
    </button>`).join("") : '<div class="empty-state">No library reagent matches this search.</div>';
}

function selectCatalogReagent(id) {
  const reagent = reagentState.catalog.find((entry) => entry.id === id);
  if (!reagent) return;
  reagentEls.form.elements.catalog_reagent_id.value = reagent.id;
  reagentEls.librarySearch.value = reagentCatalogLabel(reagent);
  reagentEls.libraryResults.classList.remove("is-open");
  if (!reagentEls.form.elements.location.value && reagent.default_storage) {
    reagentEls.form.elements.location.placeholder = `Suggested storage: ${reagent.default_storage}`;
  }
}

function itemCatalog(item) {
  return item.reagent_catalog || reagentState.catalog.find((entry) => entry.id === item.catalog_reagent_id) || {};
}

function renderReagentInventory() {
  const term = normalizedReagentSearch(reagentEls.inventorySearch.value);
  const items = reagentState.items.filter((item) => {
    const catalog = itemCatalog(item);
    return !term || [catalog.name, catalog.catalog_number, catalog.manufacturer, catalog.barcode, catalog.gtin, ...(catalog.synonyms || []), item.lot_number, item.container_barcode, item.location, item.status]
      .some((value) => normalizedReagentSearch(value).includes(term));
  });
  reagentEls.inventoryList.innerHTML = items.length ? items.map((item) => {
    const catalog = itemCatalog(item);
    const aliquotCount = reagentState.aliquots.filter((aliquot) => aliquot.inventory_item_id === item.id && aliquot.status === "available").length;
    const reconstitution = item.reconstituted_at ? `Reconstituted ${formatDate(item.reconstituted_at)}${item.reconstitution_concentration ? ` · ${item.reconstitution_concentration} ${item.reconstitution_concentration_unit || ""}` : ""}` : null;
    return `<article class="item reagent-item">
      <div>
        <div class="item-title">${escapeHtml(catalog.name || "Unknown reagent")} <span class="badge ${item.status === "expired" || item.status === "depleted" ? "danger" : item.status === "low" ? "warning" : ""}">${escapeHtml(item.status)}</span></div>
        <div class="item-meta"><span>${escapeHtml([catalog.manufacturer, catalog.catalog_number].filter(Boolean).join(" · "))}</span><span>${escapeHtml(`${item.quantity} ${item.unit}`)}</span><span>${escapeHtml(item.location)}</span>${item.lot_number ? `<span>Lot ${escapeHtml(item.lot_number)}</span>` : ""}${item.container_barcode ? `<span>Code ${escapeHtml(item.container_barcode)}</span>` : ""}${Number(item.minimum_quantity) > 0 ? `<span>Reorder ≤ ${escapeHtml(`${item.minimum_quantity} ${item.unit}`)}</span>` : ""}<span>${aliquotCount} available aliquot${aliquotCount === 1 ? "" : "s"}</span></div>
        ${reconstitution ? `<p class="event-notes">${escapeHtml(reconstitution)}</p>` : ""}
      </div>
      <div class="item-actions"><button class="secondary-button" type="button" data-aliquots="${escapeHtml(item.id)}">Aliquots</button><button class="icon-button edit-button" type="button" data-edit-reagent="${escapeHtml(item.id)}" title="Edit reagent" aria-label="Edit reagent">&#9998;</button></div>
    </article>`;
  }).join("") : '<div class="empty-state">No reagent stock matches this filter.</div>';
}

function renderAliquots() {
  const selected = reagentState.items.find((item) => item.id === reagentState.selectedItemId);
  if (!selected) return;
  const catalog = itemCatalog(selected);
  reagentEls.aliquotTitle.textContent = `Aliquots · ${catalog.name || "Reagent"}`;
  const aliquots = reagentState.aliquots.filter((entry) => entry.inventory_item_id === selected.id);
  reagentEls.aliquotList.innerHTML = aliquots.length ? aliquots.map((aliquot) => `<article class="item compact-item"><div><div class="item-title">${escapeHtml(aliquot.label)} <span class="badge">${escapeHtml(aliquot.status)}</span></div><div class="item-meta"><span>${escapeHtml(`${aliquot.quantity} ${aliquot.unit}`)}</span><span>${escapeHtml(aliquot.location)}</span>${aliquot.expiration_date ? `<span>Expires ${escapeHtml(formatDate(aliquot.expiration_date))}</span>` : ""}</div></div></article>`).join("") : '<div class="empty-state">No aliquots recorded for this item.</div>';
}

function openAliquots(itemId) {
  reagentState.selectedItemId = itemId;
  reagentEls.aliquotForm.reset();
  reagentEls.aliquotForm.elements.inventory_item_id.value = itemId;
  reagentEls.aliquotForm.classList.remove("is-hidden");
  renderAliquots();
  reagentEls.aliquotForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetReagentForm() {
  reagentEls.form.reset();
  reagentEls.form.elements.id.value = "";
  reagentEls.form.elements.catalog_reagent_id.value = "";
  reagentEls.submit.textContent = "Add to inventory";
  reagentEls.cancelEdit.classList.add("is-hidden");
  reagentEls.libraryResults.classList.remove("is-open");
}

function editReagentItem(id) {
  const item = reagentState.items.find((entry) => entry.id === id);
  if (!item) return;
  Object.entries(item).forEach(([name, value]) => {
    if (reagentEls.form.elements[name] && name !== "reagent_catalog") reagentEls.form.elements[name].value = value ?? "";
  });
  reagentEls.librarySearch.value = reagentCatalogLabel(itemCatalog(item));
  reagentEls.submit.textContent = "Update inventory item";
  reagentEls.cancelEdit.classList.remove("is-hidden");
  reagentEls.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadReagentInventory() {
  if (!ensureDb()) return;
  const [catalogResult, itemsResult, aliquotsResult] = await Promise.all([
    db.from("reagent_catalog").select("*").order("name"),
    db.from("reagent_inventory_items").select("*, reagent_catalog(*)").order("created_at", { ascending: false }),
    db.from("reagent_aliquots").select("*").order("created_at", { ascending: false }),
  ]);
  const error = catalogResult.error || itemsResult.error || aliquotsResult.error;
  if (error) {
    reagentEls.inventoryList.innerHTML = `<div class="empty-state">Reagent inventory unavailable. Run the reagent inventory migration.<br>${escapeHtml(error.message)}</div>`;
    return;
  }
  reagentState.catalog = catalogResult.data || [];
  reagentState.items = itemsResult.data || [];
  reagentState.aliquots = aliquotsResult.data || [];
  renderReagentLibraryResults();
  renderReagentInventory();
  if (reagentState.selectedItemId) renderAliquots();
  document.dispatchEvent(new CustomEvent("reagents:loaded"));
}

async function handleReagentSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const catalogId = valueOrNull(data.get("catalog_reagent_id"));
  if (!catalogId) { showToast("Select a reagent from the library results."); return; }
  const id = valueOrNull(data.get("id"));
  const payload = {
    catalog_reagent_id: catalogId, lot_number: valueOrNull(data.get("lot_number")), container_barcode: valueOrNull(data.get("container_barcode")), expiration_date: valueOrNull(data.get("expiration_date")), opened_at: valueOrNull(data.get("opened_at")),
    quantity: Number(data.get("quantity")), unit: valueOrNull(data.get("unit")), location: valueOrNull(data.get("location")), status: data.get("status"),
    minimum_quantity: Number(data.get("minimum_quantity") || 0),
    reconstituted_at: valueOrNull(data.get("reconstituted_at")), reconstitution_solvent: valueOrNull(data.get("reconstitution_solvent")),
    reconstitution_concentration: numberOrNull(data.get("reconstitution_concentration")), reconstitution_concentration_unit: valueOrNull(data.get("reconstitution_concentration_unit")),
    reconstitution_notes: valueOrNull(data.get("reconstitution_notes")), notes: valueOrNull(data.get("notes")), updated_at: new Date().toISOString(),
  };
  reagentEls.submit.disabled = true;
  const { error } = id ? await db.from("reagent_inventory_items").update(payload).eq("id", id) : await db.from("reagent_inventory_items").insert(payload);
  reagentEls.submit.disabled = false;
  if (error) { showToast(`Error saving reagent: ${error.message}`); return; }
  showToast(id ? "Inventory item updated." : "Reagent added to inventory.");
  resetReagentForm(); await loadReagentInventory();
}

async function handleAliquotSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const payload = { inventory_item_id: data.get("inventory_item_id"), label: valueOrNull(data.get("label")), quantity: Number(data.get("quantity")), unit: valueOrNull(data.get("unit")), location: valueOrNull(data.get("location")), prepared_at: valueOrNull(data.get("prepared_at")), expiration_date: valueOrNull(data.get("expiration_date")), status: data.get("status"), notes: valueOrNull(data.get("notes")) };
  const { error } = await db.from("reagent_aliquots").insert(payload);
  if (error) { showToast(`Error saving aliquot: ${error.message}`); return; }
  showToast("Aliquot saved."); await loadReagentInventory();
  event.currentTarget.reset(); event.currentTarget.elements.inventory_item_id.value = reagentState.selectedItemId;
}

reagentEls.librarySearch.addEventListener("focus", () => { renderReagentLibraryResults(); reagentEls.libraryResults.classList.add("is-open"); });
reagentEls.librarySearch.addEventListener("input", () => { reagentEls.form.elements.catalog_reagent_id.value = ""; renderReagentLibraryResults(); reagentEls.libraryResults.classList.add("is-open"); });
reagentEls.libraryResults.addEventListener("click", (event) => { const option = event.target.closest("[data-catalog-id]"); if (option) selectCatalogReagent(option.dataset.catalogId); });
reagentEls.inventorySearch.addEventListener("input", renderReagentInventory);
reagentEls.inventoryList.addEventListener("click", (event) => { const aliquot = event.target.closest("[data-aliquots]"); const edit = event.target.closest("[data-edit-reagent]"); if (aliquot) openAliquots(aliquot.dataset.aliquots); if (edit) editReagentItem(edit.dataset.editReagent); });
reagentEls.form.addEventListener("submit", handleReagentSubmit);
reagentEls.cancelEdit.addEventListener("click", resetReagentForm);
reagentEls.aliquotForm.addEventListener("submit", handleAliquotSubmit);
reagentEls.closeAliquot.addEventListener("click", () => reagentEls.aliquotForm.classList.add("is-hidden"));
reagentEls.refresh.addEventListener("click", loadReagentInventory);
window.addEventListener("app:languagechange", () => {
  renderReagentLibraryResults();
  renderReagentInventory();
  if (reagentState.selectedItemId) renderAliquots();
});

loadReagentInventory();
