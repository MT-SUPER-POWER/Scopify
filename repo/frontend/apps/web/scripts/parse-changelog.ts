import type { ParsedChangelogEntry, ParsedChangelogRelease } from "../types/changelog";
import type { UpdateCategory } from "../types/updates";

const categories = new Set(["Added", "Visual", "Quality", "Fixed"]);

/** Deliberately small Markdown contract, shared by the app, release export and CI. */
export function parseChangelog(source: string): ParsedChangelogRelease[] {
  const releases: ParsedChangelogRelease[] = [];
  const ids = new Set<string>();
  const versions = new Set<string>();
  let release: ParsedChangelogRelease | undefined;
  let category: UpdateCategory | undefined;
  let entry: ParsedChangelogEntry | undefined;

  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const line = raw.trim();
    const heading = line.match(
      /^## v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(?: — (\d{4}-\d{2}-\d{2}))?$/,
    );
    if (heading) {
      if (versions.has(heading[1])) throw new Error(`Duplicate changelog version: ${heading[1]}`);
      versions.add(heading[1]);
      release = { version: heading[1], date: heading[2] ?? null, entries: [] };
      if (
        release.date &&
        (Number.isNaN(Date.parse(release.date)) ||
          new Date(release.date).toISOString().slice(0, 10) !== release.date)
      )
        throw new Error(`Invalid release date: ${release.date}`);
      releases.push(release);
      category = undefined;
      entry = undefined;
      continue;
    }
    if (line.startsWith("## ")) throw new Error(`Invalid release heading at line ${index + 1}`);
    if (line.startsWith("### ")) {
      const name = line.slice(4);
      if (!release || !categories.has(name))
        throw new Error(`Invalid category at line ${index + 1}: ${name}`);
      category = name as UpdateCategory;
      entry = undefined;
      continue;
    }
    if (line.startsWith("- ")) {
      if (!release || !category)
        throw new Error(`Update outside a version/category at line ${index + 1}`);
      const links = [
        ...line.matchAll(
          /\[(?:[a-z]+\s*·\s*)?([a-f0-9]{7,40})\]\(https:\/\/github\.com\/MT-SUPER-POWER\/Scopify\/commit\/([a-f0-9]{7,40})\)/g,
        ),
      ];
      if (line.includes("/Scopify/commit/") && !links.length)
        throw new Error(`Invalid commit link at line ${index + 1}`);
      if (links.some((link) => !link[2].startsWith(link[1])))
        throw new Error(`Commit label disagrees with link at line ${index + 1}`);
      const content = line
        .replace(
          /\s*\(\[(?:[a-z]+\s*·\s*)?[a-f0-9]{7,40}\]\(https:\/\/github\.com\/MT-SUPER-POWER\/Scopify\/commit\/[a-f0-9]{7,40}\)\)/g,
          "",
        )
        .trim();
      const item = content.match(/^- \*\*(.+?)\*\*(?:[：:]\s*(.*))?$/);
      if (!item) throw new Error(`Use '- **title**：description' at line ${index + 1}`);
      const description = item[2] ?? "";
      entry = {
        id: "",
        category,
        title: item[1],
        description,
        line: index + 1,
        historical: false,
        commits: links.map((link) => link[2]),
      };
      release.entries.push(entry);
      continue;
    }
    const marker = line.match(/^<!-- update:([a-z0-9][a-z0-9-]*)( historical)? -->$/);
    if (marker) {
      if (!entry || entry.id)
        throw new Error(`Orphaned or duplicate update marker at line ${index + 1}`);
      if (ids.has(marker[1])) throw new Error(`Duplicate update id: ${marker[1]}`);
      ids.add(marker[1]);
      entry.id = marker[1];
      entry.line = index + 1;
      entry.historical = Boolean(marker[2]);
      continue;
    }
    const translation = line.match(/^<!-- translation:(zh-TW|en-US) (.+) -->$/);
    if (translation) {
      if (!entry?.id) throw new Error(`Translation without an update at line ${index + 1}`);
      const value: unknown = JSON.parse(translation[2]);
      if (
        !value ||
        typeof value !== "object" ||
        !("title" in value) ||
        typeof value.title !== "string" ||
        !("description" in value) ||
        typeof value.description !== "string"
      )
        throw new Error(`Invalid translation at line ${index + 1}`);
      entry.translations ??= {};
      const locale = translation[1] as "zh-TW" | "en-US";
      if (entry.translations[locale]) throw new Error(`Duplicate translation at line ${index + 1}`);
      entry.translations[locale] = { title: value.title, description: value.description };
      continue;
    }
    if (release && line && !line.startsWith("<!--") && !line.startsWith(">"))
      throw new Error(`Unexpected changelog content at line ${index + 1}`);
  }
  for (const item of releases.flatMap((version) => version.entries)) {
    if (!item.id) throw new Error(`Missing stable update marker for ${item.title}`);
  }
  return releases;
}
