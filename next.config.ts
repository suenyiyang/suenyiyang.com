import createMdx from '@next/mdx';
import { NextConfig } from 'next';

const withMdx = createMdx({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  }
})

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });

    return config;
  }
};

export default withMdx(nextConfig);
