import { allPosts, Post } from "content-collections/generated";
import { FC, useMemo, useState } from "react";
import { PostCard } from "./PostCard";
import { Tag } from "./Tag";

interface PostListProps {
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

export const PostList: FC<PostListProps> = ({ showFilter = false, limit }) => {
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
        <div className="flex flex-wrap items-center gap-3 mb-10 py-3 border-t border-b border-[var(--reading-rule)]">
          <span className="font-mono text-eyebrow font-bold tracking-[0.05em] uppercase text-text-muted mr-2">
            Filter
          </span>
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

      {/* Posts list, grouped by year */}
      <div className="flex flex-col gap-11 sm:gap-14">
        {years.map((year) => (
          <section key={year}>
            <h2 className="font-mono text-meta font-medium tracking-[0.04em] text-text-muted dark:text-text-muted-dark pb-3.5 border-b border-[var(--reading-rule)]">
              {year}
            </h2>
            <ol className="list-none m-0 p-0 divide-y divide-[var(--reading-rule)]">
              {postsByYear[year].map((post) => (
                <li key={post._meta.path}>
                  <PostCard post={post} />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
};
