import { DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH } from "@/constants/desktopPlaybackController";
import type { WebRuntime } from "@/lib/runtime/types";

export function requestDesktopPlaybackControllerThemeEditor(
  runtime: Pick<WebRuntime, "navigation">,
) {
  return runtime.navigation.navigateMainWindow(DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH);
}
