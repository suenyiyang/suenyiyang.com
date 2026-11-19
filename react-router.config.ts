import path from "node:path";
import type { Config } from "@react-router/dev/config";
import { writeNotFoundPage, writeSeoFiles } from "./config/seo-files";

export default {
  prerender: true,
  ssr: false,
  appDirectory: "src",
  buildEnd({ reactRouterConfig }) {
    const clientDir = path.join(reactRouterConfig.buildDirectory, "client");
    writeSeoFiles(clientDir);
    writeNotFoundPage(clientDir);
  },
} satisfies Config;
