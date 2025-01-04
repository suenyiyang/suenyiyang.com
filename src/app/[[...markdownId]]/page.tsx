import { FC } from "react";
import { getPageFilePath } from "@/logic";
import { readFileSync } from "fs";
import { MdxRenderer } from "@/components/MdxRenderer";
import matter from "gray-matter";

type PageParams = Promise<Partial<{
  markdownId: string[];
}>>;

interface PageProps {
  params?: PageParams;
}

export const generateStaticParams = () => {
  return [
    { markdownId: [''] },
    { markdownId: ['posts/hello-world'] },
  ]
};

const Page: FC<PageProps> = async (props) => {
  const { params } = props;

  const { markdownId = [] } = await params ?? {};

  const filePath = getPageFilePath(markdownId);

  const fileContent = readFileSync(filePath);

  const { content } = matter(fileContent);

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <MdxRenderer source={content} />
    </article>
  )
};

export default Page;
