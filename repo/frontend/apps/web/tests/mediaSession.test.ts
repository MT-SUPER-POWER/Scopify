import * as React from "react";
import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";

import { useMediaSession } from "@/hooks/player/useMediaSession";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import type { SongDetail } from "@/types/api/music";

interface MockActionHandlers {
  [action: string]: MediaSessionActionHandler | null;
}

class MockMediaSession {
  actionHandlers: MockActionHandlers = {};
  metadata: MediaMetadata | null = null;
  playbackState: MediaSessionPlaybackState = "none";
  positionState: MediaPositionState | null = null;

  setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
    this.actionHandlers[action] = handler;
  }

  setPositionState(state?: MediaPositionState) {
    this.positionState = state ?? null;
  }
}

class MockMediaMetadata {
  album: string;
  artist: string;
  artwork: readonly MediaImage[];
  title: string;

  constructor(init: MediaMetadataInit) {
    this.album = init.album ?? "";
    this.artist = init.artist ?? "";
    this.artwork = init.artwork ?? [];
    this.title = init.title ?? "";
  }
}

describe("useMediaSession", () => {
  let mockMediaSession: MockMediaSession;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    mockMediaSession = new MockMediaSession();
    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { MediaMetadata: typeof MockMediaMetadata }).MediaMetadata =
      MockMediaMetadata;
    Object.defineProperty(globalThis.navigator, "mediaSession", {
      configurable: true,
      value: mockMediaSession,
      writable: true,
    });
  });

  afterEach(() => {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });

  test("synchronizes metadata with current track info and generates artwork sizes", () => {
    const mockSong: SongDetail = {
      al: {
        id: 100,
        name: "Test Album",
        picUrl: "https://example.com/cover.jpg",
        tns: [],
      },
      ar: [
        { alias: [], id: 1, name: "Artist A", tns: [] },
        { alias: [], id: 2, name: "Artist B", tns: [] },
      ],
      dt: 180000,
      fee: 0,
      id: 123456,
      name: "Test Song",
    } as unknown as SongDetail;

    const audioRef = { current: null };

    // Simulate hook effects
    const cleanup = testRunHook(() => {
      useMediaSession({
        audioRef,
        currentSongDetail: mockSong,
        isPlaying: true,
      });
    });

    expect(mockMediaSession.metadata).not.toBeNull();
    expect(mockMediaSession.metadata?.title).toBe("Test Song");
    expect(mockMediaSession.metadata?.artist).toBe("Artist A / Artist B");
    expect(mockMediaSession.metadata?.album).toBe("Test Album");
    expect(mockMediaSession.metadata?.artwork.length).toBe(6);
    expect(mockMediaSession.metadata?.artwork[0].src).toBe("https://example.com/cover.jpg");
    expect(mockMediaSession.playbackState).toBe("playing");

    cleanup();
  });

  test("clears metadata when no song is active", () => {
    const audioRef = { current: null };

    const cleanup = testRunHook(() => {
      useMediaSession({
        audioRef,
        currentSongDetail: null,
        isPlaying: false,
      });
    });

    expect(mockMediaSession.metadata).toBeNull();
    expect(mockMediaSession.playbackState).toBe("none");

    cleanup();
  });

  test("registers action handlers for media controls and routes to player store", () => {
    const audio = {
      currentTime: 30,
      duration: 180,
      playbackRate: 1,
      addEventListener: mock(() => {}),
      removeEventListener: mock(() => {}),
    } as unknown as HTMLAudioElement;
    const audioRef = { current: audio };

    const setIsPlayingMock = mock((_playing: boolean) => {});
    const playPrevMock = mock(async () => {});
    const advanceMock = mock(async () => {});

    usePlayerStore.setState({
      setIsPlaying: setIsPlayingMock,
      playPrev: playPrevMock,
    });
    usePersonalFmStore.setState({
      advance: advanceMock,
    });

    const cleanup = testRunHook(() => {
      useMediaSession({
        audioRef,
        currentSongDetail: {
          al: { id: 1, name: "Album", picUrl: "", tns: [] },
          ar: [{ alias: [], id: 1, name: "Artist", tns: [] }],
          dt: 180000,
          fee: 0,
          id: 1,
          name: "Song",
        } as unknown as SongDetail,
        isPlaying: true,
      });
    });

    expect(mockMediaSession.actionHandlers.play).toBeDefined();
    expect(mockMediaSession.actionHandlers.pause).toBeDefined();
    expect(mockMediaSession.actionHandlers.previoustrack).toBeDefined();
    expect(mockMediaSession.actionHandlers.nexttrack).toBeDefined();
    expect(mockMediaSession.actionHandlers.seekto).toBeDefined();
    expect(mockMediaSession.actionHandlers.seekbackward).toBeDefined();
    expect(mockMediaSession.actionHandlers.seekforward).toBeDefined();

    mockMediaSession.actionHandlers.play?.({ action: "play" });
    expect(setIsPlayingMock).toHaveBeenCalledWith(true);

    mockMediaSession.actionHandlers.pause?.({ action: "pause" });
    expect(setIsPlayingMock).toHaveBeenCalledWith(false);

    mockMediaSession.actionHandlers.previoustrack?.({ action: "previoustrack" });
    expect(playPrevMock).toHaveBeenCalledTimes(1);

    mockMediaSession.actionHandlers.nexttrack?.({ action: "nexttrack" });
    expect(advanceMock).toHaveBeenCalledTimes(1);

    mockMediaSession.actionHandlers.seekto?.({ action: "seekto", seekTime: 65 });
    expect(audio.currentTime).toBe(65);

    mockMediaSession.actionHandlers.seekbackward?.({ action: "seekbackward", seekOffset: 10 });
    expect(audio.currentTime).toBe(55);

    mockMediaSession.actionHandlers.seekforward?.({ action: "seekforward", seekOffset: 15 });
    expect(audio.currentTime).toBe(70);

    cleanup();

    // Verify cleanup unbinds action handlers
    expect(mockMediaSession.actionHandlers.play).toBeNull();
    expect(mockMediaSession.actionHandlers.pause).toBeNull();
  });

  test("synchronizes position state with audio progress", () => {
    const listeners: Record<string, () => void> = {};
    const audio = {
      currentTime: 45,
      duration: 180,
      playbackRate: 1,
      addEventListener: mock((event: string, handler: () => void) => {
        listeners[event] = handler;
      }),
      removeEventListener: mock((event: string) => {
        delete listeners[event];
      }),
    } as unknown as HTMLAudioElement;
    const audioRef = { current: audio };

    const cleanup = testRunHook(() => {
      useMediaSession({
        audioRef,
        currentSongDetail: {
          al: { id: 1, name: "Album", picUrl: "", tns: [] },
          ar: [{ alias: [], id: 1, name: "Artist", tns: [] }],
          dt: 180000,
          fee: 0,
          id: 1,
          name: "Song",
        } as unknown as SongDetail,
        isPlaying: true,
      });
    });

    expect(mockMediaSession.positionState).toEqual({
      duration: 180,
      playbackRate: 1,
      position: 45,
    });

    // Simulate audio progress
    audio.currentTime = 60;
    listeners.timeupdate?.();

    expect(mockMediaSession.positionState).toEqual({
      duration: 180,
      playbackRate: 1,
      position: 60,
    });

    cleanup();
    expect(listeners.timeupdate).toBeUndefined();
  });
});

/** Helper to run hook effects and collect cleanup functions in tests */
function testRunHook(render: () => void): () => void {
  const cleanups: (() => void)[] = [];
  const effectSpy = spyOn(React, "useEffect").mockImplementation((fn) => {
    const cleanup = fn();
    if (typeof cleanup === "function") cleanups.push(cleanup);
  });

  try {
    render();
  } finally {
    effectSpy.mockRestore();
  }

  return () => {
    for (const fn of cleanups) {
      fn();
    }
  };
}
