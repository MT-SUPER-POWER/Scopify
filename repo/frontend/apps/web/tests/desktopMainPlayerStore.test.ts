import { afterAll, afterEach, expect, mock, test } from "bun:test";

import {
  registerDesktopMainPlaybackCommandDispatcher,
  type DesktopMainPlaybackCommandDispatcher,
} from "@/lib/playbackHost/desktopMainCommandDispatcher";
import {
  registerDesktopMainQueueCommandDispatcher,
  type DesktopMainQueueCommandDispatcher,
} from "@/lib/playbackHost/desktopMainQueueCommandDispatcher";
import { runtime } from "@/lib/runtime";
import { usePlayerStore } from "@/store/module/player";
import type { SongDetail } from "@/types/api/music";

const originalIsDesktop = runtime.isDesktop;
const originalGetNonce = runtime.playbackHost.getNonce;
const originalState = usePlayerStore.getState();

let unregisterPlaybackDispatcher: (() => void) | null = null;
let unregisterQueueDispatcher: (() => void) | null = null;

function createSong(id: number): SongDetail {
  return {
    al: { id, name: `Album ${id}`, picUrl: "" },
    ar: [],
    dt: 180_000,
    fee: 0,
    id,
    name: `Song ${id}`,
    publishTime: 0,
  };
}

function enableDesktopMainRuntime(): void {
  Object.defineProperty(runtime, "isDesktop", { configurable: true, value: true });
  Object.defineProperty(runtime.playbackHost, "getNonce", {
    configurable: true,
    value: () => null,
  });
}

afterEach(() => {
  unregisterPlaybackDispatcher?.();
  unregisterPlaybackDispatcher = null;
  unregisterQueueDispatcher?.();
  unregisterQueueDispatcher = null;
  usePlayerStore.setState(originalState, true);
  Object.defineProperty(runtime, "isDesktop", { configurable: true, value: originalIsDesktop });
  Object.defineProperty(runtime.playbackHost, "getNonce", {
    configurable: true,
    value: originalGetNonce,
  });
});

afterAll(() => {
  Object.defineProperty(runtime, "isDesktop", { configurable: true, value: originalIsDesktop });
  Object.defineProperty(runtime.playbackHost, "getNonce", {
    configurable: true,
    value: originalGetNonce,
  });
});

test("desktop Main owns queue state even when legacy Host dispatchers are present", () => {
  enableDesktopMainRuntime();
  const playbackDispatch = mock<DesktopMainPlaybackCommandDispatcher>(async (command) => ({
    commandId: command.commandId,
    status: "accepted",
  }));
  const queueDispatch = mock<DesktopMainQueueCommandDispatcher>(async () => ({
    status: "applied",
  }));
  unregisterPlaybackDispatcher = registerDesktopMainPlaybackCommandDispatcher(playbackDispatch);
  unregisterQueueDispatcher = registerDesktopMainQueueCommandDispatcher(queueDispatch);
  const songs = [createSong(1), createSong(2), createSong(3)];

  usePlayerStore.setState({ currentSongDetail: songs[1] });
  usePlayerStore.getState().setQueue(songs, 1, 88);
  usePlayerStore.getState().setRepeatMode("all");
  usePlayerStore.getState().setShuffle(true);
  usePlayerStore.getState().moveQueueItem(0, 2);
  usePlayerStore.getState().setVolume(42);

  expect(playbackDispatch).not.toHaveBeenCalled();
  expect(queueDispatch).not.toHaveBeenCalled();
  expect(usePlayerStore.getState()).toMatchObject({
    historyIndex: 0,
    historyStack: [0],
    isShuffle: true,
    playlistId: 88,
    queueIndex: 0,
    repeatMode: "all",
    volume: 42,
  });
  expect(usePlayerStore.getState().queue).toEqual([songs[1], songs[2], songs[0]]);
  expect(usePlayerStore.getState().originalQueue).toEqual([songs[1], songs[2], songs[0]]);
});

test("desktop Main preserves the selected full queue locally", () => {
  enableDesktopMainRuntime();
  const songs = [createSong(1), createSong(2), createSong(3)];

  usePlayerStore.getState().setQueue(songs, 2, "daily");

  expect(usePlayerStore.getState()).toMatchObject({
    historyIndex: 0,
    historyStack: [2],
    playlistId: "daily",
    queueIndex: 2,
  });
  expect(usePlayerStore.getState().queue).toEqual(songs);
  expect(usePlayerStore.getState().originalQueue).toEqual(songs);
});
