/**
 * One-command release: `pnpm release [version]`.
 * Asks for the version, previews the generated notes, then bumps packages,
 * regenerates docs/CHANGELOG.md, commits, tags and pushes. CI does the rest.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

// Commit-generated history starts after this tag; older notes live in docs/archive.
const CHANGELOG_BASE = "v2.0.3";
const PACKAGES = [
  "package.json",
  "repo/frontend/apps/web/package.json",
  "repo/frontend/apps/desktop/package.json",
  "repo/frontend/apps/docs/package.json",
];
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const run = (command: string, args: string[], inherit = false) =>
  execFileSync(command, args, {
    encoding: "utf8",
    stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  })?.trim() ?? "";
const git = (...args: string[]) => run("git", args);
// Run package CLIs through the current runtime: no shell quoting, works on Windows too.
const cli = (bin: string, args: string[]) => run(process.execPath, [bin, ...args]);
const cliff = (...args: string[]) => cli("node_modules/git-cliff/lib/cli/cli.js", args);

function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

const current = (JSON.parse(readFileSync("package.json", "utf8")) as { version: string }).version;
const prompt = createInterface({ input: process.stdin, output: process.stdout });

if (git("status", "--porcelain", "--untracked-files=no", "--ignore-submodules")) {
  fail("工作区有未提交的修改，请先提交或暂存后再发版。");
}
const branch = git("branch", "--show-current");
if (branch !== "master") fail(`请在 master 分支发版（当前：${branch}）。`);

console.log(`上个版本：v${current}`);
const input = (process.argv[2] ?? (await prompt.question("本次发布的版本号："))).trim();
const version = input.replace(/^v/, "");
if (!VERSION.test(version)) fail(`版本号格式不对：${input}（例如 2.0.4）`);
const tag = `v${version}`;
if (git("tag", "--list", tag)) fail(`${tag} 已经存在。`);

const notes = cliff("--unreleased", "--tag", tag, "--strip", "all");
if (!/^### /m.test(notes)) {
  console.log("\n这次没有 feat / fix / perf 提交，更新说明会是空的。");
}
console.log(`\n即将发布 ${tag}\n\n${notes}\n`);
const answer = await prompt.question(`确认发布 ${tag} 并推送？(y/N) `);
prompt.close();
if (answer.trim().toLowerCase() !== "y") fail("已取消，未做任何修改。");

for (const file of PACKAGES) {
  const source = readFileSync(file, "utf8");
  writeFileSync(file, source.replace(/("version":\s*")[^"]+(")/, `$1${version}$2`));
}
cliff(`${CHANGELOG_BASE}..HEAD`, "--tag", tag, "--output", "docs/CHANGELOG.md");
cli("node_modules/prettier/bin/prettier.cjs", ["--write", "docs/CHANGELOG.md", ...PACKAGES]);

git("add", "docs/CHANGELOG.md", ...PACKAGES);
run("git", ["commit", "-m", `chore(release): ${tag}`], true);
git("tag", "-a", tag, "-m", tag);
run("git", ["push", "--atomic", "origin", "HEAD", `refs/tags/${tag}`], true);

console.log(`\n✔ 已推送 ${tag}，GitHub Actions 会自动打包并发布 Release。`);
