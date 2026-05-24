import { useMDXComponents } from "@mdx-js/react";
import type { ComponentProps } from "react";
import { Callout } from "~/components/Callout";
import { Columns } from "~/components/Columns";
import { Hero } from "~/components/Hero";
import { PostList } from "~/components/PostList";
import { RecentPosts } from "~/components/RecentPosts";
import { PostWrapper } from "~/components/wrapper/PostWrapper";
import { Anchor } from "~/components/html/Anchor";
import { PostsPage, AboutPage } from "~/components/pages";
import { PostImage } from "~/components/PostImage";

type MDXComponents = Parameters<typeof useMDXComponents>["0"];

export default {
  Callout,
  Columns,
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
  img: PostImage,
  table: (props: ComponentProps<"table">) => {
    return (
      <div className="table-scroll">
        <table {...props} />
      </div>
    );
  },
} satisfies MDXComponents;
