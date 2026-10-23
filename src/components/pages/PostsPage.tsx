import { FC } from "react";
import { PostList } from "../PostList";

export const PostsPage: FC = () => {
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
