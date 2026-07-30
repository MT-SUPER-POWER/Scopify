import type { DesktopBridge } from "@scopify/desktop-contract";

import type { AppConfig } from "@/types/config";
import type { LyricData } from "@/types/lyrics";

declare global {
  interface Window {
    electronAPI?: DesktopBridge<AppConfig, LyricData>;
  }
}

export {};
