import { $, $$, storage } from "./dom.js";

const STORAGE_KEY = "toc-state";

/**
 * Table of contents: persist collapse state, keep the sticky panel aligned with
 * the article and clamped above the footer, and highlight the active section.
 */
export const initToc = (signal) => {
  const toc = $("[data-post-toc]");
  if (!toc) return;

  // Restore collapse state without animating the initial open/close.
  if (storage) {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored !== null) {
      toc.classList.add("no-transition");
      toc.open = stored === "true";
      requestAnimationFrame(() => toc.classList.remove("no-transition"));
    }
    toc.addEventListener("toggle", () => {
      storage.setItem(STORAGE_KEY, toc.open ? "true" : "false");
    }, { signal });
  }

  const articleMeta = $(".article-meta");
  const footer = $(".footer");
  const desktop = window.matchMedia("(min-width: 64rem)");

  // Align the ToC top with the article meta, down to a minimum offset.
  const setTocTop = () => {
    if (!articleMeta || getComputedStyle(toc).position === "absolute") return;
    const metaTop = articleMeta.getBoundingClientRect().top;
    const minTop = parseFloat(getComputedStyle(toc).getPropertyValue("--toc-top-min")) || 80;
    toc.style.setProperty("--toc-top", `${metaTop <= minTop ? minTop : metaTop}px`);
  };

  const clearClamp = () => {
    toc.style.position = toc.style.top = toc.style.left = "";
  };

  // Read the ToC's natural fixed `top` by momentarily clearing inline overrides.
  const readFixedTop = () => {
    const { position, top, left } = toc.style;
    clearClamp();
    const fixedTop = parseFloat(getComputedStyle(toc).top) || 0;
    Object.assign(toc.style, { position, top, left });
    return fixedTop;
  };

  // On desktop, switch the fixed ToC to absolute before it overlaps the footer.
  const updateClamp = () => {
    if (!desktop.matches) return clearClamp();
    const footerTop = footer.getBoundingClientRect().top + window.scrollY;
    const tocHeight = toc.offsetHeight;
    const gap = 24;
    if (window.scrollY + readFixedTop() + tocHeight >= footerTop - gap) {
      toc.style.position = "absolute";
      toc.style.top = `${Math.max(footerTop - tocHeight - gap, 0)}px`;
      toc.style.left = `${toc.getBoundingClientRect().left + window.scrollX}px`;
    } else {
      clearClamp();
    }
  };

  if (footer) {
    updateClamp();
    window.addEventListener("scroll", updateClamp, { passive: true, signal });
    window.addEventListener("resize", updateClamp, { signal });
    desktop.addEventListener("change", updateClamp, { signal });
  }

  if (articleMeta) {
    setTocTop();
    window.addEventListener("scroll", setTocTop, { passive: true, signal });
    window.addEventListener("resize", setTocTop, { signal });
    $(".article-cover__img")?.addEventListener("load", setTocTop, { signal });
  }
  toc.style.visibility = "visible";

  // Scroll-spy: highlight the ToC link for the section currently in view.
  const headings = $$(".article-content h2[id], .article-content h3[id], .article-content h4[id]");
  const links = $$("a[href^='#']", toc);
  if (!headings.length || !links.length) return;

  let activeId = null;
  const setActive = (id) => {
    if (id === activeId) return;
    activeId = id;
    links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
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

  // Near the bottom, force-select the last heading (which may never fully
  // satisfy the observer's rootMargin).
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
      setActive(headings[headings.length - 1].id);
    }
  }, { passive: true, signal });
};
