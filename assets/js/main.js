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

// Decode a Cloudflare-obfuscated email (XOR each byte with the leading key
// byte). Cloudflare's own decoder runs only on the initial full page load, so
// after a body swap we decode the freshly injected emails ourselves.
const cfDecodeEmail = (hex) => {
  let out = "";
  const key = parseInt(hex.substr(0, 2), 16);
  for (let i = 2; i < hex.length; i += 2) {
    out += String.fromCharCode(parseInt(hex.substr(i, 2), 16) ^ key);
  }
  return out;
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

  // (Active-nav highlight needs no JS: the header is swapped on navigation, so
  // the server-rendered .active class always matches the current page.)

  // Decode Cloudflare-obfuscated emails injected into this page.
  document.querySelectorAll("[data-cfemail]").forEach((el) => {
    const email = cfDecodeEmail(el.dataset.cfemail);
    el.textContent = email;
    el.classList.remove("__cf_email__");
    const link = el.closest('a[href*="email-protection"]') || (el.tagName === "A" ? el : null);
    if (link) link.href = "mailto:" + email;
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

// In-memory page cache. A prefetch (or click) kicks off the fetch and stores
// the (pending) HTML, so by click time the network round-trip is already done.
// Bounded to CACHE_MAX entries — oldest evicted first — so a long session
// can't grow it without limit.
const PAGE_CACHE = new Map();
const CACHE_MAX = 32;

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
    if (PAGE_CACHE.size > CACHE_MAX) PAGE_CACHE.delete(PAGE_CACHE.keys().next().value);
  }
  return pending;
};

// Page-specific <head> tags to sync on navigation. The inlined <style>/<script>
// and charset/viewport are shared across pages, so they're deliberately left
// untouched (re-running the inlined script would re-bind everything).
const HEAD_SELECTOR =
  'title, meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"]';
const updateHead = (doc) => {
  document.head.querySelectorAll(HEAD_SELECTOR).forEach((el) => el.remove());
  // importNode brings the node into THIS document; cloning then appending a
  // node still owned by the parsed document yields cross-document references
  // that Firefox rejects with "Permission denied to access object".
  doc.head.querySelectorAll(HEAD_SELECTOR).forEach((el) => document.head.appendChild(document.importNode(el, true)));
};

// Client-side navigation: fetch the target page and swap <main> plus the
// header — the header carries the server-rendered active-nav state, so no JS
// is needed to recompute it (and a fresh header means the mobile menu is
// closed). Page-specific <head> tags are synced; the inlined CSS/JS and footer
// never reload. Wrapped in the same-document View Transitions API for a smooth
// fade where supported (Chrome/Safari); other browsers swap instantly.
//
// Fast eased scroll to an absolute Y (native smooth scroll gives no control
// over duration, which felt sluggish). ~200ms, easeOutCubic.
const smoothScrollTo = (to, duration = 350) => {
  const start = window.scrollY;
  const dist = to - start;
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min((now - t0) / duration, 1);
    window.scrollTo(0, start + dist * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

// Scroll memory for Back/Forward only: each page's scroll is saved when you
// leave it and restored when you return via the Back/Forward button; a normal
// link click opens at the top. currentPath also lets popstate tell a real
// navigation from an in-page hash change (a TOC link), which must NOT trigger
// a re-render.
const scrollPositions = new Map();
let currentPath = location.pathname;

const visit = async (url, push = true) => {
  scrollPositions.set(currentPath, window.scrollY); // remember the page we're leaving
  let html;
  try {
    html = await fetchPage(url);
  } catch (_) {
    window.location.href = url;
    return;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const nextMain = doc.querySelector("main");
  const curMain = document.querySelector("main");
  if (!nextMain || !curMain) {
    window.location.href = url;
    return;
  }

  if (push) history.pushState(null, "", url);

  const render = () => {
    // adoptNode re-homes the parsed nodes (and their descendants) into THIS
    // document before insertion, so later access — TOC links, scroll-spy
    // headings — doesn't hit a cross-document "Permission denied" in Firefox.
    const nextHeader = doc.querySelector(".site-header-outer");
    const curHeader = document.querySelector(".site-header-outer");
    if (nextHeader && curHeader) curHeader.replaceWith(document.adoptNode(nextHeader));
    curMain.replaceWith(document.adoptNode(nextMain));
    updateHead(doc);
    initPage();
    currentPath = location.pathname;
    // Link clicks (push) open at the top; Back/Forward restore the saved
    // position. Re-apply next frame so late layout can't clamp a restore.
    const y = push ? 0 : scrollPositions.get(currentPath) ?? 0;
    window.scrollTo(0, y);
    if (y) requestAnimationFrame(() => window.scrollTo(0, y));
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

  // Theme switcher lives in the persistent footer — bind once.
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

  // Intent prefetch: fetch a page only after the cursor rests on its link, or
  // it holds keyboard focus, for ~175ms (signalling intent), cancelling if the
  // cursor/focus leaves sooner. Sweeping across — or tabbing through — a list
  // prefetches nothing; dwelling on a link makes that click instant. Touch
  // devices have no hover, so they load on click.
  let intentTimer;
  const eligible = (a) =>
    a &&
    a.origin === location.origin &&
    a.pathname !== location.pathname &&
    !a.hasAttribute("download") &&
    (!a.target || a.target === "_self") &&
    a.getAttribute("href") &&
    !a.getAttribute("href").startsWith("#");
  const scheduleWarm = (e) => {
    const a = e.target.closest("a");
    if (!eligible(a)) return;
    clearTimeout(intentTimer);
    intentTimer = setTimeout(() => fetchPage(a.href).catch(() => {}), 175);
  };
  const cancelWarm = () => clearTimeout(intentTimer);
  document.addEventListener("mouseover", scheduleWarm, { passive: true });
  document.addEventListener("focusin", scheduleWarm, { passive: true });
  document.addEventListener("mouseout", cancelWarm, { passive: true });
  document.addEventListener("focusout", cancelWarm, { passive: true });

  // Intercept same-origin link clicks → body-only swap. Pages not prefetched
  // are fetched here (via visit → fetchPage) when actually opened.
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a");
    if (!a || a.origin !== location.origin) return;
    if (a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
    const href = a.getAttribute("href");
    if (!href) return;

    // In-page anchor (TOC links, etc.): just scroll to the target. We don't
    // touch history or the URL, so it never pushes entries (no stepping
    // through anchors on Back) and the address bar stays clean.
    if (a.hash && a.pathname === location.pathname) {
      const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (target) {
        e.preventDefault();
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const to = target.getBoundingClientRect().top + window.scrollY - margin;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) window.scrollTo(0, to);
        else smoothScrollTo(to);
      }
      return;
    }

    if (href.startsWith("#")) return; // hash with no matching element — leave it
    e.preventDefault();
    visit(a.href);
  });

  window.addEventListener("popstate", () => {
    // In-page hash navigation (same path) fires popstate in some browsers —
    // let the browser scroll to the fragment instead of re-rendering.
    if (location.pathname === currentPath) return;
    visit(location.href, false);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initShell();
  initPage();
});
