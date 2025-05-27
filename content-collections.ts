import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";

const posts = defineCollection({
  name: "posts",
  directory: "pages/posts",
  include: "**/*.mdx",
  exclude: "**/index.mdx",
  schema: z.object({
    title: z.string(),
    date: z.string(),
  }),
});

export default defineConfig({
  collections: [posts],
});
