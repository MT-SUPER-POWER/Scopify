import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["@scopify/ui"],
};

const withMDX = createMDX();
const enhancedConfig = withMDX(config);

// Fumadocs MDX currently emits Turbopack conditions unsupported by Next 16.1.6.
// This app intentionally uses Webpack until the two schemas converge.
delete enhancedConfig.turbopack;

export default enhancedConfig;
