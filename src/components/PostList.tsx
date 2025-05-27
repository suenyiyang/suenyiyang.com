import { type Post } from "~/utils/posts";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export const PostList = ({ posts }: { posts: Post[] }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 dark:text-neutral-400">No posts found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto not-prose">
      <div className="space-y-8">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
};

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const formattedDate = post.date
    ? format(new Date(post.date), "MMMM d, yyyy")
    : "";

  return (
    <article className="group border-b border-neutral-100 dark:border-neutral-800 pb-8 last:border-b-0">
      <Link
        to={`/posts/${post.slug}`}
        className="block transition-all duration-200 hover:translate-x-1"
      >
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
            {post.title}
          </h2>

          {formattedDate && (
            <time
              dateTime={post.date}
              className="text-sm text-neutral-500 dark:text-neutral-400 font-light"
            >
              {formattedDate}
            </time>
          )}

          {post.description && (
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {post.description}
            </p>
          )}

          <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
            <span>Read more</span>
            <span className="ml-2 transform group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
};
