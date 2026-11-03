import { useEffect } from "react";
import { useNavigate } from "react-router";
import { siteConfig } from "~/config";
import { readPageContext } from "./dom";
import { createGlobalTools, type SiteInfo } from "./definitions";
import { setWebMcpNavigator, webMcpNavigate } from "./navigation";
import type { ContentRecord } from "./types";
import { useWebMcpTools } from "./use-webmcp-tools";

const SITE_ORIGIN = siteConfig.metadata.url.replace(/\/+$/, "");

const siteInfo: SiteInfo = {
  title: siteConfig.metadata.title,
  description: siteConfig.metadata.description,
  url: SITE_ORIGIN,
  author: "Yiyang Suen",
  socialLinks: (siteConfig.socialLinks ?? []).map((link) => ({
    label: link.label,
    href: link.href.startsWith("/") ? `${SITE_ORIGIN}${link.href}` : link.href,
  })),
  feeds: {
    rss: `${SITE_ORIGIN}/rss.xml`,
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  },
};

/** Dynamic import keeps the index out of the page bundle: it loads on first tool call. */
export async function loadContentIndex(): Promise<ContentRecord[]> {
  const module = await import("virtual:content-index");
  return module.contentIndex;
}

const GLOBAL_TOOLS = createGlobalTools({
  loadIndex: loadContentIndex,
  navigate: webMcpNavigate,
  getPageContext: readPageContext,
  site: siteInfo,
});

/** Registers the site-wide read tools once, on the root layout. */
export function useGlobalWebMcp(): void {
  useWebMcpTools(GLOBAL_TOOLS);
}

/** Publishes React Router's navigate to the `open_page` tool. */
export function WebMcpNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    setWebMcpNavigator((path) => navigate(path));
    return () => setWebMcpNavigator(null);
  }, [navigate]);

  return null;
}
