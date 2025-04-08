import ArticleList from "@/components/ArticleList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posts",
  description: "Collection of blog posts and articles",
};

export default function PostsPage() {
  return (
    <div>
      <ArticleList />
    </div>
  );
}
