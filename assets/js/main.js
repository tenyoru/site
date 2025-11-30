const TOC_STORAGE_KEY = "toc-state";
const THEME_STORAGE_KEY = "preferred-theme";

const safeStorage = (() => {
  try {
    const testKey = "__toc-test";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (_) {
    return null;
  }
})();

const applyTheme = (theme) => {
  const resolved = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = resolved;
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;
  toggle.setAttribute(
    "aria-label",
    resolved === "light" ? "Switch to dark theme" : "Switch to light theme"
  );
};

const initTheme = () => {
  const stored = safeStorage?.getItem(THEME_STORAGE_KEY);
  if (stored) {
    applyTheme(stored);
    return;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  const themeToggle = document.querySelector("[data-theme-toggle]");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
      const next = current === "light" ? "dark" : "light";
      applyTheme(next);
      safeStorage?.setItem(THEME_STORAGE_KEY, next);
    });
  }

  const toc = document.querySelector("[data-post-toc]");
  if (!toc) return;
  if (safeStorage) {
    const stored = safeStorage.getItem(TOC_STORAGE_KEY);
    if (stored !== null) {
      toc.open = stored === "true";
    }
  }

  toc.addEventListener("toggle", () => {
    if (!safeStorage) return;
    safeStorage.setItem(TOC_STORAGE_KEY, toc.open ? "true" : "false");
  });
});
