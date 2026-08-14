import type { DesktopBridge } from "@mt-super-power/desktop-contract";

import type { LyricData } from "@/types/lyrics";

declare global {
  interface Window {
    electronAPI?: DesktopBridge<LyricData>;
  }
}

export {};
