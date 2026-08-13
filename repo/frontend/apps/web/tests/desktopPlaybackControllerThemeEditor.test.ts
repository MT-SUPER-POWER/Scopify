import { describe, expect, test } from "bun:test";

import { DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH } from "@/constants/desktopPlaybackController";
import { requestDesktopPlaybackControllerThemeEditor } from "@/lib/desktopPlaybackWallpaper/controllerThemeEditor";
import type { WebRuntime } from "@/lib/runtime/types";

describe("desktop playback controller theme editor navigation", () => {
  test("uses the established main-window navigation channel", async () => {
    const navigatedPaths: string[] = [];
    const runtime = {
      navigation: {
        navigateMainWindow(path: string) {
          navigatedPaths.push(path);
          return true;
        },
      },
    } as Pick<WebRuntime, "navigation">;

    expect(await requestDesktopPlaybackControllerThemeEditor(runtime)).toBeTrue();
    expect(navigatedPaths).toEqual([DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH]);
  });
});
