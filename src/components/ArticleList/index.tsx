'use server';
import { getArticleInfoList } from "@/logic/article";
import Link from "next/link";
import { FC } from "react";

const ArticleList: FC = () => {
  const articleInfoList = getArticleInfoList();

  return (
    <div>
      {articleInfoList.map((item) => (
        <Link href={item.url}>
          {item.title}
          {item.createdAt}
        </Link>
      ))}
    </div>
  );
};

export default ArticleList;
