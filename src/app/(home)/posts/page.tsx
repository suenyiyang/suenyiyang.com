import ArticleList from '@/components/ArticleList';
import { Metadata } from 'next';
import SidebarLayout from '@/components/Layout/SidebarLayout';

export const metadata: Metadata = {
  title: 'Posts',
  description: 'Collection of blog posts and articles',
};

export default function PostsPage() {
  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-right pr-8">All Posts</h1>
        <ArticleList />
      </div>
    </SidebarLayout>
  );
}
