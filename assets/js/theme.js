import { $$, storage } from "./dom.js";

const STORAGE_KEY = "preferred-theme";

const systemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
};

const syncSwitcher = (theme) => {
  $$("[data-theme-label]").forEach((el) => {
    el.textContent = theme;
  });
};

/** Apply the stored (or system) theme and reflect it on the switcher. */
export const initTheme = () => {
  const theme = storage?.getItem(STORAGE_KEY) || systemTheme();
  applyTheme(theme);
  syncSwitcher(theme);
};

/**
 * Wire the theme switchers. Bound once for the session: a delegated document
 * listener keeps every switcher working — the mobile-menu copy lives in the
 * header, which the router replaces on each swap. Each click toggles light/dark.
 */
export const bindThemeControls = () => {
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".theme-switcher")) return;
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    syncSwitcher(theme);
    storage?.setItem(STORAGE_KEY, theme);
  });
};
