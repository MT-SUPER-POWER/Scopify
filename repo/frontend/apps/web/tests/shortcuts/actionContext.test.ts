import { expect, mock, test } from "bun:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import type { ShortcutActionContext, ShortcutCommandId } from "@/types/shortcuts/model";

let playback = { durationMs: 10000, volume: 98 };
let sampledPosition = 9800;
const projection = { getSnapshot: () => playback, samplePositionMs: () => sampledPosition };
const commands = {
  toggle: mock(() => {}),
  toggleLike: mock(() => {}),
  previous: mock(() => {}),
  next: mock(() => {}),
  seek: mock((_position: number) => {}),
  setVolume: mock((volume: number) => {
    playback = { ...playback, volume };
  }),
};
const router = { push: mock((_path: string, _options: unknown) => {}) };
const navigate = mock((_path: string) => {});
const focusSearch = mock(() => {});
const ui = {
  isLyricsOpen: false,
  isSearchOpen: false,
  isShortcutHelpOpen: false,
  setIsLyricsOpen(value: boolean) {
    this.isLyricsOpen = value;
  },
  setIsSearchOpen(value: boolean) {
    this.isSearchOpen = value;
  },
  setIsShortcutHelpOpen(value: boolean) {
    this.isShortcutHelpOpen = value;
  },
  toggleLyrics() {
    this.isLyricsOpen = !this.isLyricsOpen;
  },
  toggleSidebar: mock(() => {}),
  toggleQueue: mock(() => {}),
  toggleNowPlayingPanel: mock(() => {}),
};
const folia = {
  stagePanelOpen: false,
  setStagePanelOpen(value: boolean) {
    this.stagePanelOpen = value;
  },
  toggleStagePanel() {
    this.stagePanelOpen = !this.stagePanelOpen;
  },
  toggleVisualSettings: mock(() => {}),
  toggleThemeLibrary: mock(() => {}),
};
const search = {
  query: "",
  setQuery(value: string) {
    this.query = value;
  },
};
const lattice = { active: false, controller: null as { open(): void; close(): void } | null };
const desktop = {
  isDesktop: false,
  dynamicIsland: { toggle: mock(() => {}) },
  window: { reload: mock(() => {}) },
};

mock.module("next/navigation", () => ({ useRouter: () => router }));
mock.module("@/hooks/player/usePlaybackCommands", () => ({ usePlaybackCommands: () => commands }));
mock.module("@/hooks/player/usePlaybackProjection", () => ({
  usePlaybackProjectionStore: () => projection,
}));
mock.module("@/store/module/ui", () => ({ useUiStore: { getState: () => ui } }));
mock.module("@/store/module/foliaSettings", () => ({
  useFoliaSettingsStore: { getState: () => folia },
}));
mock.module("@/store/module/search", () => ({ useSearchStore: { getState: () => search } }));
mock.module("@/store/module/player", () => ({
  usePlayerStore: { getState: () => ({ currentSongDetail: null }) },
}));
mock.module("@/store/module/updates", () => ({
  useUpdatesStore: { getState: () => ({ open() {} }) },
}));
mock.module("@/store/module/audioEqualizer", () => ({
  useAudioEqualizerStore: { getState: () => ({}) },
}));
mock.module("@/store/module/audioOutput", () => ({
  useAudioOutputStore: { getState: () => ({}) },
}));
mock.module("@/store/module/desktopSubtitleControl", () => ({
  useDesktopSubtitleControl: { getState: () => ({}) },
}));
mock.module("@/store/module/lattice", () => ({
  useLatticeView: { getState: () => lattice },
  useLatticePreferences: { getState: () => ({}) },
}));
mock.module("@/lib/runtime", () => ({ runtime: desktop }));
mock.module("@/lib/shortcuts/fullscreen", () => ({ toggleApplicationFullscreen() {} }));
mock.module("@/lib/shortcuts/developerTools", () => ({ toggleApplicationDeveloperTools() {} }));

const { useShortcutActionContext } = await import("@/hooks/shortcuts/useShortcutActionContext");
const { useShortcutCommands } = await import("@/hooks/shortcuts/useShortcutCommands");
let context: ShortcutActionContext;
let execute: (id: ShortcutCommandId) => void;
function Harness() {
  context = useShortcutActionContext({ navigateTo: navigate, focusPlaylistSearch: focusSearch });
  execute = useShortcutCommands({ navigateTo: navigate, focusPlaylistSearch: focusSearch });
  return null;
}

test("action context reads live state and preserves command behavior", () => {
  renderToString(createElement(Harness));
  execute("increase-volume");
  expect(commands.setVolume).toHaveBeenLastCalledWith(100);
  playback = { ...playback, volume: 2 };
  execute("decrease-volume");
  expect(commands.setVolume).toHaveBeenLastCalledWith(0);
  playback = { ...playback, volume: 73 };
  execute("toggle-mute");
  expect(playback.volume).toBe(0);
  execute("toggle-mute");
  expect(playback.volume).toBe(73);

  execute("seek-forward-5s");
  expect(commands.seek).toHaveBeenLastCalledWith(10000);
  sampledPosition = 100;
  execute("seek-backward-1s");
  expect(commands.seek).toHaveBeenLastCalledWith(0);
  playback = { ...playback, durationMs: 0 };
  execute("seek-forward-5s");
  expect(commands.seek).toHaveBeenLastCalledWith(5100);

  execute("toggle-stage-settings");
  expect(ui.isLyricsOpen).toBe(true);
  expect(folia.stagePanelOpen).toBe(true);
  execute("toggle-stage-settings");
  expect(folia.stagePanelOpen).toBe(false);
  execute("navigate-home");
  expect(ui.isLyricsOpen).toBe(false);
  expect(navigate).toHaveBeenLastCalledWith("/");
  execute("open-shortcut-settings");
  expect(navigate).toHaveBeenLastCalledWith("/setting");
  expect(router.push).not.toHaveBeenCalled();
  execute("focus-playlist-search");
  expect(focusSearch).toHaveBeenCalledTimes(1);

  execute("open-command-palette");
  expect(search.query).toBe("> ");
  expect(ui.isSearchOpen).toBe(true);
  execute("open-command-palette");
  expect(search.query).toBe("");
  expect(ui.isSearchOpen).toBe(false);

  execute("toggle-dynamic-island");
  expect(desktop.dynamicIsland.toggle).not.toHaveBeenCalled();
  desktop.isDesktop = true;
  execute("toggle-dynamic-island");
  expect(desktop.dynamicIsland.toggle).toHaveBeenCalledTimes(1);

  execute("reload-window");
  expect(desktop.window.reload).toHaveBeenCalledTimes(1);

  const open = mock(() => {});
  lattice.controller = { open, close() {} };
  execute("playlist-view-lattice");
  expect(open).toHaveBeenCalledTimes(1);
  lattice.active = true;
  execute("playlist-view-lattice");
  expect(open).toHaveBeenCalledTimes(1);
  expect(context.playback).toBeDefined();
});
