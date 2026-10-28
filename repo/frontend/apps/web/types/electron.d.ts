import type { DesktopBridge } from "@scopify/desktop-contract";

import type { LyricData } from "@/types/lyrics/model";

declare global {
  interface Window {
    electronAPI?: DesktopBridge<LyricData>;
  }
}

export {};
