#!/usr/bin/env bun
/**
 * pre-push：只对本次推送改动到的工作区及依赖它们的工作区运行增量 typecheck。
 *
 * 提交时不做类型检查，保持 commit 轻快；推送前业务基本定型，集中一次修完类型问题。
 * 读取 git 传入的推送范围（stdin：<local ref> <local sha> <remote ref> <remote sha>），
 * 新分支以 origin 默认分支的 merge-base 为起点。根目录 tsconfig 或锁文件变化时检查全部工作区。
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ZERO_SHA = /^0+$/;
const TYPECHECKABLE = /\.(ts|tsx|mts|cts|json)$/;
const WORKSPACE = /^(repo\/frontend\/(?:apps|packages)\/[^/]+)\//;
const GLOBAL_INPUTS = new Set(["tsconfig.json", "pnpm-lock.yaml", "package.json"]);

const root = process.cwd();

function git(...args: string[]) {
  const result = Bun.spawnSync(["git", ...args], { cwd: root, stderr: "pipe" });
  return result.exitCode === 0 ? result.stdout.toString().trim() : null;
}

function resolveBase(localSha: string, remoteSha: string) {
  if (!ZERO_SHA.test(remoteSha) && git("cat-file", "-e", `${remoteSha}^{commit}`) !== null)
    return remoteSha;
  const defaultBranch =
    git("symbolic-ref", "--short", "refs/remotes/origin/HEAD") ?? "origin/master";
  return git("merge-base", localSha, defaultBranch);
}

export function collectPushedFiles(input: string) {
  const files = new Set<string>();
  for (const line of input.split("\n")) {
    const [, localSha, , remoteSha] = line.trim().split(/\s+/);
    if (!localSha || !remoteSha || ZERO_SHA.test(localSha)) continue;
    const base = resolveBase(localSha, remoteSha);
    const diff = base ? git("diff", "--name-only", base, localSha) : null;
    // 找不到比较起点时无法缩小范围，按全量检查处理。
    if (diff === null) return null;
    for (const file of diff.split("\n")) if (file) files.add(file);
  }
  return files;
}

export function selectTypecheckPackages(files: Iterable<string>) {
  const packages = new Set<string>();
  for (const file of files) {
    if (GLOBAL_INPUTS.has(file)) return null;
    if (!TYPECHECKABLE.test(file)) continue;
    const workspace = file.match(WORKSPACE)?.[1];
    const manifestPath = workspace && path.join(root, workspace, "package.json");
    if (!manifestPath || !existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (manifest.scripts?.typecheck) packages.add(manifest.name);
  }
  return packages;
}

if (import.meta.main) {
  const files = collectPushedFiles(await Bun.stdin.text());
  const packages = files === null ? null : selectTypecheckPackages(files);
  if (packages?.size === 0) {
    console.log("pre-push: 本次推送没有影响类型的改动，跳过 typecheck。");
    process.exit(0);
  }
  const filters = packages ? [...packages].map((name) => `--filter=...${name}`) : [];
  console.log(
    `pre-push: typecheck ${packages ? [...packages].join(", ") + " 及其下游" : "全部工作区"}`,
  );
  const result = Bun.spawnSync(
    ["pnpm", "exec", "turbo", "run", "typecheck", ...filters, "--output-logs=errors-only"],
    { cwd: root, stdio: ["ignore", "inherit", "inherit"] },
  );
  process.exit(result.exitCode ?? 1);
}
