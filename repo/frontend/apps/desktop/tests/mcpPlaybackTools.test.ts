import { describe, expect, test } from "bun:test";

import type { PlaybackCommandReceipt, PlaybackProjection } from "@scopify/desktop-contract";
import type { PlaybackGateway, PlaybackGatewayCommand } from "@main/capabilities/playbackGateway";
import { createMcpAuthorization } from "@main/capabilities/mcp/authorization";
import { createMcpPlaybackToolFacade } from "@main/capabilities/mcp/tools/playback";

function createGateway(snapshot: PlaybackProjection | null = createSnapshot()): PlaybackGateway {
  const receipts: PlaybackCommandReceipt[] = [];
  const dispatch = async (command: PlaybackGatewayCommand) => {
    const receipt = { commandId: command.type, status: "accepted" } as PlaybackCommandReceipt;
    receipts.push(receipt);
    return receipt;
  };

  return {
    dispose() {},
    dispatch,
    getSnapshot: () => (snapshot ? structuredClone(snapshot) : null),
    next: () => dispatch({ type: "next" }),
    pause: () => dispatch({ type: "pause" }),
    play: () => dispatch({ type: "play" }),
    previous: () => dispatch({ type: "previous" }),
    seek: (positionMs) => dispatch({ positionMs, type: "seek" }),
    setVolume: (volume) => dispatch({ type: "set-volume", volume }),
    subscribe: () => () => {},
    toggle: () => dispatch({ type: "toggle" }),
  };
}

function createSnapshot(): PlaybackProjection {
  return {
    authorityId: "authority",
    canControl: true,
    connection: "connected",
    durationMs: 185_346,
    isPlaying: true,
    liked: false,
    lyrics: ["do not expose this"],
    lyricsVersion: 1,
    phase: "playing",
    positionMs: 42_000,
    sessionId: "session",
    track: {
      albumTitle: "Album",
      artistNames: ["Artist"],
      artworkUrl: "https://image.example/artwork.jpg",
      id: 1964503912,
      title: "Song",
    },
    volume: 72,
  };
}

describe("MCP playback tool facade", () => {
  test("projects only the safe playback fields", () => {
    const tools = createMcpPlaybackToolFacade(
      createGateway(),
      createMcpAuthorization(["playback.read"]),
    );

    expect(tools.getPlaybackStatus()).toEqual({
      available: true,
      canControl: true,
      connection: "connected",
      durationMs: 185_346,
      phase: "playing",
      positionMs: 42_000,
      success: true,
      volume: 72,
    });
    expect(tools.getNowPlaying()).toEqual({
      available: true,
      durationMs: 185_346,
      phase: "playing",
      positionMs: 42_000,
      success: true,
      track: {
        albumTitle: "Album",
        artistNames: ["Artist"],
        artworkUrl: "https://image.example/artwork.jpg",
        id: 1964503912,
        title: "Song",
      },
    });
    expect(JSON.stringify(tools.getNowPlaying())).not.toContain("do not expose this");
  });

  test("returns an unavailable safe snapshot without an authority", () => {
    const tools = createMcpPlaybackToolFacade(
      createGateway(null),
      createMcpAuthorization(["playback.read"]),
    );

    expect(tools.getPlaybackStatus()).toMatchObject({
      available: false,
      phase: "unavailable",
      success: true,
    });
    expect(tools.getNowPlaying()).toMatchObject({ available: false, success: true, track: null });
  });

  test("checks playback-control permission before dispatching a command", async () => {
    const tools = createMcpPlaybackToolFacade(
      createGateway(),
      createMcpAuthorization(["playback.read"]),
    );

    await expect(tools.play()).resolves.toEqual({
      capability: "playback.control.play",
      reason: "capability-denied",
      success: false,
    });
  });

  test("checks playback-read permission before exposing a snapshot", () => {
    const tools = createMcpPlaybackToolFacade(createGateway(), createMcpAuthorization([]));

    expect(tools.getPlaybackStatus()).toEqual({
      capability: "playback.read.status",
      reason: "capability-denied",
      success: false,
    });
    expect(tools.getNowPlaying()).toEqual({
      capability: "playback.read.track",
      reason: "capability-denied",
      success: false,
    });
  });

  test("enforces granular permissions individually", async () => {
    const tools = createMcpPlaybackToolFacade(
      createGateway(),
      createMcpAuthorization(["playback.read.status", "playback.control.play"]),
    );

    // Allowed status read and play
    expect(tools.getPlaybackStatus().success).toBe(true);
    await expect(tools.play()).resolves.toMatchObject({ success: true });

    // Denied now playing and pause
    expect(tools.getNowPlaying()).toEqual({
      capability: "playback.read.track",
      reason: "capability-denied",
      success: false,
    });
    await expect(tools.pause()).resolves.toEqual({
      capability: "playback.control.pause",
      reason: "capability-denied",
      success: false,
    });
    await expect(tools.seek(1000)).resolves.toEqual({
      capability: "playback.control.seek",
      reason: "capability-denied",
      success: false,
    });
  });

  test("inherits permissions from legacy coarse groups", async () => {
    const tools = createMcpPlaybackToolFacade(
      createGateway(),
      createMcpAuthorization(["playback.read", "playback.control"]),
    );

    expect(tools.getPlaybackStatus().success).toBe(true);
    expect(tools.getNowPlaying().success).toBe(true);
    await expect(tools.play()).resolves.toMatchObject({ success: true });
    await expect(tools.pause()).resolves.toMatchObject({ success: true });
    await expect(tools.nextTrack()).resolves.toMatchObject({ success: true });
    await expect(tools.previousTrack()).resolves.toMatchObject({ success: true });
    await expect(tools.togglePlayback()).resolves.toMatchObject({ success: true });
    await expect(tools.seek(5000)).resolves.toMatchObject({ success: true });
    await expect(tools.setVolume(50)).resolves.toMatchObject({ success: true });
  });

  test("maps gateway receipts without claiming a command succeeded early", async () => {
    const gateway = createGateway();
    const tools = createMcpPlaybackToolFacade(
      gateway,
      createMcpAuthorization(["playback.read", "playback.control"]),
    );

    await expect(tools.seek(12_000)).resolves.toEqual({
      receipt: { commandId: "seek", status: "accepted" },
      success: true,
    });
  });

  test("does not label a rejected Gateway receipt as successful", async () => {
    const gateway = createGateway();
    gateway.pause = async () => ({
      commandId: "pause-rejected",
      reason: "authority-rejected",
      status: "rejected",
    });
    const tools = createMcpPlaybackToolFacade(
      gateway,
      createMcpAuthorization(["playback.read", "playback.control"]),
    );

    await expect(tools.pause()).resolves.toMatchObject({
      receipt: { reason: "authority-rejected", status: "rejected" },
      success: false,
    });
  });
});
