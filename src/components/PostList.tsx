import { allPosts, Post } from "content-collections/generated";
import { FC, useMemo, useState } from "react";
import { PostCard } from "./PostCard";
import { Tag } from "./Tag";

interface PostListProps {
  variant?: "default" | "timeline";
  showFilter?: boolean;
  limit?: number;
}

// Extract all unique tags from posts
const getAllTags = (posts: Post[]): string[] => {
  const tagSet = new Set<string>();
  posts.forEach((post) => {
    if (post.tags) {
      post.tags.split(",").forEach((tag) => {
        const trimmed = tag.trim();
        if (trimmed) tagSet.add(trimmed);
      });
    }
  });
  return Array.from(tagSet).sort();
};

// Group posts by year
const groupPostsByYear = (posts: Post[]): Record<string, Post[]> => {
  const groups: Record<string, Post[]> = {};
  posts.forEach((post) => {
    const year = post.date ? new Date(post.date).getFullYear().toString() : "Unknown";
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(post);
  });
  return groups;
};

export const PostList: FC<PostListProps> = ({
  variant = "default",
  showFilter = false,
  limit,
}) => {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const sortedPosts = useMemo(() => {
    return [...allPosts].sort(
      (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
    );
  }, []);

  const allTags = useMemo(() => getAllTags(sortedPosts), [sortedPosts]);

  const filteredPosts = useMemo(() => {
    let posts = sortedPosts;
    if (activeTag) {
      posts = posts.filter((post) =>
        post.tags?.toLowerCase().includes(activeTag.toLowerCase())
      );
    }
    if (limit) {
      posts = posts.slice(0, limit);
    }
    return posts;
  }, [sortedPosts, activeTag, limit]);

  const postsByYear = useMemo(
    () => groupPostsByYear(filteredPosts),
    [filteredPosts]
  );

  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));

  if (!allPosts || allPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary dark:text-text-secondary-dark">No posts found</p>
      </div>
    );
  }

  return (
    <div className="not-prose">
      {/* Filter row */}
      {showFilter && allTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="font-mono text-[12px] text-text-muted mr-2">Filter:</span>
          <Tag
            label="All"
            variant="filter"
            isActive={activeTag === null}
            onClick={() => setActiveTag(null)}
          />
          {allTags.map((tag) => (
            <Tag
              key={tag}
              label={tag}
              variant="filter"
              isActive={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            />
          ))}
        </div>
      ) : null}

      {/* Posts list */}
      {variant === "timeline" ? (
        <div className="space-y-12">
          {years.map((year) => (
            <div key={year}>
              <div className="py-3 mb-6">
                <h2 className="text-[24px] font-display font-bold text-text-primary dark:text-text-primary-dark">
                  {year}
                </h2>
              </div>
              <div>
                {postsByYear[year].map((post) => (
                  <PostCard key={post._meta.path} post={post} variant="timeline" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {filteredPosts.map((post) => (
            <PostCard key={post._meta.path} post={post} variant="default" />
          ))}
        </div>
      )}
    </div>
  );
};
