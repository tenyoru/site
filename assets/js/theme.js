import { $$, storage } from "./dom.js";

const STORAGE_KEY = "preferred-theme";

const systemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
};

// auto first, then the theme the system is NOT showing — so the first click
// away from auto always visibly changes something.
const cycleOrder = () =>
  systemTheme() === "dark" ? ["system", "light", "dark"] : ["system", "dark", "light"];

const syncSwitcher = (preference) => {
  const label = preference === "system" ? "auto" : preference;
  $$("[data-theme-label]").forEach((el) => {
    el.textContent = label;
  });
};

/** Apply the stored (or system) theme and reflect it on the switcher. */
export const initTheme = () => {
  const stored = storage?.getItem(STORAGE_KEY) || "system";
  applyTheme(stored === "system" ? systemTheme() : stored);
  syncSwitcher(stored);
};

/**
 * Wire the theme switchers and react to OS theme changes. Bound once for the
 * session: a delegated document listener keeps every switcher working — the
 * mobile-menu copy lives in the header, which the router replaces on each swap.
 * Each click cycles auto (system) -> dark -> light.
 */
export const bindThemeControls = () => {
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".theme-switcher")) return;
    const order = cycleOrder();
    const current = storage?.getItem(STORAGE_KEY) || "system";
    const preference = order[(order.indexOf(current) + 1) % order.length];
    applyTheme(preference === "system" ? systemTheme() : preference);
    syncSwitcher(preference);
    storage?.setItem(STORAGE_KEY, preference);
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if ((storage?.getItem(STORAGE_KEY) || "system") === "system") applyTheme(systemTheme());
  });
};
