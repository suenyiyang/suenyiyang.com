import path from "node:path";
import type { Config } from "@react-router/dev/config";
import { writeSeoFiles } from "./config/seo-files";

export default {
  prerender: true,
  ssr: false,
  appDirectory: "src",
  buildEnd({ reactRouterConfig }) {
    writeSeoFiles(path.join(reactRouterConfig.buildDirectory, "client"));
  },
} satisfies Config;
