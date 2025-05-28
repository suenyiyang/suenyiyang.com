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

  return (
    <div className="max-w-4xl mx-auto not-prose">
      <div className="space-y-8">
        {allPosts.map((post) => (
          <PostItem key={post._meta.path} post={post} />
        ))}
      </div>
    </div>
  );
};
