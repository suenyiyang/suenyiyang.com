import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    { enforce: "pre", ...mdx() },
    react({
      include: /\.(mdx|js|jsx|ts|tsx)$/,
    }),
    reactRouter(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
