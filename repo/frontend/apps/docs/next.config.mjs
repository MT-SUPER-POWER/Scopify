import { createMDX } from "fumadocs-mdx/next";

// Because this config customizes webpack, Next registers it as a persistent-cache
// build dependency and webpack parses its ESM import graph. fumadocs-mdx loads
// `source.config.ts` through runtime `import()` calls the parser cannot follow,
// which prints a benign "failed at 'import(...)'" warning per compiler. fumadocs
// tracks that file itself, so drop only those warnings and keep the rest.
const buildDependencyFilteredConsole = Object.assign(Object.create(console), {
  warn(...args) {
    const [message] = args;
    if (
      typeof message === "string" &&
      message.includes("fumadocs-mdx") &&
      message.includes("for build dependencies failed at")
    ) {
      return;
    }
    console.warn(...args);
  },
});

const config = {
  reactStrictMode: true,
  transpilePackages: ["@scopify/ui"],
  webpack(webpackConfig) {
    webpackConfig.infrastructureLogging = {
      ...webpackConfig.infrastructureLogging,
      console: buildDependencyFilteredConsole,
    };

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
