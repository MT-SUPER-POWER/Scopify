import type { DesktopBridge } from "@scopify/desktop-contract";

import type { LyricData } from "@/types/lyrics";

declare global {
  interface Window {
    electronAPI?: DesktopBridge<LyricData>;
  }
}

export {};
