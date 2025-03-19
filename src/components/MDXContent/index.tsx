'use client';

import { useMDXComponent } from 'next-contentlayer/hooks';
import Image from 'next/image';
import Link from 'next/link';

interface MDXContentProps {
  code: string;
}

const components = {
  Image,
  a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (!href) return <a {...props} />;
    
    const isInternalLink = href.startsWith('/');
    
    if (isInternalLink) {
      return <Link href={href} {...props} />;
    }
    
    return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
  },
  pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className={`${className} p-4 rounded-lg my-4 overflow-x-auto`} {...props} />
  ),
};

export function MDXContent({ code }: MDXContentProps) {
  const MDXComponent = useMDXComponent(code);
  
  return (
    <div className="prose dark:prose-invert max-w-full">
      <MDXComponent components={components} />
    </div>
  );
} 
