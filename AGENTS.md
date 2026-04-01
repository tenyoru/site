# AGENTS.md
Operational guide for coding agents working in this Hugo repository.

## Scope and Intent
- This is a Hugo static site for `https://tenyoru.io`.
- Primary stack: Hugo templates, Markdown content, SCSS (Dart Sass), vanilla JS.
- Keep changes minimal, focused, and consistent with existing patterns.
- Prefer extending current architecture over introducing new frameworks.

## Rule Files Check
- `.cursor/rules/`: not present.
- `.cursorrules`: not present.
- `.github/copilot-instructions.md`: not present.
- Active in-repo agent guidance is `AGENTS.md` plus `CLAUDE.md`.

## Environment Baseline
- GitHub Actions builds with Hugo `0.150.1` (extended) on Linux.
- Dart Sass is required by the SCSS pipeline.
- Node install is optional in CI (`npm ci` only when lockfile exists).

## Repository Map (High-Value Paths)
- `hugo.toml`: site config (params, menus, markup, security).
- `content/`: Markdown pages/posts.
- `layouts/`: templates and partials.
- `layouts/_default/baseof.html`: base shell.
- `layouts/blog/single.html`: blog post rendering.
- `layouts/partials/`: reusable partial templates.
- `layouts/shortcodes/`: custom shortcodes (`svg`, `color`, `ff`).
- `assets/scss/main.scss`: SCSS entrypoint.
- `assets/scss/theme/_colors.scss`: light/dark token maps.
- `assets/scss/theme/_utils.scss`: `theme()` function and CSS var emission.
- `assets/js/main.js`: client-side progressive enhancement behavior.
- `.github/workflows/hugo.yml`: CI reference for build tooling and flags.

## Architecture Notes (From CLAUDE.md)
- Theme system is CSS-variable based: token maps in `assets/scss/theme/_colors.scss`, emission/helpers in `assets/scss/theme/_utils.scss`.
- Theme switching persists `preferred-theme` in `localStorage` and sets `document.documentElement.dataset.theme`.
- SCSS compile behavior is defined in `layouts/partials/head/scss.html` (dev sourcemaps vs production minify/fingerprint/integrity).
- Layout hierarchy is `baseof.html` + page templates that define `main` (`home`, `section`, `blog/single`, `page`, `contact/list`).
- Width system is intentional: `shell--wide` (header/full sections), `shell--narrow` (reading layout), `post-column` (~70ch).

## Build, Lint, and Test Commands
### Tooling
- Install Hugo Extended `0.150.x` (match CI when possible).
- Install Dart Sass CLI (`dart-sass`).
- Run `npm ci` only if lockfile exists.

### Local Development
- `hugo server` — start local server with live reload.
- `hugo server -D` — include draft content.
- `hugo server --disableFastRender` — safer for template debugging.

### Production / CI-Equivalent Builds
- `hugo build` — standard production output into `public/`.
- `hugo --minify` — local approximation of CI output.
- `HUGO_ENVIRONMENT=production hugo --minify --baseURL "https://example.com/"` — closest CI-equivalent command.

### Lint-Like Validation
- There is no dedicated ESLint/Stylelint/markdownlint setup.
- Treat Hugo warnings as lint failures when validating changes.
- Run `hugo --printPathWarnings --panicOnWarning`.

### Tests (Current State)
- No automated unit/integration tests are configured.
- Validation is build success + route-level manual smoke checks.
- Minimum pre-merge check:
- `hugo --minify`
- `hugo server -D` and verify changed pages/components manually.

### Running a Single Test (Practical Equivalent)
- Because no test runner exists, use one-page smoke testing.
- Start server: `hugo server -D`
- Open only changed route (example: `/blog/test/`) and verify behavior.
- For template-only checks, run `hugo --minify` then inspect `public/<route>/index.html`.

## Code Style Guidelines
### Cross-Cutting Principles
- Preserve current architecture and naming patterns.
- Prefer small, local edits in the relevant layer.
- Avoid adding dependencies for simple behavior.
- Keep progressive enhancement: site remains usable without JS.

### Hugo Templates
- Follow existing Hugo idioms: `define`, `partial`, `with`, `range`, `dict`.
- Reuse partials instead of duplicating markup.
- Keep trim markers (`{{- ... -}}`) consistent with surrounding code.
- Prefer `relURL` / `RelPermalink` for internal links.
- Use section-specific templates only when `_default` becomes noisy.

### SCSS
- Use `@use`; do not introduce legacy `@import`.
- Pull colors from tokens via `theme(<token>)`, not hardcoded values.
- Add new color tokens in both light and dark maps.
- Keep component styles under `assets/scss/components/`.
- Register new SCSS files in `assets/scss/main.scss`.
- Respect existing compact one-line style where already used.

### JavaScript
- Use plain modern JS; no framework assumptions.
- Prefer `const`; use `let` only when reassignment is required.
- Keep semicolons, double quotes, and arrow-function style.
- Use early returns and small helpers.
- Guard browser APIs (`localStorage`, `matchMedia`, DOM lookups).
- Keep code scoped; avoid global namespace pollution.

### Imports and Module Boundaries
- SCSS theme access pattern: `@use "../theme" as *;`.
- SCSS built-ins should be explicit (for example, `@use "sass:map"`).
- JS currently lives in `assets/js/main.js`; avoid splitting unless clearly justified.

### Formatting
- Match surrounding indentation and attribute order.
- Do not reformat unrelated lines.
- Keep template/SCSS/JS formatting consistent with neighboring code.
- Optimize for readability, not rigid line-length targets.

### Types and Data Shapes
- Do not introduce TypeScript unless explicitly requested.
- In templates, guard optional values (`with`, `default`, conditionals).
- In JS, validate dataset values and element lookups before use.

### Naming Conventions
- CSS classes: kebab-case, with BEM-like elements/modifiers (`block__elem`).
- Partial/template file names: lowercase and descriptive.
- Frontmatter keys: lowercase and consistent with existing content.
- JS identifiers: camelCase; constants in `UPPER_SNAKE_CASE`.

### Error Handling and Resilience
- Prefer graceful degradation over runtime failure.
- Keep storage and external integration calls guarded.
- Avoid assuming params/content always exist in templates.

### Accessibility and UX Safeguards
- Preserve semantic HTML (`header`, `nav`, `main`, `article`, `time`).
- Preserve keyboard accessibility for interactive elements.
- Keep focus-visible states and ARIA attributes intact.
- Do not regress contrast across light/dark themes.

## Content and Frontmatter Conventions
- New posts go under `content/blog/`.
- Include at least `title`, `date`, `summary`, `tags`, `draft`.
- Keep summaries concise and avoid raw HTML in frontmatter strings.
- Keep permalink/slug behavior consistent with existing section structure.
- Content commands: `hugo new content/blog/<post-name>.md`, `hugo new content/<page-name>.md`.
- Shortcodes: `svg` (inline icons), `color` (theme key text), `ff` (fastfetch-style key/value rows).

## Agent Workflow Expectations
- Before editing, inspect nearby files for local conventions.
- After editing, run `hugo --minify` (or `hugo build`) to confirm no breakage.
- For UI changes, run `hugo server -D` and verify desktop/mobile behavior.
- Do not manually edit generated output (`public/`, `resources/`).
- Keep commits scoped to requested work only.

## When Unsure
- Choose consistency with existing repo patterns over generic best practice.
- If architecture and request conflict, favor established project architecture.
- If introducing a new pattern, explain rationale briefly in commit/PR notes.

## Common Gotchas
- Theme color issues usually come from hardcoded colors instead of `theme(<token>)`.
- JS failures can be storage-related in private browsing; keep `localStorage` usage guarded.
- If comments misbehave, validate `[params.giscus]` values in `hugo.toml`.
