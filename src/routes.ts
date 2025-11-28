import { route, type RouteConfig } from "@react-router/dev/routes";
import { readdirSync } from "node:fs";
import path from "node:path";

import { ENV_BASE } from '../config/env';

const PAGES_DIR = path.resolve(__dirname, "../pages");
const FILE_EXTENSIONS = [".mdx", ".md"];

const nestedRoutes = (params: {
  routesDir: string;
  fileExtensions: string[];
}): RouteConfig => {
  const { routesDir, fileExtensions } = params;

  const routes: RouteConfig = [];

  const scanDirectory = (dir: string, basePath: string = "") => {
    const items = readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        // Recursively scan subdirectories
        scanDirectory(fullPath, path.join(basePath, item.name));
      } else if (item.isFile()) {
        // Check if file has valid extension
        const ext = path.extname(item.name);
        if (fileExtensions.includes(ext)) {
          const fileName = path.basename(item.name, ext);

          // Build route path
          let routePath: string;
          if (fileName === "index") {
            routePath = basePath === "" ? "/" : `/${basePath}`;
          } else {
            routePath =
              basePath === "" ? `/${fileName}` : `/${basePath}/${fileName}`;
          }

          routes.push(route(routePath, fullPath));
        }
      }
    }
  };

  scanDirectory(routesDir, ENV_BASE);
  return routes;
};

export default nestedRoutes({
  routesDir: PAGES_DIR,
  fileExtensions: FILE_EXTENSIONS,
}) satisfies RouteConfig;
