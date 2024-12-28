import { FC } from "react";
import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote/rsc';
import ArticleList from "../ArticleList";

const components: MDXRemoteProps['components'] = {
  h1: (props) => <h1 className="my-4 text-2xl font-bold" {...props}></h1>,
  ArticleList,
};

export const MdxRenderer: FC<MDXRemoteProps> = (props) => {
  return <MDXRemote components={components} {...props} />
}
