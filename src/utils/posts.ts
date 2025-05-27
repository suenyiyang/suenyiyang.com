import matter from "gray-matter";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
  content: string;
}

export function getPosts(): Post[] {
  const postsDirectory = path.join(process.cwd(), "pages/posts");

  try {
    const filenames = readdirSync(postsDirectory);

    const posts = filenames
      .filter((name) => name.endsWith(".mdx") && name !== "index.mdx")
      .map((name) => {
        const filePath = path.join(postsDirectory, name);
        const fileContents = readFileSync(filePath, "utf8");
        const { data, content } = matter(fileContents);

        return {
          slug: name.replace(/\.mdx$/, ""),
          title: data.title || "Untitled",
          date: data.date || "",
          description: data.description || "",
          content,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return posts;
  } catch (error) {
    console.error("Error reading posts:", error);
    return [];
  }
}
