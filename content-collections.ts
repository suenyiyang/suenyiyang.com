import { type Context, defineCollection, defineConfig, Schema } from "@content-collections/core";
import { z } from "zod";

const getTitleFromContent = (content: string) => {
  return content.match(/^# (.*)\n/)?.[1];
}

const getPathnameFromContext = (directory: string, path: string) => {
  return "/" + [directory.replace(/^\/?pages\/?/i, ""), path.replace(/index$/i, "")].filter(Boolean).join('/');
}

const schema = z.object({
  title: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  url: z.string().optional(),
});

type ZodObjectType = typeof schema;

const transform = (data: Schema<"frontmatter", ZodObjectType>, context: Context<Schema<"frontmatter", ZodObjectType>>) => {
  return {
    ...data,
    title: data.title ?? getTitleFromContent(data.content),
    _meta: {
      ...data._meta,
      path: getPathnameFromContext(context.collection.directory, data._meta.path),
    },
  };
}

const posts = defineCollection({
  name: "posts",
  directory: "pages/posts",
  include: "**/*.mdx",
  exclude: "index.mdx",
  schema,
  transform,
});

const pages = defineCollection({
  name: "pages",
  directory: "pages",
  include: ["**/*.mdx"],
  schema,
  transform,
});

export default defineConfig({
  collections: [pages, posts],
});
