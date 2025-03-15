'use server';
import { getArticleInfoList } from "@/logic/article";
import Link from "next/link";
import { FC } from "react";

const ArticleList: FC = () => {
  const articleInfoList = getArticleInfoList();

  return (
    <div className="py-8 max-w-3xl mx-auto">
      {articleInfoList.map((item) => (
        <Link 
          key={item.url} 
          className="flex flex-col mb-6 hover:opacity-70 transition-opacity duration-200" 
          href={item.url}
        >
          <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">{item.title}</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">{item.createdAt}</span>
        </Link>
      ))}
    </div>
  );
};

export default ArticleList;
