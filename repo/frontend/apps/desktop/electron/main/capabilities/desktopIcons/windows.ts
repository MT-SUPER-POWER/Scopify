import type { DesktopIconVisibilityState } from "@scopify/desktop-contract";
import { loadNativeWallpaperModule } from "@main/services/nativeWallpaperModule";

export function getWindowsDesktopIconVisibility(): Promise<DesktopIconVisibilityState> {
  return nativeVisibility();
}

export function setWindowsDesktopIconVisibility(
  visible: boolean,
): Promise<DesktopIconVisibilityState> {
  return nativeVisibility(visible);
}

async function nativeVisibility(visible?: boolean): Promise<DesktopIconVisibilityState> {
  if (process.platform !== "win32")
    return {
      diagnostic: "Desktop icon visibility control requires Windows Explorer.",
      supported: false,
      visible: null,
    };
  try {
    const native = loadNativeWallpaperModule();
    const result = await (visible === undefined
      ? native.getDesktopIconVisibility()
      : native.setDesktopIconVisibility(visible));
    return {
      supported: result.supported,
      visible: result.visible ?? null,
      ...(result.diagnostic ? { diagnostic: result.diagnostic } : {}),
    };
  } catch (error) {
    return {
      diagnostic: error instanceof Error ? error.message : String(error),
      supported: false,
      visible: null,
    };
  }
}
