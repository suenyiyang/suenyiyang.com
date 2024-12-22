import { FC } from "react";
import { GetStaticPaths, GetStaticProps } from 'next/types';

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

  const { markdownId } = await params ?? {};

  console.log('%csrc/app/[...markdownId]/page.tsx:16 markdownId', 'color: white; background-color: #26bfa5;', markdownId);

  return <div>{ markdownId }</div>
};

export default Page;
