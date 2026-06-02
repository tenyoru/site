import { $, $$ } from "./dom.js";

/**
 * Lightbox preview using a native <dialog>. The single <img> is reused, so it's
 * hidden until the new source loads to avoid flashing the previous image.
 */
export const initPhotoPreview = (signal) => {
  const dialog = $("#photo-preview");
  if (!dialog) return;
  const img = $("img", dialog);

  const open = (src) => {
    if (img.src !== src) {
      img.removeAttribute("src");
      img.style.visibility = "hidden";
      img.onload = () => { img.style.visibility = "visible"; };
      img.src = src;
    }
    dialog.showModal();
  };

  $$(".photo-grid__item a").forEach((a) => {
    a.addEventListener("click", (e) => { e.preventDefault(); open(a.href); }, { signal });
  });

  $$(".article-content img").forEach((image) => {
    image.style.cursor = "zoom-in";
    image.addEventListener("click", () => open(image.dataset.full || image.src), { signal });
  });

  dialog.addEventListener("click", () => dialog.close(), { signal });
};
