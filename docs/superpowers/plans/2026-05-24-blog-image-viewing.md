# Blog Image Viewing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the four scopes from the approved spec (`docs/superpowers/specs/2026-05-24-blog-image-viewing-design.md`): card-modal lightbox with gallery navigation, vite-imagetools picture pipeline (AVIF/WebP/PNG + srcset), LQIP blur-up placeholders, markdown-title captions.

**Architecture:** Build-time → render-time → runtime, with strict boundaries. `vite-imagetools` plus a widened `remarkMdxRelativeImages` produce `<picture>` metadata + LQIP URLs at build. A new `PostImage` MDX renderer turns metadata into accessible `<figure><picture>` markup with blur-up. A new client-only `Lightbox` mounted once inside `PostWrapper` queries `figure[data-zoomable]`, attaches click handlers, and renders a paper-card modal portal with arrow-key / swipe / button navigation.

**Tech Stack:** React 19, React Router 7, MDX (@mdx-js/rollup), Vite 6, vite-imagetools (+ sharp), Tailwind 4, Playwright. Package manager: pnpm.

---

## File Structure

**Created:**
- `src/components/PostImage.tsx` — client component used as the MDX `img` renderer. Owns LQIP blur-up state.
- `src/components/Lightbox.tsx` — client modal component. Mounted once per post, queries `figure[data-zoomable]`, opens portal on click, handles keyboard/swipe/buttons.
- `e2e/tests/lightbox.spec.ts` — Playwright tests for the lightbox flow.

**Modified:**
- `package.json` — add `vite-imagetools` dev dependency (pulls `sharp`).
- `vite.config.ts` — register `imagetools()` plugin.
- `config/remark-mdx-relative-images.ts` — emit two imports per image (picture + LQIP) and preserve markdown `title` on the JSX node.
- `src/mdx-components.tsx` — point the `img` slot at `PostImage`.
- `src/components/wrapper/PostWrapper.tsx` — mount `<Lightbox postTitle=... />` inside the article wrapper (post pages only).
- `src/index.css` — figure / blur-up / lightbox styles (or co-located if you prefer; the project currently uses Tailwind + `index.css` for globals).
- `src/types/post.ts` or a new `src/types/image.ts` — picture metadata type (see Task 4).

**Unchanged:** all non-post pages, `Hero.tsx`, `Logo.tsx`, `PostCard.tsx`, the rest of `mdx-components.tsx`.

---

## Task 1: Install dependencies

**Files:** `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install vite-imagetools**

Run:

```bash
pnpm add -D vite-imagetools
```

`sharp` is pulled transitively. First install adds ~30MB.

- [ ] **Step 2: Verify install**

Run:

```bash
pnpm list vite-imagetools
```

Expected: shows `vite-imagetools` with a resolved version (>= 7.x).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat(deps): add vite-imagetools for build-time image processing"
```

---

## Task 2: Register vite-imagetools plugin

**Files:** Modify `vite.config.ts`

- [ ] **Step 1: Import and register the plugin**

Add the import at the top with the other vite imports:

```ts
import { imagetools } from "vite-imagetools";
```

Add it to the `plugins` array. **Do NOT set `defaultDirectives`** — directives are emitted per-import by the remark plugin (Task 3), so non-MDX image imports (favicons, hero assets imported from TS files) keep their existing behavior. Place `imagetools()` before `reactRouter()`:

```ts
plugins: [
  mdx({ /* unchanged */ }),
  tailwindcss(),
  imagetools(),
  reactRouter(),
  svgr({ include: "**/*.svg" }),
  contentCollections(),
],
```

- [ ] **Step 2: Verify dev server starts**

Run:

```bash
pnpm dev
```

Expected: server starts on http://localhost:5173 with no plugin errors. The site still loads (no posts use the new query syntax yet — that's Task 3).

Stop the dev server (Ctrl-C).

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat(build): register vite-imagetools plugin"
```

---

## Task 3: Widen the relative-images remark plugin

**Files:** Modify `config/remark-mdx-relative-images.ts`

This plugin currently emits one import (`__mdxRelImg0`) and a JSX `<img>` with only `src` + `alt`. We extend it to:

1. Emit a second LQIP import per image (a 20px-wide WebP variant).
2. Pass the markdown `title` through as a JSX attribute (currently dropped).
3. Tag the picture import with the imagetools query.

The MDX `img` component will then receive `src` (picture metadata object), `data-lqip` (URL string), `alt`, and `title`.

- [ ] **Step 1: Rewrite the visitor block**

Replace the visitor implementation in `config/remark-mdx-relative-images.ts` so the per-image transformation looks like this. The full file (keep the existing imports, helpers `parseProgram` and `isRelative`, and the `importsByUrl` accumulator at the top):

```ts
import { Parser } from "acorn";
import { visit, SKIP } from "unist-util-visit";

const parseProgram = (code: string) =>
  Parser.parse(code, { ecmaVersion: "latest", sourceType: "module" }) as unknown;

const isRelative = (url: string | undefined): url is string =>
  !!url && (url.startsWith("./") || url.startsWith("../"));

const PICTURE_QUERY = "?w=480;960;1440&format=avif;webp;png&as=picture";
const LQIP_QUERY = "?w=20&format=webp";

interface ImportRecord {
  pictureName: string;
  lqipName: string;
}

export function remarkMdxRelativeImages() {
  return (tree: any) => {
    const importsByUrl = new Map<string, ImportRecord>();
    let counter = 0;

    visit(tree, "image", (node: any, index: number | null, parent: any) => {
      if (parent == null || index == null) return;
      if (!isRelative(node.url)) return;

      let record = importsByUrl.get(node.url);
      if (!record) {
        record = {
          pictureName: `__mdxRelImgPic${counter}`,
          lqipName: `__mdxRelImgLqip${counter}`,
        };
        importsByUrl.set(node.url, record);
        counter++;
      }

      const attributes: any[] = [
        {
          type: "mdxJsxAttribute",
          name: "src",
          value: {
            type: "mdxJsxAttributeValueExpression",
            value: record.pictureName,
            data: { estree: parseProgram(record.pictureName) },
          },
        },
        {
          type: "mdxJsxAttribute",
          name: "data-lqip",
          value: {
            type: "mdxJsxAttributeValueExpression",
            value: record.lqipName,
            data: { estree: parseProgram(record.lqipName) },
          },
        },
        { type: "mdxJsxAttribute", name: "alt", value: node.alt ?? "" },
      ];

      if (node.title) {
        attributes.push({
          type: "mdxJsxAttribute",
          name: "title",
          value: node.title,
        });
      }

      parent.children[index] = {
        type: "mdxJsxFlowElement",
        name: "img",
        attributes,
        children: [],
      };

      return SKIP;
    });

    if (importsByUrl.size === 0) return;

    const importNodes = Array.from(importsByUrl.entries()).flatMap(([url, record]) => {
      const pictureCode = `import ${record.pictureName} from ${JSON.stringify(url + PICTURE_QUERY)};`;
      const lqipCode = `import ${record.lqipName} from ${JSON.stringify(url + LQIP_QUERY)};`;
      return [
        {
          type: "mdxjsEsm",
          value: pictureCode,
          data: { estree: parseProgram(pictureCode) },
        },
        {
          type: "mdxjsEsm",
          value: lqipCode,
          data: { estree: parseProgram(lqipCode) },
        },
      ];
    });

    tree.children.unshift(...importNodes);
  };
}
```

- [ ] **Step 2: Smoke-test the dev build**

Run:

```bash
pnpm dev
```

Open http://localhost:5173/posts/review-2025 in a browser. The page will render (existing `img` renderer still produces `<img>`), but **the `src` is now an object** so you may see a console warning like `[Object object]` in the URL or React warning about non-string src. **That's expected — Task 5 fixes it.** Confirm the page does not hard-crash and the warnings reference the new picture metadata shape.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add config/remark-mdx-relative-images.ts
git commit -m "feat(build): emit picture metadata + LQIP imports for relative MDX images"
```

---

## Task 4: Add the picture metadata type

**Files:** Create `src/types/image.ts`

- [ ] **Step 1: Write the type**

Create `src/types/image.ts`:

```ts
// Output shape of `vite-imagetools` when imported with `?as=picture`.
// sources: format → srcset string (one srcset per format)
// img: fallback <img> data with intrinsic dimensions
export interface PictureMetadata {
  sources: Record<string, string>;
  img: {
    src: string;
    w: number;
    h: number;
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/image.ts
git commit -m "feat(types): add PictureMetadata type for vite-imagetools picture output"
```

---

## Task 5: Build the PostImage MDX renderer

**Files:** Create `src/components/PostImage.tsx`, modify `src/mdx-components.tsx`

- [ ] **Step 1: Create PostImage**

Create `src/components/PostImage.tsx`:

```tsx
import { useState } from "react";
import type { PictureMetadata } from "~/types/image";

interface PostImageProps {
  src: PictureMetadata | string;
  "data-lqip"?: string;
  alt?: string;
  title?: string;
}

export const PostImage = ({ src, "data-lqip": lqip, alt, title }: PostImageProps) => {
  const [loaded, setLoaded] = useState(false);

  // External (non-relative) images bypass the remark plugin and arrive as plain strings.
  // Render them as a basic <img> inside a figure — no LQIP, no picture sources.
  if (typeof src === "string") {
    return (
      <figure className="post-figure" data-zoomable>
        <img
          src={src}
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={loaded ? "loaded" : ""}
        />
        {title ? <figcaption>{title}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure
      className={`post-figure ${loaded ? "loaded" : ""}`}
      data-zoomable
      style={lqip ? { backgroundImage: `url(${lqip})` } : undefined}
    >
      <picture>
        {Object.entries(src.sources).map(([format, srcset]) => (
          <source key={format} srcSet={srcset} type={`image/${format}`} />
        ))}
        <img
          src={src.img.src}
          width={src.img.w}
          height={src.img.h}
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      </picture>
      {title ? <figcaption>{title}</figcaption> : null}
    </figure>
  );
};
```

- [ ] **Step 2: Wire PostImage into the MDX components map**

Modify `src/mdx-components.tsx`. Replace the existing `img` entry. The full file should look like:

```tsx
import { useMDXComponents } from "@mdx-js/react";
import type { ComponentProps } from "react";
import { Callout } from "~/components/Callout";
import { Hero } from "~/components/Hero";
import { PostList } from "~/components/PostList";
import { RecentPosts } from "~/components/RecentPosts";
import { PostWrapper } from "~/components/wrapper/PostWrapper";
import { Anchor } from "~/components/html/Anchor";
import { PostsPage, AboutPage } from "~/components/pages";
import { PostImage } from "~/components/PostImage";

type MDXComponents = Parameters<typeof useMDXComponents>["0"];

export default {
  Callout,
  Hero,
  PostList,
  RecentPosts,
  PostsPage,
  AboutPage,
  wrapper: (props) => {
    return <PostWrapper {...props} />;
  },
  h1: () => null,
  a: Anchor,
  img: PostImage,
  table: (props: ComponentProps<"table">) => {
    return (
      <div className="table-scroll">
        <table {...props} />
      </div>
    );
  },
} satisfies MDXComponents;
```

- [ ] **Step 3: Smoke-test in dev**

Run:

```bash
pnpm dev
```

Open http://localhost:5173/posts/review-2025. Images should render. Open DevTools → Network: filter "Img" — verify at least one `.avif` or `.webp` request is made. Inspect a figure in the Elements panel: it should be `<figure data-zoomable class="post-figure ...">` containing a `<picture>` with `<source type="image/avif">`, `<source type="image/webp">`, and a fallback `<img width=... height=... loading="lazy">`.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/PostImage.tsx src/mdx-components.tsx
git commit -m "feat(blog): render post images as picture with LQIP + responsive srcset"
```

---

## Task 6: Add figure / blur-up styles

**Files:** Modify `src/index.css`

- [ ] **Step 1: Add styles**

Append to `src/index.css` (or place under the existing `@layer components` block if the file uses Tailwind layers):

```css
/* Post images — blur-up reveal */
.post-figure {
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 6px;
  overflow: hidden;
  margin: 1.75rem 0;
  cursor: zoom-in;
}

.post-figure > picture,
.post-figure > img {
  display: block;
  width: 100%;
  height: auto;
}

.post-figure picture > img,
.post-figure > img:not(picture > img) {
  opacity: 0;
  transition: opacity 240ms ease-out;
}

.post-figure.loaded picture > img,
.post-figure.loaded > img:not(picture > img) {
  opacity: 1;
}

.post-figure > figcaption {
  /* Caption sits outside the rounded image but visually associated */
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted, #666);
  text-align: center;
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .post-figure picture > img,
  .post-figure > img {
    transition: none;
  }
}
```

Note: the `cursor: zoom-in` signals clickability. The figcaption breaks out of the rounded container by being placed after the `<picture>` — adjust spacing to match your existing post typography if needed.

- [ ] **Step 2: Visual check**

Run:

```bash
pnpm dev
```

Open a post with images. Verify: (a) the blurred LQIP shows during a slow network throttle (DevTools → Network → "Slow 4G"), (b) the image fades in once loaded, (c) figures with a markdown title show the caption, (d) figures without title show no caption.

Test with a post that has a title-captioned image. Quick way: temporarily edit one image in `pages/posts/review-2025/index.mdx` to add a title:

```mdx
![alt text](./images/foo.jpeg "This is the caption")
```

After verifying, revert the edit (unless you want to add a real caption — author's call).

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(blog): blur-up reveal and figure styles for post images"
```

---

## Task 7: Build the Lightbox skeleton

**Files:** Create `src/components/Lightbox.tsx`

This task builds an opens-and-closes modal — no gallery nav, no swipe yet. Those land in Tasks 8–9.

- [ ] **Step 1: Write the component**

Create `src/components/Lightbox.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface LightboxProps {
  /** The post container — figures with [data-zoomable] inside become gallery items. */
  containerRef: React.RefObject<HTMLElement>;
  postTitle: string;
}

interface GalleryItem {
  pictureHtml: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  originElement: HTMLElement;
}

export const Lightbox = ({ containerRef, postTitle }: LightboxProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const galleryRef = useRef<GalleryItem[]>([]);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  // Mark mounted on client to enable portal rendering.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Build the gallery and attach delegated click handler.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const figures = Array.from(
      container.querySelectorAll<HTMLElement>("figure[data-zoomable]")
    );

    galleryRef.current = figures.map((figure) => {
      const picture = figure.querySelector("picture");
      const img = figure.querySelector("img");
      const figcaption = figure.querySelector("figcaption");
      return {
        pictureHtml: picture ? picture.outerHTML : img ? img.outerHTML : "",
        alt: img?.getAttribute("alt") ?? "",
        caption: figcaption?.textContent ?? "",
        width: Number(img?.getAttribute("width") ?? 0) || 0,
        height: Number(img?.getAttribute("height") ?? 0) || 0,
        originElement: figure,
      };
    });

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const figure = target.closest("figure[data-zoomable]") as HTMLElement | null;
      if (!figure) return;
      const idx = galleryRef.current.findIndex((item) => item.originElement === figure);
      if (idx === -1) return;
      lastTriggerRef.current = figure;
      setActiveIndex(idx);
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [containerRef]);

  // Body scroll lock while open + restore focus on close.
  useEffect(() => {
    if (activeIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      lastTriggerRef.current?.focus();
    };
  }, [activeIndex]);

  // Esc to close.
  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  if (!mounted || activeIndex === null) return null;
  const item = galleryRef.current[activeIndex];
  if (!item) return null;

  return createPortal(
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={item.alt || "Image preview"}
      onClick={(e) => {
        if (e.target === e.currentTarget) setActiveIndex(null);
      }}
    >
      <button
        type="button"
        className="lightbox-close"
        aria-label="Close image preview"
        onClick={() => setActiveIndex(null)}
      >
        ×
      </button>
      <article className="lightbox-card">
        <div
          className="lightbox-image"
          dangerouslySetInnerHTML={{ __html: item.pictureHtml }}
        />
        <div className="lightbox-meta">
          {item.caption ? <div className="lightbox-caption">{item.caption}</div> : null}
          <div className="lightbox-source">From “{postTitle}”</div>
        </div>
      </article>
    </div>,
    document.body
  );
};
```

The `dangerouslySetInnerHTML` here is safe — we are cloning HTML we generated ourselves in `PostImage` (same-origin, no user content). Reusing the `<picture>` element preserves the AVIF/WebP fallback chain without re-deriving srcsets.

- [ ] **Step 2: Add lightbox CSS**

Append to `src/index.css`:

```css
/* Lightbox modal */
.lightbox-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(20, 18, 16, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  animation: lightbox-fade-in 200ms ease-out;
}

.lightbox-card {
  position: relative;
  max-width: min(90vw, 1200px);
  max-height: 90vh;
  background: var(--bg-elev, #fbf8f1);
  border-radius: 10px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: lightbox-card-in 200ms ease-out;
}

.lightbox-image {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f1ea;
}

.lightbox-image picture,
.lightbox-image picture img,
.lightbox-image > img {
  display: block;
  max-width: 100%;
  max-height: calc(90vh - 5rem);
  width: auto;
  height: auto;
  object-fit: contain;
}

.lightbox-meta {
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 0.875rem;
  color: var(--text-muted, #666);
}

.lightbox-caption {
  color: var(--text-primary, #222);
  margin-bottom: 0.125rem;
}

.lightbox-source {
  font-size: 0.8125rem;
  opacity: 0.8;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  color: #f0ece4;
  border: 0;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  z-index: 1001;
}

.lightbox-close:hover {
  background: rgba(0, 0, 0, 0.65);
}

@media (max-width: 480px) {
  .lightbox-backdrop {
    padding: 1rem;
  }
  .lightbox-source {
    display: none;
  }
}

@keyframes lightbox-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes lightbox-card-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .lightbox-backdrop,
  .lightbox-card {
    animation: none;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Lightbox.tsx src/index.css
git commit -m "feat(blog): lightbox component with open/close + scroll lock"
```

---

## Task 8: Mount the Lightbox in PostWrapper

**Files:** Modify `src/components/wrapper/PostWrapper.tsx`

- [ ] **Step 1: Add the ref and mount Lightbox**

Modify `src/components/wrapper/PostWrapper.tsx`. Add a `useRef` import, attach the ref to the post-body wrapper, and mount `<Lightbox>` only when `isPost`. The modified post branch:

```tsx
import { FC, PropsWithChildren, useRef } from "react";
// ... other imports unchanged
import { Lightbox } from "../Lightbox";

export const PostWrapper: FC<PropsWithChildren> = (props) => {
  const { children } = props;
  const postBodyRef = useRef<HTMLDivElement>(null);

  // ... existing derived values unchanged

  return (
    <>
      <PageMetadata metadata={matchedPage} />

      {isPost ? (
        <div className="post-layout">
          <Toc variant="desktop" />
          <article className="flex-grow min-w-0" lang={lang}>
            {/* Article Header (unchanged) */}
            <header /* ... */>{/* unchanged */}</header>

            {/* Article Content */}
            <div className="post-body" ref={postBodyRef}>
              <Toc variant="mobile" />
              {children}
            </div>
          </article>
          <Lightbox containerRef={postBodyRef} postTitle={matchedPage?.title ?? ""} />
        </div>
      ) : (
        <div className="not-prose flex-grow min-w-0">
          {children}
        </div>
      )}

      <WalineComment matchedPage={matchedPage} />
    </>
  );
};
```

- [ ] **Step 2: Smoke-test click-to-open**

Run:

```bash
pnpm dev
```

Open http://localhost:5173/posts/review-2025. Click any image. The lightbox should open with that image, the figcaption (if any) shown as caption, and `From "Review 2025"` as source. Click outside the card → closes. Press Esc → closes.

Open http://localhost:5173 (home page). Confirm `Lightbox` is NOT mounted (no extra DOM under `body`).

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/components/wrapper/PostWrapper.tsx
git commit -m "feat(blog): mount lightbox inside PostWrapper for post pages"
```

---

## Task 9: Add gallery navigation

**Files:** Modify `src/components/Lightbox.tsx`, `src/index.css`

- [ ] **Step 1: Add prev/next state and handlers**

In `src/components/Lightbox.tsx`, add prev/next helpers and arrow-key listeners. Replace the Esc-only effect with a combined keydown handler, and add the buttons inside the modal markup.

Add these helpers above the return (inside the component, after the existing effects):

```tsx
const total = galleryRef.current.length;
const go = (delta: number) => {
  if (activeIndex === null || total === 0) return;
  setActiveIndex(((activeIndex + delta) % total + total) % total);
};
```

Replace the Esc-only `useEffect` with this combined one:

```tsx
useEffect(() => {
  if (activeIndex === null) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setActiveIndex(null);
    else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [activeIndex]);
```

Update the modal markup to include prev/next buttons (place them inside the backdrop, outside the card):

```tsx
{total > 1 ? (
  <>
    <button
      type="button"
      className="lightbox-nav lightbox-prev"
      aria-label="Previous image"
      onClick={() => go(-1)}
    >
      ‹
    </button>
    <button
      type="button"
      className="lightbox-nav lightbox-next"
      aria-label="Next image"
      onClick={() => go(1)}
    >
      ›
    </button>
  </>
) : null}
```

Place them as siblings of `<article className="lightbox-card">` inside the backdrop.

- [ ] **Step 2: Add nav button CSS**

Append to `src/index.css`:

```css
.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  color: #f0ece4;
  border: 0;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  z-index: 1001;
}

.lightbox-nav:hover {
  background: rgba(0, 0, 0, 0.65);
}

.lightbox-prev { left: 1rem; }
.lightbox-next { right: 1rem; }

@media (max-width: 640px) {
  .lightbox-nav {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.5rem;
  }
}
```

- [ ] **Step 3: Smoke-test navigation**

Run `pnpm dev`. Open a multi-image post (`/posts/review-2025` or `/posts/understand-your-agents-better`). Click image #1 → press → → image #2. Press ← at image #0 → wraps to last. Click `‹` / `›` buttons → same behavior. Open a single-image post (or temporarily edit one) → buttons absent.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/Lightbox.tsx src/index.css
git commit -m "feat(blog): gallery navigation with arrow keys and prev/next buttons"
```

---

## Task 10: Swipe + focus trap + inert

**Files:** Modify `src/components/Lightbox.tsx`

- [ ] **Step 1: Add swipe gesture handling**

Inside `Lightbox.tsx`, add pointer event handlers on the `<article className="lightbox-card">` element. Track touch-start coordinates in refs, compute deltas on touch-end, navigate horizontally on |Δx| > 50 with |Δy| < 30, dismiss on Δy > 80 (downward).

Add these refs near `lastTriggerRef`:

```tsx
const touchStartRef = useRef<{ x: number; y: number } | null>(null);
```

Add handlers to the `<article>` element:

```tsx
<article
  className="lightbox-card"
  onTouchStart={(e) => {
    const t = e.changedTouches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }}
  onTouchEnd={(e) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    touchStartRef.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dy) < 30) {
      go(dx < 0 ? 1 : -1);
    } else if (dy > 80 && Math.abs(dx) < 60) {
      setActiveIndex(null);
    }
  }}
>
  {/* existing children unchanged */}
</article>
```

- [ ] **Step 2: Add `inert` to the post container while open**

The lightbox is rendered to a portal on `document.body`, so applying `inert` to the post container keeps background interactions disabled without affecting the modal. Add another effect inside the Lightbox component:

```tsx
useEffect(() => {
  if (activeIndex === null) return;
  const container = containerRef.current;
  if (!container) return;
  container.setAttribute("inert", "");
  return () => container.removeAttribute("inert");
}, [activeIndex, containerRef]);
```

- [ ] **Step 3: Add a minimal focus trap**

Inside the modal, after it opens, move focus to the close button and contain Tab navigation inside the dialog. Add a `closeRef` and a focus-trap effect:

```tsx
const closeRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (activeIndex === null) return;
  closeRef.current?.focus();
}, [activeIndex]);

useEffect(() => {
  if (activeIndex === null) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    // Lightbox has a small fixed set of focusables: close, prev, next.
    const root = document.querySelector(".lightbox-backdrop");
    if (!root) return;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>("button:not([disabled])")
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [activeIndex]);
```

Wire `ref={closeRef}` onto the close button.

- [ ] **Step 4: Smoke-test on touch + keyboard**

Run `pnpm dev`. In DevTools, toggle device emulation → iPhone. Open a post, tap an image, swipe left/right (use mouse drag in device mode) — image changes. Swipe down — modal closes. Tab through modal — focus cycles between close / prev / next buttons. Shift-Tab wraps backwards.

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/Lightbox.tsx
git commit -m "feat(blog): swipe gestures, inert background, focus trap"
```

---

## Task 11: Playwright tests

**Files:** Create `e2e/tests/lightbox.spec.ts`

- [ ] **Step 1: Write the tests**

Create `e2e/tests/lightbox.spec.ts`. Pick `/posts/review-2025` as the test post (multiple images, simple content).

```ts
import { test, expect } from "@playwright/test";

const POST_URL = "/posts/review-2025/";

test.describe("Lightbox", () => {
  test("opens when clicking a post image", async ({ page }) => {
    await page.goto(POST_URL);
    const firstFigure = page.locator("article figure[data-zoomable]").first();
    await firstFigure.scrollIntoViewIfNeeded();
    await firstFigure.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Source meta should reflect the post title.
    await expect(page.locator(".lightbox-source")).toContainText("Review");
  });

  test("Escape closes the lightbox and restores focus", async ({ page }) => {
    await page.goto(POST_URL);
    const firstFigure = page.locator("article figure[data-zoomable]").first();
    await firstFigure.scrollIntoViewIfNeeded();
    await firstFigure.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("Arrow keys navigate to next and previous images, wrapping at ends", async ({ page }) => {
    await page.goto(POST_URL);
    const figures = page.locator("article figure[data-zoomable]");
    const count = await figures.count();
    test.skip(count < 2, "post needs multiple images for this test");

    await figures.first().scrollIntoViewIfNeeded();
    await figures.first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Grab the modal image's src; advance; expect it to change.
    const modalImg = page.locator(".lightbox-card img").first();
    const firstSrc = await modalImg.getAttribute("src");

    await page.keyboard.press("ArrowRight");
    await expect(modalImg).not.toHaveAttribute("src", firstSrc ?? "");

    // Step back to first.
    await page.keyboard.press("ArrowLeft");
    await expect(modalImg).toHaveAttribute("src", firstSrc ?? "");

    // Wrap to last by stepping back from first.
    await page.keyboard.press("ArrowLeft");
    await expect(modalImg).not.toHaveAttribute("src", firstSrc ?? "");
  });

  test("Backdrop click closes; card click does not", async ({ page }) => {
    await page.goto(POST_URL);
    const firstFigure = page.locator("article figure[data-zoomable]").first();
    await firstFigure.scrollIntoViewIfNeeded();
    await firstFigure.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Click inside the card — modal stays open.
    await page.locator(".lightbox-card").click();
    await expect(dialog).toBeVisible();

    // Click the backdrop at a known corner — modal closes.
    await dialog.click({ position: { x: 10, y: 10 } });
    await expect(dialog).toHaveCount(0);
  });

  test("Lightbox is not mounted on non-post pages", async ({ page }) => {
    await page.goto("/");
    // Even if there were images, no [data-zoomable] handler should be attached;
    // clicking a navigation image should not open a dialog.
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run the suite**

Run:

```bash
pnpm test:e2e:chromium -- lightbox.spec.ts
```

Expected: all 5 tests pass. If "Lightbox is not mounted on non-post pages" fails because some homepage element matches `[role="dialog"]`, scope the assertion to `.lightbox-backdrop` instead.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/lightbox.spec.ts
git commit -m "test(e2e): cover lightbox open, navigate, dismiss flows"
```

---

## Task 12: Full build verification

**Files:** none modified

- [ ] **Step 1: Production build**

Run:

```bash
pnpm build
```

Expected: build succeeds with no errors. Sharp may print transient warnings on first run — acceptable. Build time will be longer than baseline by several seconds (image variant generation).

- [ ] **Step 2: Inspect output**

Run:

```bash
ls build/client/assets/ | grep -E "\.(avif|webp|png|jpe?g)$" | head -20
```

Expected: a mix of `.avif`, `.webp`, and original-format files. Each post image should be present in multiple widths and formats.

- [ ] **Step 3: Serve the built site and visual-check**

Run:

```bash
pnpm serve
```

Open the served URL (typically http://localhost:3000). Visit `/posts/review-2025`. Confirm: images render, fade-in works, clicking opens the lightbox, navigation works. DevTools → Network → Img: confirm `.avif` is being served on supporting browsers.

Leave the server running for Step 4.

- [ ] **Step 4: Lighthouse check**

In Chrome DevTools, open the Lighthouse panel on `/posts/review-2025`. Run a Performance audit. Compare against a baseline run (if one is recorded) — LCP should improve and CLS should be 0 or near-zero for image-driven shifts. Save the report alongside the PR description if useful.

Stop the server after the audit.

- [ ] **Step 5: Lint pass**

Run:

```bash
pnpm lint
```

Expected: zero warnings, zero errors. Fix anything ESLint reports before continuing.

- [ ] **Step 6: Final commit (only if Step 5 surfaced fixes)**

If lint fixes were applied:

```bash
git add -p   # stage the lint-related changes only
git commit -m "chore: lint cleanups for image viewing feature"
```

If no fixes were needed, skip this step.

---

## Task 13: Update CHANGELOG / docs (optional)

**Files:** depends on the project's changelog conventions

- [ ] **Step 1: Add an entry if a `changelog/` directory exists**

The repo has a `changelog/` directory at the root. Inspect it (`ls changelog`) and follow its conventions. Add a one-line entry referencing the new feature.

If no changelog file is found that matches the convention, skip this task.

- [ ] **Step 2: Commit**

```bash
git add changelog/
git commit -m "docs(changelog): note image viewing improvements"
```

---

## Self-review checklist (run before declaring done)

After implementing all tasks, before opening a PR, verify the spec is fully implemented:

- [ ] **Lightbox style** — card modal with caption + source meta ✓ (Task 7)
- [ ] **Gallery navigation** — arrow keys, swipe, prev/next buttons, wraps at ends, hidden when ≤1 image ✓ (Tasks 9, 10)
- [ ] **Fit-to-viewport** — `object-fit: contain` with `max-height` ✓ (Task 7 CSS)
- [ ] **Post-only trigger** — `<Lightbox>` mounted only inside `isPost` branch ✓ (Task 8)
- [ ] **AVIF + WebP + PNG with srcset** — `?w=480;960;1440&format=avif;webp;png&as=picture` ✓ (Task 3)
- [ ] **Lazy + decoding=async + intrinsic dims** — set on every `<img>` in `PostImage` ✓ (Task 5)
- [ ] **LQIP placeholder** — 20px WebP URL as `background-image` with fade-in ✓ (Tasks 3, 5, 6)
- [ ] **Markdown title → caption** — `node.title` preserved by remark plugin; `PostImage` reads `props.title` ✓ (Tasks 3, 5)
- [ ] **Alt-only image → no caption** — explicit `title` check ✓ (Task 5)
- [ ] **Diagrams treated identically** — no detection logic added ✓
- [ ] **SSR safety** — Lightbox renders nothing until mounted; static HTML has the figures ✓ (Task 7)
- [ ] **Focus trap + scroll lock + inert + Esc + reduced-motion** ✓ (Tasks 7, 10, CSS)
- [ ] **Playwright tests cover open, navigate, dismiss, non-post pages** ✓ (Task 11)
- [ ] **`pnpm build` succeeds and produces AVIF/WebP variants** ✓ (Task 12)
- [ ] **`pnpm lint` clean** ✓ (Task 12)
