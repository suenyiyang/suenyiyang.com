import { useMDXComponents } from "@mdx-js/react";
import type { ComponentProps } from "react";
import { PostList } from "~/components/PostList";
import { PostWrapper } from "~/components/wrapper/PostWrapper";
import { Anchor } from "~/components/html/Anchor";

type MDXComponents = Parameters<typeof useMDXComponents>["0"];
type MdxImageProps = ComponentProps<"img">;

const CDN_BASE = __INJECTED_R2_PUBLIC_URL__.replace(/\/$/, "");
const PUBLIC_IMAGE_PATH_RE = /^(?:\.\.\/)+public\//;
const ABSOLUTE_URL_RE = /^[a-z][a-z0-9+.-]*:/i;

const resolveMdxImageSrc = (src?: string) => {
  if (!src) {
    return src;
  }

  let next = src.replace(PUBLIC_IMAGE_PATH_RE, "/");

  if (next.startsWith("public/")) {
    next = `/${next.slice("public/".length)}`;
  }

  if (ABSOLUTE_URL_RE.test(next) || next.startsWith("//")) {
    return next;
  }

  if (next.startsWith("/")) {
    if (CDN_BASE && CDN_BASE.startsWith("/") && next.startsWith(`${CDN_BASE}/`)) {
      return next;
    }

    return `${CDN_BASE}${next}`;
  }

  return next;
};

export default {
  PostList,
  wrapper: (props) => {
    return <PostWrapper {...props} />;
  },
  a: Anchor,
  img: (props: MdxImageProps) => {
    const resolvedSrc = resolveMdxImageSrc(props.src);
    return <img {...props} src={resolvedSrc} />;
  },
} satisfies MDXComponents;
