import { bindThemeControls, initTheme } from "./theme.js";
import { decodeCloudflareEmails } from "./email.js";
import { initPhotoPreview } from "./photo-preview.js";
import { initCards } from "./cards.js";
import { initToc } from "./toc.js";
import { navigate, startRouter } from "./router.js";

// Per-page wiring, re-runnable after every body swap. A fresh AbortController
// each call tears down the previous page's listeners in one shot, so nothing
// stacks across navigations.
let pageController;

const initPage = () => {
  pageController?.abort();
  pageController = new AbortController();
  const { signal } = pageController;

  initTheme();
  decodeCloudflareEmails();
  initPhotoPreview(signal);
  initCards(signal, navigate);
  initToc(signal);
};

document.addEventListener("DOMContentLoaded", () => {
  bindThemeControls();
  startRouter(initPage); // the router calls initPage() after every swap
  initPage();
});
