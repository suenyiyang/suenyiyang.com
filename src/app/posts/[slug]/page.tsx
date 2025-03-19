import { allPosts, Post } from 'contentlayer/generated';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXContent } from '@/components/MDXContent';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = allPosts.find((post: Post) => post._raw.flattenedPath === params.slug);
  
  if (!post) {
    return {
      title: 'Post not found',
    };
  }

  return {
    title: post.title,
    description: `${post.title} - Published on ${post.createdAt}`,
  };
}

export async function generateStaticParams() {
  return allPosts.map((post: Post) => ({
    slug: post._raw.flattenedPath,
  }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post = allPosts.find((post: Post) => post._raw.flattenedPath === slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <time dateTime={post.createdAt}>{post.createdAt}</time>
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <span> · Updated <time dateTime={post.updatedAt}>{post.updatedAt}</time></span>
          )}
        </div>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <MDXContent code={post.body.code} />
      </div>
    </article>
  );
} 
