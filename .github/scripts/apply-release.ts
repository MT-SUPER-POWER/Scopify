/**
 * Release CI: `bun .github/scripts/apply-release.ts v2.0.4 [--changelog]`.
 * The pushed tag is the only version input; nobody bumps package.json by hand.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

// Commit-generated history starts after this tag; older notes live in docs/archive.
const CHANGELOG_BASE = "v2.0.3";
const PACKAGES = [
  "package.json",
  "repo/frontend/apps/web/package.json",
  "repo/frontend/apps/desktop/package.json",
  "repo/frontend/apps/docs/package.json",
];

const tag = process.argv[2] || process.env.GITHUB_REF_NAME || "";
const version = tag.replace(/^v/, "");
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`Release tag must look like v2.0.4, got "${tag}"`);
}

for (const file of PACKAGES) {
  const source = readFileSync(file, "utf8");
  writeFileSync(file, source.replace(/("version":\s*")[^"]+(")/, `$1${version}$2`));
}

if (process.argv.includes("--changelog")) {
  // Up to the tag only: later commits on master belong to the next release.
  execFileSync(
    process.execPath,
    [
      "node_modules/git-cliff/lib/cli/cli.js",
      `${CHANGELOG_BASE}..${tag}`,
      "--output",
      "docs/CHANGELOG.md",
    ],
    { stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    ["node_modules/prettier/bin/prettier.cjs", "--write", "docs/CHANGELOG.md"],
    { stdio: "inherit" },
  );
}

console.log(`Applied release ${tag}`);
