import { FC } from "react";
import { PostList } from "../PostList";

export const PostsPage: FC = () => {
  return (
    <div className="not-prose">
      {/* Header */}
      <section className="pb-10 md:pb-14">
        <h1 className="post-title text-display text-text-primary dark:text-text-primary-dark mb-4">
          All Posts
        </h1>
        <p className="text-[1.0625rem] leading-[1.8] text-text-secondary dark:text-text-secondary-dark">
          Thoughts on frontend development, AI exploration, design, and everything in between.
        </p>
      </section>

      {/* Posts with filter */}
      <PostList showFilter />
    </div>
  );
};
