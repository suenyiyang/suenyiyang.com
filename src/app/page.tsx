import { allPosts, Post } from 'contentlayer/generated';
import Link from 'next/link';
import SidebarLayout from '@/components/Layout/SidebarLayout';

export default function HomePage() {
  const recentPosts = allPosts
    .sort((a: Post, b: Post) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-12">Recent Posts</h1>
        
        <div className="space-y-12">
          {recentPosts.map((post) => (
            <article key={post.url} className="group">
              <Link href={post.url} className="block">
                <h2 className="text-2xl font-bold mb-2 group-hover:underline">
                  {post.title}
                </h2>
                <time className="text-gray-500 dark:text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
