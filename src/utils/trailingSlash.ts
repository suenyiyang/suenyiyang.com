const SITE_HOSTS = new Set(["suenyiyang.com", "www.suenyiyang.com"]);

/**
 * Canonical pathname. Workers static assets use
 * html_handling = "drop-trailing-slash": /posts/foo is 200 and
 * /posts/foo/ redirects to it. The root stays "/".
 * Query strings and hashes are preserved.
 */
export function withoutTrailingSlash(pathname: string): string {
  if (!pathname || pathname === "/") return pathname || "/";

  const hashIndex = pathname.indexOf("#");
  const hash = hashIndex >= 0 ? pathname.slice(hashIndex) : "";
  const beforeHash = hashIndex >= 0 ? pathname.slice(0, hashIndex) : pathname;
  const queryIndex = beforeHash.indexOf("?");
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";
  const path = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;

  if (!path.endsWith("/")) return pathname;

  const stripped = path.replace(/\/+$/, "") || "/";
  return `${stripped}${query}${hash}`;
}

/** Absolute page URL. Root keeps its slash; every other path drops it. */
export function absolutePageUrl(siteOrigin: string, pathname: string): string {
  const origin = siteOrigin.replace(/\/+$/, "");
  const path = withoutTrailingSlash(pathname || "/");
  return path === "/" ? `${origin}/` : `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Drop a trailing slash from internal links. External and non-path hrefs pass through. */
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
    return withoutTrailingSlash(href);
  }
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      const url = new URL(href);
      if (!SITE_HOSTS.has(url.hostname)) return href;
      const nextPath = withoutTrailingSlash(url.pathname);
      if (nextPath === url.pathname) return href;
      url.pathname = nextPath;
      return url.toString();
    } catch {
      return href;
    }
  }
  return href;
}
