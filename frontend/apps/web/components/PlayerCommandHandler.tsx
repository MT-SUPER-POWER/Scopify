////////////////////////////////////////////////////////////////////////////////////////
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 于其他窗口同步播放状态的核心组件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
////////////////////////////////////////////////////////////////////////////////////////

"use client";

import { useEffect } from "react";
import { useInWindowShortcuts } from "@/hooks/shortcuts/useInWindowShortcuts";
import {
  publishCrossWindowPlayerSnapshot,
  REMOTE_PLAYER_SNAPSHOT_EVENT,
  selectRemotePlayerSnapshot,
  subscribeCrossWindowPlayerSnapshots,
} from "@/lib/player/remotePlayerState";
import { runtime } from "@/lib/runtime";
import { usePlayerStore, useUserStore } from "@/store";
import type { PlayerBroadcastCommand, RemotePlayerSnapshot } from "@/types/player";

const REMOTE_PLAYER_HEARTBEAT_INTERVAL_MS = 1_000;

export function PlayerCommandHandler() {
  useInWindowShortcuts();

  useEffect(() => {
    if (!runtime.isDesktop || typeof window === "undefined") return;

    if (window.location.pathname.includes("/tray")) return;

    const cmdChannel = new BroadcastChannel("momo-player-controls");
    const stateChannel = new BroadcastChannel("momo-player-state");
    const snapshotListeners: Array<(snapshot: RemotePlayerSnapshot) => void> = [
      (snapshot) => stateChannel.postMessage(snapshot),
      (snapshot) => runtime.media.setPlaying(snapshot.isPlaying),
      (snapshot) =>
        window.dispatchEvent(new CustomEvent(REMOTE_PLAYER_SNAPSHOT_EVENT, { detail: snapshot })),
    ];
    const onSnapshotListenerError = (error: unknown, listenerIndex: number) => {
      void runtime.logging.write({
        level: "warn",
        message: "Cross-window player snapshot listener failed.",
        metadata: { error: String(error), listenerIndex },
      });
    };
    const publishState = () => {
      const snapshot = selectRemotePlayerSnapshot(usePlayerStore.getState());
      publishCrossWindowPlayerSnapshot(snapshot, snapshotListeners, onSnapshotListenerError);
    };

    cmdChannel.onmessage = (event: MessageEvent<PlayerBroadcastCommand>) => {
      const message = event.data;
      const player = usePlayerStore.getState();

      switch (message.type) {
        case "PLAY_NEXT":
          player.playNext();
          break;
        case "PLAY_PREV":
          player.playPrev();
          break;
        case "TOGGLE_PLAY":
          player.togglePlaying();
          break;
        case "SET_VOLUME":
          player.setVolume(message.payload);
          break;
        case "SYNC_USER_STORE": {
          const userStr = localStorage.getItem("user-storage");
          if (userStr) {
            try {
              useUserStore.setState(JSON.parse(userStr).state);
            } catch {
              // Ignore a corrupted persisted user snapshot; the main window remains authoritative.
            }
          }
          break;
        }
        case "REQUEST_STATE":
          publishState();
          break;
      }
    };

    // The controller can mount before this authoritative handler is ready. Publish once on
    // connection as well as on later changes so a missed one-shot request cannot leave it stale.
    const unsubscribePlayerStore = subscribeCrossWindowPlayerSnapshots(
      {
        getState: () => usePlayerStore.getState(),
        subscribe: (listener) => usePlayerStore.subscribe(listener),
      },
      snapshotListeners,
      {
        heartbeatIntervalMs: REMOTE_PLAYER_HEARTBEAT_INTERVAL_MS,
        onListenerError: onSnapshotListenerError,
        scheduler: {
          clearInterval: (handle) => window.clearInterval(handle as number),
          setInterval: (callback, intervalMs) => window.setInterval(callback, intervalMs),
        },
      },
    );

    const handleThumbarControl = (command: string) => {
      const player = usePlayerStore.getState();
      const cmd = command.toLowerCase();

      switch (cmd) {
        case "prev":
          player.playPrev();
          break;
        case "next":
          player.playNext();
          break;
        case "toggle-play":
          player.togglePlaying();
          break;
      }
    };

    const unsubscribeControlAudio = runtime.media.onCommand(handleThumbarControl);

    return () => {
      cmdChannel.close();
      stateChannel.close();
      unsubscribePlayerStore();
      unsubscribeControlAudio();
    };
  }, []);

  return null;
}
