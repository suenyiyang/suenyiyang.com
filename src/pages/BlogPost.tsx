import { useParams } from "react-router-dom";

export default function BlogPost() {
  const { slug } = useParams();

  // This would typically fetch the blog post content based on the slug
  const post = {
    title: "My First Blog Post",
    date: "2024-03-15",
    content: "This is the full content of the blog post...",
  };

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <time className="text-gray-500">{post.date}</time>
      </header>
      <div className="prose lg:prose-xl">{post.content}</div>
    </article>
  );
}
