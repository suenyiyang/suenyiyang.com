# Vendored syntax themes

`flexoki-light.json` and `flexoki-dark.json` are the official Flexoki VS Code
color themes by Steph Ango (kepano), vendored here so `@shikijs/rehype` can use
them (`vite.config.ts`) without a runtime dependency or a network fetch.

- Source: https://github.com/kepano/flexoki/tree/main/vscode
- Files: `Flexoki-Light-color-theme.json`, `Flexoki-Dark-color-theme.json`
- License: MIT — Flexoki is MIT licensed; see https://stephango.com/flexoki
- Retrieved: 2026-09-29 (unmodified; `name` is `Flexoki` in both files)

Only the token colors are consumed. The code panel background comes from
`--reading-code-bg` in `src/index.css` (Flexoki `base-50` / `base-950`), matching
how Obsidian's Minimal theme sets `--code-background` to the secondary surface
rather than the editor background.
