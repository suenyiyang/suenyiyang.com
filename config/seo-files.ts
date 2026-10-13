import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

/** Keep in sync with siteConfig.metadata in src/config/index.tsx. */
const SITE_URL = "https://suenyiyang.com";
const SITE_TITLE = "Yiyang Suen";
const SITE_DESCRIPTION =
  "Personal blog including frontend tech, life sharing, AI exploration and more.";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagesDir = path.join(root, "pages");

export interface SeoEntry {
  /** Pathname with a trailing slash. Home is "/". */
  pathname: string;
  title: string;
  description: string;
  /** YYYY-MM-DD when the page has a date. */
  date?: string;
  isPost: boolean;
}

const STATIC_ORDER = ["/", "/posts/", "/about/", "/links/"];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function formatDay(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return undefined;
}

function titleFromContent(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

function routeFromFile(file: string): string {
  const rel = path.relative(pagesDir, file).replace(/\\/g, "/");
  const withoutExt = rel.replace(/\.(mdx|md)$/i, "");
  const withoutIndex = withoutExt.replace(/(^|\/)index$/, "");
  if (!withoutIndex) return "/";
  return `/${withoutIndex.replace(/\/$/, "")}/`;
}

function walkMdx(dir: string, files: string[] = []): string[] {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      walkMdx(full, files);
    } else if (item.isFile() && /\.(mdx|md)$/i.test(item.name)) {
      files.push(full);
    }
  }
  return files;
}

export function collectSeoEntries(): SeoEntry[] {
  const entries = walkMdx(pagesDir).map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    const pathname = routeFromFile(file);
    const title =
      (typeof data.title === "string" && data.title.trim()) ||
      titleFromContent(content) ||
      SITE_TITLE;
    const description =
      typeof data.description === "string" ? data.description.trim() : "";
    return {
      pathname,
      title,
      description,
      date: formatDay(data.date),
      isPost: /^\/posts\/[^/]+\/$/.test(pathname),
    };
  });

  const rank = (pathname: string) => {
    const index = STATIC_ORDER.indexOf(pathname);
    return index === -1 ? STATIC_ORDER.length : index;
  };

  return entries.sort((a, b) => {
    if (a.isPost !== b.isPost) return a.isPost ? 1 : -1;
    if (!a.isPost && !b.isPost) return rank(a.pathname) - rank(b.pathname);
    const aTime = a.date ? Date.parse(`${a.date}T00:00:00Z`) : 0;
    const bTime = b.date ? Date.parse(`${b.date}T00:00:00Z`) : 0;
    return bTime - aTime;
  });
}

function absolute(pathname: string): string {
  return pathname === "/" ? `${SITE_URL}/` : `${SITE_URL}${pathname}`;
}

function rfc822(day: string): string {
  return new Date(`${day}T00:00:00.000Z`).toUTCString();
}

export function renderRss(entries: SeoEntry[] = collectSeoEntries()): string {
  const posts = entries.filter((entry) => entry.isPost);
  const items = posts
    .map((post) => {
      const link = absolute(post.pathname);
      const pubDate = post.date ? `\n      <pubDate>${rfc822(post.date)}</pubDate>` : "";
      return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>${pubDate}
      <description>${cdata(post.description || post.title)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(SITE_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${xmlEscape(SITE_DESCRIPTION)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

export function renderSitemap(entries: SeoEntry[] = collectSeoEntries()): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.date ? `\n    <lastmod>${entry.date}</lastmod>` : "";
      return `  <url>
    <loc>${xmlEscape(absolute(entry.pathname))}</loc>${lastmod}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function renderSeoFiles(): { rss: string; sitemap: string } {
  const entries = collectSeoEntries();
  return {
    rss: renderRss(entries),
    sitemap: renderSitemap(entries),
  };
}

export function writeSeoFiles(clientDir: string): void {
  const { rss, sitemap } = renderSeoFiles();
  fs.mkdirSync(clientDir, { recursive: true });
  fs.writeFileSync(path.join(clientDir, "rss.xml"), rss);
  fs.writeFileSync(path.join(clientDir, "sitemap.xml"), sitemap);
  const posts = collectSeoEntries().filter((entry) => entry.isPost).length;
  console.log(`[seo] wrote rss.xml and sitemap.xml (${posts} posts) to ${clientDir}`);
}
