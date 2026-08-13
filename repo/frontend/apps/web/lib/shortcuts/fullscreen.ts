import { runtime } from "@/lib/runtime";
import { useUiStore } from "@/store/module/ui";

export async function toggleApplicationFullscreen() {
  const fullscreen = useUiStore.getState().isFullscreen;

  await runtime.window.setFullscreen(!fullscreen);
  useUiStore.getState().setIsFullscreen(!fullscreen);
}
