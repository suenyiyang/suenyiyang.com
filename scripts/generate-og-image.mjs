/**
 * Renders public/og.png — the link-preview card Feishu, X, Slack and the rest
 * of the unfurlers show for https://suenyiyang.com.
 *
 * Run manually (`pnpm og`) whenever the avatar or the wording changes; the
 * result is committed, so the build never depends on a browser.
 *
 *     node scripts/generate-og-image.mjs
 *
 * It renders through the Chromium that Playwright already provides: that gets
 * the real site fonts (Source Serif 4 / IBM Plex Mono) and real text layout
 * instead of whatever fontconfig happens to find, at the cost of one headless
 * page load.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Keep in sync with siteConfig.metadata (src/config/index.tsx).
const siteName = "Yiyang Suen";
const description =
  "Personal blog including frontend tech, life sharing, AI exploration and more.";
const siteHost = "suenyiyang.com";

// The avatar illustration paints its own #ECE5D7 background, so using the same
// colour for the card makes it bleed into the card edge without a seam.
const ink = "#1A1817";
const secondaryInk = "#575653";
const mutedInk = "#878580";
const surface = "#ECE5D7";

const WIDTH = 1200;
const HEIGHT = 630;

const asDataUrl = async (file, mime) =>
  `data:${mime};base64,${(await fs.readFile(file)).toString("base64")}`;

const fontFile = (pkg, file) =>
  path.join(root, "node_modules", pkg, "files", file);

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: "Source Serif 4";
        font-style: normal;
        font-weight: 200 900;
        src: url(${await asDataUrl(
          fontFile("@fontsource-variable/source-serif-4", "source-serif-4-latin-wght-normal.woff2"),
          "font/woff2"
        )}) format("woff2-variations");
      }
      @font-face {
        font-family: "IBM Plex Mono";
        font-style: normal;
        font-weight: 400;
        src: url(${await asDataUrl(
          fontFile("@fontsource/ibm-plex-mono", "ibm-plex-mono-latin-400-normal.woff2"),
          "font/woff2"
        )}) format("woff2");
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        width: ${WIDTH}px;
        height: ${HEIGHT}px;
        position: relative;
        overflow: hidden;
        background: ${surface};
        color: ${ink};
        font-family: "Source Serif 4", Georgia, serif;
        -webkit-font-smoothing: antialiased;
      }

      /* The illustration is square and its own background is ${surface}, so it
         sits flush against the right edge. */
      .avatar {
        position: absolute;
        top: 0;
        right: 0;
        width: ${HEIGHT}px;
        height: ${HEIGHT}px;
      }

      .copy {
        position: absolute;
        top: 0;
        left: 0;
        width: ${WIDTH - HEIGHT + 40}px;
        height: ${HEIGHT}px;
        padding: 0 0 0 88px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      h1 {
        font-size: 74px;
        font-weight: 620;
        line-height: 1.08;
        letter-spacing: 0.005em;
      }

      p {
        margin-top: 22px;
        font-size: 29px;
        line-height: 1.45;
        color: ${secondaryInk};
      }

      .host {
        margin-top: 34px;
        font-family: "IBM Plex Mono", ui-monospace, monospace;
        font-size: 21px;
        letter-spacing: 0.04em;
        color: ${mutedInk};
      }
    </style>
  </head>
  <body>
    <div class="copy">
      <h1>${siteName}</h1>
      <p>${description}</p>
      <div class="host">${siteHost}</div>
    </div>
    <img
      class="avatar"
      src="${await asDataUrl(path.join(root, "public/icon-512.png"), "image/png")}"
      alt=""
    />
  </body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
});

await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

const out = path.join(root, "public/og.png");
await page.screenshot({ path: out, type: "png" });
await browser.close();

const { size } = await fs.stat(out);
console.log(`Wrote ${path.relative(root, out)} (${WIDTH}×${HEIGHT}, ${Math.round(size / 1024)} KB)`);
