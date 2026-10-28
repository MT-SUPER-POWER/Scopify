import { beforeEach, describe, expect, it, mock } from "bun:test";
import { create } from "zustand";
import { pruneSongDetail, type SongDetail } from "@/types/song/api";

const song = (id: number) => pruneSongDetail({ id, name: `Song ${id}` });
let requests = 0;
let nextSongs = [song(1), song(2), song(3)];
let fetchSongs = async () => ({ data: { code: 200, data: nextSongs } });
let plays = 0;
const player = create(() => ({
  playlistId: null as string | null,
  queue: [] as SongDetail[],
  queueIndex: 0,
  historyIndex: 0,
  historyStack: [] as number[],
  playbackSessionRevision: 0,
  setShuffle() {},
  setRepeatMode() {},
  async playFromSong(_song: SongDetail, tracks: SongDetail[], source: string) {
    plays++;
    player.setState({ playlistId: source, queue: tracks, queueIndex: 0 });
  },
  appendQueueItems(tracks: SongDetail[]) {
    player.setState((state) => ({ queue: [...state.queue, ...tracks] }));
  },
}));

mock.module("@/store/module/player", () => ({ usePlayerStore: player }));
mock.module("@/store/module/i18n", () => ({
  useI18nStore: { getState: () => ({ locale: "zh-CN" }) },
}));
mock.module("@/lib/api/personalFm", () => ({
  getPersonalFm: () => {
    requests++;
    return fetchSongs();
  },
  getPersonalFmByMode: () => {
    requests++;
    return fetchSongs();
  },
}));

const { usePersonalFmStore: fm } = await import("@/store/module/personalFm");

beforeEach(() => {
  player.setState({ playlistId: null, queue: [], playbackSessionRevision: 0 });
  fm.setState({
    tracks: [],
    status: "idle",
    error: null,
    selection: { mode: "DEFAULT", scene: null },
  });
  requests = 0;
  plays = 0;
  nextSongs = [song(1), song(2), song(3)];
  fetchSongs = async () => ({ data: { code: 200, data: nextSongs } });
});

describe("personal FM page session", () => {
  it("waits for the first request, deduplicates concurrent entries, and then reuses the playlist", async () => {
    const response = Promise.withResolvers<Awaited<ReturnType<typeof fetchSongs>>>();
    fetchSongs = () => response.promise;
    let ready = false;
    const first = fm
      .getState()
      .ensureReady()
      .then((value) => {
        ready = value;
        return value;
      });
    const second = fm.getState().ensureReady();
    await Promise.resolve();
    expect(ready).toBe(false);
    expect(requests).toBe(1);
    response.resolve({ data: { code: 200, data: nextSongs } });
    expect(await first).toBe(true);
    expect(await second).toBe(true);
    const tracks = fm.getState().tracks;
    expect(await fm.getState().ensureReady()).toBe(true);
    expect(fm.getState().tracks).toBe(tracks);
    expect(requests).toBe(1);
    expect(plays).toBe(1);
  });

  it("preserves FM songs after playback switches to a different playlist without restarting radio", async () => {
    await fm.getState().ensureReady();
    const tracks = fm.getState().tracks;
    player.setState({ playlistId: "another-playlist", queue: [song(99)] });
    expect(await fm.getState().ensureReady()).toBe(true);
    expect(fm.getState().tracks).toBe(tracks);
    expect(player.getState().playlistId).toBe("another-playlist");
    expect(requests).toBe(1);
    expect(plays).toBe(1);
  });

  it("keeps automatic refills and queue removals in the saved FM playlist", async () => {
    await fm.getState().ensureReady();
    player.getState().appendQueueItems([song(4)]);
    player.setState((state) => ({ queue: state.queue.filter((track) => track.id !== 2) }));
    player.setState({ playlistId: "other", queue: [song(99)] });
    expect(fm.getState().tracks.map((track) => track.id)).toEqual([1, 3, 4]);
  });

  it("replaces the entire list only on an explicit refresh, retaining old songs while it loads", async () => {
    await fm.getState().ensureReady();
    const previous = fm.getState().tracks;
    const response = Promise.withResolvers<Awaited<ReturnType<typeof fetchSongs>>>();
    fetchSongs = () => response.promise;
    const refresh = fm.getState().start();
    expect(fm.getState().tracks).toBe(previous);
    expect(fm.getState().status).toBe("loading");
    response.resolve({ data: { code: 200, data: [song(4), song(5)] } });
    expect(await refresh).toBe(true);
    expect(fm.getState().tracks.map((track) => track.id)).toEqual([4, 5]);
    expect(requests).toBe(2);
  });

  it("does not enter an empty session after failure, and preserves an existing list on refresh failure", async () => {
    fetchSongs = async () => {
      throw new Error("offline");
    };
    expect(await fm.getState().ensureReady()).toBe(false);
    expect(fm.getState().tracks).toEqual([]);
    fetchSongs = async () => ({ data: { code: 200, data: nextSongs } });
    await fm.getState().ensureReady();
    const previous = fm.getState().tracks;
    fetchSongs = async () => {
      throw new Error("offline");
    };
    expect(await fm.getState().start()).toBe(false);
    expect(fm.getState().tracks).toBe(previous);
    expect(await fm.getState().ensureReady()).toBe(true);
  });
});
