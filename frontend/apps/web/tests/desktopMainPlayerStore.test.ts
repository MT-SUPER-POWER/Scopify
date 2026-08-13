import { afterAll, afterEach, expect, mock, test } from "bun:test";
import type { PlaybackCommand, PlaybackCommandReceipt } from "@scopify/desktop-contract";

import {
  dispatchDesktopMainPlaybackCommand,
  registerDesktopMainPlaybackCommandDispatcher,
} from "@/lib/playbackHost/desktopMainCommandDispatcher";
import { registerDesktopMainQueueCommandDispatcher } from "@/lib/playbackHost/desktopMainQueueCommandDispatcher";
import { runtime } from "@/lib/runtime";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";
import type { SongDetail } from "@/types/api/music";

const originalIsDesktop = runtime.isDesktop;
const originalGetNonce = runtime.playbackHost.getNonce;

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

const originalState = usePlayerStore.getState();
const originalTimeState = useTimeStore.getState();
let unregister: (() => void) | null = null;
let unregisterQueue: (() => void) | null = null;

afterEach(() => {
  unregister?.();
  unregister = null;
  unregisterQueue?.();
  unregisterQueue = null;
  usePlayerStore.setState(originalState, true);
  useTimeStore.setState(originalTimeState, true);
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

function enableDesktopMainRuntime(): void {
  Object.defineProperty(runtime, "isDesktop", { configurable: true, value: true });
  Object.defineProperty(runtime.playbackHost, "getNonce", {
    configurable: true,
    value: () => null,
  });
}

test("desktop Main routes direct controls through the registered replica dispatcher", async () => {
  enableDesktopMainRuntime();
  const songs = [createSong(1), createSong(2)];
  const commands: PlaybackCommand[] = [];
  const dispatch = mock(async (command: PlaybackCommand): Promise<PlaybackCommandReceipt> => {
    commands.push(command);
    return { commandId: command.commandId, status: "accepted" };
  });
  unregister = registerDesktopMainPlaybackCommandDispatcher(dispatch);
  usePlayerStore.setState({
    currentSongDetail: songs[0],
    currentSongUrl: null,
    isPlaying: false,
    originalQueue: songs,
    queue: songs,
    queueIndex: 0,
  });

  await usePlayerStore.getState().togglePlaying();
  usePlayerStore.getState().setIsPlaying(true);
  usePlayerStore.getState().setIsPlaying(false);
  usePlayerStore.getState().setVolume(42);
  await usePlayerStore.getState().playNext();
  await usePlayerStore.getState().playPrev();

  expect(commands.map((command) => command.type)).toEqual([
    "toggle",
    "play",
    "pause",
    "set-volume",
    "next",
    "previous",
  ]);
  expect(usePlayerStore.getState()).toMatchObject({
    isPlaying: false,
    queueIndex: 0,
    volume: originalState.volume,
  });
});

test("desktop Main sends queue intents to the Host without creating a local queue draft", async () => {
  enableDesktopMainRuntime();
  const songs = [createSong(1), createSong(2)];
  const commands: unknown[] = [];
  const dispatch = mock(async (command: unknown) => {
    commands.push(command);
    return { status: "applied" as const };
  });
  unregisterQueue = registerDesktopMainQueueCommandDispatcher(dispatch);
  usePlayerStore.setState({
    currentSongDetail: songs[0],
    currentSongUrl: "https://expired.example/1.mp3",
    historyIndex: 0,
    historyStack: [0],
    isPlaying: false,
    lyric: null,
    originalQueue: songs,
    playbackLoadRevision: 7,
    playbackSessionRevision: 3,
    queue: songs,
    queueIndex: 0,
  });

  await usePlayerStore.getState().playQueueIndex(1);

  expect(usePlayerStore.getState()).toMatchObject({
    currentSongDetail: songs[0],
    currentSongUrl: "https://expired.example/1.mp3",
    historyIndex: 0,
    historyStack: [0],
    isPlaying: false,
    lyric: null,
    playbackLoadRevision: 7,
    playbackSessionRevision: 3,
    queueIndex: 0,
    sourceChangeMode: "new-track",
  });
  expect(commands).toEqual([{ addToHistory: true, index: 1, type: "select-queue-index" }]);
});

test("desktop Main direct playTrack replaces the Host queue without a local media draft", async () => {
  enableDesktopMainRuntime();
  const currentSong = createSong(1);
  const requestedSong = createSong(2);
  const commands: unknown[] = [];
  unregisterQueue = registerDesktopMainQueueCommandDispatcher(async (command) => {
    commands.push(command);
    return { status: "applied" };
  });
  usePlayerStore.setState({
    currentSongDetail: currentSong,
    currentSongUrl: "https://cached.example/1.mp3",
    isPlaying: true,
    originalQueue: [currentSong],
    playbackLoadRevision: 7,
    playbackSessionRevision: 3,
    queue: [currentSong],
    queueIndex: 0,
  });

  await expect(usePlayerStore.getState().playTrack(requestedSong)).resolves.toBeTrue();

  expect(commands).toEqual([
    {
      play: true,
      playlistId: null,
      queue: [expect.objectContaining({ id: requestedSong.id })],
      startIndex: 0,
      type: "replace-queue",
    },
  ]);
  expect(usePlayerStore.getState()).toMatchObject({
    currentSongDetail: currentSong,
    currentSongUrl: "https://cached.example/1.mp3",
    isPlaying: true,
    playbackLoadRevision: 7,
    playbackSessionRevision: 3,
    queue: [currentSong],
    queueIndex: 0,
  });
});

test("desktop Main keeps the full source queue when a list sets its queue before playing one row", async () => {
  enableDesktopMainRuntime();
  const sourceQueue = [createSong(1), createSong(2), createSong(3)];
  const commands: unknown[] = [];
  unregisterQueue = registerDesktopMainQueueCommandDispatcher(async (command) => {
    commands.push(command);
    return { status: "applied" };
  });

  usePlayerStore.getState().setQueue(sourceQueue, 1, 88);
  await expect(usePlayerStore.getState().playTrack(sourceQueue[1]!)).resolves.toBeTrue();

  expect(commands).toEqual([
    {
      play: false,
      playlistId: 88,
      queue: [
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
        expect.objectContaining({ id: 3 }),
      ],
      startIndex: 1,
      type: "replace-queue",
    },
    {
      play: true,
      playlistId: 88,
      queue: [
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
        expect.objectContaining({ id: 3 }),
      ],
      startIndex: 1,
      type: "replace-queue",
    },
  ]);
});

test("desktop Main selects a song already present in the Host-projected queue", async () => {
  enableDesktopMainRuntime();
  const sourceQueue = [createSong(1), createSong(2), createSong(3)];
  const commands: unknown[] = [];
  unregisterQueue = registerDesktopMainQueueCommandDispatcher(async (command) => {
    commands.push(command);
    return { status: "applied" };
  });
  usePlayerStore.setState({
    currentSongDetail: sourceQueue[0],
    originalQueue: sourceQueue,
    queue: sourceQueue,
    queueIndex: 0,
  });

  await expect(usePlayerStore.getState().playTrack(sourceQueue[2]!)).resolves.toBeTrue();

  expect(commands).toEqual([{ addToHistory: true, index: 2, type: "select-queue-index" }]);
});

test("desktop Main never locally transitions queue mutation intents", () => {
  enableDesktopMainRuntime();
  const songs = [createSong(1), createSong(2), createSong(3)];
  const commands: unknown[] = [];
  unregisterQueue = registerDesktopMainQueueCommandDispatcher(async (command) => {
    commands.push(command);
    return { status: "applied" };
  });
  usePlayerStore.setState({
    currentSongDetail: songs[0],
    historyIndex: 0,
    historyStack: [0],
    isPlaying: true,
    isShuffle: false,
    originalQueue: songs,
    queue: songs,
    queueIndex: 0,
    repeatMode: "off",
  });
  const before = {
    historyIndex: usePlayerStore.getState().historyIndex,
    historyStack: usePlayerStore.getState().historyStack,
    isShuffle: usePlayerStore.getState().isShuffle,
    originalQueue: usePlayerStore.getState().originalQueue,
    queue: usePlayerStore.getState().queue,
    queueIndex: usePlayerStore.getState().queueIndex,
    repeatMode: usePlayerStore.getState().repeatMode,
  };

  usePlayerStore.getState().setQueue(songs.slice(1), 1, 24);
  void usePlayerStore.getState().playFromSong(songs[2], songs, 24);
  usePlayerStore.getState().setRepeatMode("all");
  usePlayerStore.getState().setShuffle(true);
  usePlayerStore.getState().toggleShuffle();
  usePlayerStore.getState().reshuffleQueue();
  usePlayerStore.getState().moveQueueItem(2, 1);
  usePlayerStore.getState().moveQueueItemToNext(2);
  usePlayerStore.getState().removeQueueItem(2);

  expect(usePlayerStore.getState()).toMatchObject(before);
  expect(commands).toEqual([
    {
      play: false,
      playlistId: 24,
      queue: [expect.objectContaining({ id: 2 }), expect.objectContaining({ id: 3 })],
      startIndex: 1,
      type: "replace-queue",
    },
    {
      play: true,
      playlistId: 24,
      queue: [
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
        expect.objectContaining({ id: 3 }),
      ],
      startIndex: 2,
      type: "replace-queue",
    },
    { repeatMode: "all", type: "set-repeat-mode" },
    { enabled: true, type: "set-shuffle" },
    { type: "toggle-shuffle" },
    { type: "reshuffle-queue" },
    { fromIndex: 2, toIndex: 1, type: "move-queue-item" },
    { index: 2, type: "move-queue-item-to-next" },
    { index: 2, type: "remove-queue-item" },
  ]);
});

test("desktop Main cleanCache fails closed and waits for the Host snapshot projection", async () => {
  enableDesktopMainRuntime();
  const songs = [createSong(1), createSong(2)];
  const commands: unknown[] = [];
  unregisterQueue = registerDesktopMainQueueCommandDispatcher(async (command) => {
    commands.push(command);
    return { reason: "playback-host-unavailable", status: "unavailable" };
  });
  usePlayerStore.setState({
    currentSongDetail: songs[0],
    currentSongUrl: "https://cached.example/1.mp3",
    historyIndex: 0,
    historyStack: [0],
    isPlaying: true,
    originalQueue: songs,
    queue: songs,
    queueIndex: 0,
  });
  useTimeStore.setState({ currentTime: 12_000, totalTime: 180_000 });

  usePlayerStore.getState().cleanCache();
  await Promise.resolve();

  expect(commands).toEqual([
    {
      play: false,
      playlistId: null,
      queue: [],
      startIndex: 0,
      type: "replace-queue",
    },
  ]);
  expect(usePlayerStore.getState()).toMatchObject({
    currentSongDetail: songs[0],
    currentSongUrl: "https://cached.example/1.mp3",
    historyIndex: 0,
    historyStack: [0],
    isPlaying: true,
    originalQueue: songs,
    queue: songs,
    queueIndex: 0,
  });
  expect(useTimeStore.getState()).toMatchObject({ currentTime: 12_000, totalTime: 180_000 });
});

test("desktop Main fails closed instead of returning to local playback when no dispatcher is registered", async () => {
  enableDesktopMainRuntime();
  const song = createSong(1);
  usePlayerStore.setState({
    currentSongDetail: song,
    currentSongUrl: null,
    isPlaying: false,
    volume: 66,
  });

  await usePlayerStore.getState().togglePlaying();
  usePlayerStore.getState().setVolume(12);

  expect(usePlayerStore.getState()).toMatchObject({ isPlaying: false, volume: 66 });
  await expect(
    dispatchDesktopMainPlaybackCommand({ commandId: "assert-unbound", type: "toggle" }),
  ).resolves.toMatchObject({ status: "unavailable" });
});
