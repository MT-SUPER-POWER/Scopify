import { writeFileSync } from "node:fs";
import { buildReleaseNotes, notesGit } from "./release-notes";
import { parseChangelog } from "./parse-changelog";
import { UPDATE_CATEGORIES } from "../constants/updateCategories";

const releaseMode = process.argv.includes("--release");
const manifest = buildReleaseNotes(releaseMode);
const base = process.env.UPDATES_BASE_SHA;
if (base && !/^0+$/.test(base)) {
  for (const revision of notesGit(["rev-list", "--no-merges", `${base}..HEAD`])
    .split("\n")
    .filter(Boolean)) {
    const subject = notesGit(["show", "-s", "--format=%s", revision]);
    const body = notesGit(["show", "-s", "--format=%B", revision]);
    const document = notesGit(["show", `${revision}:docs/CHANGELOG.md`]);
    // Historical commits predate this contract. Enforce it from its migration onward.
    if (!document.includes("<!-- changelog-format: 1 -->")) continue;
    if (
      !/^(feat|fix|perf|style|docs|refactor|chore|build|test|ci)(?:\([^\r\n)]+\))?!?: /.test(
        subject,
      )
    )
      throw new Error(`Use a Conventional Commit: ${revision} ${subject}`);
    let parent = "";
    try {
      parent = notesGit(["show", `${revision}^:docs/CHANGELOG.md`]);
    } catch {
      /* First commit. */
    }
    const migrating = !parent.includes("<!-- changelog-format: 1 -->");
    const previous = new Set(
      migrating
        ? []
        : parseChangelog(parent).flatMap((item) => item.entries.map((entry) => entry.id)),
    );
    const added = parseChangelog(document)
      .flatMap((item) => item.entries)
      .filter((entry) => !previous.has(entry.id));
    if (!added.length && !/^Changelog: internal$/m.test(body))
      throw new Error(
        `Commit ${revision} needs a new CHANGELOG entry, or Changelog: internal for maintenance.`,
      );
    if (!migrating && added.some((entry) => entry.historical))
      throw new Error(`New changes cannot claim historical provenance: ${revision}`);
  }
}

if (releaseMode) {
  const current = manifest.releases.find((item) => item.version === manifest.currentVersion);
  if (!current) throw new Error(`Release notes missing for ${manifest.currentVersion}`);
  const lines = [`# Scopify v${current.version}`, ""];
  for (const category of UPDATE_CATEGORIES) {
    const entries = current.entries.filter((entry) => entry.category === category.title);
    if (!entries.length) continue;
    lines.push(`## ${category.title}`, "");
    for (const entry of entries) {
      if (!entry.commit) throw new Error(`Missing source commit for ${entry.id}`);
      lines.push(
        `- **${entry.title["zh-CN"]}**：${entry.description["zh-CN"]} ([${entry.sourceType ?? entry.type} · ${entry.commit.slice(0, 8)}](https://github.com/MT-SUPER-POWER/Scopify/commit/${entry.commit}))`,
      );
    }
    lines.push("");
  }
  writeFileSync("release_notes.md", `${lines.join("\n")}\n`);
}
const entries = manifest.releases.flatMap((item) => item.entries);
console.log(
  `CHANGELOG -> What's New: ${manifest.releases.length} versions, ${entries.length} entries; ${entries.filter((entry) => entry.commitStatus === "linked").length} linked, ${entries.filter((entry) => entry.commitStatus === "unresolved").length} historical unresolved, ${entries.filter((entry) => entry.commitStatus === "pending").length} pending commit.`,
);
for (const item of manifest.releases)
  console.log(
    `v${item.version}: ${UPDATE_CATEGORIES.map((category) => `${category.title} ${item.entries.filter((entry) => entry.category === category.title).length}`).join(" | ")}`,
  );
