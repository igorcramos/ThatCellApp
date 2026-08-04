const assert = require("node:assert/strict");
const { buildMonths, nextAvailableColor } = require("../schedule-calendar.js");

const months = buildMonths([
  { date: "2026-09-15", title: "September task" },
  { date: "2026-08-01", title: "First task" },
  { date: "2026-08-01", title: "Second task" },
  { date: "not-a-date", title: "Ignored" },
]);

assert.deepEqual(months.map((month) => month.key), ["2026-08", "2026-09"]);
assert.equal(months[0].weeks, 6);
assert.equal(months[0].cells.length, 42);
assert.equal(months[0].cells[6].date, "2026-08-01");
assert.equal(months[0].cells[6].entries.length, 2);
assert.equal(months[0].cells.at(-1), null);
assert.equal(months[1].weeks, 5);
assert.equal(months[1].cells.length, 35);
assert.equal(months[1].cells.find((cell) => cell?.date === "2026-09-15").entries[0].title, "September task");
assert.deepEqual(buildMonths([]), []);
assert.deepEqual(
  buildMonths([{ date: "2026-08-31" }, { date: "2026-10-01" }]).map((month) => month.key),
  ["2026-08", "2026-09", "2026-10"],
);
assert.deepEqual(buildMonths([{ date: "2026-02-31" }]), []);
assert.equal(nextAvailableColor(["#111111", "#222222", "#333333"], ["#111111", "#111111", "#222222"]), "#333333");
assert.equal(nextAvailableColor(["#111111", "#222222"], ["#111111", "#222222"]), "#111111");

console.log("schedule calendar: 14 assertions passed");
