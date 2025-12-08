import { type Context, defineCollection, defineConfig, Schema } from "@content-collections/core";
import { schema, type SchemaZodObject } from "~/types/post";

const getTitleFromContent = (content: string) => {
  return content.match(/^# (.*)(\n)?/)?.[1];
}

const getPathnameFromContext = (directory: string, path: string) => {
  return "/" + [directory.replace(/^\/?pages\/?/i, ""), path.replace(/index$/i, "")].filter(Boolean).join('/');
}

const transform = (data: Schema<"frontmatter", SchemaZodObject>, context: Context<Schema<"frontmatter", SchemaZodObject>>) => {
  return {
    ...data,
    title: data.title ?? getTitleFromContent(data.content),
    comment: data.comment ?? true,
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
