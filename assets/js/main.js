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

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
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

// Per-page wiring. Runs on first load and after every body swap. Each call
// aborts the previous AbortController, removing all listeners from the prior
// page in one shot so nothing stacks on window/document across navigations.
let pageController;

const initPage = () => {
  pageController?.abort();
  pageController = new AbortController();
  const { signal } = pageController;

  initTheme();

  // Highlight the current page in the nav. The header isn't swapped on
  // navigation, so the server-rendered .active would otherwise stay stuck on
  // whichever page first loaded — recompute it from the current path here.
  const path = location.pathname;
  document.querySelectorAll(".menu-desktop a, .menu-list a").forEach((a) => {
    const p = new URL(a.href).pathname;
    const active = p === "/" ? path === "/" : path.startsWith(p);
    a.classList.toggle("active", active);
  });

  const previewDialog = document.getElementById("photo-preview");
  if (previewDialog) {
    const previewImg = previewDialog.querySelector("img");
    const openPreview = (src) => {
      if (previewImg.src === src) {
        previewDialog.showModal();
        return;
      }
      previewImg.removeAttribute("src");
      previewImg.style.visibility = "hidden";
      previewImg.onload = () => { previewImg.style.visibility = "visible"; };
      previewImg.src = src;
      previewDialog.showModal();
    };

    document.querySelectorAll(".photo-grid__item a").forEach((a) => {
      a.addEventListener("click", (e) => { e.preventDefault(); openPreview(a.href); }, { signal });
    });

    document.querySelectorAll(".article-content img").forEach((img) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => openPreview(img.dataset.full || img.src), { signal });
    });

    previewDialog.addEventListener("click", () => previewDialog.close(), { signal });
  }

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
        visit(href);
      }
    };
    card.addEventListener("click", (event) => {
      if (isInteractive(event.target)) return;
      navigate();
    }, { signal });
    card.addEventListener("keydown", (event) => {
      if (isInteractive(event.target)) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate();
      }
    }, { signal });
  });

  const toc = document.querySelector("[data-post-toc]");
  if (toc) {
    if (safeStorage) {
      const stored = safeStorage.getItem(TOC_STORAGE_KEY);
      if (stored !== null) {
        toc.classList.add("no-transition");
        toc.open = stored === "true";
        requestAnimationFrame(() => toc.classList.remove("no-transition"));
      }
    }

    toc.addEventListener("toggle", () => {
      if (!safeStorage) return;
      safeStorage.setItem(TOC_STORAGE_KEY, toc.open ? "true" : "false");
    }, { signal });
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
    window.addEventListener("scroll", updateTocClamp, { passive: true, signal });
    window.addEventListener("resize", updateTocClamp, { signal });
    tocMedia.addEventListener("change", updateTocClamp, { signal });
  }

  if (toc) {
    if (articleMeta) {
      setTocTop();
      window.addEventListener("scroll", setTocTop, { passive: true, signal });
      window.addEventListener("resize", setTocTop, { signal });
      const coverImg = document.querySelector(".article-cover__img");
      if (coverImg) coverImg.addEventListener("load", setTocTop, { signal });
    }
    toc.style.visibility = "visible";
  }

  // Scroll spy: highlight active TOC link
  if (toc) {
    const headings = document.querySelectorAll(".article-content h2[id], .article-content h3[id], .article-content h4[id]");
    const tocLinks = toc.querySelectorAll("a[href^='#']");
    if (headings.length && tocLinks.length) {
      let activeId = null;
      const setActive = (id) => {
        if (id === activeId) return;
        activeId = id;
        tocLinks.forEach((a) => {
          a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`);
        });
      };
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActive(entry.target.id);
              return;
            }
          }
        },
        { rootMargin: "0px 0px -80% 0px", threshold: 0 }
      );
      headings.forEach((h) => observer.observe(h));
      signal.addEventListener("abort", () => observer.disconnect());
      window.addEventListener("scroll", () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
          setActive(headings[headings.length - 1].id);
        }
      }, { passive: true, signal });
    }
  }
};

// In-memory page cache. Hovering a link kicks off the fetch and stores the
// (pending) HTML, so by click time the network round-trip is already done —
// the click path only parses and swaps.
const PAGE_CACHE = new Map();

const fetchPage = (url) => {
  let pending = PAGE_CACHE.get(url);
  if (!pending) {
    pending = fetch(url, { headers: { "X-Router": "1" } })
      .then((res) => {
        if (!res.ok) throw new Error("bad status");
        return res.text();
      })
      .catch((err) => {
        PAGE_CACHE.delete(url);
        throw err;
      });
    PAGE_CACHE.set(url, pending);
  }
  return pending;
};

// Body-only navigation: fetch the target page and swap just <main>, so the
// inlined CSS/JS, header, and footer are never reloaded. Wrapped in the
// same-document View Transitions API for a smooth fade where supported
// (Chrome/Safari); other browsers (Firefox) swap instantly.
const visit = async (url, push = true) => {
  let html;
  try {
    html = await fetchPage(url);
  } catch (_) {
    window.location.href = url;
    return;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const next = doc.querySelector("main");
  const current = document.querySelector("main");
  if (!next || !current) {
    window.location.href = url;
    return;
  }

  if (push) history.pushState(null, "", url);

  const render = () => {
    // Close the mobile menu (it lives in the persistent header, so the body
    // swap wouldn't reset it on its own).
    document.querySelector(".menu-mobile[open]")?.removeAttribute("open");
    current.replaceWith(next);
    document.title = doc.title;
    initPage();
    window.scrollTo(0, 0);
  };

  if (document.startViewTransition) {
    document.startViewTransition(render);
  } else {
    render();
  }
};

// One-time, document/window-level wiring that survives body swaps.
const initShell = () => {
  history.scrollRestoration = "manual";

  // Theme switcher lives in the persistent header — bind once.
  document.querySelectorAll(".theme-switcher__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preference = btn.dataset.themeValue;
      const resolved = preference === "system" ? getSystemTheme() : preference;
      applyTheme(resolved);
      updateThemeSwitcher(preference);
      safeStorage?.setItem(THEME_STORAGE_KEY, preference);
    });
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const stored = safeStorage?.getItem(THEME_STORAGE_KEY) || "system";
    if (stored === "system") {
      applyTheme(getSystemTheme());
    }
  });

  // Warm the page cache as early as possible: on hover (desktop) and on
  // pointerdown (touch, and ~80ms before the click fires). The fetch result
  // is reused by visit(), so the click itself does no network work.
  const warm = (e) => {
    const a = e.target.closest("a");
    if (!a || a.origin !== location.origin || a.pathname === location.pathname) return;
    if (a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    fetchPage(a.href).catch(() => {});
  };
  document.addEventListener("mouseover", warm, { passive: true });
  document.addEventListener("pointerdown", warm, { passive: true });

  // Intercept same-origin link clicks → body-only swap.
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a");
    if (!a || a.origin !== location.origin) return;
    if (a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    if (a.pathname === location.pathname && a.hash) return; // same-page anchor
    e.preventDefault();
    visit(a.href);
  });

  window.addEventListener("popstate", () => visit(location.href, false));
};

document.addEventListener("DOMContentLoaded", () => {
  initShell();
  initPage();
});
