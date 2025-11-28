const storageKey = "toc-state";

const safeStorage = (() => {
  try {
    const testKey = "__toc-test";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (_) {
    return null;
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const toc = document.querySelector("[data-post-toc]");
  if (!toc) return;

  if (safeStorage) {
    const stored = safeStorage.getItem(storageKey);
    if (stored !== null) {
      toc.open = stored === "true";
    }
  }

  toc.addEventListener("toggle", () => {
    if (!safeStorage) return;
    safeStorage.setItem(storageKey, toc.open ? "true" : "false");
  });
});
