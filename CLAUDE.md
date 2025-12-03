# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hugo static site for a personal engineering blog and portfolio at https://tenyoru.io/. The site features a dark-first design with sophisticated theming, minimal JavaScript, and strong focus on typography and accessibility.

## Development Commands

### Build & Serve
```bash
# Development server with live reload
hugo server

# Production build (outputs to public/)
hugo build

# Development server with drafts visible
hugo server -D
```

### Content Management
```bash
# Create new blog post
hugo new content/blog/post-name.md

# Create new page
hugo new content/page-name.md
```

## Architecture Overview

### Theme System (Critical)

The site uses a **CSS variables-based theming system** with Sass. This is the most important architectural pattern to understand:

**Color tokens** are defined in `assets/scss/theme/_colors.scss`:
```scss
$themes: (
  light: ( bg: #color, text: #color, accent: #color, ... ),
  dark: ( bg: #color, text: #color, accent: #color, ... )
)
```

**Theme application** happens in `assets/scss/theme/_utils.scss`:
- `@mixin emit-theme-vars()` - Converts Sass maps to CSS variables
- `@function theme($key)` - References CSS variables in Sass
- `:root` selectors apply themes based on `data-theme` attribute

**Usage in components**:
```scss
// Use theme() function to reference colors
background-color: theme(bg);
color: theme(text);
border-color: theme(border);
```

**Theme switching** is handled by JavaScript in `assets/js/main.js`:
- Reads/writes `preferred-theme` to localStorage
- Updates `document.documentElement.dataset.theme`
- Syncs with Giscus comments iframe

### SCSS Module Structure

All styles are organized in `assets/scss/`:
```
main.scss                 # Entry point, imports all modules
├── theme/
│   ├── _colors.scss      # Theme token definitions
│   ├── _utils.scss       # Theme system utilities
│   └── _index.scss       # Theme module exports
├── base/
│   ├── _root.scss        # CSS variable setup, resets
│   └── _typography.scss  # Font stacks, heading styles
├── layout/
│   └── _structure.scss   # Shell containers, footer, layout primitives
├── components/           # All UI components
└── utilities/            # Helper classes
```

**Compilation**: Handled by `layouts/partials/head/scss.html`
- Dev: Source maps, expanded output, external stylesheet
- Prod: Minified, fingerprinted, inlined with integrity hash

### Layout Template Hierarchy

```
baseof.html (master template)
├── home.html              # Homepage with rings animation
├── section.html           # Blog listing, tag pages
├── blog/single.html       # Individual blog posts
├── contact/list.html      # Contact page
└── page.html             # Generic pages
```

**Shell system** for responsive widths:
- `.shell--wide`: 1024px max (headers, full-width sections)
- `.shell--narrow`: 820px max (blog posts, readable content)
- `.post-column`: 70ch max (optimal reading line length)

### JavaScript Architecture

`assets/js/main.js` is minimal and progressive:
- **Storage safety wrapper** - Handles localStorage failures gracefully
- **Theme management** - Persists user preference, detects system theme
- **Giscus integration** - Lazy-loads comments, syncs theme
- **Interactive cards** - Click-anywhere navigation with keyboard support
- **TOC state** - Persists collapse/expand state

All features degrade gracefully when JavaScript is disabled.

### Content Structure

```
content/
├── _index.md           # Homepage (uses home.html)
├── blog/              # Blog posts (RSS enabled)
│   ├── _index.md
│   └── *.md
└── contact/
    └── _index.md
```

**Frontmatter patterns**:
```yaml
---
title: "Post Title"
date: 2024-01-01
tags: ["tag1", "tag2"]
summary: "Brief description"
draft: false
---
```

### Custom Shortcodes

Located in `layouts/shortcodes/`:

- `{{< svg "icon-name" >}}` - Inline SVG icons from `assets/images/`
- `{{< color "theme-key" "text" >}}` - Apply theme colors to text
- `{{< ff "key" "value" "url?" >}}` - Fastfetch-style key-value pairs

## Key Configuration

### Hugo Config (`hugo.toml`)

**Syntax highlighting**: Uses Chroma with `noClasses: false`
- Styles are in `assets/scss/components/_chroma.scss`
- Uses Monokai theme
- To change: Update styles in `_chroma.scss`, not inline

**Giscus comments**: Configured under `[params.giscus]`
- Repo: tenyoru/Tenyoru.github.io
- Category: Announcements
- Theme changes are synced via JavaScript

**Menu structure**: Main navigation defined in `[menu.main]`
- Blog (weight 10)
- Tags (weight 20)
- Contact (weight 30)

## Important Patterns

### Adding New Theme Colors

1. Add to both light and dark maps in `_colors.scss`
2. Reference using `theme(key-name)` function
3. No need to update CSS variables manually - they're auto-generated

### Creating New Components

1. Create `assets/scss/components/_component-name.scss`
2. Import in `main.scss`: `@use "components/component-name";`
3. Use `@use "../theme" as *;` to access `theme()` function
4. Follow BEM-like naming for classes

### Responsive Design

Use breakpoint functions from `_vars.scss`:
```scss
@media (min-width: mq(md)) { /* 768px */ }
@media (min-width: mq(lg)) { /* 1024px */ }
```

Width functions:
```scss
max-width: content-width();  // 820px
max-width: header-width();   // 1024px
```

### Adding Blog Posts

1. Create markdown file in `content/blog/`
2. Include proper frontmatter (title, date, tags, summary)
3. Use `draft: true` while writing
4. Tags automatically create taxonomy pages

### Modifying Layouts

**For blog changes**: Edit `layouts/blog/single.html`
**For navigation**: Edit `layouts/partials/header.html`
**For footer**: Edit `layouts/partials/footer.html`
**For post cards**: Edit `layouts/partials/post/card.html`

All layouts inherit from `baseof.html` via `{{ define "main" }}` blocks.

## Common Gotchas

1. **Theme colors not updating**: Make sure to use `theme()` function, not hardcoded colors
2. **JavaScript features broken**: Check localStorage availability (private browsing can block it)
3. **Styles not compiling**: Ensure Dart Sass is installed and hugo.toml has correct paths
4. **Giscus not loading**: Verify repo settings and category ID in hugo.toml
5. **Post cards not clickable**: Ensure card wrapper has `data-card-link` attribute

## Build Output

- `public/` - Generated static site (gitignored)
- `resources/` - Hugo's asset cache (gitignored)
- CSS is fingerprinted with content hash in production

## Site Identity

- Warm, sophisticated aesthetic with premium dark mode
- Light theme: Blue accents (#2563eb)
- Dark theme: Bright brown/gold accents (#f5b574)
- Very dark background (#0a0807) with subtle warmth
- Typography: System font stack (browser defaults)
- Code: Monospace stack with fallbacks
