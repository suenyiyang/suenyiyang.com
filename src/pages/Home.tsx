import { Link } from "react-router-dom";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

// This would typically come from your blog post files
const posts: BlogPost[] = [
  {
    slug: "first-post",
    title: "My First Blog Post",
    date: "2024-03-15",
    excerpt: "Welcome to my blog! This is my first post...",
  },
];

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Latest Posts</h1>
      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="border-b pb-8">
            <Link to={`/blog/${post.slug}`}>
              <h2 className="text-2xl font-semibold mb-2 hover:text-blue-600">
                {post.title}
              </h2>
            </Link>
            <time className="text-gray-500 text-sm">{post.date}</time>
            <p className="mt-4 text-gray-700">{post.excerpt}</p>
            <Link
              to={`/blog/${post.slug}`}
              className="inline-block mt-4 text-blue-600 hover:text-blue-800"
            >
              Read more →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
