import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import remarkFrontmatter from "remark-frontmatter";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import contentCollections from "@content-collections/remix-vite";
import path from "node:path";
import remarkEmoji from "remark-emoji";

import { ENV_R2_PUBLIC_URL, ENV_WALINE_SERVER_URL } from "./config/env";

const CDN_BASE = ENV_R2_PUBLIC_URL || "/";

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
  define: {
    __INJECTED_WALINE_SERVER_URL__: JSON.stringify(ENV_WALINE_SERVER_URL),
    __INJECTED_R2_PUBLIC_URL__: JSON.stringify(CDN_BASE),
  },
  base: CDN_BASE,
});
