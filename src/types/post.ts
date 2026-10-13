import z from "zod";

export const schema = z.object({
  date: z.string().optional(),
  /** ISO date. Included in BlogPosting JSON-LD when a post sets it. */
  dateModified: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  lang: z.enum(['zh', 'en']).optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  tags: z.string().optional(),
  comment: z.boolean().optional(),
});

export type SchemaZodObject = typeof schema;

export type Post = (typeof schema)['_type'];

