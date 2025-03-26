import { withContentlayer } from 'next-contentlayer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    viewTransition: true,
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    }
  },
};

export default withContentlayer(nextConfig);
