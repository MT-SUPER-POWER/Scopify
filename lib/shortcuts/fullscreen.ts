import { IS_ELECTRON } from "@/lib/utils";
import { useUiStore } from "@/store/module/ui";

export async function toggleApplicationFullscreen() {
  const fullscreen = useUiStore.getState().isFullscreen;

  if (IS_ELECTRON) {
    if (fullscreen) window.electronAPI?.exitFullScreen();
    else window.electronAPI?.enterFullScreen();
    useUiStore.getState().setIsFullscreen(!fullscreen);
    return;
  }

  if (fullscreen) {
    await document.exitFullscreen?.();
    return;
  }

  await document.documentElement.requestFullscreen?.();
}
