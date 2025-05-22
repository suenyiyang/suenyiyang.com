import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    { enforce: "pre", ...mdx() },
    react({
      include: /\.(mdx|js|jsx|ts|tsx)$/,
    }),
    reactRouter(),
    tailwindcss(),
    svgr({
      include: "**/*.svg",
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    cssCodeSplit: true,
  },
});
