import { $$, storage } from "./dom.js";

const STORAGE_KEY = "preferred-theme";

const systemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
};

const syncSwitcher = (preference) => {
  $$(".theme-switcher__btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.themeValue === preference ? "true" : "false");
  });
};

/** Apply the stored (or system) theme and reflect it on the switcher. */
export const initTheme = () => {
  const stored = storage?.getItem(STORAGE_KEY) || "system";
  applyTheme(stored === "system" ? systemTheme() : stored);
  syncSwitcher(stored);
};

/**
 * Wire the theme switcher and react to OS theme changes. The switcher lives in
 * the persistent footer, so this is bound once for the session.
 */
export const bindThemeControls = () => {
  $$(".theme-switcher__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preference = btn.dataset.themeValue;
      applyTheme(preference === "system" ? systemTheme() : preference);
      syncSwitcher(preference);
      storage?.setItem(STORAGE_KEY, preference);
    });
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if ((storage?.getItem(STORAGE_KEY) || "system") === "system") applyTheme(systemTheme());
  });
};
