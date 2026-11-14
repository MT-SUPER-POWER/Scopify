#!/usr/bin/env bun
/**
 * Synchronize and bump versions across all Scopify app package.json files.
 *
 * Usage:
 *   pnpm bump                # Defaults to bumping patch (e.g. 2.0.3 -> 2.0.4)
 *   pnpm bump patch          # Bump patch version
 *   pnpm bump minor          # Bump minor version (e.g. 2.0.3 -> 2.1.0)
 *   pnpm bump major          # Bump major version (e.g. 2.0.3 -> 3.0.0)
 *   pnpm bump beta           # Increment only the Beta counter
 *   pnpm bump patch --dry-run # Print the next tag without writing manifest files
 *   pnpm bump 2.0.5          # Set exact version
 *   pnpm bump v2.0.5         # Set exact version (strips leading 'v')
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const TARGET_PACKAGES = [
  "package.json",
  "repo/frontend/apps/web/package.json",
  "repo/frontend/apps/desktop/package.json",
  "repo/frontend/apps/docs/package.json",
];

const workspaceRoot = process.cwd();
const BETA_SUFFIX = /^beta\.(0|[1-9]\d*)$/;

function readRootVersion(): string {
  const rootPkgPath = path.join(workspaceRoot, "package.json");
  if (!existsSync(rootPkgPath)) {
    throw new Error(`Cannot find package.json in ${workspaceRoot}`);
  }
  const content = JSON.parse(readFileSync(rootPkgPath, "utf8"));
  return content.version || "0.0.0";
}

function parseSemver(v: string): [number, number, number, string] {
  const cleaned = v.replace(/^v/, "").trim();
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) {
    throw new Error(`Invalid semver version: "${v}". Expected format: X.Y.Z or X.Y.Z-tag`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] || ""];
}

export function calculateNextVersion(current: string, bumpTypeOrVersion: string): string {
  const [major, minor, patch, prerelease] = parseSemver(current);
  const target = bumpTypeOrVersion.toLowerCase().trim();
  const beta = BETA_SUFFIX.exec(prerelease);
  const nextSeries = beta ? "-beta.1" : "";

  switch (target) {
    case "patch":
      return `${major}.${minor}.${patch + 1}${nextSeries}`;
    case "minor":
      return `${major}.${minor + 1}.0${nextSeries}`;
    case "major":
      return `${major + 1}.0.0${nextSeries}`;
    case "beta":
      return `${major}.${minor}.${patch}-beta.${beta ? BigInt(beta[1]) + 1n : 1}`;
    default: {
      const cleaned = bumpTypeOrVersion.replace(/^v/, "").trim();
      parseSemver(cleaned); // validates format
      return cleaned;
    }
  }
}

function readVersionBaseline(manifestVersion: string) {
  const [major, minor, patch, prerelease] = parseSemver(manifestVersion);
  const manifestBeta = BETA_SUFFIX.exec(prerelease);
  if (!manifestBeta) return manifestVersion;

  // Publishing Beta does not write back the manifests. A local manifest bump
  // can also be ahead of the last tag, so use whichever version is higher.
  const result = Bun.spawnSync(
    ["git", "tag", "--merged", "HEAD", "--list", "v*-beta.*", "--sort=-version:refname"],
    { cwd: workspaceRoot },
  );
  if (result.exitCode !== 0) return manifestVersion;
  const tag = result.stdout
    .toString()
    .split(/\r?\n/)
    .find((value) => /^v\d+\.\d+\.\d+-beta\.(0|[1-9]\d*)$/.test(value));
  if (!tag) return manifestVersion;
  const [tagMajor, tagMinor, tagPatch, tagPrerelease] = parseSemver(tag);
  const coreDifference = tagMajor - major || tagMinor - minor || tagPatch - patch;
  if (
    coreDifference > 0 ||
    (coreDifference === 0 && BigInt(tagPrerelease.slice(5)) > BigInt(manifestBeta[1]))
  )
    return tag.slice(1);
  return manifestVersion;
}

export function bumpVersions(nextVersion: string): void {
  const cleaned = nextVersion.replace(/^v/, "").trim();
  parseSemver(cleaned);

  console.log(`\n🚀 Synchronizing versions to v${cleaned}...\n`);

  for (const relativePath of TARGET_PACKAGES) {
    const fullPath = path.join(workspaceRoot, relativePath);
    if (!existsSync(fullPath)) {
      console.warn(`⚠️  Skipped (not found): ${relativePath}`);
      continue;
    }
    const source = readFileSync(fullPath, "utf8");
    const updated = source.replace(/("version":\s*")[^"]+(")/, `$1${cleaned}$2`);
    writeFileSync(fullPath, updated);
    console.log(`  ✓ Updated ${relativePath}`);
  }

  console.log(
    `\n✨ Successfully updated all ${TARGET_PACKAGES.length} package.json files to v${cleaned}!\n`,
  );
}

// CLI Execution
if (import.meta.main) {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));

  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
Scopify Version Bumper

Usage:
  pnpm bump                # Defaults to bumping patch (e.g. 2.0.3 -> 2.0.4)
  pnpm bump patch          # 2.0.3 -> 2.0.4
  pnpm bump minor          # 2.0.3 -> 2.1.0
  pnpm bump major          # 2.0.3 -> 3.0.0
  pnpm bump beta           # 2.0.3-beta.2 -> 2.0.3-beta.3
  pnpm bump patch --dry-run # 2.0.3-beta.2 -> 2.0.4-beta.1 on a Beta series
  pnpm bump <version>      # Set explicit version (e.g. 2.0.5 or v2.0.5)

Target files:
${TARGET_PACKAGES.map((p) => `  - ${p}`).join("\n")}
`);
    process.exit(0);
  }

  const current = readVersionBaseline(readRootVersion());
  const dryRun = process.argv.includes("--dry-run");
  const input = args[0] || "patch";
  const next = calculateNextVersion(current, input);

  if (dryRun) {
    console.log(`v${next}`);
    process.exit(0);
  }
  console.log(`Current version: v${current}`);
  bumpVersions(next);
}
