import { createMDX } from "fumadocs-mdx/next";

const config = {
  reactStrictMode: true,
  transpilePackages: ["@scopify/ui"],
  webpack(webpackConfig) {
    webpackConfig.module.rules.push({
      test: /\.(mmd|mermaid)$/,
      type: "asset/source",
    });
    return webpackConfig;
  },
  async rewrites() {
    return [
      {
        source: "/llms.txt",
        destination: "/api/llms/index",
      },
      {
        source: "/llms-full.txt",
        destination: "/api/llms/full",
      },
      {
        source: "/docs.md",
        destination: "/api/llms/page",
      },
      {
        source: "/docs/:path*.md",
        destination: "/api/llms/page/:path*",
      },
    ];
  },
};

const withMDX = createMDX();
const enhancedConfig = withMDX(config);

// Fumadocs MDX currently emits Turbopack conditions unsupported by Next 16.1.6.
// This app intentionally uses Webpack until the two schemas converge.
delete enhancedConfig.turbopack;

export default enhancedConfig;
