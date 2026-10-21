import path from "node:path";

export default {
  "**/*.{js,ts,cjs,mjs,jsx,tsx,json,jsonc,css,yml}": (filenames) => {
    if (!filenames.length) return [];
    const commands = [];

    // 1. Format all staged files with Prettier
    const quotedAll = filenames.map((f) => `"${f.replaceAll("\\", "/")}"`).join(" ");
    commands.push(`prettier --write ${quotedAll}`);

    // 2. Filter web JS/TS files for ESLint
    const webCodeFiles = filenames.filter((f) => {
      const normalized = f.replaceAll("\\", "/");
      const isWeb =
        normalized.includes("/repo/frontend/apps/web/") ||
        normalized.startsWith("repo/frontend/apps/web/");
      return isWeb && /\.(js|jsx|ts|tsx|mjs)$/.test(f);
    });

    if (webCodeFiles.length > 0) {
      const webDir = path.resolve(process.cwd(), "repo/frontend/apps/web");
      const relFiles = webCodeFiles
        .map((f) => path.relative(webDir, f))
        .map((f) => `"${f.replaceAll("\\", "/")}"`)
        .join(" ");
      commands.push(
        `pnpm --dir repo/frontend/apps/web exec eslint --fix --max-warnings 0 --no-warn-ignored ${relFiles}`,
      );
    }

    return commands;
  },
  // Markdown/MDX: tables are printed compactly by prettier-plugin-markdown-compact-tables,
  // so editing one cell never re-pads the whole table.
  "**/*.{md,mdx}": (filenames) => {
    if (!filenames.length) return [];
    const quotedAll = filenames.map((f) => `"${f.replaceAll("\\", "/")}"`).join(" ");
    return [`prettier --write ${quotedAll}`];
  },
};
