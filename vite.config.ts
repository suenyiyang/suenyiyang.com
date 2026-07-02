import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import remarkFrontmatter from "remark-frontmatter";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import contentCollections from "@content-collections/remix-vite";
import { imagetools } from "vite-imagetools";
import path from "node:path";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";

import { ENV_GA_ID, ENV_WALINE_SERVER_URL } from "./config/env";
import { rehypeCodeWindow } from "./config/rehype-code-window";
import { remarkMdxRelativeImages } from "./config/remark-mdx-relative-images";
import { remarkUnwrapImages } from "./config/remark-unwrap-images";
import { remarkTwitterEmbeds } from "./config/remark-twitter-embeds";
import { remarkYoutubeEmbeds } from "./config/remark-youtube-embeds";

export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        remarkGfm,
        remarkEmoji,
        remarkYoutubeEmbeds,
        remarkTwitterEmbeds,
        remarkMdxRelativeImages,
        remarkUnwrapImages,
      ],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeShiki,
          {
            themes: { light: "vitesse-light", dark: "vitesse-dark" },
            defaultColor: false,
          },
        ],
        rehypeCodeWindow,
      ],
      providerImportSource: "@mdx-js/react",
    }),
    tailwindcss(),
    imagetools(),
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
    __INJECTED_GA_ID__: JSON.stringify(ENV_GA_ID),
  },
});
