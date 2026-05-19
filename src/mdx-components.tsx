import { useMDXComponents } from "@mdx-js/react";
import type { ComponentProps } from "react";
import { Callout } from "~/components/Callout";
import { Hero } from "~/components/Hero";
import { PostList } from "~/components/PostList";
import { RecentPosts } from "~/components/RecentPosts";
import { PostWrapper } from "~/components/wrapper/PostWrapper";
import { Anchor } from "~/components/html/Anchor";
import { PostsPage, AboutPage } from "~/components/pages";

type MDXComponents = Parameters<typeof useMDXComponents>["0"];
type MdxImageProps = ComponentProps<"img">;

export default {
  Callout,
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
      <figure>
        <img decoding="async" {...props} />
        {props.alt ? <figcaption>{props.alt}</figcaption> : null}
      </figure>
    );
  },
  table: (props: ComponentProps<"table">) => {
    return (
      <div className="table-scroll">
        <table {...props} />
      </div>
    );
  },
} satisfies MDXComponents;
