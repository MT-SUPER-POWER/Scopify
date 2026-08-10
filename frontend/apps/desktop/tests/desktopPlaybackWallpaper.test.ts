import { describe, expect, test } from "bun:test";

import type {
  DesktopPlaybackWallpaperPreferences,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "@scopify/desktop-contract";

import {
  createDesktopPlaybackWallpaperCapability,
  type DesktopPlaybackWallpaperDriver,
} from "@/main/module/desktopPlaybackWallpaper/capability";
import {
  isDesktopPlaybackWallpaperControlSender,
  isDesktopPlaybackWallpaperModelReader,
  isDesktopPlaybackWallpaperPublisherSender,
} from "@/main/module/desktopPlaybackWallpaper/authorization";
import { isDesktopPlaybackWallpaperAudioFrame } from "@/main/module/desktopPlaybackWallpaper/ipcValidation";
import {
  parseSystemWallpaperResult,
  shouldUseDesktopPlaybackWallpaperSystemFallback,
} from "@/main/module/desktopPlaybackWallpaper/fallbackPolicy";
import type { DesktopPlaybackWallpaperPreferencesRepository } from "@/main/module/desktopPlaybackWallpaper/preferences";
import {
  createDesktopPlaybackWallpaperModel,
  transitionDesktopPlaybackWallpaper,
} from "@/main/module/desktopPlaybackWallpaper/stateMachine";
import { desktopSurfaceHostCoversExactBounds } from "@/main/module/desktopPlaybackWallpaper/desktopSurfaceBounds";
import {
  applyDesktopPlaybackWallpaperPreferencesUpdate,
  normalizeDesktopPlaybackWallpaperPreferences,
  parseDesktopPlaybackWallpaperPreferencesUpdate,
} from "@/types/desktopPlaybackWallpaper";

function createMemoryPreferencesRepository(
  initial = normalizeDesktopPlaybackWallpaperPreferences(),
): DesktopPlaybackWallpaperPreferencesRepository & {
  readonly saves: DesktopPlaybackWallpaperPreferences[];
} {
  let current = normalizeDesktopPlaybackWallpaperPreferences(initial);
  const saves: DesktopPlaybackWallpaperPreferences[] = [];

  return {
    load: () => normalizeDesktopPlaybackWallpaperPreferences(current),
    save: (preferences) => {
      current = normalizeDesktopPlaybackWallpaperPreferences(preferences);
      saves.push(current);
    },
    saves,
  };
}

describe("desktop playback wallpaper preferences", () => {
  test("normalizes invalid persisted values to safe defaults", () => {
    expect(
      normalizeDesktopPlaybackWallpaperPreferences({
        enabled: "yes",
        fullscreenPolicy: "unknown",
        layers: { background: null, lyrics: false },
        systemWallpaperFallback: 1,
      }),
    ).toEqual({
      enabled: false,
      fullscreenPolicy: "pause",
      layers: { background: true, lyrics: false },
      systemWallpaperFallback: false,
    });
  });

  test("deep-merges one layer without resetting its sibling", () => {
    const current = normalizeDesktopPlaybackWallpaperPreferences({
      enabled: true,
      layers: { background: false, lyrics: true },
    });

    expect(
      applyDesktopPlaybackWallpaperPreferencesUpdate(current, {
        layers: { background: true },
      }),
    ).toEqual({
      ...current,
      layers: { background: true, lyrics: true },
    });
  });

  test("rejects empty, unknown, and malformed IPC updates", () => {
    expect(() => parseDesktopPlaybackWallpaperPreferencesUpdate({})).toThrow();
    expect(() => parseDesktopPlaybackWallpaperPreferencesUpdate({ layers: {} })).toThrow();
    expect(() =>
      parseDesktopPlaybackWallpaperPreferencesUpdate({ enabled: true, surprise: true }),
    ).toThrow();
  });
});

describe("desktop playback wallpaper state machine", () => {
  test("distinguishes disabled intent from an enabled intent with no visible layer", () => {
    const disabled = createDesktopPlaybackWallpaperModel(
      normalizeDesktopPlaybackWallpaperPreferences(),
    );
    const noLayer = createDesktopPlaybackWallpaperModel(
      normalizeDesktopPlaybackWallpaperPreferences({
        enabled: true,
        layers: { background: false, lyrics: false },
      }),
    );

    expect(disabled.status).toEqual({ reason: "disabled", state: "inactive" });
    expect(noLayer.status).toEqual({ reason: "no-visible-layer", state: "inactive" });
  });

  test("never lets a stale runtime event reactivate disabled intent", () => {
    const active = createDesktopPlaybackWallpaperModel(
      normalizeDesktopPlaybackWallpaperPreferences({ enabled: true }),
    );
    const disabled = transitionDesktopPlaybackWallpaper(active, {
      preferences: normalizeDesktopPlaybackWallpaperPreferences({ enabled: false }),
      type: "preferences-updated",
    });
    const staleRuntimeResult = transitionDesktopPlaybackWallpaper(disabled, {
      status: { displayId: "primary", state: "running" },
      type: "runtime-settled",
    });

    expect(staleRuntimeResult.status).toEqual({ reason: "disabled", state: "inactive" });
  });
});

describe("desktop playback wallpaper capability", () => {
  test("authorizes the main, DockMenu, and dedicated controller renderers only", () => {
    const allowed = {
      controllerWindowId: 30,
      mainWindowId: 10,
      trayWindowId: 20,
    };

    expect(isDesktopPlaybackWallpaperControlSender(10, allowed)).toBeTrue();
    expect(isDesktopPlaybackWallpaperControlSender(20, allowed)).toBeTrue();
    expect(isDesktopPlaybackWallpaperControlSender(30, allowed)).toBeTrue();
    expect(isDesktopPlaybackWallpaperControlSender(40, allowed)).toBeFalse();
    expect(
      isDesktopPlaybackWallpaperModelReader(40, { ...allowed, wallpaperWindowId: 40 }),
    ).toBeTrue();
    expect(
      isDesktopPlaybackWallpaperModelReader(50, { ...allowed, wallpaperWindowId: 40 }),
    ).toBeFalse();
    expect(isDesktopPlaybackWallpaperPublisherSender(10, allowed.mainWindowId)).toBeTrue();
    expect(isDesktopPlaybackWallpaperPublisherSender(20, allowed.mainWindowId)).toBeFalse();
    expect(isDesktopPlaybackWallpaperPublisherSender(30, allowed.mainWindowId)).toBeFalse();
    expect(isDesktopPlaybackWallpaperPublisherSender(40, allowed.mainWindowId)).toBeFalse();
  });

  test("persists one atomic intent and exposes the settled driver status", async () => {
    const repository = createMemoryPreferencesRepository();
    const reconciled: DesktopPlaybackWallpaperPreferences[] = [];
    const driver: DesktopPlaybackWallpaperDriver = {
      reconcile: async (preferences) => {
        reconciled.push(preferences);
        return preferences.enabled ? { displayId: "primary", state: "running" } : null;
      },
    };
    const capability = createDesktopPlaybackWallpaperCapability({
      driver,
      preferences: repository,
    });

    const model = await capability.configure({
      enabled: true,
      layers: { lyrics: false },
    });

    expect(model.preferences).toEqual({
      enabled: true,
      fullscreenPolicy: "pause",
      layers: { background: true, lyrics: false },
      systemWallpaperFallback: false,
    });
    expect(model.status).toEqual({ displayId: "primary", state: "running" });
    expect(repository.saves).toHaveLength(1);
    expect(reconciled).toHaveLength(1);
  });

  test("aborts and ignores an older start when the user disables the feature", async () => {
    const repository = createMemoryPreferencesRepository();
    let resolveStart: ((status: { displayId: string; state: "running" }) => void) | undefined;
    let firstSignal: AbortSignal | undefined;
    const driver: DesktopPlaybackWallpaperDriver = {
      reconcile: (preferences, context) => {
        if (!preferences.enabled) return Promise.resolve(null);
        firstSignal = context.signal;
        return new Promise((resolve) => {
          resolveStart = resolve;
        });
      },
    };
    const capability = createDesktopPlaybackWallpaperCapability({
      driver,
      preferences: repository,
    });

    const enabling = capability.configure({ enabled: true });
    const disabling = capability.configure({ enabled: false });
    await disabling;

    expect(firstSignal?.aborted).toBeTrue();
    resolveStart?.({ displayId: "primary", state: "running" });
    await enabling;

    expect(capability.getModel().status).toEqual({ reason: "disabled", state: "inactive" });
  });

  test("delegates every launcher to the same controller interface", async () => {
    let showCount = 0;
    const capability = createDesktopPlaybackWallpaperCapability({
      controller: {
        show: async () => {
          showCount += 1;
          return { opened: true };
        },
      },
      driver: { reconcile: async () => null },
      preferences: createMemoryPreferencesRepository(),
    });

    expect(await capability.showController()).toEqual({ opened: true });
    expect(await capability.showController()).toEqual({ opened: true });
    expect(showCount).toBe(2);
  });

  test("does not mutate the current model when persistence rejects an update", async () => {
    const repository = createMemoryPreferencesRepository();
    repository.save = (_update: DesktopPlaybackWallpaperPreferencesUpdate) => {
      throw new Error("disk full");
    };
    const capability = createDesktopPlaybackWallpaperCapability({
      driver: { reconcile: async () => null },
      preferences: repository,
    });

    await expect(capability.configure({ enabled: true })).rejects.toThrow("disk full");
    expect(capability.getModel().status).toEqual({ reason: "disabled", state: "inactive" });
  });
});

describe("desktop playback wallpaper feed validation", () => {
  test("accepts a bounded finite audio frame and rejects malformed spectrum data", () => {
    const frame = {
      bass: 1,
      lowMid: 2,
      mid: 3,
      power: 4,
      sampledAt: 5,
      spectrum: [0, 64, 255],
      treble: 6,
      vocal: 7,
    };

    expect(isDesktopPlaybackWallpaperAudioFrame(frame)).toBeTrue();
    expect(
      isDesktopPlaybackWallpaperAudioFrame({ ...frame, spectrum: [0, Number.NaN] }),
    ).toBeFalse();
    expect(isDesktopPlaybackWallpaperAudioFrame({ ...frame, power: 256 })).toBeFalse();
    expect(
      isDesktopPlaybackWallpaperAudioFrame({
        ...frame,
        spectrum: Array.from({ length: 2_049 }, () => 0),
      }),
    ).toBeFalse();
  });
});

describe("desktop playback wallpaper Windows Shell fallback", () => {
  test("requires explicit fallback intent and a visible background layer", () => {
    const preferences = normalizeDesktopPlaybackWallpaperPreferences({
      enabled: true,
      systemWallpaperFallback: true,
    });

    expect(shouldUseDesktopPlaybackWallpaperSystemFallback(preferences)).toBeTrue();
    expect(
      shouldUseDesktopPlaybackWallpaperSystemFallback({
        ...preferences,
        layers: { background: false, lyrics: true },
      }),
    ).toBeFalse();
    expect(
      shouldUseDesktopPlaybackWallpaperSystemFallback({
        ...preferences,
        enabled: false,
      }),
    ).toBeFalse();
  });

  test("accepts only successful PowerShell operation envelopes", () => {
    expect(parseSystemWallpaperResult('{"Applied":true,"Ok":true}', "", 0)).toEqual({
      changed: true,
      detail: { Applied: true, Ok: true },
      success: true,
    });
    expect(parseSystemWallpaperResult('{"Error":"denied","Ok":false}', "", 2)).toEqual({
      detail: { Error: "denied", Ok: false },
      error: "denied",
      success: false,
    });
    expect(parseSystemWallpaperResult("", "no output", 1)).toEqual({
      error: "no output",
      success: false,
    });
  });
});

describe("desktop playback wallpaper Windows desktop host", () => {
  test("rejects an outer window that covers the display while its render client is inset", () => {
    const host = {
      ActualBottom: 1_080,
      ActualClientBottom: 1_073,
      ActualClientLeft: 7,
      ActualClientRight: 1_913,
      ActualClientTop: 0,
      ActualLeft: 0,
      ActualRight: 1_920,
      ActualTop: 0,
      CoversRequestedBounds: true,
      CoversRequestedClientBounds: false,
      DefView: 2,
      Message: "outer bounds only",
      Mode: "raised-desktop",
      Ok: true,
      Progman: 1,
      RenderWindow: 4,
      RequestedBottom: 1_080,
      RequestedLeft: 0,
      RequestedRight: 1_920,
      RequestedTop: 0,
      Win32Error: 0,
      WorkerW: 3,
    };

    expect(
      desktopSurfaceHostCoversExactBounds(host, {
        height: 1_080,
        width: 1_920,
        x: 0,
        y: 0,
      }),
    ).toBeFalse();

    expect(
      desktopSurfaceHostCoversExactBounds(
        {
          ...host,
          ActualClientBottom: 1_080,
          ActualClientLeft: 0,
          ActualClientRight: 1_920,
          CoversRequestedClientBounds: true,
        },
        {
          height: 1_080,
          width: 1_920,
          x: 0,
          y: 0,
        },
      ),
    ).toBeTrue();
  });
});
