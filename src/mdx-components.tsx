import { useMDXComponents } from "@mdx-js/react";
import { PostList } from "~/components/PostList";
import { PostWrapper } from "~/components/wrapper/PostWrapper";
import { Anchor } from "~/components/html/Anchor";

type MDXComponents = Parameters<typeof useMDXComponents>["0"];

export default {
  PostList,
  wrapper: (props) => {
    return <PostWrapper {...props} />;
  },
  a: Anchor,
} satisfies MDXComponents;
