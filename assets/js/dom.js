// Tiny shared helpers used across modules.

/** Query one element. */
export const $ = (selector, root = document) => root.querySelector(selector);

/** Query all elements as an array. */
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * Storage that no-ops when unavailable (private mode, blocked storage).
 * Resolves once at load; callers use optional chaining: `storage?.getItem(...)`.
 */
const safeStorage = (backing) => {
  try {
    const key = "__storage-test";
    backing.setItem(key, "1");
    backing.removeItem(key);
    return backing;
  } catch (_) {
    return null;
  }
};
export const storage = safeStorage(localStorage);
export const sessionStore = safeStorage(sessionStorage);

const _rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
export const prefersReducedMotion = () => _rmq.matches;
