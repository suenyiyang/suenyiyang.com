import { readdirSync, readFileSync } from "fs";
import { POSTS_DIR_PATH } from "../constants";
import matter from "gray-matter";
import path from "path";

interface ArticleInfo {
  title: string;
  createdAt: string;
  modifiedAt: string;
  url: string;
}

export const getArticleInfoList = () => {
  const result: ArticleInfo[] = [];

  const posts = readdirSync(POSTS_DIR_PATH);
  for (const post of posts) {
    if (post.endsWith('index.md') || post.endsWith('index.mdx')) {
      continue;
    }
    const postContent = readFileSync(path.join(POSTS_DIR_PATH, './', post));
    const { data } = matter(postContent);

    result.push({
      title: data.title ?? '',
      createdAt: data.createdAt ?? '',
      modifiedAt: data.modifiedAt ?? '',
      url: `posts/${post.replace(/\.md(x)?$/, '')}`,
    });
  }

  return result;
};
