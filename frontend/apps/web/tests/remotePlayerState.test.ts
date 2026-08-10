import { describe, expect, test } from "bun:test";

import {
  subscribeCrossWindowPlayerSnapshots,
  subscribeRemotePlayerSnapshots,
} from "@/lib/player/remotePlayerState";
import type { SongDetail } from "@/types/api/music";
import type { RemotePlayerSnapshot } from "@/types/player";

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

describe("remote player state publisher", () => {
  test("publishes the current track immediately, then follows later player updates", () => {
    let state = {
      currentSongDetail: createSong(2),
      ignoredAction: () => undefined,
      isPlaying: true,
      volume: 80,
    };
    const subscription: { listener: ((nextState: typeof state) => void) | null } = {
      listener: null,
    };
    const snapshots: RemotePlayerSnapshot[] = [];
    const unsubscribe = subscribeRemotePlayerSnapshots(
      {
        getState: () => state,
        subscribe: (listener) => {
          subscription.listener = listener;
          return () => {
            subscription.listener = null;
          };
        },
      },
      (snapshot) => snapshots.push(snapshot),
    );

    expect(snapshots.map((snapshot) => snapshot.currentSongDetail?.id)).toEqual([2]);

    state = { ...state, currentSongDetail: createSong(3) };
    subscription.listener?.(state);
    expect(snapshots.map((snapshot) => snapshot.currentSongDetail?.id)).toEqual([2, 3]);
    expect(Object.keys(snapshots[1]).sort()).toEqual(["currentSongDetail", "isPlaying", "volume"]);

    unsubscribe();
  });

  test("self-heals a missed track notification for every cross-window consumer", () => {
    let state: RemotePlayerSnapshot = {
      currentSongDetail: createSong(10),
      isPlaying: true,
      volume: 80,
    };
    const heartbeatCallbacks: Array<() => void> = [];
    const controllerTrackIds: Array<number | undefined> = [];
    const wallpaperTrackIds: Array<number | undefined> = [];
    const unsubscribe = subscribeCrossWindowPlayerSnapshots(
      {
        getState: () => state,
        subscribe: () => () => undefined,
      },
      [
        (snapshot) => controllerTrackIds.push(snapshot.currentSongDetail?.id),
        (snapshot) => wallpaperTrackIds.push(snapshot.currentSongDetail?.id),
      ],
      {
        heartbeatIntervalMs: 500,
        scheduler: {
          clearInterval: () => undefined,
          setInterval: (callback) => {
            heartbeatCallbacks.push(callback);
            return 1;
          },
        },
      },
    );

    expect(controllerTrackIds).toEqual([10]);
    expect(wallpaperTrackIds).toEqual([10]);
    state = { ...state, currentSongDetail: createSong(11) };
    expect(heartbeatCallbacks).toHaveLength(1);
    heartbeatCallbacks[0]();
    expect(controllerTrackIds).toEqual([10, 11]);
    expect(wallpaperTrackIds).toEqual([10, 11]);

    unsubscribe();
  });

  test("keeps healthy cross-window consumers live when another transport throws", () => {
    let state: RemotePlayerSnapshot = {
      currentSongDetail: createSong(20),
      isPlaying: true,
      volume: 80,
    };
    let notify: (() => void) | null = null;
    const wallpaperTrackIds: Array<number | undefined> = [];
    const unsubscribe = subscribeCrossWindowPlayerSnapshots(
      {
        getState: () => state,
        subscribe: (listener) => {
          notify = () => listener(state);
          return () => {
            notify = null;
          };
        },
      },
      [
        (snapshot) => {
          if (snapshot.currentSongDetail?.id === 21) throw new Error("channel closed");
        },
        (snapshot) => wallpaperTrackIds.push(snapshot.currentSongDetail?.id),
      ],
      {
        heartbeatIntervalMs: 500,
        scheduler: {
          clearInterval: () => undefined,
          setInterval: () => 1,
        },
      },
    );

    state = { ...state, currentSongDetail: createSong(21) };
    expect(() => notify?.()).not.toThrow();
    expect(wallpaperTrackIds).toEqual([20, 21]);

    unsubscribe();
  });
});
