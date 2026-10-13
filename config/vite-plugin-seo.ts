import type { Plugin } from "vite";
import { renderSeoFiles } from "./seo-files";

/**
 * Serves /rss.xml and /sitemap.xml in dev. Production files are written from
 * react-router.config.ts `buildEnd`, after the prerendered client directory exists.
 */
export function seoFilesPlugin(): Plugin {
  return {
    name: "seo-files",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0];
        if (url !== "/rss.xml" && url !== "/sitemap.xml") {
          next();
          return;
        }
        const files = renderSeoFiles();
        if (url === "/rss.xml") {
          res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
          res.end(files.rss);
          return;
        }
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.end(files.sitemap);
      });
    },
  };
}
