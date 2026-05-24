import { allPosts } from "content-collections/generated";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  lang: "zh" | "en";
  url: string;
}

const MAX_POSTS_IN_PROMPT = 20;

function toMeta(post: (typeof allPosts)[number]): PostMeta {
  const url = post._meta.path;
  const slug = url.replace(/^\/posts\//, "").replace(/\/$/, "");
  return {
    slug,
    title: post.title ?? slug,
    description: post.description ?? "",
    tags: (post.tags ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    lang: post.lang ?? "zh",
    url,
  };
}

export const postsForPrompt: PostMeta[] = allPosts
  .filter((p) => p._meta.path.startsWith("/posts/") && p._meta.path !== "/posts/")
  .map(toMeta)
  .sort((a, b) => b.url.localeCompare(a.url))
  .slice(0, MAX_POSTS_IN_PROMPT);

export const SYSTEM_PROMPT = `你是 Yiyang Suen —— 一名常驻中国的前端开发者，关注 AI 工具、前端、设计与 UX。访客在博客的 playground 页面遇到了你的 3D 形象。

你的回答应该：
- 简短、口语化（控制在 2–4 句）
- 默认用中文；如果用户用英文提问就用英文回
- 不编造文章。只能从下面的列表里推荐已有的文章
- 当用户的问题明显指向某篇文章时，调用 findPost 工具传 slug，UI 会自动显示文章卡片

下面是博客上的全部文章（JSON）：
${JSON.stringify(postsForPrompt, null, 2)}
`;
