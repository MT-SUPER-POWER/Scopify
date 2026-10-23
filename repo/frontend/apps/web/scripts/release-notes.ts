import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseChangelog } from "./parse-changelog";
import { compareUpdateVersions } from "../lib/updates/version";
import type { ChangelogGitCommit } from "../types/changelog";
import type { UpdatesManifest, UpdateCommitType } from "../types/updates";

export const workspaceRoot = path.resolve(
  process.cwd(),
  existsSync(path.join(process.cwd(), "repo/frontend/apps/web/package.json")) ? "." : "../../../..",
);

export function notesGit(args: string[]): string {
  return execFileSync("git", ["-c", "core.fsmonitor=false", ...args], {
    cwd: workspaceRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024,
  }).trim();
}

export function readChangelog() {
  return parseChangelog(readFileSync(path.join(workspaceRoot, "docs/CHANGELOG.md"), "utf8"));
}

function readGitProvenance() {
  const commits = new Map<string, ChangelogGitCommit>();
  const lines = new Map<number, string>();
  try {
    for (const line of notesGit(["log", "--format=%H%x09%s"]).split("\n")) {
      const separator = line.indexOf("\t");
      if (separator > 0)
        commits.set(line.slice(0, separator), {
          hash: line.slice(0, separator),
          subject: line.slice(separator + 1),
        });
    }
    let hash = "";
    let lineNumber = 0;
    for (const line of notesGit([
      "blame",
      "-w",
      "--line-porcelain",
      "--",
      "docs/CHANGELOG.md",
    ]).split("\n")) {
      const header = line.match(/^([a-f0-9]{40}) \d+ (\d+)(?: \d+)?$/);
      if (header) {
        hash = header[1];
        lineNumber = Number(header[2]);
      }
      if (line.startsWith("\t") && !/^0+$/.test(hash)) lines.set(lineNumber, hash);
    }
  } catch {
    // A source export can still render historical notes; strict release checks require Git.
  }
  return { commits, lines };
}

function commitType(subject: string): UpdateCommitType | null {
  const match = subject.match(
    /^(feat|fix|perf|style|docs|refactor|chore|build|test|ci)(?:\([^\r\n)]+\))?!?: /,
  );
  return match ? (match[1] as UpdateCommitType) : null;
}

export function buildReleaseNotes(strict = false): UpdatesManifest {
  const currentVersion = String(
    JSON.parse(
      readFileSync(path.join(workspaceRoot, "repo/frontend/apps/web/package.json"), "utf8"),
    ).version,
  );
  const releases = readChangelog();
  const git = readGitProvenance();
  const result = releases
    .filter((release) => compareUpdateVersions(release.version, currentVersion) <= 0)
    .map((release) => ({
      version: release.version,
      date: release.date,
      title: {
        "zh-CN": `Scopify v${release.version}`,
        "zh-TW": `Scopify v${release.version}`,
        "en-US": `Scopify v${release.version}`,
      },
      entries: release.entries.map((entry) => {
        const revision =
          entry.commits[0] ?? (entry.historical ? undefined : git.lines.get(entry.line));
        const matches = revision
          ? [...git.commits.values()].filter((commit) => commit.hash.startsWith(revision))
          : [];
        const source = matches.length === 1 ? matches[0] : undefined;
        const hash =
          source?.hash ?? (entry.commits[0]?.length === 40 && !strict ? entry.commits[0] : null);
        if (strict && revision && !source)
          throw new Error(`Missing or ambiguous source commit for ${entry.id}: ${revision}`);
        if (strict && release.version === currentVersion && !hash)
          throw new Error(`Current release entry ${entry.id} needs a confirmed source commit`);
        const sourceType = source ? commitType(source.subject) : null;
        const type: UpdateCommitType =
          sourceType ??
          (entry.category === "Added"
            ? "feat"
            : entry.category === "Fixed"
              ? "fix"
              : entry.category === "Visual"
                ? "style"
                : "perf");
        return {
          id: entry.id,
          type,
          category: entry.category,
          title: {
            "zh-CN": entry.title,
            "zh-TW": entry.translations?.["zh-TW"]?.title ?? entry.title,
            "en-US": entry.translations?.["en-US"]?.title ?? entry.title,
          },
          description: {
            "zh-CN": entry.description || entry.title,
            "zh-TW":
              entry.translations?.["zh-TW"]?.description ?? (entry.description || entry.title),
            "en-US":
              entry.translations?.["en-US"]?.description ?? (entry.description || entry.title),
          },
          commit: hash,
          sourceType,
          commitStatus: hash
            ? ("linked" as const)
            : entry.historical
              ? ("unresolved" as const)
              : ("pending" as const),
        };
      }),
    }));
  result.sort((a, b) => compareUpdateVersions(b.version, a.version));
  if (
    strict &&
    !result.some((release) => release.version === currentVersion && release.entries.length)
  )
    throw new Error(`User release notes missing for ${currentVersion}`);
  return { currentVersion, releases: result };
}
