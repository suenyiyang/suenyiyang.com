import { Post } from "content-collections/generated";
import { format } from "date-fns";
import { FC } from "react";
import { Link } from "react-router";

interface PostItemProps {
  post: Post;
}

export const PostItem: FC<PostItemProps> = (props) => {
  const { post } = props;

  const formattedDate = post.date
    ? format(new Date(post.date), "MMMM d, yyyy")
    : "";

  return (
    <Link
      to={post._meta.path}
      className="block group transition-opacity duration-200"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Post title */}
          <h2 className="text-xl font-semibold text-neutral-950 dark:text-neutral-300">
            {post.title}
          </h2>
          {/* Language badge */}
          {post.lang && (
            <span className="text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded">
              {post.lang}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          {/* Publication date */}
          {formattedDate && <time dateTime={post.date}>{formattedDate}</time>}
          {/* Reading time */}
          {post.readingTime && (
            <>
              <span>•</span>
              <span>{post.readingTime}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};
