"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { runtime } from "@/lib/runtime";
import type {
  PlayerBroadcastCommand,
  RemotePlayerControllerState,
  RemotePlayerSnapshot,
} from "@/types/player";

const DEFAULT_REMOTE_PLAYER_SNAPSHOT: RemotePlayerSnapshot = {
  currentSongDetail: null,
  isPlaying: false,
  positionMs: 0,
  volume: 100,
};

export function useRemotePlayerController(): RemotePlayerControllerState {
  const [snapshot, setSnapshot] = useState(DEFAULT_REMOTE_PLAYER_SNAPSHOT);
  const [isConnected, setIsConnected] = useState(false);
  const commandChannelRef = useRef<BroadcastChannel | null>(null);

  const sendCommand = useCallback((command: PlayerBroadcastCommand) => {
    commandChannelRef.current?.postMessage(command);
  }, []);

  useEffect(() => {
    if (!runtime.isDesktop || typeof BroadcastChannel === "undefined") return;

    const stateChannel = new BroadcastChannel("momo-player-state");
    const commandChannel = new BroadcastChannel("momo-player-controls");
    commandChannelRef.current = commandChannel;

    stateChannel.onmessage = (event: MessageEvent<Partial<RemotePlayerSnapshot>>) => {
      const next = event.data;
      setSnapshot((current) => ({
        currentSongDetail:
          next.currentSongDetail === undefined ? current.currentSongDetail : next.currentSongDetail,
        isPlaying: typeof next.isPlaying === "boolean" ? next.isPlaying : current.isPlaying,
        positionMs:
          typeof next.positionMs === "number" && Number.isFinite(next.positionMs)
            ? Math.max(0, next.positionMs)
            : current.positionMs,
        volume: typeof next.volume === "number" ? next.volume : current.volume,
      }));
      setIsConnected(true);
    };

    commandChannel.postMessage({ type: "REQUEST_STATE" } satisfies PlayerBroadcastCommand);

    return () => {
      if (commandChannelRef.current === commandChannel) {
        commandChannelRef.current = null;
      }
      commandChannel.close();
      stateChannel.close();
    };
  }, []);

  return {
    ...snapshot,
    isConnected,
    playNext: () => sendCommand({ type: "PLAY_NEXT" }),
    playPrevious: () => sendCommand({ type: "PLAY_PREV" }),
    seek: (positionMs) =>
      sendCommand({
        payload: Math.max(0, positionMs),
        type: "SEEK",
      }),
    setVolume: (volume) =>
      sendCommand({
        payload: Math.max(0, Math.min(100, volume)),
        type: "SET_VOLUME",
      }),
    togglePlaying: () => sendCommand({ type: "TOGGLE_PLAY" }),
  };
}
