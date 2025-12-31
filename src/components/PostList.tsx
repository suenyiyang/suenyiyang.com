import { allPosts } from "content-collections/generated";
import { PostItem } from "./PostCard";

export const PostList = () => {
  if (!allPosts || allPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 dark:text-neutral-400">No posts found</p>
      </div>
    );
  }

  const sortedPosts = [...allPosts].sort(
    (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto not-prose">
      <div className="space-y-8">
        {sortedPosts.map((post) => (
          <PostItem key={post._meta.path} post={post} />
        ))}
      </div>
    </div>
  );
};
