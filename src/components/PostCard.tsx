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
      className="block group opacity-70 transition-opacity duration-200 hover:opacity-100"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          {post.title}
        </h2>

        <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          {formattedDate && <time dateTime={post.date}>{formattedDate}</time>}
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
