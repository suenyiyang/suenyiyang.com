const SITE_HOSTS = new Set(["suenyiyang.com", "www.suenyiyang.com"]);

/**
 * Canonical path for this site. Cloudflare Pages serves directory indexes at
 * the trailing-slash URL and 307s the slash-less form.
 * Files (a dot in the last segment, e.g. /rss.xml) are left alone.
 */
export function withTrailingSlash(pathname: string): string {
  if (!pathname || pathname === "/") return pathname || "/";

  const hashIndex = pathname.indexOf("#");
  const hash = hashIndex >= 0 ? pathname.slice(hashIndex) : "";
  const beforeHash = hashIndex >= 0 ? pathname.slice(0, hashIndex) : pathname;
  const queryIndex = beforeHash.indexOf("?");
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";
  const path = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;

  if (!path || path === "/" || path.endsWith("/")) return pathname;
  const last = path.split("/").pop() ?? "";
  if (last.includes(".")) return pathname;
  return `${path}/${query}${hash}`;
}

/** Add a trailing slash to internal links. External and non-path hrefs pass through. */
export function canonicalizeInternalHref(href: string | undefined): string | undefined {
  if (!href) return href;
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href;
  }
  if (href.startsWith("/") && !href.startsWith("//")) {
    return withTrailingSlash(href);
  }
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      const url = new URL(href);
      if (!SITE_HOSTS.has(url.hostname)) return href;
      const nextPath = withTrailingSlash(url.pathname);
      if (nextPath === url.pathname) return href;
      url.pathname = nextPath;
      return url.toString();
    } catch {
      return href;
    }
  }
  return href;
}
