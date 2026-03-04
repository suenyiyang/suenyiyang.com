import { FC } from "react";
import { PostList } from "../PostList";

export const PostsPage: FC = () => {
  return (
    <div className="not-prose">
      {/* Header */}
      <section className="pb-8">
        <h1 className="font-display italic text-[36px] md:text-[42px] tracking-[-1px] text-text-primary dark:text-text-primary-dark mb-4">
          All Posts
        </h1>
        <p className="text-text-secondary dark:text-text-secondary-dark max-w-xl">
          Thoughts on frontend development, AI exploration, design, and everything in between.
        </p>
      </section>

      {/* Posts with filter */}
      <PostList variant="timeline" showFilter />
    </div>
  );
};
