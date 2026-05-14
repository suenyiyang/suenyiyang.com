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
- `pnpm lint` - run ESLint

## Content
- MDX pages live in `pages/`; posts live in `pages/posts/<slug>/index.mdx`.
- Frontmatter schema (all optional): `title`, `date`, `description`, `keywords`, `lang` (`zh` or `en`), `url`, `tags`, `comment`.
- If `title` is missing, it is inferred from the first `#` heading.
- **Images are co-located with the post**: drop them in the same folder and reference with relative paths, e.g. `![alt](./diagram.png)`. A remark plugin rewrites these into ESM imports so Vite hashes and bundles them. IDE markdown preview renders them inline.

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
