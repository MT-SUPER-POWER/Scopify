import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseChangelog } from "./parse-changelog";
import type { UpdatesManifest } from "@/types/updates/model";

export const workspaceRoot = path.resolve(
  process.cwd(),
  existsSync(path.join(process.cwd(), "repo/frontend/apps/web/package.json")) ? "." : "../../../..",
);

/** Commits after the latest tag, so `pnpm dev:web` shows what the next release will say. */
function readUnreleasedPreview() {
  try {
    const markdown = execFileSync(
      process.execPath,
      [
        path.join(workspaceRoot, "node_modules/git-cliff/lib/cli/cli.js"),
        "--unreleased",
        "--strip",
        "all",
      ],
      { cwd: workspaceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return parseChangelog(markdown).filter((release) => release.entries.length);
  } catch {
    // Exported sources without Git history still show the committed changelog.
    return [];
  }
}

/**
 * docs/CHANGELOG.md (written by git-cliff on `pnpm release`) → embedded What's New data.
 * `strict` is for release builds: the version being shipped must have its section.
 */
export function buildReleaseNotes({
  strict = false,
  preview = false,
}: { strict?: boolean; preview?: boolean } = {}): UpdatesManifest {
  const currentVersion = String(
    JSON.parse(
      readFileSync(path.join(workspaceRoot, "repo/frontend/apps/web/package.json"), "utf8"),
    ).version,
  );
  const released = parseChangelog(
    readFileSync(path.join(workspaceRoot, "docs/CHANGELOG.md"), "utf8"),
  ).filter((release) => release.version);
  if (strict && !released.some((release) => release.version === currentVersion))
    throw new Error(`docs/CHANGELOG.md has no section for v${currentVersion}; run pnpm release`);
  return {
    currentVersion,
    releases: [...(preview ? readUnreleasedPreview() : []), ...released],
  };
}
