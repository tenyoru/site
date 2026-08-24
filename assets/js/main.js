import { bindThemeControls, initTheme } from "./theme.js";
import { decodeCloudflareEmails } from "./email.js";
import { initPhotoPreview } from "./photo-preview.js";
import { initCards } from "./cards.js";
import { initToc } from "./toc.js";
import { initCopy, initFeedCopy } from "./copy.js";
import { initClouds } from "./clouds.js";
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
  initCopy(signal);
  initFeedCopy(signal);
  initClouds(signal);
};

// .menu-panel lives outside .site-header-outer (see menu-panel.html) and
// isn't touched by the router's swap, so a session-level delegated listener
// is enough - same reasoning as bindThemeControls().
const bindMenuClose = () => {
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-menu-close]")) return;
    const details = document.querySelector(".menu-mobile");
    if (details) details.open = false;
  });
};

document.addEventListener("DOMContentLoaded", () => {
  bindThemeControls();
  bindMenuClose();
  startRouter(initPage); // the router calls initPage() after every swap
  initPage();
});
