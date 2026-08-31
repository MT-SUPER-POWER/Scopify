import { describe, expect, test } from "bun:test";
import { rankCommandWorkspaceEntries } from "@/lib/commandWorkspace/shortcutRanking";

const commands = [
  { id: "toggle-playback" as const, label: "播放/暂停" },
  { id: "next-track" as const, label: "下一首" },
  { id: "toggle-like" as const, label: "喜欢" },
];

describe("command workspace shortcut ranking", () => {
  test("puts more frequently used shortcuts first", () => {
    expect(
      rankCommandWorkspaceEntries(commands, (command) => {
        const usageCounts: Partial<Record<(typeof commands)[number]["id"], number>> = {
          "next-track": 8,
          "toggle-playback": 3,
        };
        return usageCounts[command.id] ?? 0;
      }).map((command) => command.id),
    ).toEqual(["next-track", "toggle-playback", "toggle-like"]);
  });

  test("keeps registration order when shortcuts have the same usage", () => {
    expect(
      rankCommandWorkspaceEntries(commands, (command) => {
        const usageCounts: Partial<Record<(typeof commands)[number]["id"], number>> = {
          "next-track": 2,
          "toggle-like": 2,
        };
        return usageCounts[command.id] ?? 0;
      }).map((command) => command.id),
    ).toEqual(["next-track", "toggle-like", "toggle-playback"]);
  });

  test("moves a frequently opened workspace page ahead of its default position", () => {
    const entries = [
      { id: "search", usageCount: 0 },
      { id: "now-playing", usageCount: 0 },
      { id: "queue", usageCount: 0 },
      { id: "settings", usageCount: 6 },
      { id: "toggle-playback", usageCount: 3 },
    ];

    expect(rankCommandWorkspaceEntries(entries, (entry) => entry.usageCount)[0]?.id).toBe(
      "settings",
    );
  });
});
