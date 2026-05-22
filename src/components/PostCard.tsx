import { Post } from "content-collections/generated";
import { format } from "date-fns";
import { FC } from "react";
import { Link } from "react-router";
import { Tag } from "./Tag";

interface PostCardProps {
  post: Post;
  variant?: "default" | "timeline";
}

export const PostCard: FC<PostCardProps> = ({ post, variant = "default" }) => {
  const date = post.date ? new Date(post.date) : null;
  const day = date ? format(date, "dd") : "";
  const month = date ? format(date, "MMM").toUpperCase() : "";
  const formattedDate = date ? format(date, "MMMM d, yyyy") : "";

  const tags = post.tags
    ? post.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (variant === "timeline") {
    return (
      <Link
        to={post._meta.path}
        className="flex gap-10 group py-5 first:pt-0"
      >
        {/* Date column - 100px fixed width */}
        <div className="flex-shrink-0 w-[100px] text-center">
          <div className="relative inline-block bg-bg-light dark:bg-bg-dark px-2">
            <div className="font-mono text-meta text-text-muted uppercase">
              {month}
            </div>
            <div className="text-[1.875rem] font-display font-bold text-text-primary dark:text-text-primary-dark leading-tight">
              {day}
            </div>
          </div>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="font-display text-h4 font-semibold tracking-[-0.008em] text-text-primary dark:text-text-primary-dark group-hover:text-text-secondary dark:group-hover:text-text-secondary-dark transition-colors leading-snug">
            {post.title}
          </h3>
          {post.description ? (
            <p className="text-secondary leading-[1.5] text-text-secondary dark:text-text-secondary-dark line-clamp-2">
              {post.description}
            </p>
          ) : null}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-3 pt-1">
              {tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    );
  }

  // Default variant (Home > RecentPosts)
  return (
    <Link
      to={post._meta.path}
      className="block group py-5 first:pt-0 border-b border-[var(--reading-rule)] last:border-b-0"
    >
      <div className="space-y-2">
        <h3 className="font-display text-h3 font-semibold tracking-[-0.008em] leading-[1.3] text-text-primary dark:text-text-primary-dark group-hover:text-text-secondary dark:group-hover:text-text-secondary-dark transition-colors">
          {post.title}
        </h3>
        {post.description ? (
          <p className="text-secondary leading-[1.5] text-text-secondary dark:text-text-secondary-dark line-clamp-2">
            {post.description}
          </p>
        ) : null}
        <div className="flex items-center gap-3 flex-wrap">
          {formattedDate ? (
            <time
              dateTime={post.date}
              className="font-mono text-meta text-text-muted"
            >
              {formattedDate}
            </time>
          ) : null}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

// Backwards-compatible alias
export const PostItem = PostCard;
