(() => {
  const key = "thatcellapp-theme";
  const allowed = new Set(["auto", "light", "dark"]);
  let preference = "auto";
  try { preference = localStorage.getItem(key) || "auto"; } catch (_) {}
  if (!allowed.has(preference)) preference = "auto";
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  function apply() {
    const theme = preference === "auto" ? (system.matches ? "dark" : "light") : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#101b20" : "#f5f7f8");
  }
  apply();
  system.addEventListener("change", apply);
  document.addEventListener("DOMContentLoaded", () => {
    const select = document.querySelector("#themeSelect");
    if (!select) return;
    select.value = preference;
    select.addEventListener("change", () => {
      preference = allowed.has(select.value) ? select.value : "auto";
      try { localStorage.setItem(key, preference); } catch (_) {}
      apply();
    });
  });
})();
