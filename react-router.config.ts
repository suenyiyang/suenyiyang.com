import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "./pages",
  prerender: ["/"],
  ssr: false,
} satisfies Config;
