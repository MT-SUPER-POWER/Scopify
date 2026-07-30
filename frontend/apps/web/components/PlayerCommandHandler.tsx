////////////////////////////////////////////////////////////////////////////////////////
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 于其他窗口同步播放状态的核心组件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
////////////////////////////////////////////////////////////////////////////////////////

"use client";

import { useEffect } from "react";
import { useInWindowShortcuts } from "@/hooks/shortcuts/useInWindowShortcuts";
import { IS_ELECTRON } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import type { PlayerBroadcastCommand } from "@/types/player";

const getSafeState = <T extends object>(state: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(state).filter(([, value]) => typeof value !== "function"),
  ) as Partial<T>;

export function PlayerCommandHandler() {
  useInWindowShortcuts();

  useEffect(() => {
    if (!IS_ELECTRON || typeof window === "undefined") return;

    if (window.location.pathname.includes("/tray")) return;

    const cmdChannel = new BroadcastChannel("momo-player-controls");
    const stateChannel = new BroadcastChannel("momo-player-state");

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
          stateChannel.postMessage(getSafeState(usePlayerStore.getState()));
          break;
      }
    };

    // 同步播放状态，让托盘窗口的播放/暂停按钮图标保持正确
    const unsubscribePlayerStore = usePlayerStore.subscribe((state) => {
      stateChannel.postMessage(getSafeState(state));
      window.electronAPI?.setPlayerPlaying(state.isPlaying);
    });

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

    const unsubscribeControlAudio = window.electronAPI?.onControlAudio(handleThumbarControl);

    return () => {
      cmdChannel.close();
      stateChannel.close();
      unsubscribePlayerStore();
      unsubscribeControlAudio?.();
    };
  }, []);

  return null;
}
