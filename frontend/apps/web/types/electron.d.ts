import type { DesktopBridge, PlaybackHostBridge } from "@scopify/desktop-contract";

import type { LyricData } from "@/types/lyrics";

declare global {
  interface Window {
    electronAPI?: DesktopBridge<LyricData>;
    playbackHostAPI?: PlaybackHostBridge<LyricData>;
  }
}

export {};
