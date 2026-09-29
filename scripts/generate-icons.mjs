/**
 * Renders the site's icon set out of the avatar illustration.
 *
 * Run manually (`pnpm icons`) whenever the avatar changes; the results are
 * committed, so neither the build nor the site depends on this script or on the
 * network.
 *
 *     node scripts/generate-icons.mjs
 *
 * It renders through the Chromium that Playwright already provides (the same
 * trick as scripts/generate-og-image.mjs), so there is no image toolchain to
 * install: `drawImage` does the scaling and the canvas encoders produce the
 * files.
 *
 * What it writes — every file is the whole illustration, only resized and
 * re-encoded, never cropped or masked:
 *
 *   favicon.ico           16 + 32   PNG frames
 *   icon-192.webp          192      webp
 *   logo.webp              128      webp (the header's mark)
 *   apple-touch-icon.png   180      PNG
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { loadAvatar, toDataUrl } from "./lib/avatar.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");

/**
 * The illustration is painted on grainy paper, and PNG — the only format an
 * apple-touch-icon takes — keeps every speck: 69 KB at 180px. Rounding the
 * channels to 16 steps flattens grain nobody can see at the size an iOS icon is
 * actually drawn, and lands that frame at ~26 KB. The 16/32px .ico frames are
 * small enough to leave alone.
 */
const FLATTEN_STEPS = 16;

// One entry per slot: 16/32 cover a browser tab, 128px is 3x the 36px header
// mark, and 180/192 are as large as an icon is ever drawn.
const jobs = [
  { key: "ico16", size: 16, format: "png" },
  { key: "ico32", size: 32, format: "png" },
  { key: "icon192", size: 192, format: "webp" },
  { key: "logo", size: 128, format: "webp" },
  { key: "appleTouch", size: 180, format: "png", flatten: FLATTEN_STEPS },
];

const rendered = await renderIcons(await loadAvatar(), jobs);

await write("favicon.ico", buildIco([
  { size: 16, png: rendered.ico16 },
  { size: 32, png: rendered.ico32 },
]));
await write("icon-192.webp", rendered.icon192);
await write("logo.webp", rendered.logo);
await write("apple-touch-icon.png", rendered.appleTouch);

async function write(file, data) {
  const out = path.join(publicDir, file);
  await fs.writeFile(out, data);
  console.log(`Wrote public/${file} (${Math.round(data.length / 1024)} KB)`);
}

async function renderIcons(avatar, icons) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto("about:blank");

    const encoded = await page.evaluate(
      async ({ dataUrl, icons }) => {
        const image = new Image();
        image.src = dataUrl;
        await image.decode();

        const source = image.naturalWidth;
        const out = {};

        for (const icon of icons) {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = icon.size;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(image, 0, 0, source, source, 0, 0, icon.size, icon.size);

          if (icon.flatten) {
            const pixels = ctx.getImageData(0, 0, icon.size, icon.size);
            const steps = icon.flatten;
            for (let i = 0; i < pixels.data.length; i += 4) {
              for (let channel = 0; channel < 3; channel += 1) {
                const value = pixels.data[i + channel];
                pixels.data[i + channel] = Math.round(value / steps) * steps;
              }
            }
            ctx.putImageData(pixels, 0, 0);
          }

          const type = `image/${icon.format}`;
          const dataUrlOut =
            icon.format === "webp"
              ? canvas.toDataURL(type, 0.85)
              : canvas.toDataURL(type);
          out[icon.key] = dataUrlOut.slice(dataUrlOut.indexOf(",") + 1);
        }

        return out;
      },
      { dataUrl: toDataUrl(avatar), icons }
    );

    return Object.fromEntries(
      Object.entries(encoded).map(([key, base64]) => [key, Buffer.from(base64, "base64")])
    );
  } finally {
    await browser.close();
  }
}

/**
 * Packs PNG frames into a .ico container: a 6-byte header, one 16-byte
 * directory entry per frame, then the frames themselves. ICO has allowed PNG
 * payloads since Vista, which is why these frames are not BMPs.
 */
function buildIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(frames.length, 4);

  const entries = [];
  let offset = header.length + frames.length * 16;

  for (const frame of frames) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(frame.size, 0); // width (0 would mean 256)
    entry.writeUInt8(frame.size, 1); // height
    entry.writeUInt8(0, 2); // palette colours
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(frame.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += frame.png.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...frames.map((frame) => frame.png)]);
}
