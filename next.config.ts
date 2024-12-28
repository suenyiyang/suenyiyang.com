import createMdx from '@next/mdx';
import { NextConfig } from 'next';

const withMdx = createMdx({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  }
})

const nextConfig: NextConfig = {};

export default withMdx(nextConfig);
