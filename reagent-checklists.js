const reagentChecklistState = {
  lists: [],
  items: [],
  sessions: [],
  entries: [],
  profiles: [],
  selectedListId: null,
  migrationAvailable: true,
};

const reagentChecklistEls = {
  select: document.querySelector("#reagentChecklistSelect"),
  summary: document.querySelector("#reagentChecklistSummary"),
  status: document.querySelector("#reagentChecklistStatus"),
  newList: document.querySelector("#newReagentChecklist"),
  editList: document.querySelector("#editReagentChecklist"),
  deleteList: document.querySelector("#deleteReagentChecklist"),
  listForm: document.querySelector("#reagentChecklistForm"),
  responsible: document.querySelector("#reagentChecklistResponsible"),
  cancelList: document.querySelector("#cancelReagentChecklistEdit"),
  newItem: document.querySelector("#newReagentChecklistItem"),
  itemForm: document.querySelector("#reagentChecklistItemForm"),
  catalog: document.querySelector("#reagentChecklistCatalog"),
  cancelItem: document.querySelector("#cancelReagentChecklistItemEdit"),
  itemList: document.querySelector("#reagentChecklistItemList"),
  checkForm: document.querySelector("#reagentWeeklyCheckForm"),
  checkDate: document.querySelector("#reagentChecklistDate"),
  checkRows: document.querySelector("#reagentWeeklyCheckRows"),
  history: document.querySelector("#reagentChecklistHistory"),
};

const reagentChecklistStorageKey = "thatcellapp-reagent-checklist";

function reagentChecklistToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function reagentChecklistTranslate(text) {
  return window.translateAppText ? window.translateAppText(text) : text;
}

function reagentChecklistProfileName(userId) {
  const profile = reagentChecklistState.profiles.find((entry) => entry.id === userId)
    || state.profiles.find((entry) => entry.id === userId)
    || (state.profile?.id === userId ? state.profile : null);
  return profile?.full_name || profile?.email || reagentChecklistTranslate("Unassigned");
}

function selectedReagentChecklist() {
  return reagentChecklistState.lists.find((list) => list.id === reagentChecklistState.selectedListId) || null;
}

function selectedReagentChecklistItems(includeInactive = true) {
  return reagentChecklistState.items
    .filter((item) => item.checklist_id === reagentChecklistState.selectedListId && (includeInactive || item.is_active))
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.display_name.localeCompare(b.display_name));
}

function reagentChecklistCatalogItem(item) {
  return item.reagent_catalog
    || reagentState.catalog.find((catalog) => catalog.id === item.catalog_reagent_id)
    || {};
}

function reagentChecklistLatestSession() {
  return reagentChecklistState.sessions
    .filter((session) => session.checklist_id === reagentChecklistState.selectedListId)
    .sort((a, b) => b.checked_on.localeCompare(a.checked_on))[0] || null;
}

function reagentChecklistSessionForDate(date) {
  return reagentChecklistState.sessions.find((session) =>
    session.checklist_id === reagentChecklistState.selectedListId && session.checked_on === date
  ) || null;
}

function reagentChecklistEntryMap(sessionId) {
  return new Map(reagentChecklistState.entries
    .filter((entry) => entry.session_id === sessionId)
    .map((entry) => [entry.checklist_item_id, entry]));
}

function reagentChecklistAddDays(date, days) {
  const result = new Date(`${date}T12:00:00`);
  result.setDate(result.getDate() + Number(days || 7));
  return result.toISOString().slice(0, 10);
}

function renderReagentChecklistCatalogOptions(selectedId = "") {
  if (!reagentChecklistEls.catalog) return;
  const catalog = [...reagentState.catalog].sort((a, b) => a.name.localeCompare(b.name));
  reagentChecklistEls.catalog.innerHTML = `<option value="">${escapeHtml(reagentChecklistTranslate("Select a catalog product"))}</option>${catalog.map((entry) =>
    `<option value="${escapeHtml(entry.id)}">${escapeHtml(reagentCatalogLabel(entry))}</option>`
  ).join("")}`;
  reagentChecklistEls.catalog.value = selectedId || "";
}

function renderReagentChecklistResponsibleOptions(selectedId = "") {
  if (!reagentChecklistEls.responsible) return;
  const profiles = [...reagentChecklistState.profiles];
  state.profiles.forEach((profile) => {
    if (!profiles.some((entry) => entry.id === profile.id)) profiles.push(profile);
  });
  if (state.profile && !profiles.some((profile) => profile.id === state.profile.id)) profiles.push(state.profile);
  reagentChecklistEls.responsible.innerHTML = `<option value="">${escapeHtml(reagentChecklistTranslate("Unassigned"))}</option>${profiles
    .sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || ""))
    .map((profile) => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.full_name || profile.email || "User")}</option>`)
    .join("")}`;
  reagentChecklistEls.responsible.value = selectedId || "";
}

function renderReagentChecklistSummary() {
  const list = selectedReagentChecklist();
  if (!list) {
    reagentChecklistEls.summary.innerHTML = `<div class="empty-state">${escapeHtml(reagentChecklistTranslate("Create a material list to start weekly checks."))}</div>`;
    return;
  }
  const latest = reagentChecklistLatestSession();
  const dueDate = latest ? reagentChecklistAddDays(latest.checked_on, list.frequency_days) : reagentChecklistToday();
  const overdue = dueDate < reagentChecklistToday();
  const dueToday = dueDate === reagentChecklistToday();
  const dueTone = overdue ? "danger" : dueToday ? "warning" : "";
  const activeCount = selectedReagentChecklistItems(false).length;
  reagentChecklistEls.summary.innerHTML = `
    <div class="reagent-checklist-metric"><span>${escapeHtml(reagentChecklistTranslate("Responsible"))}</span><strong>${escapeHtml(reagentChecklistProfileName(list.responsible_user_id))}</strong></div>
    <div class="reagent-checklist-metric"><span>${escapeHtml(reagentChecklistTranslate("Frequency"))}</span><strong>${escapeHtml(`${list.frequency_days} ${reagentChecklistTranslate("days")}`)}</strong></div>
    <div class="reagent-checklist-metric"><span>${escapeHtml(reagentChecklistTranslate("Active items"))}</span><strong>${activeCount}</strong></div>
    <div class="reagent-checklist-metric"><span>${escapeHtml(reagentChecklistTranslate("Last checked"))}</span><strong>${latest ? escapeHtml(formatDate(latest.checked_on)) : escapeHtml(reagentChecklistTranslate("Never"))}</strong></div>
    <div class="reagent-checklist-metric ${dueTone}"><span>${escapeHtml(reagentChecklistTranslate(overdue ? "Overdue since" : "Next due"))}</span><strong>${escapeHtml(formatDate(dueDate))}</strong></div>`;
}

function renderReagentChecklistItems() {
  const items = selectedReagentChecklistItems(true);
  const latest = reagentChecklistLatestSession();
  const latestEntries = reagentChecklistEntryMap(latest?.id);
  reagentChecklistEls.itemList.innerHTML = items.length ? items.map((item) => {
    const catalog = reagentChecklistCatalogItem(item);
    const entry = latestEntries.get(item.id);
    const unit = reagentChecklistTranslate(item.unit);
    return `<article class="item reagent-checklist-item ${item.is_active ? "" : "is-inactive"}">
      <div>
        <div class="item-title">${escapeHtml(item.display_name)} ${item.is_active ? "" : `<span class="badge">${escapeHtml(reagentChecklistTranslate("Inactive"))}</span>`}</div>
        <div class="item-meta">
          <span>${escapeHtml([catalog.manufacturer, catalog.catalog_number].filter(Boolean).join(" · "))}</span>
          <span>${escapeHtml(item.expected_location || reagentChecklistTranslate("No location"))}</span>
          <span>${escapeHtml(`${reagentChecklistTranslate("Minimum")} ${item.minimum_quantity} ${unit}`)}</span>
          ${entry ? `<span>${escapeHtml(`${reagentChecklistTranslate("Last count")} ${entry.quantity_observed ?? "—"}`)}</span>` : ""}
        </div>
      </div>
      <div class="item-actions">
        <button class="icon-button edit-button" type="button" data-edit-checklist-item="${escapeHtml(item.id)}" title="${escapeHtml(reagentChecklistTranslate("Edit item"))}" aria-label="${escapeHtml(reagentChecklistTranslate("Edit item"))}">&#9998;</button>
        <button class="icon-button delete-button" type="button" data-delete-checklist-item="${escapeHtml(item.id)}" title="${escapeHtml(reagentChecklistTranslate("Delete item"))}" aria-label="${escapeHtml(reagentChecklistTranslate("Delete item"))}">&#128465;</button>
      </div>
    </article>`;
  }).join("") : `<div class="empty-state">${escapeHtml(reagentChecklistTranslate("No items in this list."))}</div>`;
}

function reagentChecklistStatusFor(quantity, minimum) {
  if (quantity === null || Number.isNaN(quantity)) return "not_checked";
  if (quantity === 0) return "out";
  if (quantity < Number(minimum || 0)) return "low";
  return "ok";
}

function renderReagentWeeklyCheckRows() {
  const items = selectedReagentChecklistItems(false);
  const requestedDate = reagentChecklistEls.checkDate.value || reagentChecklistToday();
  const sameDateSession = reagentChecklistSessionForDate(requestedDate);
  const entries = reagentChecklistEntryMap(sameDateSession?.id);
  reagentChecklistEls.checkForm.elements.notes.value = sameDateSession?.notes || "";
  reagentChecklistEls.checkRows.innerHTML = items.length ? items.map((item) => {
    const entry = entries.get(item.id);
    const quantity = entry?.quantity_observed ?? "";
    const ordered = sameDateSession ? Boolean(entry?.ordered) : false;
    const notes = sameDateSession ? entry?.notes || "" : "";
    const unit = reagentChecklistTranslate(item.unit);
    return `<div class="reagent-weekly-row" data-check-item="${escapeHtml(item.id)}">
      <div class="reagent-weekly-item"><strong>${escapeHtml(item.display_name)}</strong><span>${escapeHtml(item.expected_location || reagentChecklistTranslate("No location"))} · ${escapeHtml(`${reagentChecklistTranslate("Minimum")} ${item.minimum_quantity} ${unit}`)}</span></div>
      <label class="reagent-weekly-count">${escapeHtml(reagentChecklistTranslate("Count"))}<input data-check-quantity type="number" inputmode="decimal" min="0" step="any" value="${escapeHtml(quantity)}"></label>
      <label class="checkbox-label reagent-weekly-order"><input data-check-ordered type="checkbox" ${ordered ? "checked" : ""}> ${escapeHtml(reagentChecklistTranslate("Order item"))}</label>
      <details class="reagent-weekly-notes" ${notes ? "open" : ""}>
        <summary>${escapeHtml(reagentChecklistTranslate("Notes"))}${notes ? " ·" : ""}</summary>
        <input data-check-notes aria-label="${escapeHtml(reagentChecklistTranslate("Notes"))}" placeholder="${escapeHtml(reagentChecklistTranslate("Optional"))}" value="${escapeHtml(notes)}">
      </details>
    </div>`;
  }).join("") : `<div class="empty-state">${escapeHtml(reagentChecklistTranslate("Add active items before saving a weekly check."))}</div>`;
}

function renderReagentChecklistHistory() {
  const sessions = reagentChecklistState.sessions
    .filter((session) => session.checklist_id === reagentChecklistState.selectedListId)
    .sort((a, b) => b.checked_on.localeCompare(a.checked_on));
  reagentChecklistEls.history.innerHTML = sessions.length ? sessions.map((session) => {
    const entries = reagentChecklistState.entries.filter((entry) => entry.session_id === session.id);
    const checked = entries.filter((entry) => entry.status !== "not_checked").length;
    const low = entries.filter((entry) => entry.status === "low" || entry.status === "out").length;
    const ordered = entries.filter((entry) => entry.ordered).length;
    return `<article class="compact-alert ${low ? "is-danger" : "is-info"}">
      <strong>${escapeHtml(formatDate(session.checked_on))} · ${escapeHtml(reagentChecklistProfileName(session.checked_by))}</strong>
      <span>${escapeHtml(`${checked} ${reagentChecklistTranslate("items checked")} · ${low} ${reagentChecklistTranslate("low/out")} · ${ordered} ${reagentChecklistTranslate("to order")}`)}</span>
      ${session.notes ? `<span>${escapeHtml(session.notes)}</span>` : ""}
      <button class="text-button" type="button" data-open-check-session="${escapeHtml(session.checked_on)}">${escapeHtml(reagentChecklistTranslate("Open check"))}</button>
    </article>`;
  }).join("") : `<div class="empty-state">${escapeHtml(reagentChecklistTranslate("No weekly checks recorded yet."))}</div>`;
}

function renderReagentChecklists() {
  const selected = selectedReagentChecklist();
  reagentChecklistEls.select.innerHTML = reagentChecklistState.lists.length
    ? reagentChecklistState.lists.map((list) => `<option value="${escapeHtml(list.id)}">${escapeHtml(list.name)}</option>`).join("")
    : `<option value="">${escapeHtml(reagentChecklistTranslate("No material lists"))}</option>`;
  reagentChecklistEls.select.value = selected?.id || "";
  const disabled = !selected;
  reagentChecklistEls.editList.disabled = disabled;
  reagentChecklistEls.deleteList.disabled = disabled;
  reagentChecklistEls.newItem.disabled = disabled;
  reagentChecklistEls.checkForm.querySelector("button[type='submit']").disabled = disabled;
  reagentChecklistEls.newList.disabled = !reagentChecklistState.migrationAvailable;
  renderReagentChecklistResponsibleOptions(selected?.responsible_user_id || currentUserId() || "");
  renderReagentChecklistCatalogOptions();
  renderReagentChecklistSummary();
  renderReagentChecklistItems();
  renderReagentWeeklyCheckRows();
  renderReagentChecklistHistory();
}

async function loadReagentChecklists() {
  if (!db || !reagentChecklistEls.select || (state.authAvailable && !state.session)) return;
  reagentChecklistEls.status.textContent = reagentChecklistTranslate("Loading material lists…");
  const [listsResult, itemsResult, sessionsResult, entriesResult, profilesResult] = await Promise.all([
    db.from("reagent_checklists").select("*").order("name"),
    db.from("reagent_checklist_items").select("*, reagent_catalog(*)").order("sort_order"),
    db.from("reagent_check_sessions").select("*").order("checked_on", { ascending: false }),
    db.from("reagent_check_entries").select("*"),
    db.from("profiles").select("id, full_name, email, is_active").eq("is_active", true).order("full_name"),
  ]);
  const error = listsResult.error || itemsResult.error || sessionsResult.error || entriesResult.error || profilesResult.error;
  if (error) {
    reagentChecklistState.migrationAvailable = !isMissingTableError(error);
    reagentChecklistState.lists = [];
    reagentChecklistState.items = [];
    reagentChecklistState.sessions = [];
    reagentChecklistState.entries = [];
    reagentChecklistState.profiles = [];
    reagentChecklistState.selectedListId = null;
    reagentChecklistEls.status.textContent = isMissingTableError(error)
      ? reagentChecklistTranslate("Material lists are not installed. Run the reagent checklists migration in Supabase.")
      : `${reagentChecklistTranslate("Could not load material lists")}: ${error.message}`;
    renderReagentChecklists();
    return;
  }
  reagentChecklistState.migrationAvailable = true;
  reagentChecklistState.lists = listsResult.data || [];
  reagentChecklistState.items = itemsResult.data || [];
  reagentChecklistState.sessions = sessionsResult.data || [];
  reagentChecklistState.entries = entriesResult.data || [];
  reagentChecklistState.profiles = profilesResult.data || [];
  const savedId = window.localStorage.getItem(reagentChecklistStorageKey);
  if (!reagentChecklistState.lists.some((list) => list.id === reagentChecklistState.selectedListId)) {
    reagentChecklistState.selectedListId = reagentChecklistState.lists.find((list) => list.id === savedId)?.id
      || reagentChecklistState.lists.find((list) => list.name === "VictorLab TC")?.id
      || reagentChecklistState.lists[0]?.id
      || null;
  }
  reagentChecklistEls.status.textContent = "";
  renderReagentChecklists();
}

function openReagentChecklistForm(list = null) {
  reagentChecklistEls.listForm.reset();
  reagentChecklistEls.listForm.elements.id.value = list?.id || "";
  reagentChecklistEls.listForm.elements.name.value = list?.name || "";
  reagentChecklistEls.listForm.elements.description.value = list?.description || "";
  reagentChecklistEls.listForm.elements.frequency_days.value = list?.frequency_days || 7;
  reagentChecklistEls.listForm.elements.is_active.checked = list ? Boolean(list.is_active) : true;
  renderReagentChecklistResponsibleOptions(list?.responsible_user_id || currentUserId() || "");
  reagentChecklistEls.listForm.classList.remove("is-hidden");
  reagentChecklistEls.listForm.elements.name.focus();
}

function closeReagentChecklistForm() {
  reagentChecklistEls.listForm.classList.add("is-hidden");
  reagentChecklistEls.listForm.reset();
}

async function handleReagentChecklistSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const id = valueOrNull(data.get("id"));
  const payload = {
    name: String(data.get("name") || "").trim(),
    description: valueOrNull(data.get("description")),
    frequency_days: Number(data.get("frequency_days") || 7),
    responsible_user_id: valueOrNull(data.get("responsible_user_id")),
    is_active: data.get("is_active") === "on",
    updated_at: new Date().toISOString(),
  };
  if (!id) payload.created_by = currentUserId();
  const submit = event.currentTarget.querySelector("button[type='submit']");
  submit.disabled = true;
  const result = id
    ? await db.from("reagent_checklists").update(payload).eq("id", id).select().single()
    : await db.from("reagent_checklists").insert(payload).select().single();
  submit.disabled = false;
  if (result.error) {
    showToast(`${reagentChecklistTranslate("Could not save list")}: ${result.error.message}`);
    return;
  }
  reagentChecklistState.selectedListId = result.data.id;
  window.localStorage.setItem(reagentChecklistStorageKey, result.data.id);
  closeReagentChecklistForm();
  showToast(reagentChecklistTranslate(id ? "Material list updated." : "Material list created."));
  await loadReagentChecklists();
}

async function deleteSelectedReagentChecklist() {
  const list = selectedReagentChecklist();
  if (!list) return;
  const confirmed = window.confirm(`${reagentChecklistTranslate("Delete material list")} “${list.name}”? ${reagentChecklistTranslate("Its items and complete check history will also be deleted.")}`);
  if (!confirmed) return;
  const { error } = await db.rpc("delete_reagent_checklist", { p_checklist_id: list.id });
  if (error) {
    showToast(`${reagentChecklistTranslate("Could not delete list")}: ${error.message}`);
    return;
  }
  reagentChecklistState.selectedListId = null;
  window.localStorage.removeItem(reagentChecklistStorageKey);
  showToast(reagentChecklistTranslate("Material list deleted."));
  await loadReagentChecklists();
}

function openReagentChecklistItemForm(item = null) {
  const list = selectedReagentChecklist();
  if (!list) return;
  reagentChecklistEls.itemForm.reset();
  reagentChecklistEls.itemForm.elements.id.value = item?.id || "";
  reagentChecklistEls.itemForm.elements.display_name.value = item?.display_name || "";
  reagentChecklistEls.itemForm.elements.expected_location.value = item?.expected_location || "";
  reagentChecklistEls.itemForm.elements.minimum_quantity.value = item?.minimum_quantity ?? 0;
  reagentChecklistEls.itemForm.elements.unit.value = item?.unit || "units";
  reagentChecklistEls.itemForm.elements.sort_order.value = item?.sort_order ?? selectedReagentChecklistItems().length + 1;
  reagentChecklistEls.itemForm.elements.is_active.checked = item ? Boolean(item.is_active) : true;
  reagentChecklistEls.itemForm.elements.notes.value = item?.notes || "";
  renderReagentChecklistCatalogOptions(item?.catalog_reagent_id || "");
  reagentChecklistEls.itemForm.classList.remove("is-hidden");
}

function closeReagentChecklistItemForm() {
  reagentChecklistEls.itemForm.classList.add("is-hidden");
  reagentChecklistEls.itemForm.reset();
}

async function handleReagentChecklistItemSubmit(event) {
  event.preventDefault();
  const list = selectedReagentChecklist();
  if (!list) return;
  const data = new FormData(event.currentTarget);
  const id = valueOrNull(data.get("id"));
  const payload = {
    checklist_id: list.id,
    catalog_reagent_id: valueOrNull(data.get("catalog_reagent_id")),
    display_name: String(data.get("display_name") || "").trim(),
    expected_location: valueOrNull(data.get("expected_location")),
    minimum_quantity: Number(data.get("minimum_quantity") || 0),
    unit: String(data.get("unit") || "units").trim(),
    sort_order: Number(data.get("sort_order") || 0),
    is_active: data.get("is_active") === "on",
    notes: valueOrNull(data.get("notes")),
    updated_at: new Date().toISOString(),
  };
  const submit = event.currentTarget.querySelector("button[type='submit']");
  submit.disabled = true;
  const { error } = id
    ? await db.from("reagent_checklist_items").update(payload).eq("id", id)
    : await db.from("reagent_checklist_items").insert(payload);
  submit.disabled = false;
  if (error) {
    showToast(`${reagentChecklistTranslate("Could not save item")}: ${error.message}`);
    return;
  }
  closeReagentChecklistItemForm();
  showToast(reagentChecklistTranslate(id ? "List item updated." : "List item added."));
  await loadReagentChecklists();
}

async function deleteReagentChecklistItem(itemId) {
  const item = reagentChecklistState.items.find((entry) => entry.id === itemId);
  if (!item) return;
  if (!window.confirm(`${reagentChecklistTranslate("Delete list item")} “${item.display_name}”?`)) return;
  const { error } = await db.from("reagent_checklist_items").delete().eq("id", item.id);
  if (error) {
    const message = error.code === "23503"
      ? reagentChecklistTranslate("This item has check history. Mark it inactive instead of deleting it.")
      : error.message;
    showToast(`${reagentChecklistTranslate("Could not delete item")}: ${message}`);
    return;
  }
  showToast(reagentChecklistTranslate("List item deleted."));
  await loadReagentChecklists();
}

async function handleReagentWeeklyCheckSubmit(event) {
  event.preventDefault();
  const list = selectedReagentChecklist();
  const items = selectedReagentChecklistItems(false);
  if (!list || !items.length) return;
  const data = new FormData(event.currentTarget);
  const checkedOn = String(data.get("checked_on") || reagentChecklistToday());
  const submit = event.currentTarget.querySelector("button[type='submit']");
  submit.disabled = true;
  const { data: session, error: sessionError } = await db.from("reagent_check_sessions").upsert({
    checklist_id: list.id,
    checked_on: checkedOn,
    checked_by: currentUserId(),
    notes: valueOrNull(data.get("notes")),
    updated_at: new Date().toISOString(),
  }, { onConflict: "checklist_id,checked_on" }).select().single();
  if (sessionError) {
    submit.disabled = false;
    showToast(`${reagentChecklistTranslate("Could not save weekly check")}: ${sessionError.message}`);
    return;
  }
  const rows = [...reagentChecklistEls.checkRows.querySelectorAll("[data-check-item]")].map((row) => {
    const item = items.find((entry) => entry.id === row.dataset.checkItem);
    const rawQuantity = row.querySelector("[data-check-quantity]").value;
    const quantity = rawQuantity === "" ? null : Number(rawQuantity);
    const ordered = row.querySelector("[data-check-ordered]").checked;
    return {
      session_id: session.id,
      checklist_item_id: item.id,
      quantity_observed: quantity,
      status: reagentChecklistStatusFor(quantity, item.minimum_quantity),
      ordered,
      notes: valueOrNull(row.querySelector("[data-check-notes]").value),
      updated_at: new Date().toISOString(),
    };
  });
  const { error: entriesError } = await db.from("reagent_check_entries").upsert(rows, { onConflict: "session_id,checklist_item_id" });
  submit.disabled = false;
  if (entriesError) {
    showToast(`${reagentChecklistTranslate("The check header was saved, but its item counts failed")}: ${entriesError.message}`);
    return;
  }
  showToast(reagentChecklistTranslate("Weekly check saved. Inventory quantities were not changed."));
  await loadReagentChecklists();
}

reagentChecklistEls.select?.addEventListener("change", (event) => {
  reagentChecklistState.selectedListId = event.currentTarget.value || null;
  if (reagentChecklistState.selectedListId) window.localStorage.setItem(reagentChecklistStorageKey, reagentChecklistState.selectedListId);
  closeReagentChecklistForm();
  closeReagentChecklistItemForm();
  renderReagentChecklists();
});
reagentChecklistEls.newList?.addEventListener("click", () => openReagentChecklistForm());
reagentChecklistEls.editList?.addEventListener("click", () => openReagentChecklistForm(selectedReagentChecklist()));
reagentChecklistEls.deleteList?.addEventListener("click", deleteSelectedReagentChecklist);
reagentChecklistEls.listForm?.addEventListener("submit", handleReagentChecklistSubmit);
reagentChecklistEls.cancelList?.addEventListener("click", closeReagentChecklistForm);
reagentChecklistEls.newItem?.addEventListener("click", () => openReagentChecklistItemForm());
reagentChecklistEls.itemForm?.addEventListener("submit", handleReagentChecklistItemSubmit);
reagentChecklistEls.cancelItem?.addEventListener("click", closeReagentChecklistItemForm);
reagentChecklistEls.itemList?.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-checklist-item]");
  const remove = event.target.closest("[data-delete-checklist-item]");
  if (edit) openReagentChecklistItemForm(reagentChecklistState.items.find((item) => item.id === edit.dataset.editChecklistItem));
  if (remove) deleteReagentChecklistItem(remove.dataset.deleteChecklistItem);
});
reagentChecklistEls.checkDate?.addEventListener("change", renderReagentWeeklyCheckRows);
reagentChecklistEls.checkForm?.addEventListener("submit", handleReagentWeeklyCheckSubmit);
reagentChecklistEls.history?.addEventListener("click", (event) => {
  const open = event.target.closest("[data-open-check-session]");
  if (!open) return;
  reagentChecklistEls.checkDate.value = open.dataset.openCheckSession;
  renderReagentWeeklyCheckRows();
  reagentChecklistEls.checkForm.scrollIntoView({ behavior: "smooth", block: "start" });
});
window.addEventListener("app:languagechange", renderReagentChecklists);
document.addEventListener("reagents:loaded", loadReagentChecklists);

if (reagentChecklistEls.checkDate) reagentChecklistEls.checkDate.value = reagentChecklistToday();
loadReagentChecklists();
