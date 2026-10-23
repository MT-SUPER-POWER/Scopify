import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { compareUpdateVersions } from "../lib/updates/version";
import type { UpdatesManifest, UpdateRelease } from "../types/updates";

export const workspaceRoot = path.resolve(
  process.cwd(),
  existsSync(path.join(process.cwd(), "repo/frontend/apps/web/package.json")) ? "." : "../../../..",
);
const text = z
  .object({
    "zh-CN": z.string().trim().min(1),
    "zh-TW": z.string().trim().min(1),
    "en-US": z.string().trim().min(1),
  })
  .strict();
const commitType = z.enum([
  "feat",
  "fix",
  "perf",
  "style",
  "docs",
  "refactor",
  "chore",
  "build",
  "test",
  "ci",
]);
const fragmentSchema = z
  .object({
    type: commitType,
    category: z.enum(["Added", "Visual", "Quality", "Fixed"]),
    audience: z.enum(["user", "internal"]),
    title: text,
    description: text,
    // Only for migrating historical entries; new entries derive their own introduction commit.
    commit: z
      .string()
      .regex(/^[a-f0-9]{7,40}$/)
      .optional(),
  })
  .strict();
const version = z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
const releaseSchema = z.array(
  z
    .object({
      version,
      date: z.string().date().nullable(),
      title: text,
      entries: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]*$/)).min(1),
    })
    .strict(),
);

export function notesGit(args: string[]): string {
  return execFileSync("git", ["-c", "core.fsmonitor=false", ...args], {
    cwd: workspaceRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function readUpdateFragments() {
  const directory = path.join(workspaceRoot, "docs/updates/entries");
  return new Map(
    readdirSync(directory)
      .filter((file) => file.endsWith(".json"))
      .map((file) => [
        file.slice(0, -5),
        fragmentSchema.parse(JSON.parse(readFileSync(path.join(directory, file), "utf8"))),
      ]),
  );
}

export function buildReleaseNotes(strict = false): UpdatesManifest {
  const currentVersion = version.parse(
    JSON.parse(
      readFileSync(path.join(workspaceRoot, "repo/frontend/apps/web/package.json"), "utf8"),
    ).version,
  );
  const releases = releaseSchema.parse(
    JSON.parse(readFileSync(path.join(workspaceRoot, "docs/updates/releases.json"), "utf8")),
  );
  const fragments = readUpdateFragments();
  const usedVersions = new Set<string>();
  const usedEntries = new Set<string>();
  const result: UpdateRelease[] = [];

  for (const release of releases) {
    if (usedVersions.has(release.version)) throw new Error(`Duplicate release ${release.version}`);
    usedVersions.add(release.version);
    const entries: UpdateRelease["entries"] = [];
    for (const id of release.entries) {
      if (usedEntries.has(id)) throw new Error(`Update entry assigned twice: ${id}`);
      usedEntries.add(id);
      const fragment = fragments.get(id);
      if (!fragment) throw new Error(`Unknown update entry ${id}`);
      let commit: string | null = null;
      let sourceType: UpdateRelease["entries"][number]["sourceType"] = null;
      try {
        const revision =
          fragment.commit ??
          notesGit([
            "log",
            "--diff-filter=A",
            "--format=%H",
            "--",
            `docs/updates/entries/${id}.json`,
          ])
            .split("\n")
            .filter(Boolean)
            .at(-1);
        if (revision) {
          commit = notesGit(["rev-parse", "--verify", `${revision}^{commit}`]);
          notesGit(["merge-base", "--is-ancestor", commit, "HEAD"]);
          const subject = notesGit(["show", "-s", "--format=%s", commit]);
          const keyword = subject.match(/^([a-z]+)(?:\([^\r\n)]+\))?!?: /)?.[1];
          sourceType = commitType.parse(keyword);
        } else if (strict) throw new Error(`Entry ${id} has no committed source`);
      } catch (error) {
        if (strict) throw error;
        commit = null;
        sourceType = null;
      }
      if (fragment.audience === "user")
        entries.push({
          id,
          type: fragment.type,
          category: fragment.category,
          title: fragment.title,
          description: fragment.description,
          commit,
          sourceType,
        });
    }
    if (
      compareUpdateVersions(release.version, currentVersion) <= 0 &&
      (currentVersion.includes("-") || !release.version.includes("-"))
    ) {
      result.push({ ...release, entries });
    }
  }
  result.sort((a, b) => compareUpdateVersions(b.version, a.version));
  if (
    strict &&
    !result.some((release) => release.version === currentVersion && release.entries.length)
  ) {
    throw new Error(`User release notes missing for ${currentVersion}`);
  }
  return { currentVersion, releases: result };
}
