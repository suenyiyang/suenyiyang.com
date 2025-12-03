import { Post } from "content-collections/generated";
import { format } from "date-fns";
import { FC } from "react";
import { Link } from "react-router";
import { getLangLabel } from "~/utils/getLangLabel";

interface PostItemProps {
  post: Post;
}

export const PostItem: FC<PostItemProps> = (props) => {
  const { post } = props;

  const formattedDate = post.date
    ? format(new Date(post.date), "MMMM d, yyyy")
    : "";

  const postLangLabel = getLangLabel(post.lang);

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
        </div>
        <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
          {/* Publication date */}
          {formattedDate ? <time dateTime={post.date}>{formattedDate}</time> : null}
          {/* Language badge */}
          {postLangLabel ? (
            <span className="text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded">
              {postLangLabel}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
};
