// Home hero: two fBm-noise cloud layers drift at different speeds (parallax)
// behind a pixel-font wordmark; a letter cell warms to the accent color while
// the near cloud passes behind it. Canvas 2D only, one rAF loop.
// The wordmark comes from data-cloud-hero="..." on the hero element; empty = clouds only.
import { $, prefersReducedMotion } from "./dom.js";

const RAMP = " .·:•oO@"; // cloud density → glyph
const TRANSIT = 75; // seconds for the sun/moon to cross the band (at 100% zoom)
// Baseline zoom, captured once per page load (module scope, so SPA re-inits
// don't rebase it and change the speed mid-session).
const DPR_BASE = window.devicePixelRatio || 1;
const FIRST_DELAY = 5; // s before the first rise — soon, so visitors see one
const gap = () => 15 + Math.random() * 25; // s of empty sky between transits
// Artwork colors, not UI theme tokens: the sun is warm and the moon is pale
// regardless of theme (theme only decides which body is up).
const SUN = [244, 180, 96];
const MOON = [216, 214, 226];

// Hand-drawn 7-row pixel font ("#" = filled cell). Only the glyphs the
// wordmark needs — extend here if the text changes.
const FONT = {
  " ": ["...", "...", "...", "...", "...", "...", "..."],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
};

// Classic shadertoy hash + value noise, 3-octave fbm. Returns ~0..1.
const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const noise = (x, y) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = (x - xi) ** 2 * (3 - 2 * (x - xi));
  const yf = (y - yi) ** 2 * (3 - 2 * (y - yi));
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
};
const fbm = (x, y) =>
  0.5 * noise(x, y) + 0.3 * noise(x * 2.1, y * 2.1) + 0.2 * noise(x * 4.3, y * 4.3);

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerpRgb = (a, b, t) =>
  `${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)}`;

// Stamp the wordmark into a per-cell bitmask, integer-scaled and centered.
const buildMask = (word, cols, rows) => {
  const mask = new Uint8Array(cols * rows);
  const glyphs = [...word].map((ch) => FONT[ch]).filter(Boolean);
  if (!glyphs.length) return mask;
  const wordW = glyphs.reduce((w, g) => w + g[0].length + 1, -1);
  // word height capped at half the band, so the text scales with the cell size
  // instead of jumping to a bigger integer scale on mid-width screens
  const k = Math.max(1, Math.min(Math.floor((rows * 0.5) / 7), Math.floor((cols * 0.9) / wordW)));
  if (wordW * k > cols) return mask; // narrow screens: clouds only
  let cx = Math.floor((cols - wordW * k) / 2);
  const cy = Math.floor((rows - 7 * k) / 2);
  for (const g of glyphs) {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] !== "#") continue;
        for (let dy = 0; dy < k; dy++)
          for (let dx = 0; dx < k; dx++) mask[(cy + r * k + dy) * cols + cx + c * k + dx] = 1;
      }
    cx += (g[0].length + 1) * k;
  }
  return mask;
};

export const initClouds = (signal) => {
  const hero = $("[data-cloud-hero]");
  if (!hero) return;
  const canvas = $(".home-hero__canvas", hero);
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  const word = (hero.dataset.cloudHero ?? "").toUpperCase();
  hero.classList.add("home-hero--on"); // shows the canvas, so size it after this

  let cols = 0;
  let rows = 0;
  let w = 0;
  let h = 0;
  let cell = 10; // px per glyph cell; shrinks on narrow screens so the whole
  // composition scales down instead of showing a small slice of it
  let mask;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    cell = Math.max(6, Math.min(10, Math.round(w / 144)));
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    cols = Math.ceil(w / cell);
    rows = Math.ceil(h / cell);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${cell}px ui-monospace, monospace`;
    mask = buildMask(word, cols, rows);
  };

  // ponytail: assumes theme color tokens are 6-digit hex (they are, see _colors.scss)
  let themeKey = null;
  let colors;
  const readColors = () => {
    const key = document.documentElement.dataset.theme ?? "";
    if (key === themeKey) return;
    themeKey = key;
    const css = getComputedStyle(document.documentElement);
    const parse = (name) => {
      const n = parseInt(css.getPropertyValue(name).trim().slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    colors = { heading: parse("--heading"), muted: parse("--muted"), accent: parse("--accent") };
  };

  let riseAt = FIRST_DELAY; // t of the current/next transit's start

  const draw = (t) => {
    readColors();
    ctx.clearRect(0, 0, w, h);
    const { heading, accent } = colors;
    // Terraria-style transit: rise on the left, apex mid-band, set on the right.
    // Transits are episodes, not a loop — after one ends the sky stays empty
    // for a while, so the body never teleports back to the left edge.
    if (t >= riseAt + TRANSIT) riseAt = t + gap();
    const p = (t - riseAt) / TRANSIT;
    // light ramps in at rise and out at set (and is 0 between transits)
    const fade = clamp01(Math.min(p, 1 - p) / 0.1);
    const bx = p * (cols + 24) - 12; // start/end just off-band
    const by = rows * (0.9 - 0.72 * Math.sin(p * Math.PI));
    const body = themeKey === "light" ? SUN : MOON;
    const isSun = body === SUN;
    const bodyStr = body.join(",");
    const R = Math.max(2.5, rows * 0.17); // body radius, in cells
    // narrow screens see a thin slice of the sky and can look empty — lower the
    // condensation threshold as the viewport shrinks (zero on desktop widths)
    const bias = cols < 110 ? ((110 - cols) / 110) * 0.12 : 0;
    for (let r = 0; r < rows; r++) {
      const y = (r + 0.5) * cell;
      // fade near the band's top/bottom so shapes don't get sliced by the edge
      const edge = clamp01(Math.min(r, rows - 1 - r) / (rows * 0.18));
      for (let c = 0; c < cols; c++) {
        const x = (c + 0.5) * cell;
        // Halftone sky: a glyph in (almost) every cell — faint dots for open
        // sky, denser marks inside clouds. Two fbm fields at different drift
        // speeds give parallax; clouds wear the theme accent and warm toward
        // the body color where its light hits.
        const far = fbm((c + t * 0.5) * 0.014, r * 0.045 + 19);
        const near = fbm((c + t * 1.4) * 0.02, r * 0.055 + 57);
        const dens = Math.max(
          clamp01((far - 0.42 + bias) / 0.35) * 0.55,
          clamp01((near - 0.45 + bias) / 0.3),
        );
        let halo = 0;
        let light = 0;
        if (fade > 0) {
          const dx = c - bx;
          const dy = r - by;
          const dist = Math.hypot(dx, dy);
          // Sun: long wide rays (30papers-style angular lobes) reaching across the
          // band. Moon: calm circular glow, no rays.
          // both bodies get a tight glowing circle; the sun adds wide rays that
          // reach across most of the band
          halo = fade * clamp01(1 - dist / (R * (isSun ? 2.4 : 3.2))) ** 1.3;
          light =
            fade *
            (isSun
              ? clamp01(
                  halo * 0.9 +
                    clamp01(1 - dist / (R * 20)) ** 1.1 *
                      (0.1 + 1.4 * (0.5 + 0.5 * Math.sin(Math.atan2(dy, dx) * 9 + t * 0.5)) ** 2),
                )
              : clamp01(halo * 1.1 + clamp01(1 - dist / (R * 8)) ** 1.5 * 0.7));
          if (dist <= R) {
            // The body, in the sky's halftone language: a dense glyph core that
            // loosens toward the rim. Both bodies hide behind clouds (and the
            // wordmark, drawn later) — their light doesn't. The moon's crescent
            // comes from subtracting an offset disc.
            let v = clamp01(((R - dist) / R) * 2.2) * (1 - clamp01(dens * 1.7));
            if (!isSun) {
              const biteDist = Math.hypot(c - (bx + R * 0.55), r - (by - R * 0.25));
              v *= clamp01((biteDist - R * 0.55) / (R * 0.45));
            }
            if (v > 0.05) {
              ctx.fillStyle = `rgba(${bodyStr},${0.5 + 0.5 * v})`;
              ctx.fillText(RAMP[Math.round((0.6 + 0.4 * v) * (RAMP.length - 1))], x, y);
            }
          }
        }
        // clouds are drawn after (over) the body, so it sits behind them.
        // Light multiplies cloud density only — rays are invisible on open sky
        // and show up as lit cloud matter. The halo is the exception: a small
        // visible glowing circle hugging the body (stronger for the moon).
        const glow = halo * (isSun ? 0.25 : 0.6);
        const alpha = Math.min(0.9, (0.045 + dens * 0.85 * (0.6 + light * 1.2) + glow) * edge);
        if (alpha > 0.02) {
          const tint = clamp01(Math.max(light * (0.5 + dens), halo));
          ctx.fillStyle = `rgba(${lerpRgb(accent, body, tint)},${alpha})`;
          ctx.fillText(RAMP[Math.round(Math.max(dens, glow) * (RAMP.length - 1))], x, y);
        }
        if (mask[r * cols + c]) {
          // opaque rect per cell: fillText("█") leaves stripes, translucent
          // rects show seams where the bleed overlaps
          ctx.fillStyle = `rgb(${lerpRgb(heading, body, Math.max(dens * 0.3, light))})`;
          ctx.fillRect(x - cell / 2, y - cell / 2, cell + 0.5, cell + 0.5);
        }
      }
    }
  };

  const reduced = prefersReducedMotion();
  // Page zoom scales devicePixelRatio, and with it the physical size of the
  // band — a fixed-duration transit then looks faster. Dividing frame time by
  // the zoom factor keeps all motion (transit, drift, rays) at a constant
  // on-screen speed: exactly 2x slower wall-clock at 200%, never compounding,
  // because nothing else in the timing depends on zoom. Accumulating world
  // time frame by frame also means zooming mid-transit never teleports the body.
  let raf = 0;
  let wt = 0; // world time, in seconds slowed by zoom
  let last = 0;
  const loop = (now) => {
    const t = now / 1000;
    // clamp dt: first frame's `last` is 0, and t counts from page load, not init
    wt += (Math.min(t - last, 0.1) * DPR_BASE) / (window.devicePixelRatio || 1);
    last = t;
    draw(wt);
    raf = requestAnimationFrame(loop);
  };

  const staticT = TRANSIT * 0.35; // reduced motion: body frozen mid-morning
  resize();
  if (reduced) {
    riseAt = 0;
    draw(staticT);
    // static frame won't repaint on its own, so follow theme switches
    const mo = new MutationObserver(() => draw(staticT));
    mo.observe(document.documentElement, { attributeFilter: ["data-theme"] });
    signal.addEventListener("abort", () => mo.disconnect());
  } else {
    raf = requestAnimationFrame(loop);
    signal.addEventListener("abort", () => cancelAnimationFrame(raf));
  }
  window.addEventListener(
    "resize",
    () => {
      resize();
      if (reduced) draw(staticT);
    },
    { signal },
  );
};
