import { expect, test } from "bun:test";
import { getCommandFrecency, searchCommands } from "@/lib/commandWorkspace/commandSearch";
import type { CommandSearchDocument } from "@/types/commandWorkspace/search";

const COMMANDS: CommandSearchDocument[] = [
  { id: "settings", label: "设置", summary: "应用、Folia 与桌面播放设置", keywords: "settings" },
  { id: "queue", label: "播放队列", summary: "播放、调整与移除队列曲目", keywords: "queue" },
  { id: "play-mode", label: "播放模式", keywords: "play mode shuffle" },
  { id: "daily", label: "每日推荐", keywords: "daily recommend" },
  { id: "island", label: "灵动岛设置", keywords: "dynamic island" },
  { id: "now-playing", label: "正在播放", keywords: "now playing" },
  { id: "theme", label: "外观与主题", keywords: "theme appearance dark" },
];

const ids = (query: string, usage = {}, now = 0) =>
  searchCommands(COMMANDS, (item) => item, query, usage, now).map((hit) => hit.item.id);

test("matches pinyin initials and full pinyin against Chinese labels", () => {
  expect(ids("sz")[0]).toBe("settings");
  expect(ids("mrtj")).toEqual(["daily"]);
  expect(ids("zzbf")[0]).toBe("now-playing");
  expect(ids("shezhi")[0]).toBe("settings");
});

test("ranks label prefix above substring and keyword matches", () => {
  expect(ids("播放")).toEqual(["queue", "play-mode", "now-playing", "settings"]);
});

test("tolerates typos and skipped letters in latin keywords", () => {
  expect(ids("apperance")).toEqual(["theme"]);
  expect(ids("dynamc")).toEqual(["island"]);
  expect(ids("dyn isl")).toEqual(["island"]);
});

test("requires every term to match somewhere", () => {
  expect(ids("播放 主题")).toEqual([]);
});

test("returns highlight ranges on the label", () => {
  const [hit] = searchCommands(COMMANDS, (item) => item, "mrtj");
  expect(hit.labelRanges).toEqual([[0, 4]]);
});

test("frequent recent commands rise without overriding relevance", () => {
  const day = 24 * 60 * 60 * 1000;
  const usage = {
    "now-playing": { count: 20, lastUsedAt: 0 },
    "play-mode": { count: 3, lastUsedAt: 0 },
  };
  expect(ids("bf", usage).slice(0, 2)).toEqual(["play-mode", "queue"]);
  expect(ids("播放", usage)[0]).not.toBe("now-playing");
  expect(ids("", usage).slice(0, 2)).toEqual(["now-playing", "play-mode"]);
  expect(getCommandFrecency(usage["now-playing"], 28 * day)).toBeLessThan(
    getCommandFrecency(usage["now-playing"], 0) / 3,
  );
});
