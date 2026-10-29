import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// 与 Turbo 使用同一份工作区脚本声明，不再维护第二份 ESLint 工作区名单。
const lintWorkspaces = new Map();
const WEB_WORKSPACE = "repo/frontend/apps/web";
const LINTABLE = /\.(js|jsx|ts|tsx|mjs)$/;

const toPosix = (file) => file.replaceAll("\\", "/");
const quote = (files) => files.map((file) => `"${toPosix(file)}"`).join(" ");
const relativeToRoot = (file) => toPosix(path.relative(process.cwd(), file));
const workspaceOf = (file) => {
  const relative = relativeToRoot(file);
  const workspace = relative.match(/^(repo\/frontend\/(?:apps|packages)\/[^/]+)\//)?.[1];
  if (!workspace) return undefined;
  if (!lintWorkspaces.has(workspace)) {
    const manifestPath = path.resolve(process.cwd(), workspace, "package.json");
    const manifest = existsSync(manifestPath)
      ? JSON.parse(readFileSync(manifestPath, "utf8"))
      : undefined;
    lintWorkspaces.set(workspace, Boolean(manifest?.scripts?.lint));
  }
  return lintWorkspaces.get(workspace) ? workspace : undefined;
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
      commands.push("pnpm exec turbo run lint:theme --filter=@scopify/web");
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
