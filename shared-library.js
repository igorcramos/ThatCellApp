(function sharedLibraryModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SharedLibrary = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildSharedLibrary() {
  function normalize(value) {
    return String(value || "").trim().toLocaleLowerCase();
  }

  function includesQuery(record, fields, query) {
    const normalizedQuery = normalize(query);
    return !normalizedQuery || fields.some((field) => normalize(record?.[field]).includes(normalizedQuery));
  }

  function filterCellLines(records, query) {
    const fields = ["identifier", "full_name", "clone", "name", "species", "cell_type", "source"];
    return (records || []).filter((record) => includesQuery(record, fields, query));
  }

  function filterProtocols(records, query) {
    const fields = ["name", "project", "target_cell_type", "version", "notes"];
    return (records || []).filter((record) => includesQuery(record, fields, query));
  }

  function isShared(record) {
    return record?.is_shared === true;
  }

  function isInSameVisibilityScope(record, candidate) {
    if (isShared(candidate)) return isShared(record);
    if (isShared(record)) return false;
    const ownerId = candidate?.created_by;
    return !ownerId || record?.created_by === ownerId;
  }

  function findDuplicateCellLine(records, candidate, excludedId = null) {
    return (records || []).find((record) => record.id !== excludedId
      && isInSameVisibilityScope(record, candidate)
      && normalize(record.identifier || record.name) === normalize(candidate?.identifier)
      && normalize(record.clone) === normalize(candidate?.clone));
  }

  function findDuplicateProtocol(records, candidate, excludedId = null) {
    return (records || []).find((record) => record.id !== excludedId
      && isInSameVisibilityScope(record, candidate)
      && normalize(record.name) === normalize(candidate?.name)
      && normalize(record.version) === normalize(candidate?.version));
  }

  function nextAdaptationName(sourceName, records) {
    const baseName = `${String(sourceName || "Protocol").trim()} (adaptation)`;
    const existingNames = new Set((records || []).map((record) => normalize(record.name)));
    if (!existingNames.has(normalize(baseName))) return baseName;
    let copyNumber = 2;
    while (existingNames.has(normalize(`${baseName} ${copyNumber}`))) copyNumber += 1;
    return `${baseName} ${copyNumber}`;
  }

  return {
    filterCellLines,
    filterProtocols,
    findDuplicateCellLine,
    findDuplicateProtocol,
    isShared,
    nextAdaptationName,
    normalize,
  };
});
