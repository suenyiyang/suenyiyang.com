# Blog Typography System — Design Spec

**Date:** 2026-05-22
**Status:** Approved, ready for implementation planning
**Scope:** Site-wide typography + spacing token system; post body, listing pages, site chrome; TOC sidebar and floating back-to-top.

---

## 1. Goals

1. **Tighter information density** — the current reading surface feels too sparse on long-form articles. Tighten line-height and block rhythm so ~30% more text fits per screen without sacrificing readability.
2. **Stronger hierarchy** — h1 / h2 / h3 / h4 should differentiate clearly at a glance. Current scale (h2 24–28px against 17–18px body) is too compressed.
3. **Cross-language consistency** — every size, line-height, and rhythm value is identical for Latin and CJK content. Different writing systems share one scale; only the font *stack* differs via fallback, never via `:lang()` switching.
4. **Single token source of truth** — every typography decision lives as a CSS custom property in `src/index.css`. Component code references tokens, never hard-coded sizes.
5. **Predictable across viewports** — body and code stay at fixed sizes; only heading display sizes scale via `clamp()`.

## 2. Non-goals

- No font swap. Inter, Playfair Display, IBM Plex Mono, PingFang SC all stay.
- No color or theme rework. Reading surface tokens (`--reading-*`, palette) stay as-is.
- No constrained-breakout layout for figures/code. The article column stays at a single fixed width.
- No new content features (no related posts, no comments redesign, no search). TOC sidebar is the one new component.
- Performance budget unchanged — no new font weights, no new web font subsets.

## 3. Design tokens

All tokens are declared in `src/index.css` under `@theme` (Tailwind v4 theme block) or `:root` (for tokens consumed outside the Tailwind theme namespace).

### 3.1 Type scale

```css
@theme {
  /* Display + headings — scale with viewport via clamp() */
  --text-display-xl: clamp(2.5rem, 7vw, 3.5rem);    /* 40 → 56px · Hero h1 only */
  --text-display:    clamp(2.25rem, 5.5vw, 2.75rem); /* 36 → 44px · post title, page h1 */
  --text-h2:         clamp(1.625rem, 3vw, 1.75rem);  /* 26 → 28px */
  --text-h3:         clamp(1.25rem, 2.2vw, 1.3125rem); /* 20 → 21px */
  --text-h4:         1.125rem;  /* 18px · fixed */

  /* Body + supporting text — fixed across viewports */
  --text-body:      1rem;       /* 16px */
  --text-secondary: 0.875rem;   /* 14px · post descriptions, captions */
  --text-code:      0.875rem;   /* 14px · code blocks */
  --text-meta:      0.8125rem;  /* 13px · date / read time / nav */
  --text-tag:       0.6875rem;  /* 11px · tag chips */
  --text-eyebrow:   0.6875rem;  /* 11px · "RECENT POSTS" style labels */
}
```

### 3.2 Line-heights

```css
@theme {
  --lh-display:   1.1;    /* Hero, post title */
  --lh-heading:   1.22;   /* h2 / h3 / h4 */
  --lh-body:      1.7;    /* paragraphs, lists, blockquote — applies to Latin + CJK */
  --lh-secondary: 1.55;   /* descriptions, captions */
  --lh-code:      1.65;   /* code blocks */
}
```

> **CJK note:** there is intentionally *no* CJK-specific line-height override. The same `--lh-body: 1.7` is applied to both Latin and CJK. This favors consistency over per-language micro-optimization; the user has explicitly chosen consistency.

### 3.3 Block rhythm

```css
@theme {
  --space-block:  0.95em;   /* default p + p, p + ul, etc. */
  --space-h2:     1.85em;   /* margin-top on h2 */
  --space-h3:     1.45em;   /* margin-top on h3 */
  --space-h4:     1.2em;    /* margin-top on h4 */
  --space-pre:    1.3em;    /* margin around <pre> */
  --space-figure: 1.6em;    /* margin around <figure> */
  --space-hr:     2.4em;    /* margin around <hr> */
}
```

### 3.4 Container

```css
@theme {
  --col-width:        50rem;    /* 800px — unchanged */
  --col-px-mobile:    1rem;     /* 16px (was 20px / px-5) */
  --col-px-desktop:   4rem;     /* 64px (px-16, unchanged) */
  --col-py-mobile:    2rem;     /* 32px (py-8, unchanged) */
  --col-py-desktop:   3rem;     /* 48px (py-12, unchanged) */

  --toc-rail-width:   12.5rem;  /* 200px — TOC sticky column */
  --toc-gap:          2.5rem;   /* 40px between TOC and article */
  --toc-breakpoint:   80rem;    /* 1280px — TOC only renders at or above this */
}
```

### 3.5 Font stacks (fallback-based, no `:lang()` switching)

```css
:root {
  --font-sans:    "Inter Variable", "PingFang SC", "Source Han Sans SC",
                  "Noto Sans SC", system-ui, -apple-system, sans-serif;

  --font-display: "Playfair Display Variable", "PingFang SC", "Source Han Sans SC",
                  "Noto Sans SC", Georgia, serif;

  --font-mono:    "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
}
```

Latin glyphs render in the first family; CJK glyphs fall through to PingFang SC automatically. Mixed-language headings like *"AI 与 Frontend"* render with one consistent font-size across the heading; only the per-character font-family changes.

The current `body { font-family: var(--font-sans), var(--font-chinese); }` declaration and the `:lang(zh) { font-family: var(--font-chinese); }` block in `src/index.css` are **removed**. The `:lang(zh) { letter-spacing: 0.01em; }` block in `.post-body` is **removed**.

## 4. Element-level rules — post body

All rules apply inside `.post-body`. Sizes and rhythm refer to the tokens above.

| Element | Font family | Size | Line-height | Margin-top | Notes |
|---|---|---|---|---|---|
| `p` | sans | `--text-body` | `--lh-body` | `--space-block` | `text-wrap: pretty` |
| `h2` | display | `--text-h2` | `--lh-heading` | `--space-h2` | letter-spacing -0.012em, `text-wrap: balance` |
| `h3` | display | `--text-h3` | `--lh-heading` | `--space-h3` | letter-spacing -0.008em |
| `h4` | display | `--text-h4` | `--lh-heading` | `--space-h4` | |
| `strong` | inherit | inherit | inherit | inherit | weight 600, color text-primary |
| `em` | inherit | inherit | inherit | inherit | italic |
| `a` | inherit | inherit | inherit | inherit | underline, offset 3px, decoration-color 35% body |
| `ul`, `ol` | inherit | inherit | inherit | `--space-block` | padding-left 1.4em |
| `li` | inherit | inherit | inherit | 0.3em (between items) | marker color text-muted; ol uses tabular-nums |
| `blockquote` | inherit | inherit | inherit | `--space-block` | border-left 3px, padding-left 1.1em, color text-secondary |
| `pre` | mono | `--text-code` | `--lh-code` | `--space-pre` | macOS window chrome wrapper preserved (existing `.code-window`) |
| `code` (inline) | mono | 0.86em | inherit | inherit | bg `--reading-code-bg`, radius 5px |
| `figure` | inherit | inherit | inherit | `--space-figure` | center-aligned, gap 0.5em |
| `figcaption` | sans | 0.78125rem (12.5px) | `--lh-secondary` | 0 | color text-muted, balanced |
| `table` | sans | `--text-secondary` (14px) | 1.55 | `--space-block` | inside `.table-scroll` wrapper |
| `th` | sans | inherit | inherit | 0 | weight 600, border-bottom 1.5px quote-bar |
| `td` | sans | inherit | inherit | 0 | border-bottom 1px reading-rule |
| `hr` | — | — | — | `--space-hr` | 1px top border, width 36%, centered |

The first heading inside `.post-body` has `margin-top: 0` (existing rule preserved).

## 5. Article header (`PostWrapper.tsx`)

| Element | Token applied |
|---|---|
| Meta line (`date · read time`) | `--text-meta` mono, color text-muted, `tabular-nums`, centered |
| Post title (h1) | `--text-display` Playfair 600, `--lh-display`, letter-spacing -0.014em, `text-wrap: balance`, centered |
| Tag chips | `--text-tag` mono, border 1px reading-rule, radius 999px |
| Header rule (the divider between header and body) | 1px reading-rule, margin-bottom `--space-figure` |

Padding-bottom on the header reduces from `pb-9 mb-10 md:pb-10 md:mb-12` to `pb-7 mb-8 md:pb-8 md:mb-10` (proportional to the new scale).

## 6. Listing pages

### 6.1 Home (`pages/index.mdx` → `Hero.tsx` + `RecentPosts.tsx`)

**Hero:**
- `h1` uses `--text-display-xl` (clamp 40 → 56px), `font-display`, italic, weight 400, line-height `--lh-display`, letter-spacing -0.025em
- Tags eyebrow uses `--text-meta` mono with letter-spacing 2px, color text-muted
- Description bumps from `text-lg` to explicit 1.125rem (18px) with line-height 1.55 (one notch above body to read as intro)
- Section padding: `pt-2 pb-6 md:pt-6 md:pb-10`

**RecentPosts:**
- "RECENT POSTS" eyebrow uses `--text-eyebrow` (11px), letter-spacing 0.18em, weight 700, uppercase
- "View all →" link uses `--text-meta` mono
- Section header has top border (`border-t reading-rule`), padding-top `--space-h2`

**PostCard (default variant):**
- Title: `--text-h3` (21px) Playfair 600, weight 600, letter-spacing -0.008em, line-height 1.3
- Description: `--text-secondary` (14px), color text-secondary, line-height 1.5, line-clamp-2 preserved
- Date + tag row: `--text-meta` mono
- Card padding `py-5` (was `py-6`); bottom border 1px reading-rule

### 6.2 Posts list (`PostsPage.tsx` + `PostList.tsx` + `PostCard` timeline)

**Page header:**
- `h1` "All Posts" uses `--text-display` italic Playfair (drops the hard-coded 36/42px)
- Description uses `--text-body` (16px), color text-secondary, max-w 36em
- Section padding `pb-7 md:pb-8`

**Filter row:**
- Existing low-contrast outline replaced with: outline chip default, **inverted** (filled charcoal + paper text) when active
- Chip font: `--text-meta` mono (12–13px)
- Filter label: `--text-eyebrow` style ("FILTER" with letter-spacing 0.05em)
- Row sits between `border-t` and `border-b` 1px reading-rule

**Timeline:**
- Year heading: `--text-h2` size, `font-display` weight 700 (current 24px hard-coded → token-driven)
- Date column day number: 1.875rem (30px) `font-display` weight 700 (was 32px hard-coded)
- Month: `--text-meta` mono uppercase, color text-muted
- Timeline row: gap-12 → gap-10 (consistent with overall tightening)
- Title in timeline row: `--text-h4` (18px) Playfair 600 (was Inter `font-semibold`) — picks up display font for consistency with article h-titles
- Description: `--text-secondary` (14px), line-clamp-2

### 6.3 About (`pages/about.mdx` → `AboutPage.tsx`)

- `h1` "About Me" uses `--text-display` italic Playfair (drops 36/42 hard-coded)
- Avatar size unchanged (24×24)
- Social icons unchanged
- Bio prose **drops the Tailwind `prose` plugin classes**; uses the same explicit token rules as `.post-body` (Tailwind `@plugin "@tailwindcss/typography"` import in index.css can remain, but `AboutPage.tsx` no longer applies `prose prose-neutral` / `prose-invert` classes on the bio section)
- "Interests & Skills" h2 uses `--text-h2` Playfair (was `text-xl font-medium`)
- Skill chips use `--text-tag` mono

## 7. Site chrome

### 7.1 Header (`Header.tsx`)

- Container padding mobile: `py-4 px-4` (was `px-5`) — matches main column
- Container padding desktop: unchanged (`md:py-5 md:px-16`)
- Logo: unchanged
- Nav links: unchanged, `--text-meta` mono (already 13px)

### 7.2 Footer (`Footer.tsx`)

- Already token-aligned at 11px / 12px mono; no functional changes
- Padding mobile: `py-6 px-4` (was `px-5`) — consistency

## 8. TOC sidebar (new component)

A new component renders a sticky table of contents derived from the post's `h2` / `h3` headings.

### 8.1 Behavior

- **Viewport ≥ 1280px (`--toc-breakpoint`):** sticky left rail, 200px wide, with `--toc-gap` to the article. Highlights the current section via IntersectionObserver. Article column **stays at 800px** — TOC consumes previously-empty desktop flank.
- **Viewport < 1280px:** a collapsible "Contents" pill renders above the article body. Pill is **collapsed by default** on mobile to keep first paint clean; expandable via tap. The desktop sticky rail is `display: none` at this breakpoint.

### 8.2 Source of truth

The TOC's structure is derived by walking the rendered MDX article DOM for `h2` and `h3` elements after mount. Each heading already has `scroll-margin-top: 5rem` (existing); the TOC links by `id`.

### 8.3 Visual spec

| Element | Rules |
|---|---|
| Container (desktop rail) | `position: sticky; top: 4.5rem;` (clears the sticky site header) |
| "Contents" eyebrow | `--text-eyebrow`, weight 700, letter-spacing 0.18em, uppercase, border-bottom 1px reading-rule, pb 0.5rem |
| Link (`h2` entries) | `--text-meta` mono, color text-secondary, line-height 1.7, padding-left 0 |
| Link (`h3` entries) | same, padding-left 0.8rem (indent) |
| Active link | color text-primary, weight 500, left border 2px text-primary, margin-left -0.6rem, padding-left 0.5rem |
| Pill (mobile/tablet) | border 1px reading-rule, radius 8px, bg reading-code-bg-light tint |
| Pill header | `--text-meta` mono, padding 0.55rem 0.8rem, ▾ chevron when collapsed / ▴ when open |

### 8.4 Component shape

```
src/components/Toc.tsx
src/components/wrapper/PostWrapper.tsx  (renders <Toc> in two modes)
```

The article column must stay at its 800px centered position; the TOC fills the empty left flank without shifting the article. To accomplish this, `PostWrapper.tsx` renders the post inside a wrapper with `position: relative`, and the desktop `<Toc>` rail uses absolute positioning:

```css
@media (min-width: 80rem) {
  .post-layout { position: relative; }
  .post-toc-desktop {
    position: absolute;
    top: 0;
    left: calc(0px - var(--toc-rail-width) - var(--toc-gap));
    width: var(--toc-rail-width);
    height: 100%;
  }
  .post-toc-desktop > .toc-inner {
    position: sticky;
    top: 4.5rem;
  }
}
@media (max-width: 80rem - 1px) {
  .post-toc-desktop { display: none; }
}
```

The mobile/tablet collapsible pill renders inside the article body above the first paragraph; the desktop rail is hidden at that breakpoint via the media query.

`<Toc>` is **post-only** — does not render on Home, Posts list, or About. The main column width in `src/root.tsx` stays at `max-w-[800px]`; no change needed there.

## 9. Back-to-top button (new component)

A small floating circular button that appears once the user has scrolled ~200px on any page.

### 9.1 Behavior

- Renders at all viewport widths (mobile, tablet, desktop)
- Position: `fixed; bottom: 1rem; right: 1rem;` on mobile; `bottom: 1.5rem; right: 1.5rem;` on ≥ 768px
- Visibility: hidden when `window.scrollY < 200`; fades in above that threshold via `opacity` transition
- Click: scrolls smoothly to top (`window.scrollTo({ top: 0, behavior: 'smooth' })`), respecting `prefers-reduced-motion`
- Icon: ↑ arrow (Iconify, or inline SVG)
- Color: bg `text-primary`, fg `bg-light` (inverted); shadow `0 4px 12px rgba(0,0,0,0.18)`

### 9.2 Component shape

```
src/components/BackToTop.tsx
src/root.tsx  (renders <BackToTop /> once, outside <main>, at the body level)
```

Renders on **every** page — not just posts.

## 10. Removed / replaced behavior

| Removed | Reason |
|---|---|
| `:lang(zh) { letter-spacing: 0.01em; }` in `.post-body` | Consistency rule — no per-language style branching |
| `:lang(zh, zh-CN, ...) { font-family: var(--font-chinese); }` block in `index.css` | Replaced by fallback stacks |
| `body { font-family: var(--font-sans), var(--font-chinese); }` (CJK appended) | Replaced by single `--font-sans` stack with CJK fonts already inside |
| `--font-chinese` variable | Folded into `--font-sans` / `--font-display` stacks |
| `prose prose-neutral dark:prose-invert prose-p:text-text-body ...` on `AboutPage` bio | Replaced by `.post-body`-style token-driven rules |
| Hard-coded `text-[2rem] leading-[1.18] md:text-[3rem] md:leading-[1.12]` on `PostWrapper` h1 | Replaced by `--text-display` + `--lh-display` |
| Hard-coded `text-[36px] md:text-[42px]` on `PostsPage` h1 + `AboutPage` h1 | Replaced by `--text-display` |
| Hard-coded `text-[18px]` on `PostCard` titles | Replaced by `--text-h3` (default) or `--text-h4` (timeline) |
| Hard-coded `text-[14px]` on `PostCard` descriptions | Replaced by `--text-secondary` |
| Hard-coded `text-[12px]` / `text-[13px]` on meta lines | Replaced by `--text-meta` |
| Hard-coded `text-[11px]` on RecentPosts eyebrow | Replaced by `--text-eyebrow` |
| Hard-coded body 17/18px in `.post-body` | Replaced by `--text-body` (16px) |

## 11. Net effect summary

| Aspect | Before | After |
|---|---|---|
| Body size (mobile/desktop) | 17px / 18px | **16px / 16px** |
| Body line-height | 1.85 (desktop) | **1.7** |
| Block rhythm | 1.4em | **0.95em** |
| h2 size | 24 / 28px | **clamp 26 → 28px** |
| h2 margin-top | 2.6em | **1.85em** |
| h3 size | 20 / 22px | **clamp 20 → 21px** |
| Post title | 32 / 48px | **clamp 36 → 44px** |
| Hero title | 36 / 56px | **clamp 40 → 56px** (display-xl) |
| Mobile column padding | 20px (px-5) | **16px (px-4)** |
| Desktop column padding | 64px (px-16) | unchanged |
| Column width | 800px | unchanged |
| CJK letter-spacing | 0.01em via `:lang()` | **0** (consistency rule) |
| Font-family switching | `:lang(zh)` overrides | **fallback stack only** |
| TOC sidebar | none | **sticky ≥1280px / collapsible pill below** |
| Back-to-top button | none | **all viewports, all pages** |

Information density gain on long-form articles: estimated **~28–32%** more text per screen (line-height + block rhythm together).

## 12. Files affected

```
src/index.css                              REWRITE typography sections
src/components/Hero.tsx                    Token-aligned
src/components/RecentPosts.tsx             Eyebrow + section-head rules
src/components/PostCard.tsx                Title/description tokens, both variants
src/components/PostList.tsx                Filter chips, year heading, timeline row tokens
src/components/Tag.tsx                     Chip size to --text-tag (verify)
src/components/layout/Header.tsx           Mobile padding px-4
src/components/layout/Footer.tsx           Mobile padding px-4
src/components/wrapper/PostWrapper.tsx     Article header tokens; grid layout for ≥1280px TOC
src/components/pages/PostsPage.tsx         h1 + description tokens
src/components/pages/AboutPage.tsx         h1 + bio (drop prose plugin) + skills h2 tokens
src/components/Toc.tsx                     NEW
src/components/BackToTop.tsx               NEW
src/root.tsx                               Mount <BackToTop /> at body level
```

## 13. Out of scope (defer to future spec)

- Constrained-breakout layout for code/figures
- Meta sidebar (date/tags/share/back-to-top column) on desktop
- Footnotes-as-side-notes (Tufte-style)
- Drop caps / pull quotes / opening-paragraph treatment
- Sticky reading progress bar
- Print stylesheet refresh
- RSS thumbnail / OG image typography
