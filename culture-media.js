const cultureMediaState = {
  recipes: [],
  components: [],
  selectedRecipeId: null,
  migrationAvailable: true,
  loading: null,
};

const cultureMediaEls = {
  recipeSelect: document.querySelector("#mediaRecipeSelect"),
  newRecipe: document.querySelector("#newMediaRecipe"),
  duplicateRecipe: document.querySelector("#duplicateMediaRecipe"),
  editRecipe: document.querySelector("#editMediaRecipe"),
  deleteRecipe: document.querySelector("#deleteMediaRecipe"),
  recipeForm: document.querySelector("#mediaRecipeForm"),
  cancelRecipe: document.querySelector("#cancelMediaRecipeEdit"),
  recipeSummary: document.querySelector("#mediaRecipeSummary"),
  newComponent: document.querySelector("#newMediaComponent"),
  componentList: document.querySelector("#mediaComponentList"),
  componentForm: document.querySelector("#mediaComponentForm"),
  saveComponent: document.querySelector("#saveMediaComponent"),
  cancelComponent: document.querySelector("#cancelMediaComponentEdit"),
  calculationMode: document.querySelector("#mediaCalculationMode"),
  rateLabel: document.querySelector("#mediaRateLabel"),
  rateHelp: document.querySelector("#mediaRateHelp"),
  targetVolume: document.querySelector("#mediaTargetVolume"),
  targetVolumeUnit: document.querySelector("#mediaTargetVolumeUnit"),
  resultBody: document.querySelector("#mediaResultBody"),
  liquidSummary: document.querySelector("#mediaLiquidSummary"),
  status: document.querySelector("#mediaStatus"),
};

const cultureMediaStorageKey = "thatcellapp-culture-media-recipe";

const cultureMediaVolumeUnits = Object.freeze({
  L: 1,
  mL: 1e-3,
  "µL": 1e-6,
  uL: 1e-6,
});

const cultureMediaMassUnits = Object.freeze({
  kg: 1e3,
  g: 1,
  mg: 1e-3,
  "µg": 1e-6,
  ug: 1e-6,
  ng: 1e-9,
});

const cultureMediaConcentrationUnits = Object.freeze({
  X: { family: "fold", factor: 1 },
  M: { family: "molar", factor: 1 },
  mM: { family: "molar", factor: 1e-3 },
  "µM": { family: "molar", factor: 1e-6 },
  uM: { family: "molar", factor: 1e-6 },
  nM: { family: "molar", factor: 1e-9 },
  "g/L": { family: "mass", factor: 1 },
  "mg/mL": { family: "mass", factor: 1 },
  "mg/L": { family: "mass", factor: 1e-3 },
  "µg/mL": { family: "mass", factor: 1e-3 },
  "ug/mL": { family: "mass", factor: 1e-3 },
  "µg/L": { family: "mass", factor: 1e-6 },
  "ug/L": { family: "mass", factor: 1e-6 },
  "ng/mL": { family: "mass", factor: 1e-6 },
  "ng/µL": { family: "mass", factor: 1e-3 },
  "ng/uL": { family: "mass", factor: 1e-3 },
  "U/mL": { family: "activity-u", factor: 1e3 },
  "U/L": { family: "activity-u", factor: 1 },
  "IU/mL": { family: "activity-iu", factor: 1e3 },
  "IU/L": { family: "activity-iu", factor: 1 },
  "% v/v": { family: "percent-vv", factor: 1 },
  "% w/v": { family: "percent-wv", factor: 1 },
});

const cultureMediaModeLabels = Object.freeze({
  dilution: "Dilution (C1V1 = C2V2)",
  percent_vv: "Percent volume/volume (% v/v)",
  percent_wv: "Percent mass/volume (% w/v)",
  mass_per_volume: "Mass per volume",
  volume_per_volume: "Volume per volume / ratio",
  fixed_per_volume: "Fixed amount per reference volume",
});

function cultureMediaTranslate(text) {
  return window.translateAppText ? window.translateAppText(text) : text;
}

function cultureMediaNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cultureMediaFormatNumber(value) {
  if (!Number.isFinite(value)) return "—";
  const absolute = Math.abs(value);
  const maximumFractionDigits = absolute !== 0 && (absolute < 0.01 || absolute >= 10000) ? 6 : 4;
  return new Intl.NumberFormat(window.getAppLocale?.() || "en-US", { maximumFractionDigits }).format(value);
}

function cultureMediaFormatInUnit(canonicalValue, unit, unitMap) {
  const factor = unitMap[unit];
  return factor ? `${cultureMediaFormatNumber(canonicalValue / factor)} ${unit}` : "—";
}

function cultureMediaReadableVolume(liters) {
  if (!Number.isFinite(liters)) return "—";
  const absolute = Math.abs(liters);
  if (absolute >= 1 - 1e-12) return cultureMediaFormatInUnit(liters, "L", cultureMediaVolumeUnits);
  if (absolute >= 1e-3 - 1e-15) return cultureMediaFormatInUnit(liters, "mL", cultureMediaVolumeUnits);
  return cultureMediaFormatInUnit(liters, "µL", cultureMediaVolumeUnits);
}

function cultureMediaReadableMass(grams) {
  if (!Number.isFinite(grams)) return "—";
  const absolute = Math.abs(grams);
  if (absolute >= 1 - 1e-12) return cultureMediaFormatInUnit(grams, "g", cultureMediaMassUnits);
  if (absolute >= 1e-3 - 1e-15) return cultureMediaFormatInUnit(grams, "mg", cultureMediaMassUnits);
  if (absolute >= 1e-6 - 1e-18) return cultureMediaFormatInUnit(grams, "µg", cultureMediaMassUnits);
  return cultureMediaFormatInUnit(grams, "ng", cultureMediaMassUnits);
}

function cultureMediaError(message) {
  return { error: message, result: null, liquidLiters: 0, formula: "" };
}

function calculateCultureMediaComponent(component, targetVolume, targetVolumeUnit) {
  const finalVolumeFactor = cultureMediaVolumeUnits[targetVolumeUnit];
  if (!(targetVolume > 0) || !finalVolumeFactor) {
    return cultureMediaError("Enter a final volume greater than zero and select a valid volume unit.");
  }
  const finalLiters = targetVolume * finalVolumeFactor;
  const mode = component.calculation_mode;

  if (mode === "dilution") {
    const stockValue = cultureMediaNumber(component.stock_value);
    const targetValue = cultureMediaNumber(component.target_value);
    const stockDefinition = cultureMediaConcentrationUnits[component.stock_unit];
    const targetDefinition = cultureMediaConcentrationUnits[component.target_unit];
    if (!(targetValue >= 0) || !targetDefinition) {
      return cultureMediaError("Provide a valid final concentration.");
    }
    if (!(stockValue > 0)) {
      return cultureMediaError("Stock concentration pending; add it before calculating the preparation volume.");
    }
    if (!stockDefinition) {
      return cultureMediaError("Provide valid stock and final concentrations.");
    }
    if (stockDefinition.family !== targetDefinition.family) {
      return cultureMediaError("Stock and final concentrations use incompatible dimensions.");
    }
    const stockCanonical = stockValue * stockDefinition.factor;
    const targetCanonical = targetValue * targetDefinition.factor;
    if (targetCanonical > stockCanonical) {
      return cultureMediaError("The final concentration is greater than the stock concentration; dilution cannot produce it.");
    }
    const requiredLiters = finalLiters * targetCanonical / stockCanonical;
    return {
      error: null,
      result: cultureMediaReadableVolume(requiredLiters),
      liquidLiters: requiredLiters,
      formula: `C1V1 = C2V2 · ${stockValue} ${component.stock_unit} → ${targetValue} ${component.target_unit}`,
    };
  }

  if (mode === "percent_vv") {
    const percent = cultureMediaNumber(component.target_value);
    if (!(percent >= 0 && percent <= 100)) {
      return cultureMediaError("Percent v/v must be between 0 and 100.");
    }
    const requiredLiters = finalLiters * percent / 100;
    return {
      error: null,
      result: cultureMediaReadableVolume(requiredLiters),
      liquidLiters: requiredLiters,
      formula: `${percent}% v/v × ${targetVolume} ${targetVolumeUnit}`,
    };
  }

  if (mode === "percent_wv") {
    const percent = cultureMediaNumber(component.target_value);
    if (!(percent >= 0)) return cultureMediaError("Percent w/v must be zero or greater.");
    const grams = percent * (finalLiters * 1000) / 100;
    return {
      error: null,
      result: cultureMediaReadableMass(grams),
      liquidLiters: 0,
      formula: `${percent}% w/v = ${percent} g / 100 mL`,
    };
  }

  const rateValue = cultureMediaNumber(component.rate_value);
  const referenceValue = cultureMediaNumber(component.reference_value);
  const referenceFactor = cultureMediaVolumeUnits[component.reference_unit];
  if (!(rateValue >= 0) || !(referenceValue > 0) || !referenceFactor) {
    return cultureMediaError("Provide a valid amount and a reference volume greater than zero.");
  }
  const scale = finalLiters / (referenceValue * referenceFactor);

  if (mode === "mass_per_volume") {
    const massFactor = cultureMediaMassUnits[component.rate_unit];
    if (!massFactor) return cultureMediaError("Mass per volume requires kg, g, mg, µg, or ng.");
    const resultValue = rateValue * scale;
    return {
      error: null,
      result: `${cultureMediaFormatNumber(resultValue)} ${component.rate_unit}`,
      liquidLiters: 0,
      formula: `${rateValue} ${component.rate_unit} / ${referenceValue} ${component.reference_unit}`,
    };
  }

  if (mode === "volume_per_volume") {
    const amountFactor = cultureMediaVolumeUnits[component.rate_unit];
    if (!amountFactor) return cultureMediaError("Volume per volume requires L, mL, or µL for the added volume.");
    const requiredLiters = rateValue * amountFactor * scale;
    return {
      error: null,
      result: cultureMediaReadableVolume(requiredLiters),
      liquidLiters: requiredLiters,
      formula: `${rateValue} ${component.rate_unit} / ${referenceValue} ${component.reference_unit}`,
    };
  }

  if (mode === "fixed_per_volume") {
    const amountUnit = String(component.rate_unit || "").trim();
    if (!amountUnit) return cultureMediaError("Enter the unit for the fixed amount.");
    const resultValue = rateValue * scale;
    const volumeFactor = cultureMediaVolumeUnits[amountUnit];
    return {
      error: null,
      result: `${cultureMediaFormatNumber(resultValue)} ${amountUnit}`,
      liquidLiters: volumeFactor ? resultValue * volumeFactor : 0,
      formula: `${rateValue} ${amountUnit} / ${referenceValue} ${component.reference_unit}`,
    };
  }

  return cultureMediaError("Select a supported calculation mode.");
}

function selectedCultureMediaRecipe() {
  return cultureMediaState.recipes.find((recipe) => recipe.id === cultureMediaState.selectedRecipeId) || null;
}

function selectedCultureMediaComponents(includeInactive = true) {
  return cultureMediaState.components
    .filter((component) => component.recipe_id === cultureMediaState.selectedRecipeId && (includeInactive || component.is_active))
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name));
}

function cultureMediaModeLabel(mode) {
  return cultureMediaTranslate(cultureMediaModeLabels[mode] || mode);
}

function describeCultureMediaComponent(component) {
  if (component.calculation_mode === "dilution") {
    return `${component.stock_value ?? "—"} ${component.stock_unit || ""} → ${component.target_value ?? "—"} ${component.target_unit || ""}`.trim();
  }
  if (component.calculation_mode === "percent_vv") return `${component.target_value ?? "—"}% v/v`;
  if (component.calculation_mode === "percent_wv") return `${component.target_value ?? "—"}% w/v`;
  return `${component.rate_value ?? "—"} ${component.rate_unit || ""} / ${component.reference_value ?? "—"} ${component.reference_unit || ""}`.trim();
}

function setCultureMediaStatus(message = "", isError = false) {
  if (!cultureMediaEls.status) return;
  cultureMediaEls.status.textContent = cultureMediaTranslate(message);
  cultureMediaEls.status.classList.toggle("is-error", isError);
}

function renderCultureMediaRecipeSummary() {
  const recipe = selectedCultureMediaRecipe();
  if (!recipe) {
    cultureMediaEls.recipeSummary.innerHTML = `<div class="empty-state">${escapeHtml(cultureMediaTranslate("Create a recipe to start calculating culture media."))}</div>`;
    return;
  }
  const activeComponents = selectedCultureMediaComponents(false).length;
  cultureMediaEls.recipeSummary.innerHTML = `
    <div class="media-summary-card"><span>${escapeHtml(cultureMediaTranslate("Version"))}</span><strong>${escapeHtml(recipe.version)}</strong></div>
    <div class="media-summary-card"><span>${escapeHtml(cultureMediaTranslate("Base / solvent"))}</span><strong>${escapeHtml(recipe.solvent_name)}</strong></div>
    <div class="media-summary-card"><span>${escapeHtml(cultureMediaTranslate("Active components"))}</span><strong>${activeComponents}</strong></div>
    ${recipe.description ? `<div class="media-summary-card" style="grid-column: 1 / -1"><span>${escapeHtml(cultureMediaTranslate("Description"))}</span><strong>${escapeHtml(recipe.description)}</strong></div>` : ""}`;
}

function renderCultureMediaComponentList() {
  const components = selectedCultureMediaComponents(true);
  cultureMediaEls.componentList.innerHTML = components.length ? components.map((component) => `
    <article class="media-component-card ${component.is_active ? "" : "is-inactive"}">
      <div>
        <strong>${escapeHtml(component.name)} ${component.is_active ? "" : `<span class="badge">${escapeHtml(cultureMediaTranslate("Inactive"))}</span>`}</strong>
        <p>${escapeHtml(cultureMediaModeLabel(component.calculation_mode))}<br>${escapeHtml(describeCultureMediaComponent(component))}</p>
        ${component.notes ? `<p>${escapeHtml(component.notes)}</p>` : ""}
      </div>
      <div class="media-component-actions">
        <button class="icon-button edit-button" type="button" data-edit-media-component="${escapeHtml(component.id)}" title="${escapeHtml(cultureMediaTranslate("Edit component"))}" aria-label="${escapeHtml(cultureMediaTranslate("Edit component"))}">&#9998;</button>
        <button class="icon-button delete-button" type="button" data-delete-media-component="${escapeHtml(component.id)}" title="${escapeHtml(cultureMediaTranslate("Delete component"))}" aria-label="${escapeHtml(cultureMediaTranslate("Delete component"))}">&#128465;</button>
      </div>
    </article>`).join("") : `<div class="empty-state">${escapeHtml(cultureMediaTranslate("No components in this recipe."))}</div>`;
}

function renderCultureMediaCalculation() {
  const recipe = selectedCultureMediaRecipe();
  const targetVolume = cultureMediaNumber(cultureMediaEls.targetVolume?.value);
  const targetUnit = cultureMediaEls.targetVolumeUnit?.value;
  const components = selectedCultureMediaComponents(false);
  if (!recipe || !components.length) {
    cultureMediaEls.resultBody.innerHTML = `<tr><td colspan="4" class="empty-state">${escapeHtml(cultureMediaTranslate(recipe ? "Add an active component to calculate this recipe." : "Select a recipe to calculate."))}</td></tr>`;
    cultureMediaEls.liquidSummary.innerHTML = "";
    return;
  }
  const calculations = components.map((component) => ({
    component,
    calculation: calculateCultureMediaComponent(component, targetVolume, targetUnit),
  }));
  cultureMediaEls.resultBody.innerHTML = calculations.map(({ component, calculation }) => `
    <tr>
      <td><strong>${escapeHtml(component.name)}</strong>${component.notes ? `<div class="media-result-formula">${escapeHtml(component.notes)}</div>` : ""}</td>
      <td>${escapeHtml(cultureMediaModeLabel(component.calculation_mode))}</td>
      <td>${calculation.error ? `<span class="media-result-error">${escapeHtml(cultureMediaTranslate(calculation.error))}</span>` : `<strong>${escapeHtml(calculation.result)}</strong>`}</td>
      <td><span class="media-result-formula">${escapeHtml(calculation.formula || "—")}</span></td>
    </tr>`).join("");

  const unitFactor = cultureMediaVolumeUnits[targetUnit];
  const finalLiters = targetVolume && unitFactor ? targetVolume * unitFactor : 0;
  const liquidLiters = calculations.reduce((sum, entry) => sum + (entry.calculation.error ? 0 : entry.calculation.liquidLiters), 0);
  const solventLiters = finalLiters - liquidLiters;
  const invalidCount = calculations.filter((entry) => entry.calculation.error).length;
  const overfilled = finalLiters > 0 && solventLiters < -Math.max(finalLiters * 1e-9, 1e-12);
  cultureMediaEls.liquidSummary.innerHTML = `
    <div class="media-summary-card"><span>${escapeHtml(cultureMediaTranslate("Final volume"))}</span><strong>${escapeHtml(finalLiters ? cultureMediaFormatInUnit(finalLiters, targetUnit, cultureMediaVolumeUnits) : "—")}</strong></div>
    <div class="media-summary-card"><span>${escapeHtml(cultureMediaTranslate("Liquid additions"))}</span><strong>${escapeHtml(cultureMediaFormatInUnit(liquidLiters, targetUnit, cultureMediaVolumeUnits))}</strong></div>
    <div class="media-summary-card ${overfilled ? "is-warning" : ""}"><span>${escapeHtml(cultureMediaTranslate(overfilled ? "Volume exceeded" : "Base / solvent remaining"))}</span><strong>${escapeHtml(finalLiters ? cultureMediaFormatInUnit(solventLiters, targetUnit, cultureMediaVolumeUnits) : "—")}</strong></div>`;
  setCultureMediaStatus(invalidCount
    ? `${invalidCount} component(s) need correction before this preparation is ready.`
    : overfilled
      ? "Liquid additions exceed the requested final volume. Review the recipe before preparing it."
      : "Calculation ready. Values are estimates from the saved recipe; verify the protocol before preparation.", invalidCount > 0 || overfilled);
}

function renderCultureMedia() {
  if (!cultureMediaEls.recipeSelect) return;
  const recipe = selectedCultureMediaRecipe();
  cultureMediaEls.recipeSelect.innerHTML = cultureMediaState.recipes.length
    ? cultureMediaState.recipes.map((entry) => `<option value="${escapeHtml(entry.id)}">${escapeHtml(`${entry.name} · v${entry.version}`)}</option>`).join("")
    : `<option value="">${escapeHtml(cultureMediaTranslate("No culture media recipes"))}</option>`;
  cultureMediaEls.recipeSelect.value = recipe?.id || "";
  [cultureMediaEls.editRecipe, cultureMediaEls.duplicateRecipe, cultureMediaEls.deleteRecipe, cultureMediaEls.newComponent].forEach((button) => {
    if (button) button.disabled = !recipe || !cultureMediaState.migrationAvailable;
  });
  if (cultureMediaEls.newRecipe) cultureMediaEls.newRecipe.disabled = !cultureMediaState.migrationAvailable;
  renderCultureMediaRecipeSummary();
  renderCultureMediaComponentList();
  renderCultureMediaCalculation();
}

async function loadCultureMedia() {
  if (!db || !cultureMediaEls.recipeSelect || (state.authAvailable && !state.session)) return;
  if (cultureMediaState.loading) return cultureMediaState.loading;
  cultureMediaState.loading = (async () => {
    setCultureMediaStatus("Loading culture media recipes…");
    const [recipesResult, componentsResult] = await Promise.all([
      db.from("culture_media_recipes").select("*").order("name"),
      db.from("culture_media_components").select("*").order("sort_order").order("name"),
    ]);
    const error = recipesResult.error || componentsResult.error;
    if (error) {
      cultureMediaState.migrationAvailable = !isMissingTableError(error);
      cultureMediaState.recipes = [];
      cultureMediaState.components = [];
      setCultureMediaStatus(cultureMediaState.migrationAvailable
        ? `Could not load culture media recipes: ${error.message}`
        : "Culture Media is not installed. Run the culture media migration in Supabase.", true);
      renderCultureMedia();
      return;
    }
    cultureMediaState.migrationAvailable = true;
    cultureMediaState.recipes = recipesResult.data || [];
    cultureMediaState.components = componentsResult.data || [];
    const savedId = window.localStorage.getItem(cultureMediaStorageKey);
    if (!cultureMediaState.recipes.some((recipe) => recipe.id === cultureMediaState.selectedRecipeId)) {
      cultureMediaState.selectedRecipeId = cultureMediaState.recipes.find((recipe) => recipe.id === savedId)?.id
        || cultureMediaState.recipes[0]?.id
        || null;
    }
    setCultureMediaStatus("");
    renderCultureMedia();
  })().finally(() => {
    cultureMediaState.loading = null;
  });
  return cultureMediaState.loading;
}

function openCultureMediaRecipeForm(recipe = null) {
  const form = cultureMediaEls.recipeForm;
  form.reset();
  form.elements.id.value = recipe?.id || "";
  form.elements.name.value = recipe?.name || "";
  form.elements.version.value = recipe?.version || "1.0";
  form.elements.solvent_name.value = recipe?.solvent_name || "Base medium / solvent";
  form.elements.description.value = recipe?.description || "";
  form.elements.notes.value = recipe?.notes || "";
  form.elements.is_active.checked = recipe?.is_active ?? true;
  form.querySelector("button[type='submit']").textContent = cultureMediaTranslate(recipe ? "Update recipe" : "Save & add components");
  form.classList.remove("is-hidden");
  form.querySelector("input[name='name']").focus();
}

function closeCultureMediaRecipeForm() {
  cultureMediaEls.recipeForm.classList.add("is-hidden");
  cultureMediaEls.recipeForm.reset();
}

async function handleCultureMediaRecipeSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const id = valueOrNull(data.get("id"));
  const payload = {
    name: String(data.get("name") || "").trim(),
    version: String(data.get("version") || "1.0").trim(),
    solvent_name: String(data.get("solvent_name") || "").trim(),
    description: valueOrNull(data.get("description")),
    notes: valueOrNull(data.get("notes")),
    is_active: data.get("is_active") === "on",
  };
  if (!payload.name || !payload.version || !payload.solvent_name) {
    showToast(cultureMediaTranslate("Name, version, and base / solvent are required."));
    return;
  }
  if (!id) payload.created_by = currentUserId();
  const submit = event.currentTarget.querySelector("button[type='submit']");
  submit.disabled = true;
  const query = id
    ? db.from("culture_media_recipes").update(payload).eq("id", id).select().single()
    : db.from("culture_media_recipes").insert(payload).select().single();
  const { data: saved, error } = await query;
  submit.disabled = false;
  if (error) {
    showToast(`${cultureMediaTranslate("Could not save recipe")}: ${error.message}`);
    return;
  }
  const created = !id;
  cultureMediaState.selectedRecipeId = saved.id;
  window.localStorage.setItem(cultureMediaStorageKey, saved.id);
  closeCultureMediaRecipeForm();
  showToast(cultureMediaTranslate(id ? "Recipe updated." : "Recipe created."));
  await loadCultureMedia();
  if (created) openCultureMediaComponentForm();
}

async function duplicateSelectedCultureMediaRecipe() {
  const recipe = selectedCultureMediaRecipe();
  if (!recipe) return;
  const sourceComponents = selectedCultureMediaComponents(true);
  cultureMediaEls.duplicateRecipe.disabled = true;
  const recipePayload = {
    name: `${recipe.name} copy`,
    version: recipe.version,
    solvent_name: recipe.solvent_name,
    description: recipe.description,
    notes: recipe.notes,
    is_active: true,
    created_by: currentUserId(),
  };
  const { data: copy, error: recipeError } = await db.from("culture_media_recipes").insert(recipePayload).select().single();
  if (recipeError) {
    cultureMediaEls.duplicateRecipe.disabled = false;
    showToast(`${cultureMediaTranslate("Could not duplicate recipe")}: ${recipeError.message}`);
    return;
  }
  if (sourceComponents.length) {
    const componentPayloads = sourceComponents.map((component) => ({
      recipe_id: copy.id,
      name: component.name,
      calculation_mode: component.calculation_mode,
      stock_value: component.stock_value,
      stock_unit: component.stock_unit,
      target_value: component.target_value,
      target_unit: component.target_unit,
      rate_value: component.rate_value,
      rate_unit: component.rate_unit,
      reference_value: component.reference_value,
      reference_unit: component.reference_unit,
      sort_order: component.sort_order,
      is_active: component.is_active,
      notes: component.notes,
    }));
    const { error: componentError } = await db.from("culture_media_components").insert(componentPayloads);
    if (componentError) showToast(`${cultureMediaTranslate("Recipe copied, but components could not be copied")}: ${componentError.message}`);
  }
  cultureMediaState.selectedRecipeId = copy.id;
  window.localStorage.setItem(cultureMediaStorageKey, copy.id);
  cultureMediaEls.duplicateRecipe.disabled = false;
  await loadCultureMedia();
  openCultureMediaRecipeForm(selectedCultureMediaRecipe());
  showToast(cultureMediaTranslate("Recipe duplicated. Rename or adjust the copy."));
}

async function deleteSelectedCultureMediaRecipe() {
  const recipe = selectedCultureMediaRecipe();
  if (!recipe) return;
  const componentCount = selectedCultureMediaComponents(true).length;
  const message = `${cultureMediaTranslate("Delete recipe")} “${recipe.name}” (${componentCount} ${cultureMediaTranslate("components")})?\n\n${cultureMediaTranslate("This action also deletes its saved components and cannot be undone.")}`;
  if (!window.confirm(message)) return;
  const { error } = await db.from("culture_media_recipes").delete().eq("id", recipe.id);
  if (error) {
    showToast(`${cultureMediaTranslate("Could not delete recipe")}: ${error.message}`);
    return;
  }
  cultureMediaState.selectedRecipeId = null;
  window.localStorage.removeItem(cultureMediaStorageKey);
  closeCultureMediaRecipeForm();
  closeCultureMediaComponentForm();
  showToast(cultureMediaTranslate("Recipe deleted."));
  await loadCultureMedia();
}

function syncCultureMediaCalculationFields() {
  const mode = cultureMediaEls.calculationMode.value;
  document.querySelectorAll("[data-media-fields]").forEach((section) => {
    section.classList.toggle("is-hidden", !section.dataset.mediaFields.split(" ").includes(mode));
  });
  if (mode === "mass_per_volume") {
    cultureMediaEls.rateLabel.textContent = cultureMediaTranslate("Mass amount");
    cultureMediaEls.rateHelp.textContent = cultureMediaTranslate("Use kg, g, mg, µg, or ng.");
  } else if (mode === "volume_per_volume") {
    cultureMediaEls.rateLabel.textContent = cultureMediaTranslate("Added volume");
    cultureMediaEls.rateHelp.textContent = cultureMediaTranslate("Use L, mL, or µL. This amount counts toward the final liquid volume.");
  } else {
    cultureMediaEls.rateLabel.textContent = cultureMediaTranslate("Fixed amount");
    cultureMediaEls.rateHelp.textContent = cultureMediaTranslate("Any explicit unit is accepted. L, mL, and µL count toward the final liquid volume.");
  }
}

function openCultureMediaComponentForm(component = null) {
  const form = cultureMediaEls.componentForm;
  form.reset();
  form.elements.id.value = component?.id || "";
  form.elements.name.value = component?.name || "";
  form.elements.calculation_mode.value = component?.calculation_mode || "dilution";
  form.elements.stock_value.value = component?.stock_value ?? "";
  form.elements.stock_unit.value = component?.stock_unit || "X";
  form.elements.target_value.value = component?.calculation_mode === "dilution" ? component?.target_value ?? "" : "";
  form.elements.percentage_value.value = ["percent_vv", "percent_wv"].includes(component?.calculation_mode) ? component?.target_value ?? "" : "";
  form.elements.target_unit.value = component?.target_unit || "X";
  form.elements.rate_value.value = component?.rate_value ?? "";
  form.elements.rate_unit.value = component?.rate_unit || "";
  form.elements.reference_value.value = component?.reference_value ?? 100;
  form.elements.reference_unit.value = component?.reference_unit || "mL";
  form.elements.sort_order.value = component?.sort_order ?? selectedCultureMediaComponents(true).length + 1;
  form.elements.notes.value = component?.notes || "";
  form.elements.is_active.checked = component?.is_active ?? true;
  const componentCount = selectedCultureMediaComponents(true).length;
  const primarySubmit = cultureMediaEls.saveComponent;
  const finishSubmit = form.querySelector("[data-component-next='finish']");
  document.querySelector("#mediaComponentFormTitle").textContent = cultureMediaTranslate(component ? "Edit recipe component" : "Add recipe component");
  document.querySelector("#mediaComponentProgress").textContent = cultureMediaTranslate(component
    ? `Editing component ${Math.max(1, selectedCultureMediaComponents(true).findIndex((entry) => entry.id === component.id) + 1)} of ${componentCount}.`
    : componentCount ? `${componentCount} component${componentCount === 1 ? "" : "s"} saved. Add the next one.` : "Enter the first component of this recipe.");
  primarySubmit.textContent = cultureMediaTranslate(component ? "Update component" : "Save & add another");
  primarySubmit.dataset.componentNext = component ? "finish" : "another";
  finishSubmit.classList.toggle("is-hidden", Boolean(component));
  syncCultureMediaCalculationFields();
  form.classList.remove("is-hidden");
  form.querySelector("input[name='name']").focus();
}

function closeCultureMediaComponentForm() {
  cultureMediaEls.componentForm.classList.add("is-hidden");
  cultureMediaEls.componentForm.reset();
  cultureMediaEls.saveComponent.dataset.componentNext = "another";
  cultureMediaEls.saveComponent.textContent = cultureMediaTranslate("Save & add another");
  cultureMediaEls.componentForm.querySelector("[data-component-next='finish']")?.classList.remove("is-hidden");
}

function cultureMediaComponentPayload(data) {
  const mode = String(data.get("calculation_mode") || "");
  const payload = {
    recipe_id: cultureMediaState.selectedRecipeId,
    name: String(data.get("name") || "").trim(),
    calculation_mode: mode,
    stock_value: null,
    stock_unit: null,
    target_value: null,
    target_unit: null,
    rate_value: null,
    rate_unit: null,
    reference_value: null,
    reference_unit: null,
    sort_order: Number(data.get("sort_order") || 0),
    is_active: data.get("is_active") === "on",
    notes: valueOrNull(data.get("notes")),
  };
  if (mode === "dilution") {
    payload.stock_value = cultureMediaNumber(data.get("stock_value"));
    payload.stock_unit = valueOrNull(data.get("stock_unit"));
    payload.target_value = cultureMediaNumber(data.get("target_value"));
    payload.target_unit = valueOrNull(data.get("target_unit"));
  } else if (mode === "percent_vv" || mode === "percent_wv") {
    payload.target_value = cultureMediaNumber(data.get("percentage_value"));
    payload.target_unit = mode === "percent_vv" ? "% v/v" : "% w/v";
  } else {
    payload.rate_value = cultureMediaNumber(data.get("rate_value"));
    payload.rate_unit = valueOrNull(data.get("rate_unit"));
    payload.reference_value = cultureMediaNumber(data.get("reference_value"));
    payload.reference_unit = valueOrNull(data.get("reference_unit"));
  }
  return payload;
}

function validateCultureMediaComponent(payload) {
  if (!payload.name) return "Component name is required.";
  if (payload.calculation_mode === "dilution" && payload.stock_value === null) {
    const targetDefinition = cultureMediaConcentrationUnits[payload.target_unit];
    return payload.target_value !== null && payload.target_value >= 0 && targetDefinition
      ? null
      : "Provide a valid final concentration.";
  }
  const preview = calculateCultureMediaComponent(payload, 100, "mL");
  return preview.error;
}

async function handleCultureMediaComponentSubmit(event) {
  event.preventDefault();
  if (!selectedCultureMediaRecipe()) return;
  const data = new FormData(event.currentTarget);
  const id = valueOrNull(data.get("id"));
  const nextAction = event.submitter?.dataset.componentNext || "finish";
  const payload = cultureMediaComponentPayload(data);
  const validationError = validateCultureMediaComponent(payload);
  if (validationError) {
    showToast(cultureMediaTranslate(validationError));
    return;
  }
  const submit = event.currentTarget.querySelector("button[type='submit']");
  submit.disabled = true;
  const { error } = id
    ? await db.from("culture_media_components").update(payload).eq("id", id)
    : await db.from("culture_media_components").insert(payload);
  submit.disabled = false;
  if (error) {
    showToast(`${cultureMediaTranslate("Could not save component")}: ${error.message}`);
    return;
  }
  showToast(cultureMediaTranslate(id ? "Component updated." : "Component added."));
  await loadCultureMedia();
  if (!id && nextAction === "another") openCultureMediaComponentForm();
  else closeCultureMediaComponentForm();
}

async function deleteCultureMediaComponent(componentId) {
  const component = cultureMediaState.components.find((entry) => entry.id === componentId);
  if (!component) return;
  if (!window.confirm(`${cultureMediaTranslate("Delete component")} “${component.name}”?`)) return;
  const { error } = await db.from("culture_media_components").delete().eq("id", component.id);
  if (error) {
    showToast(`${cultureMediaTranslate("Could not delete component")}: ${error.message}`);
    return;
  }
  closeCultureMediaComponentForm();
  showToast(cultureMediaTranslate("Component deleted."));
  await loadCultureMedia();
}

cultureMediaEls.recipeSelect?.addEventListener("change", (event) => {
  cultureMediaState.selectedRecipeId = event.currentTarget.value || null;
  if (cultureMediaState.selectedRecipeId) window.localStorage.setItem(cultureMediaStorageKey, cultureMediaState.selectedRecipeId);
  closeCultureMediaRecipeForm();
  closeCultureMediaComponentForm();
  renderCultureMedia();
});
cultureMediaEls.newRecipe?.addEventListener("click", () => openCultureMediaRecipeForm());
cultureMediaEls.duplicateRecipe?.addEventListener("click", duplicateSelectedCultureMediaRecipe);
cultureMediaEls.editRecipe?.addEventListener("click", () => openCultureMediaRecipeForm(selectedCultureMediaRecipe()));
cultureMediaEls.deleteRecipe?.addEventListener("click", deleteSelectedCultureMediaRecipe);
cultureMediaEls.recipeForm?.addEventListener("submit", handleCultureMediaRecipeSubmit);
cultureMediaEls.cancelRecipe?.addEventListener("click", closeCultureMediaRecipeForm);
cultureMediaEls.newComponent?.addEventListener("click", () => openCultureMediaComponentForm());
cultureMediaEls.componentForm?.addEventListener("submit", handleCultureMediaComponentSubmit);
cultureMediaEls.cancelComponent?.addEventListener("click", closeCultureMediaComponentForm);
cultureMediaEls.calculationMode?.addEventListener("change", syncCultureMediaCalculationFields);
cultureMediaEls.componentList?.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-media-component]");
  const remove = event.target.closest("[data-delete-media-component]");
  if (edit) openCultureMediaComponentForm(cultureMediaState.components.find((component) => component.id === edit.dataset.editMediaComponent));
  if (remove) deleteCultureMediaComponent(remove.dataset.deleteMediaComponent);
});
cultureMediaEls.targetVolume?.addEventListener("input", renderCultureMediaCalculation);
cultureMediaEls.targetVolumeUnit?.addEventListener("change", renderCultureMediaCalculation);
window.addEventListener("app:languagechange", renderCultureMedia);
document.addEventListener("reagents:loaded", loadCultureMedia);

window.CultureMediaCalculator = Object.freeze({
  calculateComponent: calculateCultureMediaComponent,
  concentrationUnits: cultureMediaConcentrationUnits,
  volumeUnits: cultureMediaVolumeUnits,
  massUnits: cultureMediaMassUnits,
});

renderCultureMedia();
loadCultureMedia();
window.setTimeout(loadCultureMedia, 1200);
