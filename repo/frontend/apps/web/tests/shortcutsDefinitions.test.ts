import { describe, expect, test } from "bun:test";

import {
  DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS,
  SHORTCUT_COMMANDS,
} from "@/constants/shortcuts";
import { findShortcutConflict } from "@/lib/shortcuts/bindings";

function getShortcut(id: (typeof SHORTCUT_COMMANDS)[number]["id"]) {
  const command = SHORTCUT_COMMANDS.find((candidate) => candidate.id === id);
  if (!command) throw new Error(`Missing shortcut: ${id}`);
  return command;
}

describe("shortcut definitions", () => {
  test("assigns non-conflicting defaults to liking and opening current-track comments", () => {
    const like = getShortcut("toggle-like");
    const comments = getShortcut("open-current-track-comments");

    expect(like.defaultBinding).toEqual({ key: "KeyL", primary: true, alt: true });
    expect(comments.defaultBinding).toEqual({ key: "KeyC", primary: true, alt: true });
    expect(findShortcutConflict(like.id, like.defaultBinding, {})).toBeNull();
    expect(findShortcutConflict(comments.id, comments.defaultBinding, {})).toBeNull();
  });

  test("keeps playlist search page-scoped and out of the fullscreen binding", () => {
    const playlistSearch = getShortcut("focus-playlist-search");
    const fullscreen = getShortcut("toggle-fullscreen");

    expect(playlistSearch.defaultBinding).toEqual({ key: "KeyF", primary: true, alt: true });
    expect(playlistSearch.scope).toBe("playlist");
    expect(playlistSearch.defaultBinding).not.toEqual(fullscreen.defaultBinding);
  });

  test("limits desktop-controller registration to controls available in that window", () => {
    expect(DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS).toEqual(
      expect.arrayContaining([
        "toggle-playback",
        "toggle-like",
        "open-current-track-comments",
        "previous-track",
        "next-track",
      ]),
    );
    expect(DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS).not.toContain("toggle-sidebar");
    expect(DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS).not.toContain("focus-playlist-search");
  });
});
