import { $, $$ } from "./dom.js";

export const initPhotoPreview = (signal) => {
  const dialog = $("#photo-preview");
  if (!dialog) return;
  const img = $("img", dialog);
  const hint = $(".photo-preview__hint", dialog);

  const items = [
    ...$$(".photo-grid__item a").map((el) => ({ el, src: el.href })),
    ...$$(".article-content img").map((el) => ({ el, src: el.dataset.full || el.src })),
  ];
  if (!items.length) return;

  const sources = items.map((it) => it.src);
  const multiple = sources.length > 1;
  let current = 0;

  if (hint) hint.hidden = !multiple;

  const show = (index) => {
    current = (index + sources.length) % sources.length;
    const src = sources[current];
    if (img.getAttribute("src") !== src) {
      img.removeAttribute("src");
      img.style.visibility = "hidden";
      img.onload = () => { img.style.visibility = "visible"; };
      img.src = src;
    }
  };

  const openAt = (index) => {
    show(index);
    dialog.showModal();
    history.pushState(null, "", "#preview-open");
  };
  const step = (delta) => { if (multiple) show(current + delta); };

  items.forEach((it, i) => {
    if (it.el.tagName === "A") {
      it.el.addEventListener("click", (e) => { e.preventDefault(); openAt(i); }, { signal });
    } else {
      it.el.style.cursor = "zoom-in";
      it.el.addEventListener("click", () => openAt(i), { signal });
    }
  });

  $("[data-preview-close]", dialog)?.addEventListener("click", () => dialog.close(), { signal });

  // When dialog closes by any means other than Back, pop the history state we pushed.
  dialog.addEventListener("close", () => {
    if (location.hash === "#preview-open") history.back();
  }, { signal });

  // Back button / mobile swipe-back: close the dialog instead of navigating away.
  window.addEventListener("popstate", () => {
    if (dialog.open) dialog.close();
  }, { signal });

  document.addEventListener("keydown", (e) => {
    if (!dialog.open) return;
    if (e.key === "Enter") { dialog.close(); return; }
    if (!multiple) return;
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  }, { signal });

  // Click image: navigate left/right half; close if single.
  img.addEventListener("click", (e) => {
    if (!multiple) { dialog.close(); return; }
    step(e.offsetX < img.offsetWidth / 2 ? -1 : 1);
  }, { signal });

  // Backdrop click closes.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  }, { signal });

  // Scroll wheel navigation (throttled to one step per 300ms).
  let wheelLocked = false;
  dialog.addEventListener("wheel", (e) => {
    if (!multiple || wheelLocked) return;
    wheelLocked = true;
    step(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => { wheelLocked = false; }, 300);
  }, { passive: true, signal });

  // Swipe navigation.
  let touchX = 0;
  dialog.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true, signal });
  dialog.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }, { signal });
};
