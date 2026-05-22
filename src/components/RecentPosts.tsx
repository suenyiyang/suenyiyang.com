import { FC } from "react";
import { Link } from "react-router";
import { PostList } from "./PostList";

export interface RecentPostsProps {
  limit?: number;
}

export const RecentPosts: FC<RecentPostsProps> = ({ limit = 5 }) => {
  return (
    <section className="border-t border-[var(--reading-rule)] pt-[var(--space-h2)] mt-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-mono text-eyebrow font-bold tracking-[0.18em] uppercase text-text-primary dark:text-text-primary-dark">
          Recent posts
        </h2>
        <Link
          to="/posts"
          className="font-mono text-meta text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
      <PostList variant="default" limit={limit} />
    </section>
  );
};
