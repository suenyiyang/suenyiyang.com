import { allPosts, Post } from 'contentlayer/generated';
import Link from 'next/link';

export default function HomePage() {
  const recentPosts = allPosts
    .sort((a: Post, b: Post) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Recent Posts</h2>
          <Link 
            href="/posts" 
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            View all →
          </Link>
        </div>

        <div className="grid gap-8">
          {recentPosts.map((post) => (
            <Link 
              key={post.url}
              href={post.url} 
              className="block p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <h3 className="text-xl font-bold mb-2">{post.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{post.createdAt}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
