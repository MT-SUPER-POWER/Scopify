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

  test("registers developer tools as a runtime shortcut command", () => {
    const developerTools = getShortcut("toggle-developer-tools");

    expect(developerTools.defaultBinding).toEqual({ key: "F12" });
    expect(developerTools.scope).toBeUndefined();
    expect(findShortcutConflict(developerTools.id, developerTools.defaultBinding, {})).toBeNull();
  });

  test("registers audio settings, queue, and both desktop entry points with valid defaults", () => {
    const audioSettings = getShortcut("toggle-audio-settings");
    const queue = getShortcut("toggle-queue");
    const desktopController = getShortcut("toggle-desktop-controller");
    const desktopMusicMode = getShortcut("toggle-desktop-music-mode");

    expect(audioSettings.defaultBinding).toEqual({ key: "KeyA", primary: true, alt: true });
    expect(queue.defaultBinding).toEqual({ key: "KeyJ", primary: true });
    expect(desktopController.defaultBinding).toEqual({ key: "KeyD", primary: true, alt: true });
    expect(desktopMusicMode.defaultBinding).toEqual({ key: "KeyP", primary: true, alt: true });

    expect(findShortcutConflict(audioSettings.id, audioSettings.defaultBinding, {})).toBeNull();
    expect(findShortcutConflict(queue.id, queue.defaultBinding, {})).toBeNull();
    expect(
      findShortcutConflict(desktopController.id, desktopController.defaultBinding, {}),
    ).toBeNull();
    expect(
      findShortcutConflict(desktopMusicMode.id, desktopMusicMode.defaultBinding, {}),
    ).toBeNull();
  });

  test("registers distinct non-conflicting shortcuts for Folia settings and the theme library", () => {
    const foliaSettings = getShortcut("open-folia-settings");
    const foliaThemeLibrary = getShortcut("open-folia-theme-library");

    expect(foliaSettings.defaultBinding).toEqual({ key: "Comma", primary: true, shift: true });
    expect(foliaThemeLibrary.defaultBinding).toEqual({
      key: "Period",
      primary: true,
      shift: true,
    });
    expect(findShortcutConflict(foliaSettings.id, foliaSettings.defaultBinding, {})).toBeNull();
    expect(
      findShortcutConflict(foliaThemeLibrary.id, foliaThemeLibrary.defaultBinding, {}),
    ).toBeNull();
  });

  test("limits desktop-controller registration to controls available in that window", () => {
    expect(DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS).toEqual(
      expect.arrayContaining([
        "toggle-playback",
        "toggle-like",
        "open-current-track-comments",
        "previous-track",
        "next-track",
        "toggle-queue",
        "toggle-audio-settings",
        "open-shortcut-settings",
        "toggle-desktop-music-mode",
      ]),
    );
    expect(DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS).not.toContain("toggle-sidebar");
    expect(DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS).not.toContain("focus-playlist-search");
  });
});
