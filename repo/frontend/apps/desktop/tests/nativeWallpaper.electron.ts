import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import { app, BrowserWindow, ipcMain, screen } from "electron";
import type { DesktopPlaybackWallpaperModel } from "@scopify/desktop-contract";
import type { NativeWallpaperModule } from "../types/nativeWallpaper";
import { parseDesktopPlaybackWallpaperPreferencesUpdate } from "../types/desktopPlaybackWallpaper";
import { createElectronDesktopPlaybackWallpaperDriver } from "../electron/main/capabilities/desktopPlaybackWallpaper/electronDriver";
import { createDesktopPlaybackWallpaperCapability } from "../electron/main/capabilities/desktopPlaybackWallpaper/capability";
import { createDesktopPlaybackWallpaperPreferencesRepository } from "../electron/main/capabilities/desktopPlaybackWallpaper/preferences";

// An isolated real Electron window exercises Renderer IPC -> capability -> Rust -> AppKit/WorkerW.
async function run() {
  const outputRoot = process.env.SCOPIFY_WALLPAPER_SMOKE_ROOT;
  if (!outputRoot) throw new Error("Run this test through scripts/verify-wallpaper-native.ts");
  app.setPath("userData", join(outputRoot, "profile"));
  console.log("[wallpaper-smoke] waiting for Electron readiness");
  await app.whenReady();
  console.log("[wallpaper-smoke] creating isolated window");
  const window = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    minWidth: 640,
    minHeight: 480,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(outputRoot, "preload.cjs"),
    },
  });
  const original = window.getBounds();
  const minimumSize = window.getMinimumSize();
  const hostLosses: string[] = [];
  const driver = createElectronDesktopPlaybackWallpaperDriver({
    mainWindow: window,
    onHostLost: (diagnostic) => hostLosses.push(diagnostic),
  });
  const capability = createDesktopPlaybackWallpaperCapability({
    driver,
    preferences: createDesktopPlaybackWallpaperPreferencesRepository({
      filePath: join(outputRoot, "preferences.json"),
    }),
  });
  const native = createRequire(import.meta.url)(
    process.env.SCOPIFY_WALLPAPER_MODULE_PATH!,
  ) as NativeWallpaperModule;
  ipcMain.handle("desktop-playback-wallpaper:configure", (event, update: unknown) => {
    assert.equal(event.sender.id, window.webContents.id);
    return capability.configure(parseDesktopPlaybackWallpaperPreferencesUpdate(update));
  });

  try {
    await window.loadURL(
      'data:text/html,<html><body style="margin:0;background:%232b2824"><div data-desktop-playback-wallpaper-content-ready="true">Scopify native wallpaper verification</div></body></html>',
    );
    if (process.platform !== "win32") {
      assert.equal((await native.getDesktopIconVisibility()).supported, false);
      assert.equal((await native.setDesktopIconVisibility(false)).supported, false);
      const journal = join(outputRoot, "unsupported-system-wallpaper.json");
      assert.equal(
        (await native.applySystemWallpaper(join(outputRoot, "missing.png"), journal)).success,
        false,
      );
      assert.equal((await native.restoreSystemWallpaper(journal)).success, false);
      assert.equal(native.restoreSystemWallpaperSync(journal).success, false);
      console.log("[wallpaper-smoke] desktop service async/sync ABI and platform gates passed");
    }
    for (let cycle = 1; cycle <= 3; cycle++) {
      const active = (await window.webContents.executeJavaScript(
        "window.wallpaperSmoke.configure({enabled:true})",
      )) as DesktopPlaybackWallpaperModel;
      assert.equal(active.status.state, "running", JSON.stringify(active.status));
      assert.equal(
        native.isAttached(),
        true,
        "Window must remain at the native desktop layer after showInactive",
      );
      if (process.platform === "darwin") {
        const display = screen.getDisplayMatching(window.getBounds());
        const before = window.getContentBounds();
        hostLosses.length = 0;
        // Reproduce Dock hide/show notifications without changing the user's Dock settings.
        for (const height of [display.bounds.height, Math.max(1, display.bounds.height - 64)]) {
          screen.emit(
            "display-metrics-changed",
            {},
            {
              ...display,
              workArea: { ...display.bounds, height },
            },
            ["workArea"],
          );
          // A broad notification with unchanged physical geometry must be harmless too.
          screen.emit("display-metrics-changed", {}, display, ["bounds", "workArea"]);
        }
        const otherDisplay = { ...display, id: display.id + 100_000 };
        screen.emit("display-metrics-changed", {}, otherDisplay, ["bounds"]);
        screen.emit("display-removed", {}, otherDisplay);
        assert.deepEqual(
          hostLosses,
          [],
          "Dock visibility and other displays must not disable wallpaper",
        );
        assert.equal(capability.getModel().status.state, "running");
        assert.equal(native.isAttached(), true);
        assert.deepEqual(window.getContentBounds(), before);
        // Keep protection for an actual change to the wallpaper display.
        screen.emit(
          "display-metrics-changed",
          {},
          {
            ...display,
            scaleFactor: display.scaleFactor + 1,
          },
          ["scaleFactor"],
        );
        assert.equal(hostLosses.length, 1);
        hostLosses.length = 0;
        screen.emit("display-removed", {}, display);
        assert.equal(hostLosses.length, 1);
        hostLosses.length = 0;
        console.log(
          "[wallpaper-smoke] Dock work-area changes preserve wallpaper; real display changes remain guarded",
        );
      }
      const inactive = (await window.webContents.executeJavaScript(
        "window.wallpaperSmoke.configure({enabled:false})",
      )) as DesktopPlaybackWallpaperModel;
      assert.equal(inactive.status.state, "inactive");
      assert.equal(native.isAttached(), false);
      assert.deepEqual(window.getBounds(), original);
      assert.deepEqual(window.getMinimumSize(), minimumSize);
      console.log(
        `[wallpaper-smoke] cycle ${cycle}: IPC attach, native desktop layer, detach and window restoration passed`,
      );
    }
    // An enabled session must also be restored by shutdown, without a Renderer toggle.
    await window.webContents.executeJavaScript("window.wallpaperSmoke.configure({enabled:true})");
    await capability.dispose();
    assert.equal(native.isAttached(), false);
    assert.deepEqual(window.getBounds(), original);
    console.log("[wallpaper-smoke] shutdown restoration passed");
    window.destroy();
    app.exit(0);
  } catch (error) {
    console.error("[wallpaper-smoke]", error);
    await capability
      .dispose()
      .catch((cleanupError) => console.error("[wallpaper-smoke] cleanup failed", cleanupError));
    window.destroy();
    app.exit(1);
  }
}
void run().catch((error) => {
  console.error("[wallpaper-smoke] startup failed", error);
  app.exit(1);
});
