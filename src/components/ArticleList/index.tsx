'use server';
import { getArticleInfoList } from "@/logic/article";
import Link from "next/link";
import { FC } from "react";

const ArticleList: FC = () => {
  const articleInfoList = getArticleInfoList();

  return (
    <div className="py-8">
      {articleInfoList.map((item) => (
        <Link key={item.url} className="flex flex-col" href={item.url}>
          <h3 className="text-xl font-semibold">{item.title}</h3>
          <span className="text-sm">{item.createdAt}</span>
        </Link>
      ))}
    </div>
  );
};

export default ArticleList;
