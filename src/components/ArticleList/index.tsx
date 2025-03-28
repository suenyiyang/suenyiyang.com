"use client";
import { allPosts, Post } from "contentlayer/generated";
import Link from "next/link";
import { FC } from "react";

const ArticleList: FC = () => {
  const posts = allPosts.sort(
    (a: Post, b: Post) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-12">
      {posts.map((post: Post) => (
        <article key={post.url}>
          <Link href={post.url} className="block">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ viewTransitionName: `post-title-${post.url}` }}
            >
              {post.title}
            </h2>
            <time className="text-gray-500 dark:text-gray-400">
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </Link>
        </article>
      ))}
    </div>
  );
};

export default ArticleList;
