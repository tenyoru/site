import { $$ } from "./dom.js";

/**
 * Copy button on every code block. Injected here (not in the render hook) so it
 * also appears on router-swapped pages; the guard skips blocks already wired.
 */
export const initCopy = (signal) => {
  $$(".highlight, pre:not(.chroma)").forEach((block) => {
    if (block.parentElement?.classList.contains("code-wrap")) return;
    const code = block.querySelector("code") || block;

    // Wrap in a non-scrolling parent so the button stays pinned while the
    // code scrolls horizontally.
    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    block.replaceWith(wrap);
    wrap.appendChild(block);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText.replace(/\n+$/, ""));
        btn.textContent = "Copied";
      } catch (_) {
        btn.textContent = "Failed";
      }
      setTimeout(() => { btn.textContent = "Copy"; }, 1500);
    }, { signal });

    wrap.appendChild(btn);
  });
};
