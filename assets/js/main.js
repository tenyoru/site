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

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const getCurrentTheme = () =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

// const setGiscusTheme = (theme) => {
//   const iframe = document.querySelector("iframe.giscus-frame");
//   const container = document.querySelector("[data-giscus]");
//   if (!iframe || !container) return;
//   const lightTheme = container.dataset.themeLight || "light";
//   const darkTheme = container.dataset.themeDark || "dark";
//   const desired = theme === "light" ? lightTheme : darkTheme;
//   iframe.contentWindow?.postMessage(
//     {
//       giscus: {
//         setConfig: {
//           theme: desired,
//         },
//       },
//     },
//     "https://giscus.app"
//   );
// };

// const loadGiscus = () => {
//   const container = document.querySelector("[data-giscus]");
//   if (!container || container.dataset.giscusLoaded) return;
//   const script = document.createElement("script");
//   script.src = "https://giscus.app/client.js";
//   script.async = true;
//   script.crossOrigin = "anonymous";
//   script.setAttribute("data-repo", container.dataset.repo);
//   script.setAttribute("data-repo-id", container.dataset.repoId);
//   script.setAttribute("data-category", container.dataset.category);
//   script.setAttribute("data-category-id", container.dataset.categoryId);
//   script.setAttribute("data-mapping", container.dataset.mapping || "pathname");
//   script.setAttribute("data-strict", container.dataset.strict || "0");
//   script.setAttribute(
//     "data-reactions-enabled",
//     container.dataset.reactionsEnabled || "1"
//   );
//   script.setAttribute("data-emit-metadata", container.dataset.emitMetadata || "0");
//   script.setAttribute(
//     "data-input-position",
//     container.dataset.inputPosition || "bottom"
//   );
//   script.setAttribute(
//     "data-theme",
//     getCurrentTheme() === "light"
//       ? container.dataset.themeLight || "light"
//       : container.dataset.themeDark || "dark"
//   );
//   script.setAttribute("data-lang", container.dataset.lang || "en");
//   script.dataset.giscusScript = "true";
//   container.appendChild(script);
//   container.dataset.giscusLoaded = "true";
// };

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  // setGiscusTheme(theme);
};

const updateThemeSwitcher = (preference) => {
  const buttons = document.querySelectorAll(".theme-switcher__btn");
  buttons.forEach((btn) => {
    const isActive = btn.dataset.themeValue === preference;
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
};

const initTheme = () => {
  const stored = safeStorage?.getItem(THEME_STORAGE_KEY) || "system";
  const resolved = stored === "system" ? getSystemTheme() : stored;
  applyTheme(resolved);
  updateThemeSwitcher(stored);
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  // loadGiscus();

  const themeButtons = document.querySelectorAll(".theme-switcher__btn");
  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const preference = btn.dataset.themeValue;
      const resolved = preference === "system" ? getSystemTheme() : preference;
      applyTheme(resolved);
      updateThemeSwitcher(preference);
      safeStorage?.setItem(THEME_STORAGE_KEY, preference);
    });
  });

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const stored = safeStorage?.getItem(THEME_STORAGE_KEY) || "system";
    if (stored === "system") {
      applyTheme(getSystemTheme());
    }
  });

  // const observer = new MutationObserver(() => {
  //   const iframe = document.querySelector("iframe.giscus-frame");
  //   if (!iframe) return;
  //   const currentTheme = getCurrentTheme();
  //   setGiscusTheme(currentTheme);
  //   observer.disconnect();
  // });
  // observer.observe(document.body, { childList: true, subtree: true });

  const cards = document.querySelectorAll("[data-card-link]");
  cards.forEach((card) => {
    const href = card.dataset.cardLink;
    if (!href) return;
    const isExternal = card.dataset.cardExternal === "true";
    const isInteractive = (target) =>
      target.closest("a, button, input, textarea, select");
    const navigate = () => {
      if (isExternal) {
        window.open(href, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = href;
      }
    };
    card.addEventListener("click", (event) => {
      if (isInteractive(event.target)) return;
      navigate();
    });
    card.addEventListener("keydown", (event) => {
      if (isInteractive(event.target)) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate();
      }
    });
  });

  const toc = document.querySelector("[data-post-toc]");
  if (toc) {
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
  }

  // Align ToC with content top on load.
  const articleMeta = document.querySelector(".article-meta");
  const setTocTop = () => {
    if (!toc || !articleMeta) return;
    const tocPosition = window.getComputedStyle(toc).position;
    if (tocPosition === "absolute") return;
    const metaRect = articleMeta.getBoundingClientRect();
    const minTopStr = window.getComputedStyle(toc).getPropertyValue("--toc-top-min");
    const minTop = parseFloat(minTopStr) || 80;
    
    if (metaRect.top <= minTop) {
      toc.style.setProperty("--toc-top", `${minTop}px`);
    } else {
      toc.style.setProperty("--toc-top", `${metaRect.top}px`);
    }
  };

  // Clamp fixed ToC above the footer on desktop.
  const footer = document.querySelector(".footer");
  const tocMedia = window.matchMedia("(min-width: 64rem)");
  if (toc && footer) {
    const readFixedTop = () => {
      const prevPosition = toc.style.position;
      const prevTop = toc.style.top;
      const prevLeft = toc.style.left;
      toc.style.position = "";
      toc.style.top = "";
      toc.style.left = "";
      const fixedTop = parseFloat(window.getComputedStyle(toc).top) || 0;
      toc.style.position = prevPosition;
      toc.style.top = prevTop;
      toc.style.left = prevLeft;
      return fixedTop;
    };

    const updateTocClamp = () => {
      if (!tocMedia.matches) {
        toc.style.position = "";
        toc.style.top = "";
        toc.style.left = "";
        return;
      }

      const footerTop = footer.getBoundingClientRect().top + window.scrollY;
      const tocHeight = toc.offsetHeight;
      const fixedTop = readFixedTop();
      const fixedBottom = window.scrollY + fixedTop + tocHeight;
      const gap = 24;
      const maxTop = footerTop - tocHeight - gap;

      if (fixedBottom >= footerTop - gap) {
        const left = toc.getBoundingClientRect().left + window.scrollX;
        toc.style.position = "absolute";
        toc.style.top = `${Math.max(maxTop, 0)}px`;
        toc.style.left = `${left}px`;
      } else {
        toc.style.position = "";
        toc.style.top = "";
        toc.style.left = "";
      }
    };

    updateTocClamp();
    window.addEventListener("scroll", updateTocClamp, { passive: true });
    window.addEventListener("resize", updateTocClamp);
    tocMedia.addEventListener("change", updateTocClamp);
  }

  if (toc && articleMeta) {
    setTocTop();
    window.addEventListener("scroll", setTocTop, { passive: true });
    window.addEventListener("resize", setTocTop);
  }
});
