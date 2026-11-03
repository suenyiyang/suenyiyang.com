import { useSetAtom } from "jotai";
import { FC, useMemo } from "react";
import { activeTagAtom } from "~/stores/posts";
import { createPostsPageTools } from "~/webmcp/definitions";
import { loadContentIndex } from "~/webmcp/register";
import { useWebMcpTools } from "~/webmcp/use-webmcp-tools";
import { PostList } from "../PostList";

export const PostsPage: FC = () => {
  const setActiveTag = useSetAtom(activeTagAtom);
  const tools = useMemo(
    () => createPostsPageTools({ loadIndex: loadContentIndex, setActiveTag }),
    [setActiveTag],
  );

  // Only exists on /posts, and unregisters as soon as the route unmounts.
  useWebMcpTools(tools);

  return (
    <div className="not-prose">
      {/* Header */}
      <section className="pb-10 md:pb-14">
        <h1 className="post-title text-display text-text-primary dark:text-text-primary-dark">
          文章
        </h1>
      </section>

      {/* Posts with filter */}
      <PostList showFilter />
    </div>
  );
};
