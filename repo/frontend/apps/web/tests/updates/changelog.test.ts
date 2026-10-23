import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parseChangelog } from "../../scripts/parse-changelog";

const document = (entry: string) => `## v2.0.3\n\n### Visual\n\n${entry}\n`;

describe("CHANGELOG contract", () => {
  test("keeps editorial categories independent of conventional commit types", () => {
    const [release] = parseChangelog(
      document(
        "- **F12 shortcut**：Clearer controls. ([fix · 1234567](https://github.com/MT-SUPER-POWER/Scopify/commit/1234567890123456789012345678901234567890))\n  <!-- update:f12 -->",
      ),
    );
    expect(release.entries[0].category).toBe("Visual");
    expect(release.entries[0].description).toBe("Clearer controls.");
    expect(release.entries[0].commits).toEqual(["1234567890123456789012345678901234567890"]);
  });

  test("keeps an empty prerelease in version history", () => {
    expect(parseChangelog("## v1.0.2-alpha\n\n> No separate notes.\n")[0]).toMatchObject({
      version: "1.0.2-alpha",
      entries: [],
    });
  });

  test("does not relabel an unresolved historical entry as new implementation", () => {
    const [release] = parseChangelog(
      document("- **Old update**\n  <!-- update:old-entry historical -->"),
    );
    expect(release.entries[0]).toMatchObject({ historical: true, commits: [] });
  });

  test("rejects mismatched hashes, duplicate ids and invalid categories", () => {
    expect(() =>
      parseChangelog(
        document(
          "- **Wrong** ([abcdef0](https://github.com/MT-SUPER-POWER/Scopify/commit/1234567890))\n  <!-- update:wrong -->",
        ),
      ),
    ).toThrow("disagrees");
    expect(() =>
      parseChangelog(
        document(
          "- **First**\n  <!-- update:duplicate -->\n- **Second**\n  <!-- update:duplicate -->",
        ),
      ),
    ).toThrow("Duplicate update id");
    expect(() => parseChangelog("## v2.0.3\n### Architecture\n")).toThrow("Invalid category");
  });

  test("preserves optional translations in the same Markdown entry", () => {
    const [release] = parseChangelog(
      document(
        '- **中文标题**：中文说明。\n  <!-- update:localized -->\n  <!-- translation:en-US {"title":"English title","description":"English description."} -->',
      ),
    );
    expect(release.entries[0].translations?.["en-US"]?.title).toBe("English title");
  });

  test("all historical versions and canonical categories remain parseable", () => {
    const source = readFileSync(
      new URL("../../../../../../docs/CHANGELOG.md", import.meta.url),
      "utf8",
    );
    const releases = parseChangelog(source);
    expect(releases.length).toBeGreaterThanOrEqual(35);
    expect(releases.some((release) => release.version === "1.0.0")).toBe(true);
    expect(releases.some((release) => release.version === "1.2.0-beta.2")).toBe(true);
    expect(releases.flatMap((release) => release.entries).length).toBeGreaterThan(500);
    const audit = readFileSync(
      new URL("../../../../../../docs/updates/PROVENANCE.md", import.meta.url),
      "utf8",
    );
    for (const entry of releases.flatMap((release) => release.entries)) {
      if (entry.id.startsWith("legacy-")) expect(audit.includes(entry.id)).toBe(true);
    }
    expect(
      new Set(
        releases
          .find((release) => release.version === "2.0.3")
          ?.entries.map((entry) => entry.category),
      ),
    ).toEqual(new Set(["Added", "Visual", "Quality", "Fixed"]));
  });
});
