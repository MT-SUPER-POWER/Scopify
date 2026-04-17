////////////////////////////////////////////////////////////////////////////////////////
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 于其他窗口同步播放状态的核心组件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
////////////////////////////////////////////////////////////////////////////////////////

"use client";

import { useEffect } from "react";
import { IS_ELECTRON } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";

const getSafeState = (state: any) => {
  const safeState: any = {};
  for (const key in state) {
    if (typeof state[key] !== "function") {
      safeState[key] = state[key];
    }
  }
  return safeState;
};

export function PlayerCommandHandler() {
  useEffect(() => {
    if (!IS_ELECTRON || typeof window === "undefined") return;

    if (window.location.pathname.includes("/tray")) return;

    const cmdChannel = new BroadcastChannel("momo-player-controls");
    const stateChannel = new BroadcastChannel("momo-player-state");

    cmdChannel.onmessage = (event) => {
      const { type, payload } = event.data;
      const player = usePlayerStore.getState();

      switch (type) {
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
          player.setVolume(payload);
          break;
        case "SYNC_USER_STORE": {
          const userStr = localStorage.getItem("user-storage");
          if (userStr) {
            try {
              useUserStore.setState(JSON.parse(userStr).state);
            } catch (_e) {}
          }
          break;
        }
        case "REQUEST_STATE":
          stateChannel.postMessage(getSafeState(usePlayerStore.getState()));
          break;
      }
    };

    // 同步播放状态，让托盘窗口的播放/暂停按钮图标保持正确
    const unsubscribe = usePlayerStore.subscribe((state) => {
      stateChannel.postMessage(getSafeState(state));
      if (window.electronAPI) {
        window.electronAPI.send("player-state-changed", { isPlaying: state.isPlaying });
      }
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

    if (window.electronAPI?.onControlAudio) {
      window.electronAPI.onControlAudio(handleThumbarControl);
    }

    return () => {
      cmdChannel.close();
      stateChannel.close();
      unsubscribe();
      if (window.electronAPI) {
        window.electronAPI.off("control-audio");
      }
    };
  }, []);

  return null;
}
