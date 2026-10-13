import { describe, expect, it, mock } from "bun:test";
import React from "react";
import { motionValue } from "framer-motion";
import type { Theme } from "@/components/lyrics/folia/src/types";
import type { VisualizerBackgroundRenderProps } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";

let storedHandle: FileSystemFileHandle | undefined;
let storedBlob: { blob: Blob; name: string; mimeType: string } | undefined;

mock.module("@/lib/lyrics/foliaVideoStorage", () => ({
  saveVideoLayerFileHandle: async (handle: FileSystemFileHandle) => {
    storedHandle = handle;
  },
  loadVideoLayerFileHandle: async () => storedHandle,
  clearVideoLayerFileHandle: async () => {
    storedHandle = undefined;
  },
  saveVideoLayerBlob: async (data: { blob: Blob; name: string; mimeType: string }) => {
    storedBlob = data;
  },
  loadVideoLayerBlob: async () => storedBlob,
  clearVideoLayerBlob: async () => {
    storedBlob = undefined;
  },
}));

const { clampVideoLayerOpacity, useVideoLayerSettingsStore, VIDEO_LAYER_OPACITY_BOUNDS } =
  await import("@/components/lyrics/folia/src/stores/useVideoLayerSettingsStore");
const { clearVideoLayerFile, loadStoredVideoLayerFile, saveVideoLayerFile } =
  await import("@/components/lyrics/folia/src/services/videoLayerFile");
const { DEFAULT_SORA_BACKGROUND_TUNING } = await import("@/components/lyrics/folia/src/types");
const soraEntry = (
  await import("@/components/lyrics/folia/src/components/visualizer/backgrounds/sora/entry")
).default;

describe("VideoLayerSettingsStore", () => {
  it("clamps opacity to the defined bounds", () => {
    expect(clampVideoLayerOpacity(0)).toBe(VIDEO_LAYER_OPACITY_BOUNDS.min);
    expect(clampVideoLayerOpacity(1.5)).toBe(VIDEO_LAYER_OPACITY_BOUNDS.max);
    expect(clampVideoLayerOpacity(0.5)).toBe(0.5);
    expect(clampVideoLayerOpacity(NaN)).toBe(0.6);
  });

  it("updates and toggles enabled state", () => {
    const store = useVideoLayerSettingsStore.getState();
    store.setVideoLayerEnabled(true);
    expect(useVideoLayerSettingsStore.getState().videoLayerEnabled).toBe(true);
    store.toggleVideoLayer();
    expect(useVideoLayerSettingsStore.getState().videoLayerEnabled).toBe(false);
  });

  it("updates video url, opacity and fit options", () => {
    const store = useVideoLayerSettingsStore.getState();
    store.setVideoLayerUrl("https://example.com/loop.mp4");
    expect(useVideoLayerSettingsStore.getState().videoLayerUrl).toBe(
      "https://example.com/loop.mp4",
    );

    store.setVideoLayerOpacity(0.8);
    expect(useVideoLayerSettingsStore.getState().videoLayerOpacity).toBe(0.8);

    store.setVideoLayerFit("contain");
    expect(useVideoLayerSettingsStore.getState().videoLayerFit).toBe("contain");
  });
});

describe("videoLayerFile storage", () => {
  it("saves and clears video files in folia asset storage", async () => {
    const file = new File(["test-video-content"], "bg.mp4", { type: "video/mp4" });
    const picked = { file, handle: null };

    await saveVideoLayerFile(picked);
    const restored = await loadStoredVideoLayerFile(false);
    expect(restored).not.toBeNull();
    if (restored && restored.status === "ready") {
      expect(restored.file.name).toBe("bg.mp4");
    }

    await clearVideoLayerFile();
    const afterClear = await loadStoredVideoLayerFile(false);
    expect(afterClear).toBeNull();
  });
});

describe("Sora blank background", () => {
  it("defaults blank to false", () => {
    expect(DEFAULT_SORA_BACKGROUND_TUNING.blank).toBe(false);
  });

  it("renders a solid background and skips the WebGL canvas when blank is enabled", () => {
    const mockTheme: Theme = {
      name: "snow",
      fontStyle: "sans",
      animationIntensity: "normal",
      primaryColor: "#000",
      secondaryColor: "#666",
      accentColor: "#00f",
      backgroundColor: "#fff",
    };

    const daylightProps: VisualizerBackgroundRenderProps = {
      config: {
        sora: {
          tuning: {
            blank: true,
            starDensity: 1,
            starSize: 1,
            starSpeed: 1,
            twinkleIntensity: 0.8,
            accentRatio: 0.5,
            audioSyncStrength: 0.4,
            backgroundBrightness: 1,
          },
        },
      },
      isDaylight: true,
      theme: mockTheme,
      paused: false,
      audioPower: motionValue(0),
      audioBands: { bass: 0, mid: 0, treble: 0 },
      staticMode: false,
    };

    const daylightResult = soraEntry.render(daylightProps);
    expect(
      React.isValidElement<{ style?: React.CSSProperties; children?: React.ReactNode }>(
        daylightResult,
      ),
    ).toBe(true);
    if (
      !React.isValidElement<{ style?: React.CSSProperties; children?: React.ReactNode }>(
        daylightResult,
      )
    ) {
      throw new Error("Expected daylightResult to be a valid element");
    }
    expect(daylightResult.props.style?.backgroundColor).toBe("#ffffff");
    expect(daylightResult.props.children).toBe(false);

    const nightProps: VisualizerBackgroundRenderProps = {
      ...daylightProps,
      isDaylight: false,
      theme: {
        ...mockTheme,
        name: "classic-dark",
        backgroundColor: "#000",
      },
    };

    const nightResult = soraEntry.render(nightProps);
    expect(
      React.isValidElement<{ style?: React.CSSProperties; children?: React.ReactNode }>(
        nightResult,
      ),
    ).toBe(true);
    if (
      !React.isValidElement<{ style?: React.CSSProperties; children?: React.ReactNode }>(
        nightResult,
      )
    ) {
      throw new Error("Expected nightResult to be a valid element");
    }
    expect(nightResult.props.style?.backgroundColor).toBe("#000000");
    expect(nightResult.props.children).toBe(false);
  });

  it("handles broken or permission-rejected video handles gracefully", async () => {
    const { readVideoLayerFileHandle } =
      await import("@/components/lyrics/folia/src/services/videoLayerFile");
    const brokenHandle = {
      name: "broken.mp4",
      queryPermission: async () => {
        throw new Error("File deleted or inaccessible");
      },
      getFile: async () => {
        throw new Error("File not found");
      },
    } as unknown as FileSystemFileHandle;

    const result = await readVideoLayerFileHandle(brokenHandle, false);
    expect(result.status).toBe("missing");
  });

  it("clamps negative clock time to non-negative target for video alignment", () => {
    const duration = 10;
    const calculateTarget = (seconds: number) => {
      const nonNegative = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
      return nonNegative % duration;
    };

    expect(calculateTarget(-2.5)).toBe(0);
    expect(calculateTarget(0)).toBe(0);
    expect(calculateTarget(5.5)).toBe(5.5);
    expect(calculateTarget(12)).toBe(2);
    expect(calculateTarget(NaN)).toBe(0);
  });
});
