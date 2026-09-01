import { $$ } from "./dom.js";

// Copy button that writes `getText()` to the clipboard, with "Copied"/"Failed" feedback.
const makeCopyBtn = (label, getText, signal) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "copy-btn";
  btn.textContent = "Copy";
  btn.setAttribute("aria-label", label);

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(getText());
      btn.textContent = "Copied";
    } catch (_) {
      btn.textContent = "Failed";
    }
    setTimeout(() => { btn.textContent = "Copy"; }, 1500);
  }, { signal });

  return btn;
};

/**
 * Copy button on every code block. Injected here (not in the render hook) so it
 * also appears on router-swapped pages; the guard skips blocks already wired.
 */
export const initCopy = (signal) => {
  $$(".highlight, pre:not(.chroma)").forEach((block) => {
    if (block.closest(".src-view__code")) return; // /src/ has its own text "copy"
    if (block.parentElement?.classList.contains("code-wrap")) return;
    const code = block.querySelector("code") || block;

    // Wrap in a non-scrolling parent so the button stays pinned while the
    // code scrolls horizontally.
    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    block.replaceWith(wrap);
    wrap.appendChild(block);

    wrap.appendChild(makeCopyBtn("Copy code to clipboard", () => code.innerText.replace(/\n+$/, ""), signal));
  });
};

const copyFeedURL = async (link) => {
  try {
    await navigator.clipboard.writeText(link.href);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Clicking any RSS feed link copies its URL instead of navigating. JS-only:
 * without it the link just opens the feed, which is still a fine fallback.
 */
export const initFeedCopy = (signal) => {
  // Small header links (home/blog/photos): popup above the link.
  $$(".section-header__rss").forEach((link) => {
    if (link.dataset.copyWired) return;
    link.dataset.copyWired = "true";

    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const ok = await copyFeedURL(link);
      const tip = document.createElement("span");
      tip.className = "copy-tooltip";
      tip.textContent = ok ? "Copied!" : "Copy failed";
      link.appendChild(tip);
      requestAnimationFrame(() => tip.classList.add("is-visible"));
      setTimeout(() => tip.remove(), 1200);
    }, { signal });
  });

  // /rss/ page rows: swap the value text in place, right where the click happened.
  $$(".rss-feed-list .contact-item__link").forEach((link) => {
    const value = link.querySelector(".contact-item__value");
    if (!value || link.dataset.copyWired) return;
    link.dataset.copyWired = "true";
    const original = value.textContent;

    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const ok = await copyFeedURL(link);
      value.textContent = ok ? "Copied!" : "Copy failed";
      setTimeout(() => { value.textContent = original; }, 1200);
    }, { signal });
  });
};
