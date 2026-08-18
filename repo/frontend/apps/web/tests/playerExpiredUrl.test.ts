import { afterAll, afterEach, beforeEach, expect, mock, test } from "bun:test";
import type { SongDetail } from "@/types/api/music";
import type { PlayerStore } from "@/types/player";

function createSong(id: number): SongDetail {
  return {
    id,
    name: `Song ${id}`,
    dt: 180_000,
    fee: 0,
    ar: [],
    al: {
      id,
      name: `Album ${id}`,
      picUrl: "",
    },
    publishTime: 0,
  };
}

const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;
const memoryStorage = new (class implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
})();

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: memoryStorage,
});
const importWindow = new EventTarget() as Window & typeof globalThis;
Object.defineProperty(importWindow, "localStorage", {
  configurable: true,
  value: memoryStorage,
});
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: importWindow,
});

const { mergePersistedPlayerState, selectPersistedPlayerState, usePlayerStore } =
  await import("@/store/module/player");
const initialPlayerState = usePlayerStore.getInitialState();
const { playTrack: initialPlayTrack, setIsPlaying, togglePlaying } = initialPlayerState;

const resetPlayerStore = (playTrack: PlayerStore["playTrack"] = initialPlayTrack) => {
  usePlayerStore.setState({
    ...initialPlayerState,
    currentSongDetail: null,
    currentSongUrl: null,
    isPlaying: false,
    playbackFailureCount: 0,
    playTrack,
  });
};

beforeEach(() => {
  resetPlayerStore();
});

afterEach(() => {
  resetPlayerStore();
});

afterAll(() => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: originalLocalStorage,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

test("discard an expired persisted playback URL during rehydration", () => {
  const restored = mergePersistedPlayerState(
    {
      currentSongDetail: createSong(1),
      currentSongUrl: "https://expired.example/song.mp3",
    },
    usePlayerStore.getState(),
  ) as PlayerStore;
  const persisted = selectPersistedPlayerState({
    ...usePlayerStore.getState(),
    currentSongUrl: "https://temporary.example/song.mp3",
  });

  expect(restored.currentSongUrl).toBeNull();
  expect(persisted).not.toHaveProperty("currentSongUrl");
});

test("request a fresh playback URL when resuming a restored song", async () => {
  const song = createSong(2);
  const playTrack = mock(async () => true);
  usePlayerStore.setState({
    currentSongDetail: song,
    currentSongUrl: null,
    isPlaying: false,
    playTrack,
  });

  try {
    await togglePlaying();
    expect(playTrack).toHaveBeenCalledWith(song, { preservePlaybackSession: true });
  } finally {
    resetPlayerStore(initialPlayTrack);
  }
});

test("legacy play controls request a fresh URL through setIsPlaying", async () => {
  const song = createSong(3);
  const playTrack = mock(async () => true);
  usePlayerStore.setState({
    currentSongDetail: song,
    currentSongUrl: null,
    isPlaying: false,
    playTrack,
  });

  try {
    setIsPlaying(true);
    await Promise.resolve();
    expect(playTrack).toHaveBeenCalledWith(song, { preservePlaybackSession: true });
  } finally {
    resetPlayerStore(initialPlayTrack);
  }
});
