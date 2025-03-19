import ArticleList from '@/components/ArticleList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Posts',
  description: 'Collection of blog posts and articles',
};

export default function PostsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-center mt-8">Posts</h1>
      <ArticleList />
    </div>
  );
} 
