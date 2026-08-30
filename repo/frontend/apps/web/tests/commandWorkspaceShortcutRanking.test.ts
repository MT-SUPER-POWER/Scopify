import { describe, expect, test } from "bun:test";
import { rankCommandWorkspaceShortcuts } from "@/lib/commandWorkspace/shortcutRanking";

const commands = [
  { id: "toggle-playback" as const, label: "播放/暂停" },
  { id: "next-track" as const, label: "下一首" },
  { id: "toggle-like" as const, label: "喜欢" },
];

describe("command workspace shortcut ranking", () => {
  test("puts more frequently used shortcuts first", () => {
    expect(
      rankCommandWorkspaceShortcuts(commands, {
        "next-track": 8,
        "toggle-playback": 3,
      }).map((command) => command.id),
    ).toEqual(["next-track", "toggle-playback", "toggle-like"]);
  });

  test("keeps registration order when shortcuts have the same usage", () => {
    expect(
      rankCommandWorkspaceShortcuts(commands, {
        "next-track": 2,
        "toggle-like": 2,
      }).map((command) => command.id),
    ).toEqual(["next-track", "toggle-like", "toggle-playback"]);
  });
});
