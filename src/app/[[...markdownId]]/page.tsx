import { FC } from "react";
import { getPageFilePath } from "@/logic";
import { readFileSync } from "fs";

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

  console.log('%csrc/app/[...markdownId]/page.tsx:16 markdownId', 'color: white; background-color: #26bfa5;', markdownId);

  const filePath = getPageFilePath(markdownId);

  const fileContent = readFileSync(filePath);

  return (
    <div>
      <p>{markdownId}</p>
      <article>{fileContent.toString()}</article>
    </div>
  )
};

export default Page;
