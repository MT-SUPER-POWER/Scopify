import { UPDATE_GROUPS } from "../constants/updateCategories";
import type { UpdateRelease } from "../types/updates";

const RELEASE = /^## (?:v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?) — (\d{4}-\d{2}-\d{2})|未发布)$/;
const ENTRY =
  /^- (.+) \(\[[a-f0-9]{7,40}\]\(https:\/\/github\.com\/MT-SUPER-POWER\/Scopify\/commit\/([a-f0-9]{40})\)\)$/;

/** Reads the fixed Markdown shape git-cliff writes from cliff.toml. */
export function parseChangelog(source: string): UpdateRelease[] {
  const releases: UpdateRelease[] = [];
  let release: UpdateRelease | undefined;
  let group: (typeof UPDATE_GROUPS)[number] | undefined;

  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const line = raw.trim();
    const heading = line.match(RELEASE);
    if (heading) {
      release = { version: heading[1] ?? null, date: heading[2] ?? null, entries: [] };
      releases.push(release);
      group = undefined;
      continue;
    }
    if (line.startsWith("### ")) {
      group = UPDATE_GROUPS.find((item) => item.heading === line.slice(4));
      if (!release || !group) throw new Error(`Unknown changelog group at line ${index + 1}`);
      continue;
    }
    if (line.startsWith("- ") && release) {
      const entry = line.match(ENTRY);
      if (!entry || !group) throw new Error(`Unexpected changelog entry at line ${index + 1}`);
      release.entries.push({ commit: entry[2], group: group.id, text: entry[1] });
    }
  }
  return releases;
}
