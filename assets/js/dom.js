// Tiny shared helpers used across modules.

/** Query one element. */
export const $ = (selector, root = document) => root.querySelector(selector);

/** Query all elements as an array. */
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * localStorage that no-ops when unavailable (private mode, blocked storage).
 * Resolves once at load; callers use optional chaining: `storage?.getItem(...)`.
 */
export const storage = (() => {
  try {
    const key = "__storage-test";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return localStorage;
  } catch (_) {
    return null;
  }
})();

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
