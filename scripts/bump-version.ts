#!/usr/bin/env bun
/**
 * Synchronize and bump versions across all Scopify app package.json files.
 *
 * Usage:
 *   pnpm bump                # Defaults to bumping patch (e.g. 2.0.3 -> 2.0.4)
 *   pnpm bump patch          # Bump patch version
 *   pnpm bump minor          # Bump minor version (e.g. 2.0.3 -> 2.1.0)
 *   pnpm bump major          # Bump major version (e.g. 2.0.3 -> 3.0.0)
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

function calculateNextVersion(current: string, bumpTypeOrVersion: string): string {
  const [major, minor, patch] = parseSemver(current);
  const target = bumpTypeOrVersion.toLowerCase().trim();

  switch (target) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default: {
      const cleaned = bumpTypeOrVersion.replace(/^v/, "").trim();
      parseSemver(cleaned); // validates format
      return cleaned;
    }
  }
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
  pnpm bump <version>      # Set explicit version (e.g. 2.0.5 or v2.0.5)

Target files:
${TARGET_PACKAGES.map((p) => `  - ${p}`).join("\n")}
`);
    process.exit(0);
  }

  const current = readRootVersion();
  const input = args[0] || "patch";
  const next = calculateNextVersion(current, input);

  console.log(`Current version: v${current}`);
  bumpVersions(next);
}
