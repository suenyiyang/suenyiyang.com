# Blog Typography System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Roll out a token-driven typography + spacing system across the site, replace per-language style branching with a fallback font stack, and add a sticky TOC sidebar plus a floating back-to-top button.

**Architecture:** Every typographic value lives as a CSS custom property in `src/index.css` under `@theme` / `:root`. Components reference tokens (utility classes from Tailwind's `@theme` block, or inline `var(--token)`). `.post-body` is the single source for article rhythm. Latin and CJK glyphs render through one font stack — no `:lang()` switching. Two new React components (`Toc.tsx`, `BackToTop.tsx`) handle the new features; `PostWrapper.tsx` and `root.tsx` are the integration points.

**Tech Stack:** React Router 7 (SSR), Tailwind CSS v4 (`@theme` block), MDX via `@mdx-js/rollup`, Shiki for code highlighting, content-collections, Playwright e2e. Adds `rehype-slug` so MDX headings carry stable IDs for TOC anchoring.

**Testing notes for the implementer:**
- This project has **no unit-test runner**. The verification surface is Playwright e2e (`pnpm test:e2e`) plus visual inspection in `pnpm dev`.
- For pure CSS / token tasks, "verify" means: open the affected page in the dev server and visually confirm the change matches the spec; where high-value, add a Playwright `getByRole`/`evaluate` assertion of computed style.
- For new behavior (Toc, BackToTop), add a dedicated Playwright spec — they have testable functional surface.
- All tasks assume you've already run `pnpm install` at least once. Run it again after Task 0 because that task adds a dependency.
- **CRITICAL:** before starting, run `pnpm test:e2e --reporter=line` once to capture the baseline test status. Several visual-regression snapshots in `e2e/snapshots/` **will** intentionally need updating after the redesign — run `pnpm test:e2e --update-snapshots -g "visual"` once the dust has settled (Task 14). Do not update snapshots blindly mid-stream; let them fail and refresh only at the end.

---

## File map (single source of truth — refer back when in doubt)

| File | Status | Responsibility |
|---|---|---|
| `vite.config.ts` | Modify | Add `rehype-slug` to MDX rehype pipeline |
| `package.json` | Modify | Pin `rehype-slug` |
| `src/index.css` | Rewrite typography sections | All design tokens; `@theme` block; `.post-body` element rules; remove `:lang(zh)` rules; remove `--font-chinese` |
| `src/components/Hero.tsx` | Modify | display-xl headline, eyebrow + intro tokens |
| `src/components/RecentPosts.tsx` | Modify | Eyebrow + section-head rules |
| `src/components/PostCard.tsx` | Modify | Default + timeline variants, token-driven |
| `src/components/PostList.tsx` | Modify | Filter row (border-t/border-b, FILTER eyebrow), timeline year heading, gap-10 |
| `src/components/Tag.tsx` | Modify | Chip uses `--text-tag`; filter variant gets inverted active state |
| `src/components/layout/Header.tsx` | Modify | Mobile padding `px-4` |
| `src/components/layout/Footer.tsx` | Modify | Mobile padding `px-4` |
| `src/components/wrapper/PostWrapper.tsx` | Modify | Header tokens + padding; render `<Toc>` desktop rail + mobile pill |
| `src/components/pages/PostsPage.tsx` | Modify | h1 + description tokens |
| `src/components/pages/AboutPage.tsx` | Modify | h1, drop `prose` plugin, skills h2 tokens |
| `src/components/Toc.tsx` | **NEW** | TOC component (`variant="desktop" \| "mobile"`); IntersectionObserver active section |
| `src/components/BackToTop.tsx` | **NEW** | Floating fixed circular button, scroll-listener visibility |
| `src/root.tsx` | Modify | Mount `<BackToTop />` once at body level |
| `e2e/tests/typography.spec.ts` | **NEW** | Computed-style + presence assertions for tokens, Toc, BackToTop |

---

## Task 0: Add `rehype-slug` so MDX headings carry stable IDs

The TOC links by `id`. Right now headings have no auto-generated IDs (the MDX pipeline only runs Shiki + `rehypeCodeWindow`). Add `rehype-slug` before any other TOC work or every anchor will be broken.

**Files:**
- Modify: `package.json` (dev dependency)
- Modify: `vite.config.ts:11-37` (rehype plugin list)

- [ ] **Step 1: Install rehype-slug**

```bash
pnpm add -D rehype-slug
```

Expected: `package.json` `devDependencies` gains `"rehype-slug": "^6.x.x"` (whatever the current version resolves to), `pnpm-lock.yaml` updates.

- [ ] **Step 2: Wire rehype-slug into the MDX pipeline**

In `vite.config.ts`, import the plugin and add it to `rehypePlugins` **before** `rehypeShiki` (slug only needs to walk the AST once and Shiki's transformation doesn't affect heading IDs, but conventionally slug runs first):

```ts
// vite.config.ts (top of imports)
import rehypeSlug from "rehype-slug";
```

```ts
// inside mdx({...}) options
rehypePlugins: [
  rehypeSlug,
  [
    rehypeShiki,
    {
      themes: { light: "vitesse-light", dark: "vitesse-dark" },
      defaultColor: false,
    },
  ],
  rehypeCodeWindow,
],
```

- [ ] **Step 3: Verify IDs are emitted**

Run `pnpm dev`. Open `http://localhost:5173/posts/understand-your-agents-better` (or any post). In devtools Elements panel, confirm at least one `<h2>` inside `.post-body` has an `id` attribute matching the heading text (e.g. `id="why-agents-need-context"`).

Expected: every `<h2>`/`<h3>` inside `.post-body` has an `id`. If you see *no* IDs, the plugin order is wrong.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts
git commit -m "build: add rehype-slug for MDX heading IDs"
```

---

## Task 1: Declare the typography token system in `src/index.css`

Lay down every token the rest of the plan references. **Do not** touch `.post-body` rules yet — only the token declarations and the font-stack consolidation. This keeps the foundational change isolated and reversible.

**Files:**
- Modify: `src/index.css:16-35` (current `@theme` block) and `src/index.css:37-60` (current `:root` block)

- [ ] **Step 1: Replace the `@theme` block with the full token set**

Replace lines 16–35 (the existing `@theme { ... }`) with:

```css
@theme {
  /* --- Type scale: display + headings scale via clamp(); body + meta are fixed --- */
  --text-display-xl: clamp(2.5rem, 7vw, 3.5rem);      /* 40 → 56px · Hero h1 only */
  --text-display:    clamp(2.25rem, 5.5vw, 2.75rem);  /* 36 → 44px · post title, page h1 */
  --text-h2:         clamp(1.625rem, 3vw, 1.75rem);   /* 26 → 28px */
  --text-h3:         clamp(1.25rem, 2.2vw, 1.3125rem);/* 20 → 21px */
  --text-h4:         1.125rem;                        /* 18px · fixed */

  --text-body:      1rem;        /* 16px */
  --text-secondary: 0.875rem;    /* 14px */
  --text-code:      0.875rem;    /* 14px */
  --text-meta:      0.8125rem;   /* 13px */
  --text-tag:       0.6875rem;   /* 11px */
  --text-eyebrow:   0.6875rem;   /* 11px */

  /* --- Line-heights --- */
  --lh-display:   1.1;
  --lh-heading:   1.22;
  --lh-body:      1.7;
  --lh-secondary: 1.55;
  --lh-code:      1.65;

  /* --- Block rhythm --- */
  --space-block:  0.95em;
  --space-h2:     1.85em;
  --space-h3:     1.45em;
  --space-h4:     1.2em;
  --space-pre:    1.3em;
  --space-figure: 1.6em;
  --space-hr:     2.4em;

  /* --- Container --- */
  --col-width:        50rem;
  --col-px-mobile:    1rem;
  --col-px-desktop:   4rem;
  --col-py-mobile:    2rem;
  --col-py-desktop:   3rem;

  --toc-rail-width:   12.5rem;
  --toc-gap:          2.5rem;
  --toc-breakpoint:   80rem;

  /* --- Fonts: one stack each. CJK glyphs fall through automatically. --- */
  --font-sans:    "Inter Variable", "PingFang SC", "Source Han Sans SC",
                  "Noto Sans SC", system-ui, -apple-system, sans-serif;
  --font-display: "Playfair Display Variable", "PingFang SC", "Source Han Sans SC",
                  "Noto Sans SC", Georgia, serif;
  --font-mono:    "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;

  /* --- Color palette (unchanged) --- */
  --color-bg-light: #FDFCF9;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6862;
  --color-text-muted: #908C84;
  --color-text-body: #3C3A36;
  --color-border-light: #E7E3DA;

  --color-bg-dark: #0E0E0E;
  --color-text-primary-dark: #F3F1EB;
  --color-text-secondary-dark: #9B978E;
  --color-text-body-dark: #C7C4BC;
  --color-border-dark: #262421;
}
```

- [ ] **Step 2: Remove `--font-chinese` and `:lang(zh)` from the global stylesheet**

In `src/index.css`, find the `:root` block (currently lines 37–60). Delete the `--font-chinese` declaration. The `:root` block should now look like this (everything except the deleted `--font-chinese` lines, including the comment):

```css
:root {
  view-transition-name: theme;
  --vt-x: 50%;
  --vt-y: 50%;
  --vt-radius: 150%;

  /* Reading surface tokens (light) */
  --reading-code-bg: #EEEADF;
  --reading-code-text: #403D38;
  --reading-quote-bar: #D8D2C4;
  --reading-rule: #E7E3DA;
  --reading-selection-bg: #E9E2CE;
  --reading-selection-text: #1A1A1A;
  --code-window-bg: #FFFFFF;

  --waline-theme-color: var(--color-neutral-700) !important;
  --waline-active-color: var(--color-neutral-950) !important;
}
```

- [ ] **Step 3: Drop the `:lang(zh)` font-family block in `@layer base`**

Inside `@layer base { ... }` (currently lines 77–111), replace the `body` and `:lang(...)` rules so the body uses only `--font-sans`:

```css
body {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

Delete this entire `:lang(...)` block (it used to be right after `body { ... }`):

```css
/* DELETE THIS BLOCK */
:lang(zh),
:lang(zh-CN),
:lang(zh-Hans),
:lang(zh-TW),
:lang(zh-HK) {
  font-family: var(--font-chinese);
}
```

The rest of `@layer base` (the `html { scroll-behavior }`, `::selection`, `@media (prefers-reduced-motion: reduce)`) is unchanged.

- [ ] **Step 4: Sanity-check the build**

Run the dev server. Expected: page loads with no console errors, fonts render correctly (Latin Inter / CJK PingFang fallback) on every page.

```bash
pnpm dev
```

Open `http://localhost:5173/`. Confirm the homepage and a post render. Body type may look subtly different from the final goal (we haven't migrated `.post-body` yet) but layout should be intact.

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat(css): declare typography token system; consolidate font stacks"
```

---

## Task 2: Migrate `.post-body` element rules to tokens

Rewrite every `.post-body` rule in `src/index.css` to consume the tokens declared in Task 1. This is the biggest single CSS change. Preserve the existing media-safety footer (the unlayered `.post-body img/video` rules) and the existing `.code-window` rules — only typography/rhythm changes.

**Files:**
- Modify: `src/index.css:113-410` (the `@layer components` block containing `.post-title` and `.post-body` rules)

- [ ] **Step 1: Replace the `.post-title` rule**

Find `.post-title { ... }` (currently lines 117–123). The class is still used by `PostWrapper.tsx`; just align it to the new token. Replace with:

```css
.post-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-style: normal;
  letter-spacing: -0.014em;
  line-height: var(--lh-display);
  text-wrap: balance;
}
```

- [ ] **Step 2: Replace `.post-body` and its dark variant**

Replace the base `.post-body` rules (currently lines 125–148, including the `:lang(zh)` letter-spacing block and both viewport sizes) with:

```css
.post-body {
  color: var(--color-text-body);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: var(--lh-body);
  min-width: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.dark .post-body {
  color: var(--color-text-body-dark);
}
```

There are now **no** `@media (min-width: 768px)` size bumps on `.post-body` itself, and **no** `:lang(zh)` letter-spacing rule. Delete both.

- [ ] **Step 3: Replace the block-rhythm and `p` rules**

Replace the `.post-body > * + *` and `.post-body p` rules (currently lines 150–156) with:

```css
.post-body > * + * {
  margin-top: var(--space-block);
}
.post-body p {
  text-wrap: pretty;
}
```

- [ ] **Step 4: Replace the heading rules (h2 / h3 / h4)**

Replace the existing heading block (currently lines 158–196 — both the base `is(h2, h3, h4)` rule, the per-level rules, the desktop overrides, and the `first-child` margin reset) with this single block:

```css
.post-body :is(h2, h3, h4) {
  font-family: var(--font-display);
  color: var(--color-text-primary);
  font-weight: 600;
  line-height: var(--lh-heading);
  text-wrap: balance;
  scroll-margin-top: 5rem;
}
.dark .post-body :is(h2, h3, h4) {
  color: var(--color-text-primary-dark);
}
.post-body h2 {
  font-size: var(--text-h2);
  margin-top: var(--space-h2);
  letter-spacing: -0.012em;
}
.post-body h3 {
  font-size: var(--text-h3);
  margin-top: var(--space-h3);
  letter-spacing: -0.008em;
}
.post-body h4 {
  font-size: var(--text-h4);
  margin-top: var(--space-h4);
}
.post-body > :is(h2, h3, h4):first-child {
  margin-top: 0;
}
```

- [ ] **Step 5: Strong / em / lists**

Replace the existing `strong` / `em` / list rules (currently lines 198–231) with:

```css
.post-body strong {
  font-weight: 600;
  color: var(--color-text-primary);
}
.dark .post-body strong {
  color: var(--color-text-primary-dark);
}
.post-body em {
  font-style: italic;
}

.post-body :is(ul, ol) {
  padding-left: 1.4em;
  margin-top: var(--space-block);
}
.post-body ul { list-style: disc; }
.post-body ol { list-style: decimal; }
.post-body :is(ul, ol) :is(ul, ol) {
  margin-top: 0.3em;
}
.post-body li {
  margin-top: 0.3em;
  padding-left: 0.25em;
}
.post-body li::marker {
  color: var(--color-text-muted);
}
.post-body ol > li::marker {
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 6: Blockquote**

Replace the blockquote block (currently lines 233–245) with:

```css
.post-body blockquote {
  border-left: 3px solid var(--reading-quote-bar);
  padding-left: 1.1em;
  margin-top: var(--space-block);
  color: var(--color-text-secondary);
  font-style: normal;
}
.dark .post-body blockquote {
  color: var(--color-text-secondary-dark);
}
.post-body blockquote > * + * {
  margin-top: 0.6em;
}
```

- [ ] **Step 7: Links + inline code**

Replace the link + inline-code block (currently lines 247–266) with:

```css
.post-body a {
  color: inherit;
  font-weight: 500;
}

.post-body :not(pre) > code {
  font-family: var(--font-mono);
  font-size: 0.86em;
  background: var(--reading-code-bg);
  color: var(--reading-code-text);
  padding: 0.12em 0.4em;
  border-radius: 5px;
  word-break: break-word;
}
.post-body :not(pre) > code::before,
.post-body :not(pre) > code::after {
  content: none;
}
```

- [ ] **Step 8: Code blocks — preserve `.code-window` chrome, retune rhythm**

The macOS-window chrome wrapper rules (`.code-window`, `.code-window__chrome`, `.code-window__dot:nth-child(...)`) are **kept verbatim** — do not touch them. Only the `.post-body pre` rules change. Replace the `pre` block (currently lines 297–326, including the `@media (min-width: 768px)` size bump) with:

```css
.post-body pre {
  margin-top: var(--space-pre);
  margin-bottom: var(--space-pre);
  padding: 1.05rem 1.15rem;
  border-radius: 10px;
  max-width: 100%;
  overflow-x: auto;
  font-size: var(--text-code);
  line-height: var(--lh-code);
  -webkit-overflow-scrolling: touch;
  tab-size: 2;
}
.post-body .code-window pre {
  margin: 0;
  border-radius: 0;
}
@media (min-width: 768px) {
  .post-body pre {
    padding: 1.2rem 1.35rem;
  }
}
.post-body pre code {
  font-family: var(--font-mono);
  font-size: inherit;
  display: block;
  background: none;
  padding: 0;
  border: 0;
}
```

Leave the four Shiki theme rules (`.post-body .shiki { color: var(--shiki-light); }`, etc., currently lines 328–341) **unchanged**.

- [ ] **Step 9: Figures / images / figcaption**

Replace the figure block (currently lines 343–366) with:

```css
.post-body figure {
  margin-top: var(--space-figure);
  margin-bottom: var(--space-figure);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5em;
}
.post-body figure img,
.post-body > p > img,
.post-body > img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
.post-body figcaption {
  font-family: var(--font-sans);
  font-size: 0.78125rem;
  color: var(--color-text-muted);
  text-align: center;
  text-wrap: balance;
  line-height: var(--lh-secondary);
  margin-top: 0;
}
```

- [ ] **Step 10: Tables**

Replace the table block (currently lines 368–398) with:

```css
.post-body .table-scroll {
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.post-body table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-size: var(--text-secondary);
  line-height: 1.55;
  margin-top: var(--space-block);
}
.post-body :is(th, td) {
  padding: 0.55em 0.9em;
  text-align: left;
  vertical-align: top;
}
.post-body td {
  border-bottom: 1px solid var(--reading-rule);
}
.post-body tbody tr:last-child td {
  border-bottom: 0;
}
.post-body th {
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 1.5px solid var(--reading-quote-bar);
}
.dark .post-body th {
  color: var(--color-text-primary-dark);
}
```

- [ ] **Step 11: Horizontal rule**

Replace the `hr` block (currently lines 400–409) with:

```css
.post-body hr {
  border: 0;
  border-top: 1px solid var(--reading-rule);
  margin-top: var(--space-hr);
  margin-bottom: var(--space-hr);
  width: 36%;
  margin-left: auto;
  margin-right: auto;
}
```

- [ ] **Step 12: Visual verification on a real post**

Run `pnpm dev`. Open `http://localhost:5173/posts/understand-your-agents-better`. Verify:
- Body type is 16px (devtools Computed > font-size on a `<p>` shows `16px`)
- Body line-height is `27.2px` ( = 16 × 1.7 ) on both mobile (375px viewport) and desktop (1280px)
- h2 has a visible "breathing room" above (`margin-top` ≈ 28 × 1.85 ≈ 52px)
- h2 size is 26–28px; h3 is 20–21px
- Block rhythm between paragraphs is tighter than before (~15px vs. previous ~24px)
- No regressions in code blocks (macOS window chrome still present)
- No regressions in images / tables / blockquotes
- Toggling dark mode still works

- [ ] **Step 13: Commit**

```bash
git add src/index.css
git commit -m "feat(css): migrate .post-body to token-driven typography"
```

---

## Task 3: Update `Tag.tsx` — chip token, inverted-active filter

Centralize chip sizing on `--text-tag` and replace the low-contrast outline-when-active filter chip with an inverted (filled charcoal + paper text) active state.

**Files:**
- Modify: `src/components/Tag.tsx` (entire file)

- [ ] **Step 1: Replace `Tag.tsx`**

The component currently uses hard-coded `text-[11px]`. Switch to `text-[var(--text-tag)]` so it tracks the token, and swap the filter chip active state. Replace the file with:

```tsx
import { FC } from "react";

interface TagProps {
  label: string;
  variant?: "default" | "filter";
  isActive?: boolean;
  onClick?: () => void;
}

export const Tag: FC<TagProps> = ({
  label,
  variant = "default",
  isActive = false,
  onClick,
}) => {
  if (variant === "filter") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`font-mono text-[var(--text-meta)] px-3 py-1.5 rounded-full transition-colors ${
          isActive
            ? "bg-text-primary dark:bg-text-primary-dark text-bg-light dark:text-bg-dark border border-text-primary dark:border-text-primary-dark"
            : "bg-transparent text-text-secondary dark:text-text-secondary-dark border border-[var(--reading-rule)] hover:border-text-muted"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="font-mono text-[var(--text-tag)] px-[10px] py-1 rounded-full border border-[var(--reading-rule)] text-text-secondary dark:text-text-secondary-dark">
      {label}
    </span>
  );
};
```

Two intentional changes vs. the previous file:
- Filter chip font-size moved to `--text-meta` (13px) per spec §6.2 (filter chip font: `--text-meta` mono)
- Both variants use `rounded-full` (chip rail) and `--reading-rule` for the border — consistent with the post-title divider rules
- Default tag chip is `--text-tag` (11px) — matches spec §5 (article tags) and §6.3 (skills)

- [ ] **Step 2: Visual verification**

Run `pnpm dev`. Check:
- Home page (`/`) — recent post tags render at 11px, pill shape
- Posts list (`/posts`) — filter chips render at 13px with `All` active. Click another tag; verify the active chip is **filled** charcoal in light mode (and filled paper in dark mode), inactive chips are outlined.
- About page (`/about`) — skill chips at 11px

- [ ] **Step 3: Commit**

```bash
git add src/components/Tag.tsx
git commit -m "feat(tag): token-driven chip size; inverted active state on filter variant"
```

---

## Task 4: Update `PostCard.tsx` — default + timeline variants

Drop every hard-coded font-size; consume tokens. Both variants change.

**Files:**
- Modify: `src/components/PostCard.tsx` (entire file)

- [ ] **Step 1: Replace `PostCard.tsx`**

```tsx
import { Post } from "content-collections/generated";
import { format } from "date-fns";
import { FC } from "react";
import { Link } from "react-router";
import { Tag } from "./Tag";

interface PostCardProps {
  post: Post;
  variant?: "default" | "timeline";
}

export const PostCard: FC<PostCardProps> = ({ post, variant = "default" }) => {
  const date = post.date ? new Date(post.date) : null;
  const day = date ? format(date, "dd") : "";
  const month = date ? format(date, "MMM").toUpperCase() : "";
  const formattedDate = date ? format(date, "MMMM d, yyyy") : "";

  const tags = post.tags
    ? post.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (variant === "timeline") {
    return (
      <Link
        to={post._meta.path}
        className="flex gap-10 group py-5 first:pt-0"
      >
        {/* Date column - 100px fixed width */}
        <div className="flex-shrink-0 w-[100px] text-center">
          <div className="relative inline-block bg-bg-light dark:bg-bg-dark px-2">
            <div className="font-mono text-[var(--text-meta)] text-text-muted uppercase">
              {month}
            </div>
            <div className="text-[1.875rem] font-display font-bold text-text-primary dark:text-text-primary-dark leading-tight">
              {day}
            </div>
          </div>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="font-display text-[var(--text-h4)] font-semibold tracking-[-0.008em] text-text-primary dark:text-text-primary-dark group-hover:text-text-secondary dark:group-hover:text-text-secondary-dark transition-colors leading-snug">
            {post.title}
          </h3>
          {post.description ? (
            <p className="text-[var(--text-secondary)] leading-[1.5] text-text-secondary dark:text-text-secondary-dark line-clamp-2">
              {post.description}
            </p>
          ) : null}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-3 pt-1">
              {tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    );
  }

  // Default variant (Home > RecentPosts)
  return (
    <Link
      to={post._meta.path}
      className="block group py-5 first:pt-0 border-b border-[var(--reading-rule)] last:border-b-0"
    >
      <div className="space-y-2">
        <h3 className="font-display text-[var(--text-h3)] font-semibold tracking-[-0.008em] leading-[1.3] text-text-primary dark:text-text-primary-dark group-hover:text-text-secondary dark:group-hover:text-text-secondary-dark transition-colors">
          {post.title}
        </h3>
        {post.description ? (
          <p className="text-[var(--text-secondary)] leading-[1.5] text-text-secondary dark:text-text-secondary-dark line-clamp-2">
            {post.description}
          </p>
        ) : null}
        <div className="flex items-center gap-3 flex-wrap">
          {formattedDate ? (
            <time
              dateTime={post.date}
              className="font-mono text-[var(--text-meta)] text-text-muted"
            >
              {formattedDate}
            </time>
          ) : null}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

// Backwards-compatible alias
export const PostItem = PostCard;
```

Changes vs. the original file:
- `gap-12` → `gap-10` on the timeline variant (per spec §6.2)
- `py-6` → `py-5` on both variants (per spec §6.1 and §6.2)
- Timeline title is now `font-display` + `--text-h4` + `tracking-[-0.008em]` (instead of Inter `font-semibold` + hard-coded 18px)
- Default title is `font-display` + `--text-h3` (instead of Inter `font-semibold` + hard-coded 18px)
- Timeline day uses `text-[1.875rem]` (30px) per spec §6.2 (was `text-[32px]`)
- All hard-coded `text-[N px]` swapped for `text-[var(--text-*)]`
- Default variant gets `border-b border-[var(--reading-rule)] last:border-b-0` per spec §6.1

- [ ] **Step 2: Visual verification**

Run `pnpm dev`. Verify:
- Homepage (`/`) Recent Posts cards: titles are now Playfair italic-eligible-but-roman, sized ~21px on wide viewports, ~20px on narrow. Bottom borders divide each card.
- Posts list (`/posts`) timeline rows: day number is 30px Playfair bold, titles are 18px Playfair, gap looks tighter than before.

- [ ] **Step 3: Commit**

```bash
git add src/components/PostCard.tsx
git commit -m "feat(post-card): token-driven typography for default + timeline variants"
```

---

## Task 5: Update `PostList.tsx` — filter row + year heading + gap

Filter row gets the bordered-rail treatment with a FILTER eyebrow; year heading uses `--text-h2`; timeline gap is tightened.

**Files:**
- Modify: `src/components/PostList.tsx` (the `return` block, primarily the filter row and the year heading)

- [ ] **Step 1: Replace the `return (` block (everything from `return (` to the closing `);`)**

Keep all the imports, state, and `useMemo` blocks above. Only the JSX needs to change. Replace from `return (` through the final `);` with:

```tsx
  return (
    <div className="not-prose">
      {/* Filter row */}
      {showFilter && allTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 mb-10 py-3 border-t border-b border-[var(--reading-rule)]">
          <span className="font-mono text-[var(--text-eyebrow)] font-bold tracking-[0.05em] uppercase text-text-muted mr-2">
            Filter
          </span>
          <Tag
            label="All"
            variant="filter"
            isActive={activeTag === null}
            onClick={() => setActiveTag(null)}
          />
          {allTags.map((tag) => (
            <Tag
              key={tag}
              label={tag}
              variant="filter"
              isActive={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            />
          ))}
        </div>
      ) : null}

      {/* Posts list */}
      {variant === "timeline" ? (
        <div className="space-y-10">
          {years.map((year) => (
            <div key={year}>
              <div className="py-3 mb-6 relative">
                <div className="w-[100px] text-center">
                  <h2 className="font-display font-bold text-[var(--text-h2)] text-text-primary dark:text-text-primary-dark">
                    {year}
                  </h2>
                </div>
                <span
                  className="absolute left-[50px] -translate-x-1/2 -bottom-2 w-2 h-2 rounded-full bg-text-muted/70"
                  aria-hidden
                />
              </div>
              <div className="relative">
                <div
                  className="absolute left-[50px] -translate-x-1/2 top-[-14px] bottom-0 w-px bg-text-muted/40"
                  aria-hidden
                />
                {postsByYear[year].map((post) => (
                  <PostCard key={post._meta.path} post={post} variant="timeline" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {filteredPosts.map((post) => (
            <PostCard key={post._meta.path} post={post} variant="default" />
          ))}
        </div>
      )}
    </div>
  );
```

Changes vs. the previous JSX:
- Filter row gains `py-3 border-t border-b border-[var(--reading-rule)]` to sit between rules (spec §6.2)
- "Filter:" label → uppercase "Filter" eyebrow with `--text-eyebrow` (11px) + `tracking-[0.05em]` + bold (spec §6.2)
- Year heading switches to `--text-h2` and keeps `font-display font-bold` (was `text-[24px]`)
- Outer timeline group spacing `space-y-12` → `space-y-10` (matches overall tightening)

- [ ] **Step 2: Visual verification**

Open `/posts`. Verify:
- The filter row has a 1px top + bottom border, label says "Filter" uppercase
- Clicking a tag inverts the chip
- "2026", "2025" year headings appear visibly larger than before (26–28px vs. 24px previously)
- The 12 → 10 gap reduction is subtle but visible

- [ ] **Step 3: Commit**

```bash
git add src/components/PostList.tsx
git commit -m "feat(post-list): bordered filter rail; --text-h2 year heading; tightened gap"
```

---

## Task 6: Update `RecentPosts.tsx` — eyebrow tokens + section head

**Files:**
- Modify: `src/components/RecentPosts.tsx` (entire file)

- [ ] **Step 1: Replace `RecentPosts.tsx`**

```tsx
import { FC } from "react";
import { Link } from "react-router";
import { PostList } from "./PostList";

export interface RecentPostsProps {
  limit?: number;
}

export const RecentPosts: FC<RecentPostsProps> = ({ limit = 5 }) => {
  return (
    <section className="border-t border-[var(--reading-rule)] pt-[var(--space-h2)] mt-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-mono text-[var(--text-eyebrow)] font-bold tracking-[0.18em] uppercase text-text-primary dark:text-text-primary-dark">
          Recent posts
        </h2>
        <Link
          to="/posts"
          className="font-mono text-[var(--text-meta)] text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
      <PostList variant="default" limit={limit} />
    </section>
  );
};
```

Changes vs. previous:
- Section gets a top border + `pt-[var(--space-h2)]` (spec §6.1)
- Eyebrow uses `--text-eyebrow` (11px) + `tracking-[0.18em]` + `font-bold` (spec §6.1)
- "View all →" uses `--text-meta` mono
- Removed the redundant `pt-6` and `py-8` from the prior section

- [ ] **Step 2: Visual verification**

Open `/`. Confirm "RECENT POSTS" sits below a 1px rule, the spacing above feels generous (~36–50px depending on viewport), and the "View all →" type matches the meta line in the article header.

- [ ] **Step 3: Commit**

```bash
git add src/components/RecentPosts.tsx
git commit -m "feat(recent-posts): top-border section head with token-driven eyebrow"
```

---

## Task 7: Update `Hero.tsx` — display-xl + intro tokens

**Files:**
- Modify: `src/components/Hero.tsx` (entire file)

- [ ] **Step 1: Replace `Hero.tsx`**

```tsx
import { FC } from "react";

export interface HeroProps {
  tags: string;
  headline: string;
  description: string;
}

export const Hero: FC<HeroProps> = ({ tags, headline, description }) => {
  return (
    <section className="flex flex-col gap-6 pt-2 pb-6 md:pt-6 md:pb-10">
      <p className="font-mono text-[var(--text-meta)] tracking-[2px] text-text-muted dark:text-text-secondary">
        {tags}
      </p>
      <h1 className="font-display italic font-normal text-text-primary dark:text-text-primary-dark text-[var(--text-display-xl)] leading-[var(--lh-display)] tracking-[-0.025em]">
        {headline}
      </h1>
      <p className="text-[1.125rem] leading-[1.55] text-text-secondary dark:text-text-secondary-dark">
        {description}
      </p>
    </section>
  );
};
```

Changes vs. previous:
- Section padding now `pt-2 pb-6 md:pt-6 md:pb-10` per spec §6.1 ("Hero. Section padding…")
- Eyebrow uses `--text-meta` instead of hard-coded `text-[13px]`
- h1 uses `--text-display-xl` (clamp 40 → 56px) + `--lh-display` + letter-spacing -0.025em (spec §6.1)
- Description now explicitly `text-[1.125rem]` + `leading-[1.55]` (was `text-lg leading-[1.6]`)

- [ ] **Step 2: Visual verification**

Open `/`. Resize browser between 375px (mobile) and 1440px (desktop). Headline should fluidly clamp between 40px and 56px. Description is 18px and leads at 1.55. Tags eyebrow is 13px mono with tracked-out letterspacing.

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.tsx
git commit -m "feat(hero): display-xl headline with token-driven scale"
```

---

## Task 8: Update `PostsPage.tsx`

**Files:**
- Modify: `src/components/pages/PostsPage.tsx` (entire file)

- [ ] **Step 1: Replace `PostsPage.tsx`**

```tsx
import { FC } from "react";
import { PostList } from "../PostList";

export const PostsPage: FC = () => {
  return (
    <div className="not-prose">
      {/* Header */}
      <section className="pb-7 md:pb-8">
        <h1 className="font-display italic font-semibold tracking-[-0.014em] text-text-primary dark:text-text-primary-dark text-[var(--text-display)] leading-[var(--lh-display)] mb-4">
          All Posts
        </h1>
        <p className="text-[var(--text-body)] leading-[var(--lh-body)] text-text-secondary dark:text-text-secondary-dark max-w-[36em]">
          Thoughts on frontend development, AI exploration, design, and everything in between.
        </p>
      </section>

      {/* Posts with filter */}
      <PostList variant="timeline" showFilter />
    </div>
  );
};
```

Changes vs. previous:
- Section padding `pb-8` → `pb-7 md:pb-8` (spec §6.2)
- h1 swaps `text-[36px] md:text-[42px]` for `text-[var(--text-display)] leading-[var(--lh-display)]`
- Description uses `--text-body` (16px) + max-width `36em` (was `max-w-xl` ≈ 36rem, but the spec calls for 36em — switch to em)

- [ ] **Step 2: Visual verification**

Open `/posts`. h1 should clamp between 36px and 44px (verify by resizing). The intro paragraph should wrap at roughly 36 character widths of body type (notably narrower than before).

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/PostsPage.tsx
git commit -m "feat(posts-page): token-driven h1 + body description"
```

---

## Task 9: Update `AboutPage.tsx` — h1 token + drop `prose` plugin + skills h2

The biggest behavior change here is **removing** the `prose prose-neutral dark:prose-invert prose-p:text-text-body dark:prose-p:text-text-body-dark prose-p:leading-relaxed` classes from the bio section. The bio uses the same `.post-body`-style cascade so prose and post-body don't fight.

**Files:**
- Modify: `src/components/pages/AboutPage.tsx` (entire file)

- [ ] **Step 1: Replace `AboutPage.tsx`**

```tsx
import { FC, PropsWithChildren } from "react";
import { siteConfig } from "~/config";
import { Tag } from "../Tag";

export const AboutPage: FC<PropsWithChildren> = ({ children }) => {
  const { avatar, skills } = siteConfig.about ?? {};

  return (
    <div className="not-prose">
      {/* Profile Section */}
      <section className="pb-10 md:pb-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar */}
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-border-light dark:bg-border-dark flex-shrink-0" />
          )}

          {/* Info */}
          <div>
            <h1 className="font-display italic font-semibold tracking-[-0.014em] text-text-primary dark:text-text-primary-dark text-[var(--text-display)] leading-[var(--lh-display)] mb-4">
              About Me
            </h1>
            <div className="flex items-center gap-4 mb-4">
              {siteConfig.socialLinks?.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
                  aria-label={link.label}
                >
                  <span className={`${link.icon} w-5 h-5`} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bio Section — reuses .post-body rules so it matches article body */}
      {children ? (
        <section className="pb-10 md:pb-12">
          <div className="post-body">
            {children}
          </div>
        </section>
      ) : null}

      {/* Skills Section */}
      {skills && skills.length > 0 ? (
        <section>
          <h2 className="font-display font-semibold text-[var(--text-h2)] leading-[var(--lh-heading)] tracking-[-0.012em] text-text-primary dark:text-text-primary-dark mb-4">
            Interests &amp; Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string) => (
              <Tag key={skill} label={skill} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
```

Changes vs. previous:
- h1: `text-[36px] md:text-[42px] tracking-[-1px]` → `text-[var(--text-display)] leading-[var(--lh-display)] tracking-[-0.014em]`
- Bio wrapper: `prose prose-neutral dark:prose-invert max-w-none prose-p:text-text-body dark:prose-p:text-text-body-dark prose-p:leading-relaxed` → **`post-body`** (spec §6.3: "drops the Tailwind `prose` plugin classes; uses the same explicit token rules as `.post-body`")
- Skills h2: `text-xl font-medium` → `font-display font-semibold text-[var(--text-h2)]` (spec §6.3 "h2 uses `--text-h2` Playfair")

> **Note for implementer:** the `@plugin "@tailwindcss/typography"` import in `src/index.css` stays. We're just not applying its utility classes on the bio section anymore. Removing the plugin would affect any other consumer if one is added later; out of scope here.

- [ ] **Step 2: Visual verification**

Open `/about`. Verify:
- h1 clamps 36–44px
- Bio paragraphs match the article body (16px, line-height 1.7), no longer the `prose` plugin's defaults
- Bio still reads in dark mode (color comes from `.post-body`'s explicit `--color-text-body` token, not from `prose-invert`)
- Skills h2 is Playfair, semibold, 26–28px (matches `--text-h2`)

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/AboutPage.tsx
git commit -m "feat(about): token-driven h1/skills h2; bio adopts .post-body"
```

---

## Task 10: Update `PostWrapper.tsx` — article header tokens + tightened padding

This task only touches the **article header** + padding. The TOC integration comes in Task 14. Do not add `<Toc>` yet.

**Files:**
- Modify: `src/components/wrapper/PostWrapper.tsx` (the JSX for the article `<header>` block)

- [ ] **Step 1: Replace the `<header>` and `<article>` blocks**

Keep imports, hooks, and helpers (`estimateReadTime`, `format`, etc.) unchanged. Inside the returned JSX, replace the `<article>...</article>` block with:

```tsx
        <article className="flex-grow min-w-0" lang={lang}>
          {/* Article Header */}
          <header className="text-center pb-7 mb-8 md:pb-8 md:mb-10 border-b border-[var(--reading-rule)]">
            {/* Meta info */}
            <div className="flex items-center justify-center gap-2.5 font-mono text-[var(--text-meta)] text-text-muted mb-5 tabular-nums">
              {formattedDate ? (
                <time dateTime={matchedPage?.date}>{formattedDate}</time>
              ) : null}
              {formattedDate && readTime ? (
                <span aria-hidden>&middot;</span>
              ) : null}
              {readTime ? (
                <span>{readTime} min read</span>
              ) : null}
            </div>

            {/* Title */}
            <h1 className="post-title text-[var(--text-display)] text-text-primary dark:text-text-primary-dark mb-5">
              {matchedPage?.title}
            </h1>

            {/* Tags */}
            {tags.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {tags.map((tag: string) => (
                  <Tag key={tag} label={tag} />
                ))}
              </div>
            ) : null}
          </header>

          {/* Article Content */}
          <div className="post-body">
            {children}
          </div>
        </article>
```

Changes vs. previous:
- `pb-9 mb-10 md:pb-10 md:mb-12` → `pb-7 mb-8 md:pb-8 md:mb-10` (spec §5)
- Border color uses `--reading-rule` token (was `border-border-light dark:border-border-dark` — visually identical because the tokens share the same hex, but the rule token is the right semantic choice for reading-surface dividers)
- Meta line uses `font-mono text-[var(--text-meta)]` (was hard-coded `text-[13px]`)
- h1 uses `--text-display` (was `text-[2rem] leading-[1.18] md:text-[3rem] md:leading-[1.12]`)
- `post-title` class supplies family / weight / letter-spacing / line-height (Task 2 already updated the class)

- [ ] **Step 2: Visual verification**

Open any post (`/posts/understand-your-agents-better`). Verify:
- Title clamps 36 → 44px between viewports
- Meta line is 13px mono
- The header divider sits closer to the title than before (proportional to the new scale)
- Tag chips beneath title render at 11px pill

- [ ] **Step 3: Commit**

```bash
git add src/components/wrapper/PostWrapper.tsx
git commit -m "feat(post-wrapper): token-driven article header + tightened padding"
```

---

## Task 11: Update `Header.tsx` + `Footer.tsx` — mobile padding

Tiny task, but the spec calls it out explicitly: mobile `px-5` → `px-4`, matching the main column.

**Files:**
- Modify: `src/components/layout/Header.tsx:7`
- Modify: `src/components/layout/Footer.tsx:6`

- [ ] **Step 1: Header — replace the `<header>` opening tag**

In `src/components/layout/Header.tsx`, replace line 7:

```tsx
    <header className="w-full py-4 px-5 md:py-5 md:px-16 text-text-secondary dark:text-text-secondary-dark sticky top-0 z-10 backdrop-blur-md bg-bg-light/85 dark:bg-bg-dark/85">
```

with:

```tsx
    <header className="w-full py-4 px-4 md:py-5 md:px-16 text-text-secondary dark:text-text-secondary-dark sticky top-0 z-10 backdrop-blur-md bg-bg-light/85 dark:bg-bg-dark/85">
```

(`px-5` → `px-4`)

- [ ] **Step 2: Footer — replace the `<footer>` opening tag**

In `src/components/layout/Footer.tsx`, replace line 6:

```tsx
    <footer className="w-full py-6 px-5 md:py-8 md:px-16 mt-auto">
```

with:

```tsx
    <footer className="w-full py-6 px-4 md:py-8 md:px-16 mt-auto">
```

- [ ] **Step 3: Also tighten the main column's mobile padding in `src/root.tsx`**

The spec calls for mobile column padding 16px (px-4), matching header/footer. In `src/root.tsx:74`, replace:

```tsx
          <main className="flex flex-col flex-grow w-full max-w-[800px] mx-auto px-5 py-8 md:px-16 md:py-12">
```

with:

```tsx
          <main className="flex flex-col flex-grow w-full max-w-[800px] mx-auto px-4 py-8 md:px-16 md:py-12">
```

- [ ] **Step 4: Visual verification on a narrow viewport**

Open dev server at viewport 375px. Confirm header logo, nav, main content, and footer all flush at 16px from the left edge. No horizontal scroll.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/Footer.tsx src/root.tsx
git commit -m "feat(chrome): align mobile padding to 16px across header, main, footer"
```

---

## Task 12: Build `BackToTop.tsx` and mount it in `root.tsx`

Floating circular button. Appears when `window.scrollY > 200`. Click → smooth scroll to top (respects `prefers-reduced-motion`).

**Files:**
- Create: `src/components/BackToTop.tsx`
- Modify: `src/root.tsx` (mount once, outside `<main>`)

- [ ] **Step 1: Write a Playwright spec for BackToTop**

Create `e2e/tests/typography.spec.ts` (this file will accumulate assertions across the redesign; start it now). For now it asserts BackToTop appears past 200px scroll and disappears below.

```ts
import { test, expect } from "../fixtures";

test.describe("BackToTop", () => {
  test("hidden until 200px scroll, then visible; click scrolls to top", async ({
    page,
  }) => {
    await page.goto("/posts/understand-your-agents-better");
    await page.waitForLoadState("networkidle");

    const button = page.getByRole("button", { name: /back to top/i });
    await expect(button).toBeHidden();

    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
    await expect(button).toBeVisible();

    await button.click();
    await page.waitForFunction(() => window.scrollY < 50);
    await expect(button).toBeHidden();
  });
});
```

- [ ] **Step 2: Run the spec and watch it fail**

```bash
pnpm test:e2e e2e/tests/typography.spec.ts --reporter=line
```

Expected: FAIL — the `getByRole('button', { name: /back to top/i })` locator returns nothing because the component does not exist yet.

- [ ] **Step 3: Create `src/components/BackToTop.tsx`**

```tsx
import { FC, useEffect, useState } from "react";

const SCROLL_THRESHOLD = 200;

export const BackToTop: FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onClick = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-text-primary text-bg-light shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-opacity duration-200 dark:bg-text-primary-dark dark:text-bg-dark ${
        visible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <span className="iconify w-5 h-5" data-icon="grommet-icons:up" aria-hidden />
    </button>
  );
};
```

> **Iconify note:** the project pulls icons via `@iconify/tailwind4` (see `src/index.css`). The grommet-icons set is already a dev dep. If `data-icon` isn't picked up by the tailwind iconify integration in this project (it usually requires class-based usage like `<span className="i-grommet-icons-up" />`), swap the span for an inline SVG arrow as fallback:
>
> ```tsx
> <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
>   <path d="M12 19V5" />
>   <path d="m5 12 7-7 7 7" />
> </svg>
> ```
>
> Verify visually which works in this codebase. The inline SVG is the safer default.

- [ ] **Step 4: Mount it in `root.tsx`**

In `src/root.tsx`, add the import:

```tsx
import { BackToTop } from "~/components/BackToTop";
```

Then in the `<body>` block, place `<BackToTop />` immediately after `</Footer>` (still inside `<body>`, outside the flex column wrapper or at the end of it — either is fine, since the button is `position: fixed`):

```tsx
      <body className="bg-bg-light dark:bg-bg-dark text-text-primary dark:text-text-primary-dark font-sans">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex flex-col flex-grow w-full max-w-[800px] mx-auto px-4 py-8 md:px-16 md:py-12">
            <MDXProvider components={components}>{children}</MDXProvider>
          </main>
          <Footer />
        </div>
        <BackToTop />
        <GoogleAnalytics gaId={__INJECTED_GA_ID__} />
        <Scripts />
      </body>
```

- [ ] **Step 5: Re-run the spec — expect PASS**

```bash
pnpm test:e2e e2e/tests/typography.spec.ts --reporter=line -g "BackToTop"
```

Expected: PASS for "hidden until 200px scroll".

If the test still fails on the `aria-hidden` toggle, double-check that `toBeHidden()` Playwright matcher respects `aria-hidden="true"` + `pointer-events: none` + `opacity: 0`. In current Playwright, `toBeHidden` checks for visibility per the WAI-ARIA spec; `aria-hidden="true"` + zero opacity is sufficient.

- [ ] **Step 6: Visual verification**

Run `pnpm dev`. Scroll any page past ~200px. Confirm:
- Button appears bottom-right
- Clicking smoothly scrolls to top
- Button fades back out below 200px
- Background is `text-primary` (charcoal in light mode, paper in dark)
- Renders on every page, not just posts (verify on `/`, `/posts`, `/about`)

- [ ] **Step 7: Commit**

```bash
git add src/components/BackToTop.tsx src/root.tsx e2e/tests/typography.spec.ts
git commit -m "feat(back-to-top): floating button on all pages"
```

---

## Task 13: Build the `Toc.tsx` component

The component does two jobs:
1. Walk the rendered `.post-body` DOM after mount to extract `h2` / `h3` headings (text + `id`).
2. Track which heading is currently in view via `IntersectionObserver` and apply an "active" style.

It exposes two variants via prop:
- `variant="desktop"` — renders the sticky rail markup (the wrapping `.post-toc-desktop` selector lives in `index.css`; see Task 14 for those rules)
- `variant="mobile"` — renders the collapsible pill, collapsed by default

This task creates the component **in isolation**. It is not yet rendered anywhere; Task 14 wires it into PostWrapper.

**Files:**
- Create: `src/components/Toc.tsx`

- [ ] **Step 1: Sketch the Playwright spec for TOC behavior**

Append to `e2e/tests/typography.spec.ts`:

```ts
test.describe("Toc — desktop rail", () => {
  test("renders at ≥1280px with h2/h3 entries linked by id", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/posts/understand-your-agents-better");
    await page.waitForLoadState("networkidle");

    const rail = page.locator(".post-toc-desktop");
    await expect(rail).toBeVisible();

    const links = rail.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    const firstHref = await links.first().getAttribute("href");
    expect(firstHref).toMatch(/^#/);
  });

  test("desktop rail hidden below 1280px", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/posts/understand-your-agents-better");
    await page.waitForLoadState("networkidle");

    const rail = page.locator(".post-toc-desktop");
    await expect(rail).toBeHidden();
  });
});

test.describe("Toc — mobile pill", () => {
  test("renders below 1280px, collapsed by default, toggles open", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/posts/understand-your-agents-better");
    await page.waitForLoadState("networkidle");

    const pill = page.locator(".post-toc-mobile");
    await expect(pill).toBeVisible();

    const list = pill.locator("ul").first();
    await expect(list).toBeHidden();

    await pill.getByRole("button", { name: /contents/i }).click();
    await expect(list).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the new specs and watch them fail**

```bash
pnpm test:e2e e2e/tests/typography.spec.ts -g "Toc" --reporter=line
```

Expected: all three TOC tests FAIL — `.post-toc-desktop` / `.post-toc-mobile` don't exist.

- [ ] **Step 3: Create `src/components/Toc.tsx`**

```tsx
import { FC, useEffect, useRef, useState } from "react";

interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

interface TocProps {
  variant: "desktop" | "mobile";
}

const collectEntries = (): TocEntry[] => {
  const nodes = document.querySelectorAll<HTMLElement>(
    ".post-body h2, .post-body h3"
  );
  const entries: TocEntry[] = [];
  nodes.forEach((node) => {
    const id = node.id;
    if (!id) return;
    const text = node.textContent?.trim() ?? "";
    if (!text) return;
    entries.push({
      id,
      text,
      level: node.tagName === "H2" ? 2 : 3,
    });
  });
  return entries;
};

export const Toc: FC<TocProps> = ({ variant }) => {
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Walk the post-body once after mount
  useEffect(() => {
    setEntries(collectEntries());
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    if (entries.length === 0) return;

    const nodes = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((node): node is HTMLElement => node !== null);

    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        // Pick the first heading whose top is within the viewport's top 30%
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    nodes.forEach((node) => observer.observe(node));
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  const list = (
    <ul className="m-0 list-none p-0">
      {entries.map((entry) => {
        const isActive = activeId === entry.id;
        const indent = entry.level === 3 ? "pl-[0.8rem]" : "pl-0";
        return (
          <li key={entry.id} className="m-0 p-0">
            <a
              href={`#${entry.id}`}
              className={`block py-1 font-mono text-[var(--text-meta)] leading-[1.7] no-underline transition-colors ${indent} ${
                isActive
                  ? "text-text-primary dark:text-text-primary-dark font-medium border-l-2 border-text-primary dark:border-text-primary-dark -ml-[0.6rem] pl-[0.5rem]"
                  : "text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
              }`}
            >
              {entry.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  if (variant === "desktop") {
    return (
      <aside className="post-toc-desktop" aria-label="Table of contents">
        <div className="toc-inner">
          <p className="mb-2 pb-2 border-b border-[var(--reading-rule)] font-mono text-[var(--text-eyebrow)] font-bold uppercase tracking-[0.18em] text-text-primary dark:text-text-primary-dark">
            Contents
          </p>
          {list}
        </div>
      </aside>
    );
  }

  // Mobile pill
  return (
    <details
      className="post-toc-mobile mb-6 rounded-lg border border-[var(--reading-rule)] bg-[var(--reading-code-bg)]/40"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary
        className="flex items-center justify-between px-3 py-2 cursor-pointer list-none font-mono text-[var(--text-meta)] text-text-secondary dark:text-text-secondary-dark"
        aria-label="Contents"
      >
        <span className="font-bold uppercase tracking-[0.18em] text-text-primary dark:text-text-primary-dark text-[var(--text-eyebrow)]">
          Contents
        </span>
        <span aria-hidden>{open ? "▴" : "▾"}</span>
      </summary>
      <div className="px-3 pb-3 pt-1">{list}</div>
    </details>
  );
};
```

Implementation notes (for the engineer):
- `collectEntries()` queries the DOM **once after mount**. This is acceptable because MDX content is statically rendered; there's no late insertion of headings.
- The IntersectionObserver `rootMargin: "-80px 0px -70% 0px"` means: a heading is "active" once its top crosses the line 80px below the viewport top (clearing the sticky header) AND it has not yet scrolled past 30% from the top. This produces the usual "section I'm reading" highlight.
- `<details>`/`<summary>` is the simplest accessible disclosure pattern. The `onToggle` is fired by the browser when the user clicks; we mirror it into React state so we can render the ▾/▴ glyph.
- `aria-label="Contents"` on `<summary>` ensures `getByRole('button', { name: /contents/i })` resolves in Playwright (`<summary>` reports as `button` to AT).

- [ ] **Step 4: Verify the spec compiles and the new TOC tests still fail on layout**

The component exists now, but it's not rendered anywhere. The tests should still fail at the `.post-toc-desktop` locator step, **not** at TypeScript compile time. Run:

```bash
pnpm test:e2e e2e/tests/typography.spec.ts -g "Toc" --reporter=line
```

Expected: still FAIL (component is not yet mounted). Good — we'll mount it in Task 14.

- [ ] **Step 5: Commit**

```bash
git add src/components/Toc.tsx e2e/tests/typography.spec.ts
git commit -m "feat(toc): component with desktop rail + mobile pill (not yet mounted)"
```

---

## Task 14: Mount `<Toc>` in `PostWrapper.tsx` + add layout CSS

Now wire the TOC into the article surface. Desktop rail is **absolutely positioned** to the left of the 800px article column so the article doesn't shift. Mobile pill renders inline above the first paragraph.

**Files:**
- Modify: `src/components/wrapper/PostWrapper.tsx` (the `<article>` block from Task 10)
- Modify: `src/index.css` (add `.post-toc-desktop` + `.post-toc-mobile` CSS)

- [ ] **Step 1: Add layout CSS for TOC to `src/index.css`**

Append to the `@layer components` block (right after the `.post-body hr { ... }` rule):

```css
  /* --- TOC layout --- */
  .post-layout {
    position: relative;
  }
  .post-toc-desktop {
    display: none;
  }
  @media (min-width: 80rem) {
    .post-toc-desktop {
      display: block;
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
    .post-toc-mobile {
      display: none;
    }
  }
```

- [ ] **Step 2: Wire `<Toc>` into `PostWrapper.tsx`**

Add the import at the top of `PostWrapper.tsx`:

```tsx
import { Toc } from "../Toc";
```

Inside the returned JSX, wrap the `<article>` block in a `.post-layout` div and render both TOC variants. The mobile pill goes inside `<div className="post-body">` *before* `{children}` so it appears above the first paragraph:

```tsx
      {isPost ? (
        <div className="post-layout">
          <Toc variant="desktop" />
          <article className="flex-grow min-w-0" lang={lang}>
            {/* Article Header */}
            <header className="text-center pb-7 mb-8 md:pb-8 md:mb-10 border-b border-[var(--reading-rule)]">
              {/* Meta info */}
              <div className="flex items-center justify-center gap-2.5 font-mono text-[var(--text-meta)] text-text-muted mb-5 tabular-nums">
                {formattedDate ? (
                  <time dateTime={matchedPage?.date}>{formattedDate}</time>
                ) : null}
                {formattedDate && readTime ? (
                  <span aria-hidden>&middot;</span>
                ) : null}
                {readTime ? (
                  <span>{readTime} min read</span>
                ) : null}
              </div>

              {/* Title */}
              <h1 className="post-title text-[var(--text-display)] text-text-primary dark:text-text-primary-dark mb-5">
                {matchedPage?.title}
              </h1>

              {/* Tags */}
              {tags.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {tags.map((tag: string) => (
                    <Tag key={tag} label={tag} />
                  ))}
                </div>
              ) : null}
            </header>

            {/* Article Content */}
            <div className="post-body">
              <Toc variant="mobile" />
              {children}
            </div>
          </article>
        </div>
      ) : (
        <div className="not-prose flex-grow min-w-0">
          {children}
        </div>
      )}
```

- [ ] **Step 3: Run the TOC specs — expect PASS**

```bash
pnpm test:e2e e2e/tests/typography.spec.ts -g "Toc" --reporter=line
```

Expected: all three "Toc" tests PASS:
- Desktop rail visible at 1440px, has linked entries
- Desktop rail hidden at 1024px
- Mobile pill visible at 1024px, list collapsed initially, opens on click

If "desktop rail visible" fails because the article column is centered with auto margins (so the absolutely-positioned rail might still be off-screen on narrower 1280px viewports): the rail's `left: calc(0px - var(--toc-rail-width) - var(--toc-gap))` references the article's left edge, which is centered at `(viewport - 800px) / 2`. At 1280px viewport that's `(1280 - 800) / 2 = 240px` of left flank — exactly enough for the 200px rail + 40px gap. The expression should be exact. If it's off, recheck the `--toc-rail-width` (12.5rem = 200px) and `--toc-gap` (2.5rem = 40px) values.

- [ ] **Step 4: Visual verification**

Run `pnpm dev`. Open a post with multiple h2 sections (e.g. `/posts/understand-your-agents-better`):
- **At ≥ 1280px viewport:** a sticky TOC rail sits to the **left** of the article column; the article column has **not** shifted from center. Scrolling highlights the current section.
- **At < 1280px viewport:** the desktop rail is hidden. A collapsed "Contents ▾" pill sits at the top of the article body. Tapping expands the list; tapping a link jumps to that section.
- **On non-post pages (`/`, `/posts`, `/about`):** no TOC renders anywhere. (`<Toc>` is only mounted inside the `isPost` branch.)

- [ ] **Step 5: Refresh visual snapshots (one-time)**

The redesign intentionally changes a lot of visible pixels. The existing visual-regression baselines in `e2e/snapshots/visual.spec.ts-snapshots/` will mostly fail. Refresh once:

```bash
pnpm test:e2e -g "visual" --update-snapshots
```

Then re-run the full e2e suite:

```bash
pnpm test:e2e --reporter=line
```

Expected: all tests pass, including the new `typography.spec.ts` and the updated visual baselines.

- [ ] **Step 6: Commit**

```bash
git add src/components/wrapper/PostWrapper.tsx src/index.css e2e/snapshots/
git commit -m "feat(toc): mount in post layout; sticky rail ≥1280px, collapsible pill below"
```

---

## Task 15: Final cleanup pass — verify no hardcoded sizes remain

A sweep to catch anything missed. This task **should produce no code changes** if Tasks 1–14 were thorough; if you find a hard-coded size, fix it inline.

**Files:**
- Audit (read-only): every file in the file map above

- [ ] **Step 1: Grep for stragglers**

```bash
grep -rn 'text-\[[0-9]\+px\]\|text-\[1[78]px\]' src/components/ src/components/pages/ src/components/wrapper/ src/components/layout/
```

Expected output: empty (no remaining hard-coded `text-[Npx]` utilities). If hits appear, replace with the matching `text-[var(--text-...)]` token.

- [ ] **Step 2: Grep for the removed `--font-chinese` variable**

```bash
grep -rn 'font-chinese\|:lang(zh' src/
```

Expected output: empty. If hits remain, delete them.

- [ ] **Step 3: Grep for the removed `prose` plugin classes**

```bash
grep -rn 'prose-neutral\|prose-invert\|prose-p:' src/components/
```

Expected output: empty (we removed these from `AboutPage.tsx`). If hits remain elsewhere, evaluate whether that surface should follow the same pattern as About.

- [ ] **Step 4: Full e2e run**

```bash
pnpm test:e2e --reporter=line
pnpm lint
```

Expected: green for both.

- [ ] **Step 5: Commit (only if Steps 1–3 found stragglers; otherwise skip)**

```bash
git add -A
git commit -m "chore: remove remaining hard-coded sizes / dead font tokens"
```

---

## Acceptance criteria

Before merging:

- [ ] Body type is **16px** on every viewport (verify on `/`, `/posts`, `/posts/*`, `/about`)
- [ ] Body line-height is **1.7** on every viewport (≈ 27.2px on a 16px paragraph)
- [ ] h2 in `.post-body` clamps **26 → 28px**, with **margin-top ≈ 52px** at desktop body size
- [ ] h3 clamps **20 → 21px**
- [ ] Post title (`PostWrapper` h1) clamps **36 → 44px**
- [ ] Hero h1 (`/`) clamps **40 → 56px**, italic Playfair, weight 400, letter-spacing -0.025em
- [ ] Mobile column padding is **16px**; desktop unchanged at 64px
- [ ] Column width unchanged at 800px
- [ ] No `:lang(zh)` overrides anywhere in `src/`
- [ ] CJK content in a heading like "AI 与 Frontend" renders with **one consistent size**; only the per-character font-family differs
- [ ] Filter chip (Posts list) inverted when active (filled charcoal/paper)
- [ ] Sticky TOC rail visible at ≥ 1280px; article column **does not shift** when it appears
- [ ] Collapsible TOC pill at < 1280px, collapsed by default
- [ ] BackToTop visible after 200px scroll on every page; click smooth-scrolls to top; respects `prefers-reduced-motion`
- [ ] No new web font weights / subsets loaded (check Network panel — only Inter, Playfair Display, IBM Plex Mono families requested)
- [ ] `pnpm test:e2e` is green
- [ ] `pnpm lint` is green
- [ ] Manual sweep: home, posts list (filter+timeline), at least one post, about — all four read as a cohesive system in both light and dark mode

---

## Out of scope (per spec §13)

These are explicitly **not** part of this plan:
- Constrained-breakout layout for figures/code
- Meta sidebar on desktop
- Footnotes-as-side-notes
- Drop caps / pull quotes
- Sticky reading progress bar
- Print stylesheet
- RSS / OG image typography
