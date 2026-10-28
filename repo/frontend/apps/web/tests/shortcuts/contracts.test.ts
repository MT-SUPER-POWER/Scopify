import { describe, expect, test } from "bun:test";
import {
  DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS,
  getCommandDefinition,
  SHORTCUT_COMMANDS,
} from "@/constants/shortcuts";
import { isShortcutCommandAvailable } from "@/lib/shortcuts/availability";
import { findShortcutConflict, getEffectiveShortcutBinding } from "@/lib/shortcuts/bindings";
import type { ShortcutActionContext } from "@/types/shortcuts/model";

function actionRecorder() {
  const calls: [string, unknown[]][] = [];
  const context = new Proxy(
    {},
    {
      get: (_target, domain: string) =>
        new Proxy(
          {},
          {
            get:
              (_actions, action: string) =>
              (...args: unknown[]) => {
                calls.push([`${domain}.${action}`, args]);
              },
          },
        ),
    },
  ) as ShortcutActionContext;
  return { calls, context };
}

describe("shortcut command contracts", () => {
  test("every command has a unique ID, icon and executable declaration", () => {
    expect(SHORTCUT_COMMANDS).toHaveLength(41);
    expect(new Set(SHORTCUT_COMMANDS.map(({ id }) => id)).size).toBe(41);
    for (const command of SHORTCUT_COMMANDS) {
      expect(getCommandDefinition(command.id)).toBe(command);
      expect(command.icon).toBeTruthy();
      expect(typeof command.execute).toBe("function");
    }
    expect(getCommandDefinition("unknown")).toBeUndefined();
  });

  test.each([
    ["toggle-playback", "playback.toggle", []],
    ["toggle-like", "playback.toggleLike", []],
    ["increase-volume", "playback.adjustVolume", [5]],
    ["decrease-volume", "playback.adjustVolume", [-5]],
    ["seek-backward-5s", "playback.seekBy", [-5000]],
    ["seek-forward-1s", "playback.seekBy", [1000]],
    ["open-shortcut-settings", "navigation.navigateTo", ["/setting"]],
    ["navigate-home", "navigation.navigateHome", []],
    ["toggle-stage-settings", "folia.toggleStageSettings", []],
    ["open-folia-theme-library", "folia.openFoliaThemeLibrary", []],
    ["toggle-desktop-music-mode", "desktop.toggleDesktopMusicMode", []],
    ["focus-playlist-search", "playlist.focusSearch", []],
    ["open-current-track-comments", "track.openCurrentComments", []],
  ] as const)("%s routes to its domain capability", (id, action, args) => {
    const { calls, context } = actionRecorder();
    const command = getCommandDefinition(id);
    if (!command) throw new Error(`Missing shortcut command: ${id}`);
    command.execute(context);
    expect(calls).toEqual([[action, [...args]]]);
  });

  test("lattice availability changes with the current page state", () => {
    const unavailable = { latticeActive: false, latticeAvailable: false };
    const available = { latticeActive: false, latticeAvailable: true };
    const active = { latticeActive: true, latticeAvailable: true };
    expect(isShortcutCommandAvailable("playlist-view-lattice", unavailable)).toBe(false);
    expect(isShortcutCommandAvailable("playlist-view-lattice", available)).toBe(true);
    expect(isShortcutCommandAvailable("playlist-view-lattice", active)).toBe(false);
    expect(isShortcutCommandAvailable("playlist-view-list", active)).toBe(true);
    expect(isShortcutCommandAvailable("toggle-lattice-lights-off", available)).toBe(false);
    expect(isShortcutCommandAvailable("toggle-lattice-lights-off", active)).toBe(true);
    expect(isShortcutCommandAvailable("toggle-playback", unavailable)).toBe(true);
  });

  test("workspace exposure and input policies travel with declarations", () => {
    const visibleIds = SHORTCUT_COMMANDS.filter(
      (command) =>
        (command.scope ?? "global") === "global" && command.showInCommandWorkspace !== false,
    ).map(({ id }) => id);
    for (const id of [
      "open-search",
      "open-command-palette",
      "open-folia-settings",
      "open-folia-theme-library",
      "focus-playlist-search",
    ])
      expect(visibleIds).not.toContain(id);
    expect(visibleIds).toContain("toggle-stage-settings");
    expect(DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS).toHaveLength(16);
    expect(DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS).toContain("toggle-playback");
    expect(DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS).not.toContain("toggle-sidebar");
    expect(getCommandDefinition("open-whats-new")?.keywords).toContain("changelog");
    expect(getCommandDefinition("toggle-mute")?.focus).toBe("anywhere");
    expect(getCommandDefinition("increase-volume")?.focus).toBe("volume");
    expect(getCommandDefinition("seek-forward-5s")?.allowRepeat).toBe(true);
    expect(getCommandDefinition("toggle-playback")?.allowRepeat).toBeUndefined();
  });

  test("existing overrides, disabled commands and conflicts still resolve by stable ID", () => {
    expect(getEffectiveShortcutBinding("toggle-playback", {})).toEqual({ key: "Space" });
    expect(getEffectiveShortcutBinding("navigate-home", {})).toEqual({ key: "Home" });
    expect(getEffectiveShortcutBinding("toggle-playback", { "toggle-playback": null })).toBeNull();
    expect(
      getEffectiveShortcutBinding("toggle-playback", {
        "toggle-playback": { key: "KeyQ", primary: true },
      }),
    ).toEqual({ key: "KeyQ", primary: true });
    expect(findShortcutConflict("toggle-like", { key: "Space" }, {})).toBe("toggle-playback");
    expect(
      findShortcutConflict("toggle-like", { key: "Space" }, { "toggle-playback": null }),
    ).toBeNull();
    const forbidden = SHORTCUT_COMMANDS.filter(
      ({ defaultBinding }) => defaultBinding?.key === "KeyS",
    );
    expect(forbidden).toEqual([]);
  });
});
