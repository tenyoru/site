import { $$ } from "./dom.js";

const isInteractive = (target) => target.closest("a, button, input, textarea, select");

/**
 * Make [data-card-link] elements clickable/keyboard-activatable as a whole,
 * while leaving inner interactive elements working. Internal links go through
 * the injected navigate(); external links open in a new tab.
 */
export const initCards = (signal, navigate) => {
  $$("[data-card-link]").forEach((card) => {
    const href = card.dataset.cardLink;
    if (!href) return;
    const external = card.dataset.cardExternal === "true";

    const go = () => {
      if (external) window.open(href, "_blank", "noopener,noreferrer");
      else navigate(href);
    };

    card.addEventListener("click", (e) => {
      if (!isInteractive(e.target)) go();
    }, { signal });

    card.addEventListener("keydown", (e) => {
      if (isInteractive(e.target)) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    }, { signal });
  });
};
