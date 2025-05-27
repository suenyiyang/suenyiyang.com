import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import remarkFrontmatter from "remark-frontmatter";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    { enforce: "pre", ...mdx({ remarkPlugins: [remarkFrontmatter] }) },
    svgr({
      include: "**/*.svg",
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
