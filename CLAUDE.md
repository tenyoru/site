# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hugo (extended) static site for a personal engineering blog and portfolio at https://tenyoru.io/. Dark-first design, CSS-variable theming via Dart Sass, and a small hand-rolled client-side SPA router. Multilingual: English (default), French, Russian.

Requires **Hugo extended** (CI pins `0.162.1`) and **Dart Sass** (CI pins `1.100.0`) — Sass compiles via Hugo's pipeline, so the standalone `dart-sass` binary must be on `PATH`. A Nix `devenv` (`devenv.yaml`) provides the toolchain.

## Commands

```bash
hugo server          # dev server, live reload (drafts shown: section.html forces them on in dev)
hugo server -D       # also render content marked draft
just build           # production build → public/  (alias for `hugo`)
just deploy          # build, then `wrangler pages deploy public` to Cloudflare Pages (project "tenyoru")
hugo new content/blog/post-name.md
```

There is no test suite, linter, or Node toolchain — `js.Build` (esbuild, bundled in Hugo) handles JS.

## Deployment (two targets — important)

- **Primary, manual:** `just deploy` pushes the built `public/` to **Cloudflare Pages** via `wrangler`. This is what serves `tenyoru.io`. A `git push` alone does **not** update it.
- **Secondary, automatic:** `.github/workflows/hugo.yml` builds on push to `main` and deploys to **GitHub Pages** (`www.tenyoru.io`).
- Consequence: the live site can be stale relative to `main` until someone runs `just deploy`. When something added to the repo (e.g. a new `static/` file) "isn't live," suspect the deploy, not the file.
- `static/_headers` (Cloudflare/Netlify syntax) sets cache + security headers; `static/.well-known/security.txt`, `robots.txt`, `llms.txt`, and the web manifest are plain `static/` files served at the root.

## JavaScript Architecture (read before touching `assets/js/`)

ES modules bundled from the single entry `assets/js/main.js` via `js.Build` (see `layouts/partials/head/js.html`): minified + fingerprinted + SRI-hashed in production, external source map in dev. All modules import shared helpers from `dom.js` (`$`, `$$`, `storage`, `prefersReducedMotion`).

The site is a **client-side SPA**, not classic multi-page:

- `router.js` intercepts internal navigations, fetches the target, swaps `<body>` contents, and maintains a bounded prefetch **cache** (`CACHE_MAX = 32`) so clicks feel instant. It exports `navigate()` and `startRouter()`.
- `main.js` holds **per-page wiring that must be idempotent** — it re-runs after every body swap, tearing down the previous page's listeners via a fresh `AbortController` each time. When adding page behavior, register it here and pass the `signal`; do not attach un-abortable global listeners.
- Anchor scrolling/focus lives in `router.js` (`scrollToAnchor` honors reduced-motion and moves focus to the target for the skip link).

Feature modules (each `init*(signal)`):
- `theme.js` — theme management (NOT `main.js`). Reads/writes `preferred-theme` in localStorage, sets `document.documentElement.dataset.theme`, falls back to system theme, and syncs the Giscus iframe.
- `toc.js` — sticky table of contents: persists collapse state (`toc-state`), clamps the panel above the footer, highlights the active section.
- `cards.js` — makes `[data-card-link]` containers fully clickable/keyboard-activatable while leaving inner links working; internal links route through the injected `navigate()`.
- `photo-preview.js` — lightbox via native `<dialog>`, reusing one `<img>`.
- `email.js` — decodes Cloudflare-obfuscated email addresses (XOR with leading key byte).

Everything degrades gracefully without JS, and `storage` wraps localStorage so private-browsing failures don't throw.

## Theme System (most important pattern)

CSS-variables-based theming generated from Sass maps.

- **Tokens:** `assets/scss/theme/_colors.scss` defines `$themes: (light: (...), dark: (...))`.
- **Plumbing:** `assets/scss/theme/_utils.scss` — `@mixin emit-theme-vars()` turns the maps into CSS custom properties on `:root[data-theme=...]`; `@function theme($key)` reads them back in Sass.
- **Usage in components:** always `theme(bg)`, `theme(text)`, `theme(accent)`, etc. — never hardcode colors. Adding a color = add the key to both `light` and `dark` maps; the CSS variable is generated automatically.
- **Identity:** very dark warm background (`#0a0807`-ish), light theme blue accent (`#2563eb`), dark theme gold/brown accent (`#f5b574`). System font stack; monospace = JetBrains Mono stack.

## SCSS Structure & Conventions

`assets/scss/main.scss` imports everything. Layout: `theme/`, `base/` (`_root`, `_typography`), `layout/_structure`, `components/`, `utilities/`. Compiled by `layouts/partials/head/scss.html` (dev: expanded + source map, external; prod: minified, fingerprinted, inlined with integrity).

- New component: create `components/_name.scss`, `@use "../theme" as *;` for `theme()`, `@use "../vars" as v;` for breakpoints/widths, then `@use "components/name";` in `main.scss`. BEM-like class names.
- Breakpoints/widths come from `_vars.scss`: `mq(md)` = 768px, `mq(lg)` = 1024px; `content-width()` = 820px; `$header-height` = 3rem; `$padding-inline` = 1rem.
- **Link styling convention:** the base reset in `base/_typography.scss` sets `a { text-decoration: none }` and a single global `a:hover { color: theme(accent) }`. Do not re-declare these per component. Only add a hover/`text-decoration` rule when you need something the global can't give: coloring a **non-anchor child**, a non-color property (border, opacity, background), or a deliberately different hover color (e.g. `.menu-desktop a:hover` → `theme(text)`).

## Layout & Content

- Templates inherit from `layouts/_default/baseof.html` via `{{ define "main" }}`. Body is wrapped in `<main id="main-content">` (skip-link target) inside `.inner`.
- Shell widths: `.shell--wide` (1024px), `.shell--narrow` (820px), `.post-column` (70ch).
- `_default/section.html` is the blog listing (and forces drafts visible in dev). Taxonomy: `taxonomy.html` (single tag) + `terms.html` (all tags). Sections with bespoke templates: `photos/`, `contact/`.
- Custom code-fence render hook: `layouts/_default/_markup/render-codeblock.html` strips Hugo's auto-added `tabindex` from highlighted `<pre>`.
- Shortcodes (`layouts/shortcodes/`): `{{< svg "icon" >}}`, `{{< color "theme-key" "text" >}}`, `{{< ff "key" "value" "url?" >}}`.

## Configuration (`hugo.toml`)

- `[languages]`: `en` (w1), `fr` (w2), `ru` (w3); `defaultContentLanguageInSubdir = false`. Translations live as `name.<lang>.md` (e.g. `post.ru.md`); `head.html` emits `hreflang` alternates.
- `[menus.main]`: Blog, Photos, Contact (Tags is intentionally **not** in the nav — surfaced as a small link in the blog section header instead).
- Syntax highlighting: Chroma, `noClasses = false`, styled in `assets/scss/components/_chroma.scss` (Monokai-derived) — edit there, not inline.
- `[params.giscus]`: comments repo `tenyoru/Tenyoru.github.io`, theme synced from `theme.js`.

## Gotchas

- Colors not switching → you hardcoded instead of `theme()`.
- New page JS not firing after navigation → you registered it outside `main.js`'s re-run path, or didn't pass the `AbortController` signal.
- New `static/` file 404/stale in prod → run `just deploy`; `git push` updates GitHub Pages, not Cloudflare.
- Sass won't compile → `dart-sass` not on `PATH` / Hugo not the extended build.
- `public/` and `resources/` are gitignored build output.
