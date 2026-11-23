/**
 * Renders public/og.jpg — the link-preview card Feishu, X, Slack and the rest
 * of the unfurlers show for https://suenyiyang.com.
 *
 * Run manually (`pnpm og`) whenever the avatar or the wording changes; the
 * result is committed, so the build never depends on a browser or the network.
 *
 *     node scripts/generate-og-image.mjs
 *
 * It renders through the Chromium that Playwright already provides: that gets
 * the real site font (LXGW WenKai) and real text layout instead of whatever
 * fontconfig happens to find, at the cost of one headless page load.
 *
 * JPEG rather than the PNG the card started as: the portrait is a paper-textured
 * illustration, which costs ~750 KB in PNG and ~110 KB here, and the unfurlers
 * that read og:image all take JPEG.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { loadAvatar, toDataUrl } from "./lib/avatar.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Keep in sync with siteConfig.metadata (src/config/index.tsx).
const siteName = "Yiyang Suen";
const description =
  "Personal blog including frontend tech, life sharing, AI exploration and more.";
const siteHost = "suenyiyang.com";

// The avatar is painted on cream paper: #ECE4D7 averaged over its background,
// close enough that the card's flat fill reads as the same paper.
const ink = "#1A1817";
const secondaryInk = "#575653";
const mutedInk = "#878580";
const surface = "#ECE5D7";

const WIDTH = 1200;
const HEIGHT = 630;

const asDataUrl = async (file, mime) =>
  `data:${mime};base64,${(await fs.readFile(file)).toString("base64")}`;

const inlineFontCss = async (pkg, cssFile) => {
  const cssPath = path.join(root, "node_modules", pkg, cssFile);
  const cssDir = path.dirname(cssPath);
  const css = await fs.readFile(cssPath, "utf8");
  const matches = [...css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)];
  const replacements = await Promise.all(
    matches.map(async ([full, rel]) => [
      full,
      `url(${await asDataUrl(path.resolve(cssDir, rel), "font/woff2")})`,
    ])
  );
  let inlined = css;
  for (const [from, to] of replacements) {
    inlined = inlined.replace(from, to);
  }
  return inlined;
};

const avatar = await loadAvatar();

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      ${await inlineFontCss("lxgw-wenkai-webfont", "lxgwwenkai-regular.css")}
      ${await inlineFontCss("lxgw-wenkai-webfont", "lxgwwenkai-bold.css")}

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        width: ${WIDTH}px;
        height: ${HEIGHT}px;
        position: relative;
        overflow: hidden;
        background: ${surface};
        color: ${ink};
        font-family: "LXGW WenKai", "Kaiti SC", "STKaiti", "KaiTi", serif;
        -webkit-font-smoothing: antialiased;
      }

      /* The illustration is square and its paper background is ${surface}, so
         it sits flush against the right edge — the browser scales the full
         1254px avatar down to the card. Its left edge gets a short fade: the
         grain stops there, and a hard line against the card's flat fill reads
         as a mistake. */
      .avatar {
        position: absolute;
        top: 0;
        right: 0;
        width: ${HEIGHT}px;
        height: ${HEIGHT}px;
        -webkit-mask-image: linear-gradient(to right, transparent 0, #000 72px);
        mask-image: linear-gradient(to right, transparent 0, #000 72px);
      }

      /* Never wider than the gap the portrait leaves, or the copy runs under
         the illustration and gets covered up mid-word. */
      .copy {
        position: absolute;
        top: 0;
        left: 0;
        width: ${WIDTH - HEIGHT}px;
        height: ${HEIGHT}px;
        padding: 0 0 0 88px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      h1 {
        font-size: 74px;
        font-weight: 700;
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
      src="${toDataUrl(avatar)}"
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

const out = path.join(root, "public/og.jpg");
await page.screenshot({ path: out, type: "jpeg", quality: 88 });
await browser.close();

const { size } = await fs.stat(out);
console.log(`Wrote ${path.relative(root, out)} (${WIDTH}×${HEIGHT}, ${Math.round(size / 1024)} KB)`);
