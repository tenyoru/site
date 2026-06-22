import { $, $$, prefersReducedMotion } from "./dom.js";

// ---------------------------------------------------------------------------
// Page cache. A prefetch (or click) stores the pending HTML so the network
// round-trip is done by render time. Bounded to CACHE_MAX, oldest evicted.
// ---------------------------------------------------------------------------
const CACHE_MAX = 32;
const cache = new Map();

const fetchPage = (url) => {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url, { headers: { "X-Router": "1" } })
      .then((res) => {
        if (!res.ok) throw new Error("bad status");
        return res.text();
      })
      .catch((err) => {
        cache.delete(url);
        throw err;
      });
    cache.set(url, pending);
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  }
  return pending;
};

// ---------------------------------------------------------------------------
// <head> sync. Only page-specific tags are swapped; the inlined <style>/<script>
// and charset/viewport are shared and left alone (re-running the script would
// re-bind everything). importNode (not cloneNode) re-homes the node into this
// document, avoiding Firefox's cross-document "Permission denied" error.
// ---------------------------------------------------------------------------
const HEAD_SELECTOR =
  'title, meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"]';

const syncHead = (doc) => {
  $$(HEAD_SELECTOR, document.head).forEach((el) => el.remove());
  $$(HEAD_SELECTOR, doc.head).forEach((el) =>
    document.head.appendChild(document.importNode(el, true))
  );
};

// ---------------------------------------------------------------------------
// Scrolling. Custom eased scroll (native smooth scroll offers no duration
// control). Per-path memory is restored only on Back/Forward; link clicks open
// at the top. currentPath also lets popstate tell a real navigation from an
// in-page hash change.
// ---------------------------------------------------------------------------
const smoothScrollTo = (to, duration = 350) => {
  const start = window.scrollY;
  const distance = to - start;
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min((now - t0) / duration, 1);
    window.scrollTo(0, start + distance * (1 - (1 - p) ** 3)); // easeOutCubic
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const scrollPositions = new Map();
let currentPath = location.pathname;

// ---------------------------------------------------------------------------
// Navigation. Fetch the target, swap <main> + the header (so server-rendered
// active-nav comes along and the mobile menu resets), sync the <head>, then
// re-wire the page. adoptNode re-homes parsed nodes into this document before
// insertion (Firefox cross-document guard). Wrapped in the View Transitions
// API where available.
// ---------------------------------------------------------------------------
let afterSwap = () => {};

export const navigate = async (url, push = true) => {
  scrollPositions.set(currentPath, window.scrollY); // remember the page we're leaving

  let html;
  try {
    html = await fetchPage(url);
  } catch (_) {
    location.href = url;
    return;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const nextMain = doc.querySelector("main");
  const curMain = $("main");
  if (!nextMain || !curMain) {
    location.href = url;
    return;
  }

  if (push) history.pushState(null, "", url);

  const render = () => {
    const nextHeader = doc.querySelector(".site-header-outer");
    const curHeader = $(".site-header-outer");
    if (nextHeader && curHeader) curHeader.replaceWith(document.adoptNode(nextHeader));
    curMain.replaceWith(document.adoptNode(nextMain));
    syncHead(doc);
    afterSwap();
    currentPath = location.pathname;
    // Link clicks open at the top; Back/Forward restore the saved position.
    // Re-apply next frame so late layout can't clamp a restore.
    const y = push ? 0 : scrollPositions.get(currentPath) ?? 0;
    window.scrollTo(0, y);
    if (y) requestAnimationFrame(() => window.scrollTo(0, y));
  };

  if (document.startViewTransition) document.startViewTransition(render);
  else render();
};

// ---------------------------------------------------------------------------
// Event wiring.
// ---------------------------------------------------------------------------
const isModifiedClick = (e) =>
  e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

// Same-origin, in-page, non-download link we're willing to handle.
const isNavigable = (a) =>
  a &&
  a.origin === location.origin &&
  !a.hasAttribute("download") &&
  (!a.target || a.target === "_self");

const eligibleForPrefetch = (a) =>
  isNavigable(a) &&
  a.pathname !== location.pathname &&
  a.getAttribute("href") &&
  !a.getAttribute("href").startsWith("#");

// Scroll to an in-page anchor without touching history or the URL. Returns
// whether a target was found (and thus the click should be intercepted).
const scrollToAnchor = (hash) => {
  const target = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!target) return false;
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const to = target.getBoundingClientRect().top + window.scrollY - margin;
  if (prefersReducedMotion()) window.scrollTo(0, to);
  else smoothScrollTo(to);
  target.focus({ preventScroll: true }); // move focus (skip link); no-op on non-focusable targets
  return true;
};

/** Bind the document/window-level listeners. Run once for the session. */
export const startRouter = (onAfterSwap) => {
  afterSwap = onAfterSwap;
  history.scrollRestoration = "manual";

  // Intent prefetch: warm the cache after the cursor/focus rests on a link for
  // ~150ms; cancel if it leaves first. Sweeping/tabbing through prefetches none.
  let intentTimer;
  const scheduleWarm = (e) => {
    const a = e.target.closest("a");
    if (!eligibleForPrefetch(a)) return;
    clearTimeout(intentTimer);
    intentTimer = setTimeout(() => fetchPage(a.href).catch(() => {}), 150);
  };
  const cancelWarm = () => clearTimeout(intentTimer);
  document.addEventListener("mouseover", scheduleWarm, { passive: true });
  document.addEventListener("focusin", scheduleWarm, { passive: true });
  document.addEventListener("mouseout", cancelWarm, { passive: true });
  document.addEventListener("focusout", cancelWarm, { passive: true });

  // Intercept same-origin link clicks for a body-only swap. In-page anchors
  // just scroll (no history/URL write).
  document.addEventListener("click", (e) => {
    if (isModifiedClick(e)) return;
    const a = e.target.closest("a");
    if (!isNavigable(a)) return;
    const href = a.getAttribute("href");
    if (!href) return;

    if (a.hash && a.pathname === location.pathname) {
      if (a.closest("[data-post-toc]")) return;
      if (scrollToAnchor(a.hash)) e.preventDefault();
      return;
    }
    if (href.startsWith("#")) return; // unresolved hash — leave it to the browser
    e.preventDefault();
    navigate(a.href);
  });

  window.addEventListener("popstate", () => {
    if (location.pathname === currentPath) return; // in-page hash change
    navigate(location.href, false);
  });
};
