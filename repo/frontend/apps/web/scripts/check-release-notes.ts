import { writeFileSync } from "node:fs";
import { buildReleaseNotes, notesGit, readUpdateFragments } from "./release-notes";

const release = process.argv.includes("--release");
const manifest = buildReleaseNotes(release);
const base = process.env.UPDATES_BASE_SHA;
if (base) {
  const changed = notesGit(["diff", "--name-only", `${base}...HEAD`]).split("\n");
  const added = notesGit(["diff", "--name-only", "--diff-filter=A", `${base}...HEAD`]).split("\n");
  const fragments = readUpdateFragments();
  const entries = added.filter((file) => /^docs\/updates\/entries\/[a-z0-9-]+\.json$/.test(file));
  let migrating = false;
  try {
    notesGit(["cat-file", "-e", `${base}:docs/updates/releases.json`]);
  } catch {
    migrating = true;
  }
  if (!entries.length)
    throw new Error(
      "Add a docs/updates/entries/*.json fragment (audience: internal for maintenance).",
    );
  for (const file of entries) {
    const filename = file.split("/").at(-1);
    const entry = filename ? fragments.get(filename.slice(0, -5)) : undefined;
    if (!entry) throw new Error(`Missing update fragment: ${file}`);
    if (entry.commit) {
      if (!migrating) throw new Error(`New entry ${file} must derive its hash; omit commit.`);
      continue;
    }
    const source = notesGit(["log", "--diff-filter=A", "--format=%H", "--", file])
      .split("\n")
      .filter(Boolean)
      .at(-1);
    if (!source) throw new Error(`No source commit found for ${file}`);
    const subject = notesGit(["show", "-s", "--format=%s", source]);
    if (
      !subject.match(
        /^(feat|fix|perf|style|docs|refactor|chore|build|test|ci)(?:\([^\r\n)]+\))?!?: /,
      )
    ) {
      throw new Error(
        `Fragment ${file} must be introduced by a Conventional Commit; got ${subject}`,
      );
    }
  }
  const modifiedEntries = changed.filter(
    (file) => file.startsWith("docs/updates/entries/") && !added.includes(file),
  );
  if (modifiedEntries.length)
    throw new Error(
      `Entries are immutable; add a correction fragment: ${modifiedEntries.join(", ")}`,
    );
  for (const revision of notesGit(["rev-list", "--no-merges", `${base}..HEAD`])
    .split("\n")
    .filter(Boolean)) {
    const subject = notesGit(["show", "-s", "--format=%s", revision]);
    if (
      !/^(feat|fix|perf|style|docs|refactor|chore|build|test|ci)(?:\([^\r\n)]+\))?!?: /.test(
        subject,
      )
    )
      throw new Error(`Use a Conventional Commit: ${revision} ${subject}`);
    const files = notesGit([
      "diff-tree",
      "--root",
      "--no-commit-id",
      "--name-only",
      "--diff-filter=A",
      "-r",
      revision,
    ]).split("\n");
    if (!files.some((file) => /^docs\/updates\/entries\/[a-z0-9-]+\.json$/.test(file)))
      throw new Error(
        `Commit ${revision} needs a new update fragment; use audience: internal for maintenance.`,
      );
  }
}

if (release) {
  const current = manifest.releases.find((item) => item.version === manifest.currentVersion);
  if (!current) throw new Error(`Release notes missing for ${manifest.currentVersion}`);
  const lines = [`# ${current.title["zh-CN"]}`, ""];
  for (const entry of current.entries) {
    if (!entry.commit) throw new Error(`Missing source commit for ${entry.id}`);
    lines.push(
      `- **${entry.title["zh-CN"]}**：${entry.description["zh-CN"]} (${entry.sourceType} · [${entry.commit.slice(0, 8)}](https://github.com/MT-SUPER-POWER/Scopify/commit/${entry.commit}))`,
    );
  }
  writeFileSync("release_notes.md", `${lines.join("\n")}\n`);
}
console.log(`Release notes ready for ${manifest.currentVersion}`);
