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

const getCurrentTheme = () =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

const setGiscusTheme = (theme) => {
  const iframe = document.querySelector("iframe.giscus-frame");
  const container = document.querySelector("[data-giscus]");
  if (!iframe || !container) return;
  const lightTheme = container.dataset.themeLight || "light";
  const darkTheme = container.dataset.themeDark || "dark";
  const desired = theme === "light" ? lightTheme : darkTheme;
  iframe.contentWindow?.postMessage(
    {
      giscus: {
        setConfig: {
          theme: desired,
        },
      },
    },
    "https://giscus.app"
  );
};

const loadGiscus = () => {
  const container = document.querySelector("[data-giscus]");
  if (!container || container.dataset.giscusLoaded) return;
  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", container.dataset.repo);
  script.setAttribute("data-repo-id", container.dataset.repoId);
  script.setAttribute("data-category", container.dataset.category);
  script.setAttribute("data-category-id", container.dataset.categoryId);
  script.setAttribute("data-mapping", container.dataset.mapping || "pathname");
  script.setAttribute("data-strict", container.dataset.strict || "0");
  script.setAttribute(
    "data-reactions-enabled",
    container.dataset.reactionsEnabled || "1"
  );
  script.setAttribute("data-emit-metadata", container.dataset.emitMetadata || "0");
  script.setAttribute(
    "data-input-position",
    container.dataset.inputPosition || "bottom"
  );
  script.setAttribute(
    "data-theme",
    getCurrentTheme() === "light"
      ? container.dataset.themeLight || "light"
      : container.dataset.themeDark || "dark"
  );
  script.setAttribute("data-lang", container.dataset.lang || "en");
  script.dataset.giscusScript = "true";
  container.appendChild(script);
  container.dataset.giscusLoaded = "true";
};

const applyTheme = (theme) => {
  const resolved = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = resolved;
  const toggles = document.querySelectorAll("[data-theme-toggle]");
  toggles.forEach((toggle) => {
    toggle.setAttribute(
      "aria-label",
      resolved === "light" ? "Switch to dark theme" : "Switch to light theme"
    );
  });
  setGiscusTheme(resolved);
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
  loadGiscus();
  const themeToggles = document.querySelectorAll("[data-theme-toggle]");
  themeToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const current = getCurrentTheme();
      const next = current === "light" ? "dark" : "light";
      applyTheme(next);
      safeStorage?.setItem(THEME_STORAGE_KEY, next);
    });
  });

  const observer = new MutationObserver(() => {
    const iframe = document.querySelector("iframe.giscus-frame");
    if (!iframe) return;
    const currentTheme = getCurrentTheme();
    setGiscusTheme(currentTheme);
    observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const cards = document.querySelectorAll("[data-card-link]");
  cards.forEach((card) => {
    const href = card.dataset.cardLink;
    if (!href) return;
    const isInteractive = (target) =>
      target.closest("a, button, input, textarea, select");
    card.addEventListener("click", (event) => {
      if (isInteractive(event.target)) return;
      window.location.href = href;
    });
    card.addEventListener("keydown", (event) => {
      if (isInteractive(event.target)) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = href;
      }
    });
  });

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
