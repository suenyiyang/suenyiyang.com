#!/usr/bin/env node
/**
 * Prebuild guard for the sliced CJK webfont.
 *
 * The font in src/fonts/ is generated from the characters the site used at
 * generation time (plus GB2312 as headroom). Edit a page and that assumption
 * can go stale in two different ways, which deserve two different reactions:
 *
 *   - a character no chunk covers at all -> it silently falls back to the
 *     system font (Songti SC / whatever the OS has), so mixed-typeface text
 *     ships. That is a hard failure.
 *   - a character outside the corpus the slices were planned for, but still
 *     inside GB2312 -> it renders correctly, just from chunks that were sized
 *     for "unused padding" rather than for this page. Correct but heavier, so
 *     it only warns.
 *
 * Runs on `prebuild`; no dependencies, so it also works on Cloudflare Pages
 * (which has no Python/uv).
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS = path.join(ROOT, "src/fonts/source-han-serif.css");
const MANIFEST = path.join(ROOT, "src/fonts/source-han-serif/manifest.json");
const CONTENT_GLOBS = ["pages", "src"];

function parseRanges(css) {
  const ranges = [];
  for (const match of css.matchAll(/unicode-range:\s*([^;]+);/g)) {
    for (const part of match[1].split(",")) {
      const token = part.trim().toLowerCase().replace(/^u\+/, "");
      if (!token) continue;
      if (token.includes("?")) {
        ranges.push([
          parseInt(token.replace(/\?/g, "0"), 16),
          parseInt(token.replace(/\?/g, "f"), 16),
        ]);
      } else if (token.includes("-")) {
        const [lo, hi] = token.split("-");
        ranges.push([parseInt(lo, 16), parseInt(hi, 16)]);
      } else {
        const cp = parseInt(token, 16);
        ranges.push([cp, cp]);
      }
    }
  }
  return ranges;
}

function collectContentChars() {
  const chars = new Set();
  for (const dir of CONTENT_GLOBS) {
    const root = path.join(ROOT, dir);
    if (!existsSync(root)) continue;
    const walk = (current) => {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(mdx?|tsx?)$/.test(entry.name)) {
          for (const ch of readFileSync(full, "utf8")) {
            if (ch.codePointAt(0) > 0x7f) chars.add(ch);
          }
        }
      }
    };
    walk(root);
  }
  return chars;
}

if (!existsSync(CSS) || !existsSync(MANIFEST)) {
  console.error(
    "✖ src/fonts/source-han-serif.css is missing — run `pnpm fonts` first."
  );
  process.exit(1);
}

const ranges = parseRanges(readFileSync(CSS, "utf8"));
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const content = collectContentChars();

const covered = (cp) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi);
// Emoji and marks Adobe's font has no glyphs for: the OS renders those, by
// design, so they are not "missing coverage".
const unsupported = new Set(manifest.unsupported ?? "");
const missing = [...content]
  .filter((ch) => !covered(ch.codePointAt(0)) && !unsupported.has(ch))
  .sort();
const corpus = new Set(manifest.corpus);
const newChars = [...content]
  .filter((ch) => !corpus.has(ch) && !unsupported.has(ch))
  .sort();

if (missing.length) {
  console.error(
    `\n✖ ${missing.length} character(s) in pages/ or src/ have no font chunk:\n` +
      `    ${missing.join(" ")}\n\n` +
      `  They would fall back to the OS font, mixing typefaces in one paragraph.\n` +
      `  Run \`pnpm fonts\` to re-slice ${manifest.family} for the current content.\n`
  );
  process.exit(1);
}

if (newChars.length) {
  console.log(
    `\n⚠ ${newChars.length} new character(s) not in the slice plan (${
      manifest.coverage
    } glyphs, sliced for: ${manifest.corpus.length} corpus chars):\n` +
      `    ${newChars.slice(0, 40).join(" ")}${newChars.length > 40 ? " …" : ""}\n` +
      `  Rendering is fine (GB2312 headroom covers them), but \`pnpm fonts\` would\n` +
      `  pack them into the page-sized chunks instead of the padding chunks.\n`
  );
}

console.log(
  `✓ CJK font covers all ${content.size} non-ASCII characters in pages/ and src/ ` +
    `(${manifest.family}, ${manifest.coverage} glyphs` +
    (unsupported.size ? `, ${unsupported.size} left to the system font)` : ")")
);
