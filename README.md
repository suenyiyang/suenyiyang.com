# suenyiyang.com

Personal site and blog built with React Router SSG, Vite, MDX, and Tailwind CSS. Hosted on Cloudflare Pages.

## Stack
- React Router v7 + Vite (prerendered, no SSR)
- MDX with content-collections
- Tailwind CSS
- Waline comments (optional)
- Cloudflare Pages for hosting + CDN (everything, including images)

## Getting started
```bash
pnpm install
pnpm dev
```

## Scripts
- `pnpm dev` - start the Vite dev server (loads `.env`)
- `pnpm build` - build the static site to `build/client/`
- `pnpm serve` - serve the production build locally
- `pnpm deploy` - publish `build/client/` to Cloudflare Pages via Wrangler
- `pnpm icons` - re-cut the favicon/logo set from the avatar (see `scripts/generate-icons.mjs`)
- `pnpm og` - re-render the link-preview card
- `pnpm fonts` - rebuild the sliced CJK webfont (see [Typography](#typography))
- `pnpm lint` - run ESLint

## Content
- MDX pages live in `pages/`; posts live in `pages/posts/<slug>/index.mdx`.
- Frontmatter schema (all optional): `title`, `date`, `description`, `keywords`, `lang` (`zh` or `en`), `url`, `tags`, `comment`.
- If `title` is missing, it is inferred from the first `#` heading.
- **Images are co-located with the post**: drop them in the same folder and reference with relative paths, e.g. `![alt](./diagram.png)`. A remark plugin rewrites these into ESM imports so Vite hashes and bundles them. IDE markdown preview renders them inline.

## Typography

Reading text is a serif stack: **Source Serif 4** for Latin and **Source Han
Serif SC** (思源宋体, Adobe) for CJK. Article summaries use LXGW WenKai (霞鹜文楷)
and meta text uses IBM Plex Mono.

Adobe only ships Source Han Serif as desktop OTF/TTF (the SC variable font is
53 MB), and the community web packages are sliced for "all of CJK" — several MB
per page. This site is prerendered and has a small, stable character set, so it
slices its own: `scripts/build-cjk-font.py` subsets the variable font to the
characters used in `pages/` and `src/` plus GB2312 (6763 hanzi, so comments and
future posts still render), then splits it into `unicode-range` chunks sized by
document frequency.

- Output: `src/fonts/source-han-serif.css` + `src/fonts/source-han-serif/*.woff2`
  (39 chunks, 2.6 MB total; **committed**, so builds and CI never touch the network).
- A page only downloads the chunks its own text needs — 364 KB for the current
  content set, versus 736 KB–1.6 MB with the previous Noto Serif SC slices.
- The `wght` axis (250–900) is kept, so the reading weight (500) and strong
  weight (650) are real weights, not synthetic bold.
- Because subsetting counts as modification, the OFL reserved name rule applies:
  the generated faces are renamed to `Han Serif SC Web`, while the copyright,
  trademark and license records stay inside the font (see
  `src/fonts/source-han-serif/LICENSE.txt`).

```bash
pnpm fonts            # regenerate after adding text with new characters
pnpm fonts -- --report  # ...plus a per-page byte report
```

`pnpm build` runs `scripts/check-font-coverage.mjs` first (`prebuild`), because a
stale font set fails in two different ways: a character no chunk covers would
silently fall back to the OS font, so that fails the build and asks you to run
`pnpm fonts`; a character that is only in the GB2312 headroom renders fine but
from padding-sized chunks, so that just warns. Emoji and the ▴/▾ toc marks are
recorded in the manifest as "the system renders these" and are not flagged.

Requires [uv](https://docs.astral.sh/uv/): the script is a `uv run` script with
its Python dependencies (fonttools, brotli) declared inline. The 53 MB Adobe
source font is downloaded once into `.cache/fonts/` (gitignored).

## Avatar, icons and link previews
- The header mark, the favicon set and the link-preview card are all cut from one
  illustration — the avatar on the CDN, declared in `scripts/lib/avatar.mjs`.
  There is no separate logo artwork.
- `pnpm icons` re-cuts the icon set and `pnpm og` re-renders the card; the results
  are committed, so the build never touches the network. Pass
  `AVATAR_SRC=/path/to.jpeg` to either script to work from a local file.

## Environment variables
Create a `.env` file if needed.

```bash
BASE=/
BUILD_REGION=
WALINE_SERVER_URL=
GA_ID=
```

- `BASE` - base path prefix for routes.
- `WALINE_SERVER_URL` - Waline server endpoint for comments.
- `GA_ID` - Google Analytics ID.

## Deploy

The site is hosted on Cloudflare Pages. Two ways to deploy:

### Git integration (recommended)
1. Connect this repo in the Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Build command: `pnpm install --frozen-lockfile && pnpm build`
3. Build output directory: `build/client`
4. Environment variables: set `WALINE_SERVER_URL`, `GA_ID` as needed (production scope).
5. Add the custom domain `suenyiyang.com` under the project's Custom domains tab.

Every push to `main` then ships automatically.

### Manual via Wrangler
```bash
pnpm build
pnpm deploy
```
First run will prompt `wrangler login`.
