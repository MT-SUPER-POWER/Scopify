"use client";

import { useEffect } from "react";

import {
  createPlaybackHostSessionControlClient,
  type PlaybackHostSessionControlClientPlayerState,
} from "@/lib/playbackHost/sessionControlClient";
import { registerDesktopMainQueueCommandDispatcher } from "@/lib/playbackHost/desktopMainQueueCommandDispatcher";
import { createPlaybackHostReconnectScheduler } from "@/lib/playbackHost/reconnectScheduler";
import { runtime } from "@/lib/runtime";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";

const DESKTOP_MAIN_SESSION_CONTROL_CONNECTION_ID = "main-renderer-playback-host-session";
// Covers the PlaybackHostManager's 0.5/1/2/5s startup recovery while
// capping continued retries at a low 5-second cadence.
const RECONNECTION_DELAYS_MS = [250, 500, 1_000, 2_000, 5_000] as const;

/**
 * Keeps the visible desktop renderer as a durable-session client only. Media
 * commands and high-frequency clock projection use their dedicated channels.
 */
export function DesktopPlaybackHostSessionClient() {
  useEffect(() => {
    if (!runtime.isDesktop) return;

    let disposed = false;
    let client: ReturnType<typeof createPlaybackHostSessionControlClient> | null = null;
    const reconnectScheduler = createPlaybackHostReconnectScheduler({
      clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
      delaysMs: RECONNECTION_DELAYS_MS,
      onReconnect: () => {
        if (disposed) return;
        try {
          client?.connect();
        } catch {
          // A Host still booting/recovering is retried by the bounded scheduler.
        }
      },
      setTimer: (callback, delayMs) => setTimeout(callback, delayMs),
    });

    client = createPlaybackHostSessionControlClient({
      applySnapshot: (_snapshot, projection) => {
        reconnectScheduler.notifySnapshot();

        const { resumePositionMs, ...playerProjection } = projection;
        const previousPlayer = usePlayerStore.getState();
        usePlayerStore.setState({
          ...playerProjection,
          currentSongUrl: null,
          lyric: null,
          playbackFailureCount: 0,
          playbackLoadRevision: previousPlayer.playbackLoadRevision + 1,
          sourceChangeMode: "preserve-position",
        });
        useTimeStore.setState({
          bufferedTime: 0,
          currentTime: resumePositionMs,
          totalTime: playerProjection.currentSongDetail?.dt ?? 0,
        });
      },
      commandIdPrefix: "main-playback-session",
      connectionId: DESKTOP_MAIN_SESSION_CONTROL_CONNECTION_ID,
      control: runtime.playbackHostControl,
      onConnectionClosed: () => reconnectScheduler.notifyConnectionClosed(),
      onHostRecoveryRequired: () => reconnectScheduler.notifyConnectionClosed(),
      readPlayerState: () => usePlayerStore.getState(),
      readResumePositionMs: () => useTimeStore.getState().currentTime,
    });
    const unregisterQueueCommands = registerDesktopMainQueueCommandDispatcher(
      (command) =>
        client?.dispatchQueueCommand(command) ??
        Promise.resolve({
          reason: "playback-host-session-client-unavailable",
          status: "unavailable" as const,
        }),
    );

    const unsubscribePlayer = usePlayerStore.subscribe((state, previousState) => {
      if (hasDurableSessionStateChanged(state, previousState)) client?.notifyPlayerStateChanged();
    });

    reconnectScheduler.start();

    return () => {
      disposed = true;
      reconnectScheduler.close();
      unsubscribePlayer();
      unregisterQueueCommands();
      client?.close();
      client = null;
    };
  }, []);

  return null;
}

function hasDurableSessionStateChanged(
  state: PlaybackHostSessionControlClientPlayerState,
  previousState: PlaybackHostSessionControlClientPlayerState,
): boolean {
  return (
    state.historyIndex !== previousState.historyIndex ||
    state.historyStack !== previousState.historyStack ||
    state.isPlaying !== previousState.isPlaying ||
    state.isShuffle !== previousState.isShuffle ||
    state.musicQuality !== previousState.musicQuality ||
    state.originalQueue !== previousState.originalQueue ||
    state.playlistId !== previousState.playlistId ||
    state.queue !== previousState.queue ||
    state.queueIndex !== previousState.queueIndex ||
    state.repeatMode !== previousState.repeatMode ||
    state.volume !== previousState.volume
  );
}
