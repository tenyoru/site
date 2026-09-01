import { $ } from "./dom.js";

/**
 * /src/ file view: text "copy" in the meta row, line selection by click,
 * drag, or shift+click with #t-N / #t-N-t-M links, and the
 * "copy link / copy line" popup on the selected line number.
 */
export const initSrcView = (signal) => {
  const meta = $(".src-view__meta");
  const code = $(".src-view__code code");
  if (!meta || !code || meta.dataset.copyWired) return;
  meta.dataset.copyWired = "true";

  // Reads the code from the .cl spans so the line-number column doesn't end
  // up in the clipboard.
  const getText = () =>
    [...code.querySelectorAll(".cl")].map((l) => l.innerText).join("") || code.innerText;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "src-view__copy";
  btn.textContent = "copy";
  btn.setAttribute("aria-label", "Copy file contents to clipboard");
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getText());
      btn.textContent = "copied";
    } catch (_) {
      btn.textContent = "failed";
    }
    setTimeout(() => { btn.textContent = "copy"; }, 1500);
  }, { signal });

  meta.append(btn);

  // Strip hrefs from Chroma's line-number anchors so hovering shows no URL
  // preview; the ids stay so incoming #t-N links still scroll natively.
  code.querySelectorAll(".lnlinks").forEach((a) => a.removeAttribute("href"));

  const lines = [...code.querySelectorAll(".line")];
  const selectRange = (from, to) => {
    code.querySelectorAll(".line.is-selected").forEach((l) => l.classList.remove("is-selected"));
    for (let i = from; i <= to; i++) lines[i - 1]?.classList.add("is-selected");
  };
  let anchorNum = null; // start of a shift-click range

  // Incoming #t-5 or #t-5-t-10 → highlight; ranges have no matching element
  // id, so the browser won't scroll to them on its own.
  const m = location.hash.match(/^#t-(\d+)(?:-t-(\d+))?$/);
  if (m) {
    const from = Math.min(+m[1], +(m[2] ?? m[1]));
    const to = Math.max(+m[1], +(m[2] ?? m[1]));
    selectRange(from, to);
    anchorNum = from;
    if (m[2]) lines[from - 1]?.scrollIntoView();
  }

  // clicking anywhere but a line number (code text included) clears the
  // selection and drops the #t-… fragment; popup and "copy" are exempt, and
  // so is the click that lands right after a drag-selection ends
  document.addEventListener("click", (e) => {
    if (e.target.closest(".ln, .src-linktip, .src-view__copy")) return;
    if (Date.now() - dragEndAt < 300) return;
    if (!code.querySelector(".line.is-selected")) return;
    selectRange(1, 0); // empty range = clear
    anchorNum = null;
    history.pushState(null, "", location.pathname);
  }, { signal });

  const showTip = (ln, hash) => {
    if (!ln) return;
    $(".src-linktip")?.remove();
    const shownAt = Date.now();

    const tip = document.createElement("span");
    tip.className = "src-linktip";
    let used = false;

    // per-tip listeners die with the tip (or with the page, whichever first)
    const tipCtl = new AbortController();
    const tipSignal = AbortSignal.any([signal, tipCtl.signal]);
    const dismiss = () => {
      tipCtl.abort();
      tip.classList.add("is-hiding");
      setTimeout(() => tip.remove(), 350);
    };

    const makeAction = (label, getText) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        used = true;
        try {
          await navigator.clipboard.writeText(getText());
          b.textContent = "copied!";
        } catch (_) {
          b.textContent = "failed";
        }
        setTimeout(dismiss, 900);
      }, { signal: tipSignal });
      return b;
    };

    tip.append(
      makeAction("copy link", () => location.origin + location.pathname + hash),
      makeAction(hash.includes("-t-", 1) ? "copy lines" : "copy line", () =>
        [...code.querySelectorAll(".line.is-selected .cl")]
          .map((c) => c.innerText).join("").replace(/\n$/, "")),
    );

    // fixed-positioned on body so the code block's overflow can't clip it;
    // above the number, or below when too close to the viewport top
    const r = ln.getBoundingClientRect();
    tip.style.left = `${r.left}px`;
    if (r.top > 60) {
      tip.style.top = `${r.top - 6}px`;
      tip.style.transform = "translateY(-100%)";
    } else {
      tip.style.top = `${r.bottom + 6}px`;
    }
    // fade in after a short delay
    tip.style.opacity = "0";
    document.body.appendChild(tip);
    setTimeout(() => { tip.style.opacity = ""; }, 200);
    window.addEventListener("scroll", dismiss, { once: true, signal: tipSignal });
    // click anywhere outside (and not on another line number) → fade out;
    // the click that ends a drag fires right after mouseup, so ignore it
    document.addEventListener("click", (ev) => {
      if (Date.now() - shownAt < 300) return;
      if (!tip.contains(ev.target) && !ev.target.closest(".ln")) dismiss();
    }, { signal: tipSignal });
    setTimeout(() => { if (!used) dismiss(); }, 3000);
  };

  // Click selects a line; dragging across numbers (or shift+click) selects a
  // range. The hash and popup are applied on release.
  //
  // Pointer Events (not mouse+touch separately): on touch, a captured
  // pointer keeps e.target pinned to the element where the drag started, so
  // "which line is under the finger now" has to come from the coordinates
  // (elementFromPoint), not e.target - that's true on move for both input
  // types here, so one code path covers mouse and touch alike.
  let dragFrom = null;
  let dragTo = null;
  let dragEndAt = 0;

  const lineAt = (x, y) => document.elementFromPoint(x, y)?.closest(".ln");

  code.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    const ln = e.target.closest(".ln");
    if (!ln?.id) return;
    // no native text selection / long-press callout while dragging
    e.preventDefault();
    const num = +ln.id.slice(2);
    dragFrom = e.shiftKey && anchorNum !== null ? anchorNum : num;
    dragTo = num;
    selectRange(Math.min(dragFrom, dragTo), Math.max(dragFrom, dragTo));
  }, { signal });

  code.addEventListener("pointermove", (e) => {
    if (dragFrom === null) return;
    const ln = lineAt(e.clientX, e.clientY);
    if (!ln?.id) return;
    dragTo = +ln.id.slice(2);
    selectRange(Math.min(dragFrom, dragTo), Math.max(dragFrom, dragTo));
  }, { signal });

  const endDrag = () => {
    if (dragFrom === null) return;
    const from = Math.min(dragFrom, dragTo);
    const to = Math.max(dragFrom, dragTo);
    anchorNum = dragFrom;
    const hash = from === to ? `#t-${from}` : `#t-${from}-t-${to}`;
    // pushState instead of location.hash: no scroll jump. :target won't
    // update this way, so the highlight is a class instead.
    history.pushState(null, "", hash);
    showTip(lines[dragTo - 1]?.querySelector(".ln"), hash);
    dragFrom = null;
    dragEndAt = Date.now();
  };
  window.addEventListener("pointerup", endDrag, { signal });
  window.addEventListener("pointercancel", endDrag, { signal });
};
