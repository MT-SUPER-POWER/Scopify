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
import { useTimeStore } from "@/store/module/time";
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
    let latestPositionMs = useTimeStore.getState().currentTime;
    const selectPlayerSnapshot = (positionMs = latestPositionMs) =>
      selectRemotePlayerSnapshot({
        ...usePlayerStore.getState(),
        positionMs: Math.max(0, positionMs),
      });
    const publishState = () => {
      const snapshot = selectPlayerSnapshot();
      publishCrossWindowPlayerSnapshot(snapshot, snapshotListeners, onSnapshotListenerError);
    };
    const publishPosition = (positionMs: number) => {
      latestPositionMs = Math.max(0, positionMs);
      stateChannel.postMessage(selectPlayerSnapshot());
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
        case "SEEK": {
          const positionMs = Math.max(0, message.payload);
          window.dispatchEvent(new CustomEvent("player-seek", { detail: positionMs }));
          publishPosition(positionMs);
          break;
        }
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
        getState: () => ({
          ...usePlayerStore.getState(),
          positionMs: latestPositionMs,
        }),
        subscribe: (listener) =>
          usePlayerStore.subscribe((state) => listener({ ...state, positionMs: latestPositionMs })),
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
    const onPlayerTime = (event: Event) => {
      const positionMs = (event as CustomEvent<unknown>).detail;
      if (typeof positionMs === "number" && Number.isFinite(positionMs)) {
        publishPosition(Math.max(0, positionMs));
      }
    };
    window.addEventListener("player-time", onPlayerTime);

    return () => {
      cmdChannel.close();
      stateChannel.close();
      window.removeEventListener("player-time", onPlayerTime);
      unsubscribePlayerStore();
      unsubscribeControlAudio();
    };
  }, []);

  return null;
}
