import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parseChangelog } from "../../scripts/parse-changelog";

const hash = "5320175086981746d4c9bd04bb9dea84ef21208c";
const line = (text: string) =>
  `- ${text} ([53201750](https://github.com/MT-SUPER-POWER/Scopify/commit/${hash}))`;

describe("git-cliff changelog", () => {
  test("reads versions, groups and commit links", () => {
    const [release] = parseChangelog(
      `# Changelog\n\n> note\n\n## v2.0.4 — 2026-10-23\n\n### 新增\n\n${line("歌词支持双语对照")}\n\n### 修复\n\n${line("切歌后音量不再被重置")}\n`,
    );
    expect(release).toMatchObject({ version: "2.0.4", date: "2026-10-23" });
    expect(release.entries).toEqual([
      { commit: hash, group: "added", text: "歌词支持双语对照" },
      { commit: hash, group: "fixed", text: "切歌后音量不再被重置" },
    ]);
  });

  test("marks the unreleased preview with a null version", () => {
    expect(parseChangelog(`## 未发布\n\n### 优化\n\n${line("滚动更流畅")}`)[0]).toMatchObject({
      version: null,
      entries: [{ group: "improved" }],
    });
    expect(
      parseChangelog(`## unreleased — 2026-10-24\n\n### 新增\n\n${line("支持花火歌词")}`)[0],
    ).toMatchObject({
      version: null,
      date: "2026-10-24",
      entries: [{ group: "added" }],
    });
  });

  test("rejects groups and entries cliff.toml never writes", () => {
    expect(() => parseChangelog("## v2.0.4 — 2026-10-23\n\n### Visual\n")).toThrow("group");
    expect(() => parseChangelog("## v2.0.4 — 2026-10-23\n\n### 修复\n\n- no link\n")).toThrow(
      "entry",
    );
  });

  test("the committed changelog parses", () => {
    const source = readFileSync(new URL("../../../../../../docs/CHANGELOG.md", import.meta.url));
    expect(() => parseChangelog(source.toString())).not.toThrow();
  });
});
