import createMdx from '@next/mdx';

const withMdx = createMdx({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  }
})

const nextConfig = {};

export default withMdx(nextConfig);
