import { FC } from "react";
import { Link } from "react-router";
import { PostList } from "./PostList";

export interface RecentPostsProps {
  limit?: number;
}

export const RecentPosts: FC<RecentPostsProps> = ({ limit = 5 }) => {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-8 pt-6">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-text-primary dark:text-text-primary-dark">
          RECENT POSTS
        </h2>
        <Link
          to="/posts"
          className="font-mono text-[12px] text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
      <PostList variant="default" limit={limit} />
    </section>
  );
};
