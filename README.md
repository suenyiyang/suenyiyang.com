# suenyiyang.com

Personal site and blog built with React Router SSG, Vite, MDX, and Tailwind CSS.

## Stack
- React Router v7 + Vite
- MDX with content-collections
- Tailwind CSS
- Waline comments (optional)
- Cloudflare R2 for static assets (optional)

## Getting started
```bash
pnpm install
pnpm dev
```

## Scripts
- `pnpm dev` - start the Vite dev server (loads `.env`)
- `pnpm build` - build the site and run the R2 upload step
- `pnpm serve` - serve the production build
- `pnpm lint` - run ESLint

## Content
- MDX pages live in `pages/`; posts live in `pages/posts/`.
- Frontmatter schema (all optional): `title`, `date`, `description`, `keywords`, `lang` (`zh` or `en`), `url`, `tags`, `comment`.
- If `title` is missing, it is inferred from the first `#` heading.
- MDX images can use `public/` paths; when `R2_PUBLIC_URL` is set, absolute paths are prefixed with the CDN base.

## Environment variables
Create a `.env` file if needed.

```bash
BASE=/
BUILD_REGION=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
WALINE_SERVER_URL=
```

- `BASE` - base path prefix for routes.
- `R2_PUBLIC_URL` - CDN base for assets and Vite `base`.
- `R2_*` - required by the postbuild uploader to Cloudflare R2.
- `WALINE_SERVER_URL` - Waline server endpoint for comments.

## Build and deploy
- `pnpm build` outputs `build/` and then runs `scripts/upload-static-resource.ts` to upload `build/client` to R2.
- To build locally without uploading, run:
```bash
NPM_CONFIG_IGNORE_SCRIPTS=1 pnpm build
```
