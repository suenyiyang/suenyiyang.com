import { Post } from "content-collections/generated";
import { format } from "date-fns";
import { FC } from "react";
import { Link } from "react-router";

interface PostCardProps {
  post: Post;
}

export const PostCard: FC<PostCardProps> = ({ post }) => {
  const date = post.date ? new Date(post.date) : null;

  return (
    <Link
      to={post._meta.path}
      className="group grid grid-cols-1 gap-1.5 py-5 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-5 sm:py-[1.375rem]"
    >
      {date ? (
        <time
          dateTime={post.date}
          className="font-mono text-[0.75rem] sm:text-meta sm:pt-1.5 text-text-muted dark:text-text-muted-dark tabular-nums"
        >
          {format(date, "MM.dd")}
        </time>
      ) : (
        <span />
      )}
      <div className="flex flex-col gap-2 min-w-0">
        <h3 className="text-[1.125rem] sm:text-[1.1875rem] leading-[1.55] font-semibold tracking-[0.01em] text-pretty text-text-primary dark:text-text-primary-dark group-hover:text-accent dark:group-hover:text-accent-dark transition-colors">
          {post.title}
        </h3>
        {post.description ? (
          <p className="text-[0.9375rem] leading-[1.75] text-text-secondary dark:text-text-secondary-dark line-clamp-2">
            {post.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
};

// Backwards-compatible alias
export const PostItem = PostCard;
