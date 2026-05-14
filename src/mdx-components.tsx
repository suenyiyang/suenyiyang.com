import { useMDXComponents } from "@mdx-js/react";
import type { ComponentProps } from "react";
import { Hero } from "~/components/Hero";
import { PostList } from "~/components/PostList";
import { RecentPosts } from "~/components/RecentPosts";
import { PostWrapper } from "~/components/wrapper/PostWrapper";
import { Anchor } from "~/components/html/Anchor";
import { PostsPage, AboutPage } from "~/components/pages";

type MDXComponents = Parameters<typeof useMDXComponents>["0"];
type MdxImageProps = ComponentProps<"img">;

export default {
  Hero,
  PostList,
  RecentPosts,
  PostsPage,
  AboutPage,
  wrapper: (props) => {
    return <PostWrapper {...props} />;
  },
  h1: () => null,
  a: Anchor,
  img: (props: MdxImageProps) => {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-2 my-4">
        <img className="mt-0 mb-0" {...props} />
        {props.alt ? <span className="text-text-muted text-sm">{props.alt}</span> : null}
      </div>
    );
  },
} satisfies MDXComponents;
