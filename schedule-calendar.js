(function attachScheduleCalendar(root) {
  function normalizedDate(value) {
    const date = String(value || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
    const parsed = new Date(`${date}T12:00:00Z`);
    return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? "" : date;
  }

  function buildMonths(entries = []) {
    const entriesByDate = new Map();
    entries.forEach((entry) => {
      const date = normalizedDate(entry?.date);
      if (!date) return;
      if (!entriesByDate.has(date)) entriesByDate.set(date, []);
      entriesByDate.get(date).push(entry);
    });

    const sortedDates = [...entriesByDate.keys()].sort();
    if (!sortedDates.length) return [];
    const [startYear, startMonth] = sortedDates[0].slice(0, 7).split("-").map(Number);
    const [endYear, endMonth] = sortedDates.at(-1).slice(0, 7).split("-").map(Number);
    const monthKeys = [];
    const cursor = new Date(Date.UTC(startYear, startMonth - 1, 1));
    const end = new Date(Date.UTC(endYear, endMonth - 1, 1));
    while (cursor <= end) {
      monthKeys.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return monthKeys.map((key) => {
      const [year, month] = key.split("-").map(Number);
      const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
      const cells = Array.from({ length: cellCount }, (_, index) => {
        const day = index - firstWeekday + 1;
        if (day < 1 || day > daysInMonth) return null;
        const date = `${key}-${String(day).padStart(2, "0")}`;
        return { date, day, entries: entriesByDate.get(date) || [] };
      });
      return { key, year, month, weeks: cellCount / 7, cells };
    });
  }

  function nextAvailableColor(palette = [], usedColors = []) {
    const colors = palette.map((color) => String(color || "").toLowerCase()).filter((color) => /^#[0-9a-f]{6}$/.test(color));
    if (!colors.length) return "#176f64";
    const usage = new Map(colors.map((color) => [color, 0]));
    usedColors.map((color) => String(color || "").toLowerCase()).forEach((color) => {
      if (usage.has(color)) usage.set(color, usage.get(color) + 1);
    });
    return colors.reduce((best, color) => usage.get(color) < usage.get(best) ? color : best, colors[0]);
  }

  const api = Object.freeze({ buildMonths, nextAvailableColor });
  root.ScheduleCalendar = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
