import { readdirSync, readFileSync } from "fs";
import { PAGES_DIR_PATH } from "../constants";
import matter from "gray-matter";

interface ArticleInfo {
  title: string;
  createdAt: string;
  modifiedAt: string;
}

export const getArticleInfoList = () => {
  const result: ArticleInfo[] = [];

  const posts = readdirSync(PAGES_DIR_PATH);
  for (const post of posts) {
    if (post.endsWith('index.md') || post.endsWith('index.mdx')) {
      continue;
    }
    const postContent = readFileSync(post);
    const { data } = matter(postContent);

    result.push({
      title: data.title ?? '',
      createdAt: data.createdAt ?? '',
      modifiedAt: data.modifiedAt ?? '',
    });
  }

  return result;
};
