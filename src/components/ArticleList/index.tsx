'use client';
import { allPosts, Post } from 'contentlayer/generated';
import Link from "next/link";
import { FC } from "react";

const ArticleList: FC = () => {
  const posts = allPosts.sort(
    (a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="py-8 max-w-3xl mx-auto">
      {posts.map((post: Post) => (
        <Link 
          key={post.url} 
          className="flex flex-col mb-6 hover:opacity-70 transition-opacity duration-200" 
          href={post.url}
        >
          <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">{post.title}</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">{post.createdAt}</span>
        </Link>
      ))}
    </div>
  );
};

export default ArticleList;
