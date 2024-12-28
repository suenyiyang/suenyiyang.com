import { FC } from "react";
import { getPageFilePath } from "@/logic";
import { readFileSync } from "fs";
import { MdxRenderer } from "@/components/MdxRenderer";
import { serialize } from "next-mdx-remote/serialize";
import matter from "gray-matter";

type PageParams = Promise<Partial<{
  markdownId: string[];
}>>;

interface PageProps {
  params?: PageParams;
}

export const generateStaticParams = () => {
  return [
    { markdownId: ['index'] },
    { markdownId: ['posts/test'] },
  ]
};

const Page: FC<PageProps> = async (props) => {
  const { params } = props;

  const { markdownId = [] } = await params ?? {};

  const filePath = getPageFilePath(markdownId);

  const fileContent = readFileSync(filePath);

  const { content } = matter(fileContent);

  return (
    <div>
      <MdxRenderer source={content} />
    </div>
  )
};

export default Page;
