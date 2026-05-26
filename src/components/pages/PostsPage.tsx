import { FC } from "react";
import { PostList } from "../PostList";

export const PostsPage: FC = () => {
  return (
    <div className="not-prose">
      {/* Header */}
      <section className="pb-7 md:pb-8">
        <h1 className="font-display italic font-semibold tracking-[-0.014em] text-text-primary dark:text-text-primary-dark text-display leading-[var(--lh-display)] mb-4">
          All Posts
        </h1>
        <p className="text-body leading-[var(--lh-body)] text-text-secondary dark:text-text-secondary-dark">
          Thoughts on frontend development, AI exploration, design, and everything in between.
        </p>
      </section>

      {/* Posts with filter */}
      <PostList variant="timeline" showFilter />
    </div>
  );
};
