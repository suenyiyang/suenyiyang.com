#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["fonttools[woff]>=4.50", "brotli"]
# ///
"""Slice Adobe Source Han Serif SC (思源宋体) into unicode-range webfont chunks.

Why we do this ourselves instead of using a ready-made package:

  * Adobe ships Source Han Serif as desktop OTF/TTF only (Single SC VF OTF is
    53 MB). Serving that to a browser is a ~20x regression on font bytes.
  * The community-sliced web builds (cn-fontsource, jigmo, ...) cover 45k+
    glyphs at ~580 B/glyph, which costs 3-7 MB per page on this site.
  * This blog is fully prerendered, so we know exactly which characters appear
    on which page. We can slice for that reality instead of for "all of CJK".

Pipeline:

  1. Collect the character set: every non-ASCII character used in `pages/` and
     `src/`, plus GB2312 level 1+2 (6763 chars, the everyday Chinese set) so
     comments / future posts / new copy still render, plus CJK punctuation.
  2. Subset the variable font (wght 250-900) to that set once.
  3. Partition the set into chunks. Chunks are grown by document frequency:
     characters that appear on many pages share big files (they get downloaded
     anyway), characters used by one page get smaller files.
  4. Write one woff2 + one `@font-face` rule per chunk into src/fonts/.

Usage:
    uv run scripts/build-cjk-font.py            # build
    uv run scripts/build-cjk-font.py --report   # build + per-page byte report

The generated CSS is imported from src/index.css. Re-run this script whenever
you publish text that introduces new characters (or when you want to re-tune
chunk sizes).
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
import time
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE_FONT = ROOT / ".cache" / "fonts" / "SourceHanSerifSC-VF.otf"
SOURCE_URL = (
    "https://raw.githubusercontent.com/adobe-fonts/source-han-serif/release/"
    "Variable/OTF/SourceHanSerifSC-VF.otf"
)
OUT_DIR = ROOT / "src" / "fonts" / "source-han-serif"
CSS_OUT = ROOT / "src" / "fonts" / "source-han-serif.css"
# The Adobe license reserves the font name "Source", so a modified (subset)
# build must not keep it. We rename the generated faces and keep the Adobe
# origin in the CSS comment and in LICENSE.txt next to the files.
SOURCE_FAMILY = "Source Han Serif SC VF"
FAMILY = "Han Serif SC Web"
PS_NAME = "HanSerifSCWeb"

# Extra ranges always included: CJK punctuation, fullwidth forms, and a few
# symbol blocks that CJK body copy tends to use.
EXTRA_RANGES = [
    (0x00A0, 0x00FF),  # latin-1 punctuation / symbols
    (0x2000, 0x206F),  # general punctuation (—, “”, …, †)
    (0x2070, 0x209F),  # super/subscripts
    (0x20A0, 0x20BF),  # currency
    (0x2100, 0x214F),  # letterlike (№, ™)
    (0x2150, 0x218F),  # number forms
    (0x2190, 0x21FF),  # arrows
    (0x2200, 0x22FF),  # math operators
    (0x2460, 0x24FF),  # enclosed alphanumerics (①, ⑴)
    (0x25A0, 0x25FF),  # geometric shapes (■, ▶)
    (0x2600, 0x26FF),  # misc symbols
    (0x2700, 0x27BF),  # dingbats (✅-ish glyphs)
    (0x3000, 0x303F),  # CJK symbols and punctuation
    (0xFE30, 0xFE4F),  # CJK compatibility forms
    (0xFF00, 0xFFEF),  # halfwidth / fullwidth forms
]

# Chunking: document-frequency tier -> max characters per chunk. Higher tiers
# (used on many pages) get bigger files because they are downloaded anyway;
# page-exclusive characters get small files so a page does not pay for
# characters it never renders.
TIERS: list[tuple[int, int]] = [
    (8, 320),  # site-wide common characters
    (4, 224),
    (2, 160),
    (1, 128),
    (0, 192),  # never used on the site (GB2312 padding, comments, new posts)
]


def log(msg: str) -> None:
    print(msg, flush=True)


def ensure_source() -> None:
    if SOURCE_FONT.exists():
        return
    SOURCE_FONT.parent.mkdir(parents=True, exist_ok=True)
    log(f"downloading {SOURCE_URL}")
    log("  (53 MB, one time, cached in .cache/fonts/)")
    import urllib.request

    with urllib.request.urlopen(SOURCE_URL) as res, SOURCE_FONT.open("wb") as fh:
        while chunk := res.read(1 << 20):
            fh.write(chunk)
    log(f"  saved {SOURCE_FONT.relative_to(ROOT)}")


def gb2312_chars() -> set[str]:
    """GB2312 level 1 + level 2 = 6763 hanzi (everyday Chinese coverage)."""
    chars: set[str] = set()
    for lead in range(0xB0, 0xF8):
        for trail in range(0xA1, 0xFF):
            try:
                chars.add(bytes([lead, trail]).decode("gb2312"))
            except UnicodeDecodeError:
                continue
    return chars


FRONTMATTER = re.compile(r"^---\n([\s\S]*?)\n---\n", re.MULTILINE)


def corpus_docs() -> dict[str, str]:
    """Map doc id -> text, mirroring how the site actually renders pages.

    Post pages render frontmatter (title, summary, tags) *and* body, so the
    frontmatter text is fed to the post doc. The listing pages render only that
    frontmatter, so it is also collected into a synthetic `<listing>` doc —
    without it, title characters look like they belong to one post each and a
    listing page ends up paying for whole post chunks.
    """
    docs: dict[str, str] = {}
    listing: list[str] = []
    for path in sorted((ROOT / "pages").rglob("*.mdx")) + sorted(
        (ROOT / "pages").rglob("*.md")
    ):
        text = path.read_text(encoding="utf8")
        docs[str(path.relative_to(ROOT))] = text
        match = FRONTMATTER.match(text)
        if match:
            listing.append(match.group(1))
    docs["<listing>"] = "\n".join(listing)
    ui: list[str] = []
    for pattern in ("src/**/*.tsx", "src/**/*.ts"):
        for path in sorted(ROOT.glob(pattern)):
            ui.append(path.read_text(encoding="utf8"))
    docs["<ui>"] = "\n".join(ui)
    return docs


def build_charset(docs: dict[str, str], cmap: dict[int, str]) -> tuple[set[str], set[str]]:
    """Return (chars the CJK font can serve, content chars the font lacks).

    The second set is content the system has to render for us — emoji in
    callouts, the ▴/▾ marks in the table of contents. Adobe's font has no
    glyphs for those, so they are recorded rather than silently "missing".
    """
    content: set[str] = set()
    for text in docs.values():
        for ch in text:
            if ord(ch) > 0x7F:
                content.add(ch)
    chars = set(content)
    hanzi = gb2312_chars()
    chars |= hanzi
    for lo, hi in EXTRA_RANGES:
        for cp in range(lo, hi + 1):
            if cp in cmap:
                chars.add(chr(cp))
    out = {c for c in chars if ord(c) in cmap}
    unsupported = {c for c in content if ord(c) not in cmap}
    log(
        f"  {len(out)} in font: {len(out & hanzi)} GB2312 hanzi + symbols/punctuation"
    )
    if unsupported:
        log(f"  {len(unsupported)} content chars are not in the font (emoji, marks)")
    return out, unsupported


def plan_chunks(
    chars: set[str], docs: dict[str, str], site_freq: dict[str, int]
) -> list[list[str]]:
    """Group characters into chunks so a page downloads few, relevant files.

    Characters are banded by document frequency (how many pages use them):
    characters used everywhere are unavoidable for every page, so they live in
    big chunks; characters used by one page live in small chunks. Inside a band,
    characters are ordered by "which pages use me" (their page signature) and
    chunked contiguously, so a chunk tends to cover one page-cluster instead of
    a random slice of the band.
    """
    doc_ids = {name: index for index, name in enumerate(docs)}
    signature: dict[str, int] = {}
    for ch in chars:
        bits = 0
        for name, index in doc_ids.items():
            if ch in docs[name]:
                bits |= 1 << index
        signature[ch] = bits

    chunks: list[list[str]] = []
    for threshold, size in TIERS:
        bucket = [c for c in chars if band_of(signature[c]) == threshold]
        groups: dict[int, list[str]] = {}
        for ch in bucket:
            groups.setdefault(signature[ch], []).append(ch)
        ordered = sorted(
            groups.items(),
            key=lambda kv: (-len(kv[1]), kv[0]),
        )
        current: list[str] = []
        for _sig, members in ordered:
            members.sort(key=lambda c: (-site_freq.get(c, 0), c))
            for start in range(0, len(members), size):
                piece = members[start : start + size]
                current.extend(piece)
                if len(current) >= size:
                    chunks.append(current)
                    current = []
        if current:
            chunks.append(current)
    return chunks


def band_of(df: int) -> int:
    for threshold, _size in TIERS:
        if df >= threshold:
            return threshold
    return 0


def unicode_range(chunk: list[str]) -> str:
    """Compact `unicode-range` value: collapse runs into a-b ranges."""
    cps = sorted(ord(c) for c in chunk)
    parts: list[str] = []
    start = prev = cps[0]
    for cp in cps[1:]:
        if cp == prev + 1:
            prev = cp
            continue
        parts.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
        start = prev = cp
    parts.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
    return ", ".join(parts)


def subset_options() -> subset.Options:
    opts = subset.Options()
    opts.flavor = "woff2"
    # Keep the wght axis (250-900) so the site's 500 / 650 weights stay real
    # weights instead of synthetic bold.
    opts.retain_gids = False
    opts.notdef_outline = True
    # No vertical writing on this site: dropping the vertical features (and the
    # VORG/VVAR tables they pull in) nearly halves the glyph count.
    opts.drop_tables += ["VORG", "vhea", "vmtx"]
    # `locl` is deliberately NOT kept: in the SC build it carries the pan-CJK
    # language alternates, and keeping it drags ~780 extra glyphs per chunk into
    # the font (563 KB vs 333 KB for 1100 chars) with no visible change for
    # zh-Hans text, whose forms are already the build's default cmap targets.
    opts.layout_features = [
        "ccmp",
        "kern",
        "liga",
        "clig",
        "calt",
        "rvrn",
        "mark",
        "mkmk",
    ]
    # Keep the full name table: it carries the OFL copyright notice (nameID 0),
    # trademark and license strings that must travel with the font.
    opts.name_IDs = ["*"]
    return opts


def subset_to_bytes(source: Path, text: str, opts: subset.Options) -> bytes:
    font = subset.load_font(str(source), opts)
    subsetter = subset.Subsetter(options=opts)
    subsetter.populate(text=text)
    subsetter.subset(font)
    rename(font)
    # font.save() alone ignores options.flavor (it would emit a plain OTF,
    # ~40% larger). save_font() applies the woff2 flavor and brotli.
    buf = io.BytesIO()
    subset.save_font(font, buf, opts)
    font.close()
    return buf.getvalue()


def rename(font: TTFont) -> None:
    """Apply the OFL reserved-font-name rule to the modified (subset) build.

    Only the identifying names are rewritten; the copyright (0), trademark (7),
    designer and license (13/14) records are left alone so the OFL notice stays
    attached to the font.
    """
    table = {
        1: FAMILY,
        2: "Regular",
        3: f"{PS_NAME};subset;2.003",
        4: FAMILY,
        6: PS_NAME,
        16: FAMILY,
        17: "Regular",
        21: FAMILY,
        22: "Regular",
    }
    drop = {18, 20}  # legacy macOS compatibility names
    font["name"].names = [
        record for record in font["name"].names if record.nameID not in drop
    ]
    for record in font["name"].names:
        if record.nameID in table:
            record.string = table[record.nameID]
    if "CFF2" in font:
        top = font["CFF2"].cff.topDictIndex[0]
        if hasattr(top, "FontName"):
            top.FontName = PS_NAME


def write_manifest(
    charset: set[str],
    docs: dict[str, str],
    font_version: str,
    unsupported: set[str],
) -> None:
    """Record what the build was sliced for, so the prebuild check can tell
    "content changed, re-run pnpm fonts" apart from "a glyph is missing"."""
    corpus = sorted(
        {ch for text in docs.values() for ch in text if ord(ch) > 0x7F}
    )
    manifest = {
        "family": FAMILY,
        "source": "Adobe Source Han Serif SC VF",
        "sourceVersion": font_version,
        "coverage": len(charset),
        "corpus": "".join(corpus),
        "unsupported": "".join(sorted(unsupported)),
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf8"
    )


def write_css(entries: list[tuple[str, str]]) -> None:
    lines = [
        "/* Generated by scripts/build-cjk-font.py — do not edit by hand. */",
        "/*",
        "   Adobe Source Han Serif SC (思源宋体) Variable, version 2.003,",
        "   SIL OFL 1.1 — see ./source-han-serif/LICENSE.txt in this directory.",
        f"   Subset to this site's characters + GB2312, renamed to '{FAMILY}'",
        "   as the OFL reserved-name rule requires for modified builds, and split",
        f"   into {len(entries)} unicode-range chunks.",
        "*/",
        "",
    ]
    for filename, urange in entries:
        lines.append("@font-face {")
        lines.append(f'  font-family: "{FAMILY}";')
        lines.append("  font-style: normal;")
        lines.append("  font-weight: 250 900;")
        lines.append("  font-display: swap;")
        lines.append(f"  src: url('./source-han-serif/{filename}') format('woff2-variations');")
        lines.append(f"  unicode-range: {urange};")
        lines.append("}")
        lines.append("")
    CSS_OUT.write_text("\n".join(lines), encoding="utf8")


def parse_ranges(value: str) -> list[tuple[int, int]]:
    out = []
    for part in value.split(","):
        token = part.strip().lower().replace("u+", "")
        if not token:
            continue
        if "?" in token:
            out.append(
                (int(token.replace("?", "0"), 16), int(token.replace("?", "f"), 16))
            )
        elif "-" in token:
            lo, hi = token.split("-")
            out.append((int(lo, 16), int(hi, 16)))
        else:
            cp = int(token, 16)
            out.append((cp, cp))
    return out


def report(entries: list[tuple[str, str]]) -> None:
    """Estimate per-page font bytes from the prerendered HTML (if built)."""
    html_dir = ROOT / "build" / "client"
    pages = sorted(html_dir.rglob("index.html")) if html_dir.exists() else []
    if not pages:
        log("\n(no build/client output yet — skipping per-page report)")
        return

    faces = [
        (OUT_DIR / name, parse_ranges(urange)) for name, urange in entries
    ]
    sizes = {path.name: path.stat().st_size for path, _ in faces}
    total = sum(sizes.values())
    log(f"\n{len(faces)} chunks, {total / 1048576:.2f} MB total")
    log(f"{'page':52} {'chunks':>7} {'bytes':>9}")
    worst = 0
    for page in pages:
        text = page.read_text(encoding="utf8")
        text = re.sub(r"<script[\s\S]*?</script>", " ", text)
        text = re.sub(r"<[^>]+>", " ", text)
        cps = {ord(c) for c in text}
        used = [
            path.name
            for (path, ranges) in faces
            if any(any(lo <= cp <= hi for lo, hi in ranges) for cp in cps)
        ]
        nbytes = sum(sizes[n] for n in used)
        worst = max(worst, nbytes)
        rel = page.parent.relative_to(html_dir)
        label = "/" if str(rel) == "." else f"/{rel}/"
        log(f"{label:52} {len(used):>7} {nbytes / 1024:>8.0f}K")
    log(f"\nworst page: {worst / 1024:.0f} KB")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", action="store_true", help="per-page byte report")
    args = parser.parse_args()

    ensure_source()
    if not SOURCE_FONT.exists():
        log("source font missing")
        return 1

    log(f"reading {SOURCE_FONT.relative_to(ROOT)}")
    src = TTFont(str(SOURCE_FONT), lazy=True)
    cmap = src.getBestCmap()
    axes = [(a.axisTag, a.minValue, a.maxValue) for a in src["fvar"].axes]
    source_version = src["name"].getDebugName(5) or "unknown"
    log(f"  {len(cmap)} codepoints, axes {axes}")
    src.close()

    docs = corpus_docs()
    site_freq: dict[str, int] = {}
    for text in docs.values():
        for ch in text:
            site_freq[ch] = site_freq.get(ch, 0) + 1

    chars, unsupported = build_charset(docs, cmap)
    log(f"charset: {len(chars)} characters (corpus + GB2312 + punctuation)")

    chunks = plan_chunks(chars, docs, site_freq)
    log(f"planned {len(chunks)} chunks, sizes {min(len(c) for c in chunks)}-{max(len(c) for c in chunks)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUT_DIR.glob("*.woff2"):
        stale.unlink()

    opts = subset_options()
    entries: list[tuple[str, str]] = []
    started = time.time()
    # Sort chunks so the biggest (most shared) come first in the CSS: they are
    # the ones a browser is most likely to need early.
    chunks.sort(key=len, reverse=True)
    for index, chunk in enumerate(chunks):
        data = subset_to_bytes(SOURCE_FONT, "".join(chunk), opts)
        filename = f"shs-sc-{index:03d}.woff2"
        (OUT_DIR / filename).write_bytes(data)
        entries.append((filename, unicode_range(chunk)))
        log(
            f"  [{index + 1:>3}/{len(chunks)}] {filename} "
            f"{len(chunk):>4} glyphs {len(data) / 1024:>7.1f} KB "
            f"({len(data) / len(chunk):>5.0f} B/glyph)"
        )

    write_css(entries)
    write_manifest(chars, docs, source_version, unsupported)
    log(
        f"\nwrote {CSS_OUT.relative_to(ROOT)} and {len(entries)} woff2 files "
        f"to {OUT_DIR.relative_to(ROOT)} in {time.time() - started:.0f}s"
    )
    log(
        f"total: {sum(p.stat().st_size for p in OUT_DIR.glob('*.woff2')) / 1048576:.2f} MB"
    )

    if args.report:
        report(entries)
    return 0


if __name__ == "__main__":
    sys.exit(main())
