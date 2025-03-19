import { allPosts, Post } from 'contentlayer/generated';
import { notFound } from 'next/navigation';
import { MDXContent } from '@/components/MDXContent';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const generateStaticParams = () => {
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
    <article className="py-8 mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <time dateTime={post.createdAt}>{post.createdAt}</time>
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <span> · Updated <time dateTime={post.updatedAt}>{post.updatedAt}</time></span>
          )}
        </div>
      </div>
      <MDXContent code={post.body.code} />
    </article>
  );
} 
