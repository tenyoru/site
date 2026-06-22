import { $, $$ } from "./dom.js";

/**
 * Lightbox preview in a native <dialog>, with prev/next navigation across all
 * previewable images on the page (gallery links + article images). The single
 * <img> is reused, hidden until the new source loads to avoid flashing the
 * previous image.
 */
export const initPhotoPreview = (signal) => {
  const dialog = $("#photo-preview");
  if (!dialog) return;
  const img = $("img", dialog);
  const prevBtn = $("[data-preview-nav='prev']", dialog);
  const nextBtn = $("[data-preview-nav='next']", dialog);

  const items = [
    ...$$(".photo-grid__item a").map((el) => ({ el, src: el.href })),
    ...$$(".article-content img").map((el) => ({ el, src: el.dataset.full || el.src })),
  ];
  if (!items.length) return;

  const sources = items.map((it) => it.src);
  const multiple = sources.length > 1;
  let current = 0;

  const show = (index) => {
    current = (index + sources.length) % sources.length; // wrap around
    const src = sources[current];
    if (img.getAttribute("src") !== src) {
      img.removeAttribute("src");
      img.style.visibility = "hidden";
      img.onload = () => { img.style.visibility = "visible"; };
      img.src = src;
    }
  };

  const openAt = (index) => { show(index); dialog.showModal(); };
  const step = (delta) => show(current + delta);

  items.forEach((it, i) => {
    if (it.el.tagName === "A") {
      it.el.addEventListener("click", (e) => { e.preventDefault(); openAt(i); }, { signal });
    } else {
      it.el.style.cursor = "zoom-in";
      it.el.addEventListener("click", () => openAt(i), { signal });
    }
  });

  if (prevBtn) prevBtn.hidden = !multiple;
  if (nextBtn) nextBtn.hidden = !multiple;
  prevBtn?.addEventListener("click", () => step(-1), { signal });
  nextBtn?.addEventListener("click", () => step(1), { signal });

  document.addEventListener("keydown", (e) => {
    if (!dialog.open || !multiple) return;
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  }, { signal });

  // A click anywhere that isn't a nav button (backdrop or image) closes.
  dialog.addEventListener("click", (e) => {
    if (!e.target.closest("[data-preview-nav]")) dialog.close();
  }, { signal });
};
