import path from "node:path";

/**
 * 有 `lint` 脚本、会在 CI 的 `turbo run lint` 里检查的工作区。
 * 暂存文件落在哪个工作区，就在那个目录下用它自己的 ESLint 配置检查。
 */
const ESLINT_WORKSPACES = [
  "repo/frontend/apps/web",
  "repo/frontend/apps/docs",
  "repo/frontend/packages/desktop-contract",
  "repo/frontend/packages/notification-core",
  "repo/frontend/packages/playback-core",
  "repo/frontend/packages/ui",
];
const WEB_WORKSPACE = "repo/frontend/apps/web";
const LINTABLE = /\.(js|jsx|ts|tsx|mjs)$/;

const toPosix = (file) => file.replaceAll("\\", "/");
const quote = (files) => files.map((file) => `"${toPosix(file)}"`).join(" ");
const relativeToRoot = (file) => toPosix(path.relative(process.cwd(), file));
const workspaceOf = (file) => {
  const relative = relativeToRoot(file);
  return ESLINT_WORKSPACES.find((workspace) => relative.startsWith(`${workspace}/`));
};

export default {
  "**/*.{js,ts,cjs,mjs,jsx,tsx,json,jsonc,css,yml}": (filenames) => {
    if (!filenames.length) return [];
    // 1. Format all staged files with Prettier
    const commands = [`prettier --write ${quote(filenames)}`];

    // 2. ESLint each workspace's staged JS/TS files with that workspace's own config
    const byWorkspace = new Map();
    for (const file of filenames.filter((name) => LINTABLE.test(name))) {
      const workspace = workspaceOf(file);
      if (!workspace) continue;
      byWorkspace.set(workspace, [...(byWorkspace.get(workspace) ?? []), file]);
    }
    for (const [workspace, files] of byWorkspace) {
      const workspaceDir = path.resolve(process.cwd(), workspace);
      const relFiles = files.map((file) => path.relative(workspaceDir, file));
      commands.push(
        `pnpm --dir ${workspace} exec eslint --fix --max-warnings 0 --no-warn-ignored ${quote(relFiles)}`,
      );
    }

    // 3. Web 的主题硬编码检查（CI 的 lint 也会跑）：扫整个 Web 源码，只需一两秒
    if (filenames.some((file) => workspaceOf(file) === WEB_WORKSPACE)) {
      commands.push(`pnpm --dir ${WEB_WORKSPACE} run lint:theme`);
    }

    return commands;
  },
  // Markdown/MDX: tables are printed compactly by prettier-plugin-markdown-compact-tables,
  // so editing one cell never re-pads the whole table.
  "**/*.{md,mdx}": (filenames) => {
    if (!filenames.length) return [];
    return [`prettier --write ${quote(filenames)}`];
  },
};
