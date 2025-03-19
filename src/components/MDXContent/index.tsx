'use client';

import { useMDXComponent } from 'next-contentlayer/hooks';

interface MDXContentProps {
  code: string;
}

export function MDXContent({ code }: MDXContentProps) {
  const MDXComponent = useMDXComponent(code);
  
  return (
    <div className="prose dark:prose-invert max-w-full">
      <MDXComponent />
    </div>
  );
} 
