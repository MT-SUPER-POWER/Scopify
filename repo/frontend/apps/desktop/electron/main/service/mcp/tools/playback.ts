import type {
  McpPlaybackStatus,
  McpNowPlaying,
  McpPlaybackTrack,
  McpPlaybackControlResult,
  McpPlaybackReadResult,
  McpPlaybackToolFacade,
} from "@/types/service/mcp/tools/playback";
export type {
  McpPlaybackStatus,
  McpNowPlaying,
  McpPlaybackTrack,
  McpPlaybackControlResult,
  McpPlaybackReadResult,
  McpPlaybackToolFacade,
} from "@/types/service/mcp/tools/playback";
import type { PlaybackCommandReceipt, PlaybackTrack } from "@scopify/desktop-contract";

import type { McpCapability } from "@scopify/desktop-contract";
import type { PlaybackGateway } from "@/types/service/playback/gateway";

import type { McpAuthorization } from "@/types/service/mcp/authorization";

export function createMcpPlaybackToolFacade(
  playback: PlaybackGateway,
  authorization: McpAuthorization,
): McpPlaybackToolFacade {
  function snapshot() {
    return playback.getSnapshot();
  }

  function getPlaybackStatus(): McpPlaybackReadResult<McpPlaybackStatus> {
    if (!authorization.allows("playback.read.status")) return denied("playback.read.status");
    const current = snapshot();
    if (!current) return { ...unavailableStatus(), success: true };
    return {
      available: true,
      canControl: current.canControl,
      connection: current.connection,
      durationMs: current.durationMs,
      phase: current.phase,
      positionMs: current.positionMs,
      success: true,
      volume: current.volume,
    };
  }

  function getNowPlaying(): McpPlaybackReadResult<McpNowPlaying> {
    if (!authorization.allows("playback.read.track")) return denied("playback.read.track");
    const current = snapshot();
    if (!current) {
      return {
        available: false,
        durationMs: 0,
        phase: "unavailable",
        positionMs: 0,
        success: true,
        track: null,
      };
    }
    return {
      available: true,
      durationMs: current.durationMs,
      phase: current.phase,
      positionMs: current.positionMs,
      success: true,
      track: projectTrack(current.track),
    };
  }

  async function control(
    capability: McpCapability,
    action: () => Promise<PlaybackCommandReceipt>,
  ): Promise<McpPlaybackControlResult> {
    if (!authorization.allows(capability)) {
      return { capability, reason: "capability-denied", success: false };
    }
    const receipt = await action();
    return { receipt, success: receipt.status === "accepted" };
  }

  return {
    getNowPlaying,
    getPlaybackStatus,
    nextTrack: () => control("playback.control.next", () => playback.next()),
    pause: () => control("playback.control.pause", () => playback.pause()),
    play: () => control("playback.control.play", () => playback.play()),
    previousTrack: () => control("playback.control.previous", () => playback.previous()),
    seek: (positionMs) => control("playback.control.seek", () => playback.seek(positionMs)),
    setVolume: (volume) => control("playback.control.volume", () => playback.setVolume(volume)),
    togglePlayback: () => control("playback.control.toggle", () => playback.toggle()),
  };
}

function denied(capability: McpCapability) {
  return { capability, reason: "capability-denied" as const, success: false as const };
}

function unavailableStatus(): McpPlaybackStatus {
  return {
    available: false,
    canControl: false,
    connection: "unavailable",
    durationMs: 0,
    phase: "unavailable",
    positionMs: 0,
    volume: 0,
  };
}

function projectTrack(track: PlaybackTrack | null): McpPlaybackTrack | null {
  if (!track) return null;
  return {
    ...(track.albumTitle ? { albumTitle: track.albumTitle } : {}),
    artistNames: [...track.artistNames],
    ...(track.artworkUrl ? { artworkUrl: track.artworkUrl } : {}),
    id: track.id,
    title: track.title,
  };
}
