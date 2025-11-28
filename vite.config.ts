import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import remarkFrontmatter from "remark-frontmatter";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import contentCollections from "@content-collections/remix-vite";
import path from "node:path";
import remarkEmoji from "remark-emoji";

import { ENV_OSS_PREFIX_PATH } from "./config/env";

export default defineConfig({
  plugins: [
    mdx({ remarkPlugins: [remarkFrontmatter, remarkEmoji], providerImportSource: "@mdx-js/react" }),
    tailwindcss(),
    reactRouter(),
    svgr({
      include: "**/*.svg",
    }),
    contentCollections(),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "content-collections/generated": path.resolve(__dirname, "./.content-collections/generated"),
    },
  },
  base: ENV_OSS_PREFIX_PATH,
});
