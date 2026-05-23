# Blog Image Viewing Experience — Design

**Date:** 2026-05-24
**Status:** Approved by user, ready for implementation plan
**Scope:** Image presentation across blog posts — click-to-zoom modal, build-time performance optimization, caption authoring model, in-flow rendering polish.

## Goals

Improve the reading experience around images in blog posts without changing how authors capture and embed images. Specifically:

1. **Click-to-zoom** — readers can open any image in a post in a card-style modal with caption, gallery navigation between images in the same post, and standard dismiss interactions.
2. **Performance** — every image ships with modern formats (AVIF/WebP), responsive widths, intrinsic dimensions to prevent CLS, lazy loading, and an LQIP blur placeholder.
3. **Captions** — alt text remains accessibility-only; an explicit markdown image title becomes the visible caption.
4. **In-flow polish** — `<picture>` element, intrinsic sizing, blur-up transition.

## Non-Goals

- Internal pan/zoom inside the modal (fit-to-viewport only).
- Diagram-specific styling (treated identically to photos; transparent-bg re-exports handled separately by the author).
- Click-to-zoom on non-post pages (home, about, links).
- URL hash sync for shareable image links.
- Pinch / wheel / drag zoom interactions.

## Architecture

The feature splits into three boundaries — build, render, runtime — each independently understandable and testable.

```
.mdx source
  ![Alt for a11y](./images/foo.png "Optional caption")
        ↓ (Vite + remark)
remarkMdxRelativeImages (modified)
  inserts import with imagetools query:
    import __mdxRelImg0 from "./images/foo.png?w=480;960;1440&format=avif;webp;png&as=picture";
  emits JSX:
    <img src={__mdxRelImg0} alt="Alt for a11y" title="Optional caption" />
        ↓ (build time, vite-imagetools)
picture metadata { sources: [{srcset, type}...], img: {src, w, h} }
+ LQIP URL (separate import of a 20px-wide WebP variant)
        ↓ (React render)
mdx-components.tsx img renderer
  renders a small client component:
    <figure data-zoomable style={{ backgroundImage: `url(${lqipUrl})` }}>
      <picture>
        <source srcset="..." type="image/avif" />
        <source srcset="..." type="image/webp" />
        <img src="..." width height loading="lazy" decoding="async" />
      </picture>
      {title && <figcaption>{title}</figcaption>}
    </figure>
  Component tracks an internal `loaded` state via React (no DOM walking).
  When the main <img> fires onLoad, state flips and a `loaded` class is
  added to the <figure>; CSS transitions the <img> from opacity 0 to 1.
        ↓ (runtime, post pages only)
PostWrapper mounts <Lightbox /> once
  - Queries [data-zoomable] inside the post container
  - Builds an ordered gallery (src, caption from title, source meta from post title)
  - Attaches click handlers (event delegation)
  - On click → opens modal portal with active image
```

### Boundary 1 — Build pipeline

**Modified:** `vite.config.ts`, `config/remark-mdx-relative-images.ts`

- Add `vite-imagetools` to `vite.config.ts`. **No global `defaultDirectives`** — directives are emitted per-import by the remark plugin so non-MDX image imports (favicons, hero assets imported from TS files) keep their existing behaviour.
- `remarkMdxRelativeImages` is widened to:
  1. Emit a primary import with query `?w=480;960;1440&format=avif;webp;png&as=picture` → returns the picture metadata object.
  2. Emit a secondary import with query `?w=20&format=webp` → returns a URL string for the 20px LQIP placeholder. (Standard vite-imagetools output; a regular file load, not an inline base64 data URL. The placeholder is small enough — a few hundred bytes — that browser fetch is effectively instant.)
  3. Generate JSX of the form `<img src={primary} data-lqip={lqip} alt="..." title="..." />`. The MDX `img` renderer reads both props.

The choice of two separate imports (over a single custom directive) keeps the remark plugin small and uses only documented vite-imagetools features.

If inline base64 LQIP is later desired (for a faster first paint), the path is a custom Vite plugin that reads the 20px file at build time and inlines it; not in this scope.

### Boundary 2 — Render

**Modified:** `src/mdx-components.tsx`

The `img` MDX renderer becomes a small client component that receives picture metadata (as `src`) and the LQIP URL (as `data-lqip`). It renders:

```tsx
function PostImage({ src: picture, "data-lqip": lqip, alt, title }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <figure
      data-zoomable
      className={`post-figure ${loaded ? "loaded" : ""}`}
      style={{ backgroundImage: `url(${lqip})`, backgroundSize: "cover" }}
    >
      <picture>
        {picture.sources.map(s => (
          <source key={s.type} srcSet={s.srcset} type={s.type} />
        ))}
        <img
          src={picture.img.src}
          width={picture.img.w}
          height={picture.img.h}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      </picture>
      {title && <figcaption>{title}</figcaption>}
    </figure>
  );
}
```

The `<img>` is initially `opacity: 0`. The `.loaded` class on the figure transitions it to `opacity: 1` over 200ms, revealing the full image over the LQIP background. Loaded state lives in React (no DOM traversal).

### Boundary 3 — Runtime lightbox

**Created:** `src/components/Lightbox.tsx`
**Modified:** `src/components/wrapper/PostWrapper.tsx`

`PostWrapper` mounts `<Lightbox postTitle={post.title} />` once. The component:

- On mount, queries `figure[data-zoomable]` inside its container ref.
- Builds an ordered list of items, each capturing: the figure's full `<picture>` markup (cloned into the modal preserves AVIF/WebP fallback for free), the alt text, the caption (figcaption text content, possibly empty), and the figure's intrinsic width/height (for aspect-ratio).
- Delegates click events to a wrapping `<div>` around the post body.
- On figure click → `setActiveIndex(idx)`; opens portal modal.
- Modal markup:

```
<div role="dialog" aria-modal data-open onClick={dismissIfBackdrop}>
  <button class="close" aria-label="Close">×</button>
  <button class="prev" aria-label="Previous image">‹</button>
  <article class="lightbox-card">
    <img src srcset width height alt />
    <div class="lightbox-meta">
      <div class="caption">{caption}</div>
      <div class="source">From "{postTitle}"</div>
    </div>
  </article>
  <button class="next" aria-label="Next image">›</button>
</div>
```

State (component-local):
- `activeIndex: number | null`
- `gallery: Item[]` (built once on mount)
- Derived: `isOpen = activeIndex !== null`

Side effects when open:
- Body scroll lock (`document.body.style.overflow = "hidden"`).
- Focus trap; restore focus on close.
- The post container element (the wrapping `<div>` in `PostWrapper` that holds the post body) receives the `inert` attribute. Lightbox markup is rendered to a portal sibling so it remains interactive.
- Keyboard listener: ArrowLeft/Right navigate (wraps), Escape closes.
- Pointer listeners on card for swipe (threshold 50px horizontal → nav; 80px vertical → close).
- `prefers-reduced-motion: reduce` disables scale animation; fade only.

The component renders nothing on the server (uses `useEffect` to set a `mounted` flag before opening the portal). Static HTML still includes the `data-zoomable` figures, so images remain visible without JS.

## Authoring Model

**Image with caption:**
```markdown
![Diagram of the agent runtime loop](./images/runtime.png "How an agent processes a tool call")
```

**Image without caption** (alt-only — current pattern, still works):
```markdown
![diagram-llm](./images/foo.png)
```
→ no figcaption rendered; alt remains for screen readers.

Existing posts gain the lightbox, blur-up, and modern formats automatically. The noisy alt-as-caption text disappears (which was the desired outcome).

## Files

### Modified
- `vite.config.ts` — register `vite-imagetools`.
- `config/remark-mdx-relative-images.ts` — append imagetools query; emit picture metadata import.
- `src/mdx-components.tsx` — img renderer rewritten as picture-based component; figcaption sourced from title.
- `src/components/wrapper/PostWrapper.tsx` — mount `<Lightbox />`; pass post title.
- `package.json` — add `vite-imagetools` (and its `sharp` peer dependency). `sharp` is a native binary; first install adds ~30MB and a few seconds to install time. Build time grows roughly linearly with image count.

### Created
- `src/components/Lightbox.tsx` — modal component, gallery state, interactions.
- Styles: extend `src/index.css` or add a `Lightbox.module.css`; reuse Tailwind utilities where natural.

### Unchanged
- All non-post pages (`pages/about.mdx`, `pages/index.mdx`, `pages/links.mdx`).
- `src/components/Hero.tsx`, `Logo.tsx`, `PostCard.tsx` — their images do not flow through the MDX img renderer.
- Existing remark/rehype plugins beyond the relative-images one.

## Testing

### Playwright (`e2e/`)
- Open a post containing images → click first image → modal opens with caption + source line.
- Press `→` → second image visible; press `←` at index 0 → wraps to last image.
- Press `Esc` → modal closes; focus restores to the originating figure.
- Click backdrop → closes; click inside card → stays open.
- Post with zero images → no console errors; no modal mount work beyond no-op.
- Image authored without title → no `figcaption` element in DOM; modal caption empty (meta line still shows source).
- `prefers-reduced-motion: reduce` → no scale animation (fade only).

### Build verification
- `pnpm build` produces `.avif`, `.webp`, and original-format files under `build/client/assets/` for each post image.
- Lighthouse on `/posts/review-2025` (largest image post) shows LCP improvement and zero CLS from images.

### Manual
- Visual check on `/posts/understand-your-agents-better` (many diagrams) and `/posts/review-2025` (photos) in light + dark themes.
- Mobile breakpoint: card uses near-full viewport; meta line collapses gracefully below ~480px.

## Edge Cases

- **SSR**: Lightbox emits no DOM on the server; portal renders only after hydration. Static HTML remains image-functional without JS.
- **Tall portrait images**: modal `<img>` uses `max-height: 90vh; width: auto; object-fit: contain`.
- **LQIP on transparent PNGs**: blur shows through; accepted limitation (matches conventional implementations).
- **External (non-relative) images**: bypass the relative-images remark plugin; render as a plain `<img>` with `data-zoomable` still applied (lightbox gracefully handles missing srcset).
- **Single-image posts**: `‹` / `›` controls hidden; arrow keys disabled.

## Decisions Log

| Question | Decision | Rationale |
|---|---|---|
| Lightbox visual style | Card modal with caption + source meta | Closest to the post's reading surface; the author picked it from a 3-style mockup. |
| Gallery navigation scope | All images in the post = one gallery | Simplest mental model; arrow keys + swipe + on-screen buttons. |
| Internal zoom | Fit-to-viewport only | Avoids library overhead; matches the casual reading use case. |
| Click-to-zoom trigger | Blog posts only | Keeps home / about / links pages restrained. |
| Captions | Markdown title syntax (`![alt](src "title")`) | Built-in CommonMark; separates a11y alt from visible caption. |
| Performance tier | Full (lazy + dimensions + AVIF/WebP + srcset + LQIP) | User chose maximum quality. |
| Diagram treatment | None (identical to photos) | Author will fix dark-mode-white-box by re-exporting with transparent backgrounds. |
| Lightbox implementation | Custom component | Style C doesn't match any off-the-shelf library; surface is small (~150 lines). |
| Image processing | `vite-imagetools` | Matches Vite-native build; query-string ergonomics fit existing remark plugin shape. |

## Out of Scope (Deferred)

- URL hash sync (`#image-3`) for sharing a specific image.
- Diagram-specific dark-mode styling.
- Click-to-zoom on non-post pages.
- Pinch / wheel / drag zoom inside the modal.
- Image captions on the home page or other static pages.
