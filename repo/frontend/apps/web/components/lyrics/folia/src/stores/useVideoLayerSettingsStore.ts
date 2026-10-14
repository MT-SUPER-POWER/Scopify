import { create } from "zustand";
import {
  canPersistVideoLayerFile,
  clearVideoLayerFile,
  loadStoredVideoLayerFile,
  pickVideoLayerFile,
  saveVideoLayerFile,
} from "../services/videoLayerFile";

// src/stores/useVideoLayerSettingsStore.ts
// The built-in video layer behind the lyrics: a muted video (a picked local file, else a URL) that
// follows playback. Deliberately outside the appearance import/export payload, and therefore out of
// the OBS sources too. The local file is stored in Scopify's foliaAssetStorage.

export type VideoLayerFit = "cover" | "contain";

/** `needs-permission`: a stored pick exists but the browser wants a click to read it again. */
export type VideoLayerLocalFileStatus = "none" | "ready" | "needs-permission";

export const VIDEO_LAYER_OPACITY_BOUNDS = { min: 0.1, max: 1 } as const;
const VIDEO_LAYER_OPACITY_DEFAULT = 0.6;

const VIDEO_LAYER_ENABLED_KEY = "video_layer_enabled";
const VIDEO_LAYER_URL_KEY = "video_layer_url";
const VIDEO_LAYER_OPACITY_KEY = "video_layer_opacity";
const VIDEO_LAYER_FIT_KEY = "video_layer_fit";

export const clampVideoLayerOpacity = (value: number) =>
  Number.isFinite(value)
    ? Math.max(VIDEO_LAYER_OPACITY_BOUNDS.min, Math.min(VIDEO_LAYER_OPACITY_BOUNDS.max, value))
    : VIDEO_LAYER_OPACITY_DEFAULT;

const getStoredBoolean = (key: string, fallback: boolean): boolean => {
  if (typeof window === "undefined") return fallback;
  const value = localStorage.getItem(key);
  return value === null ? fallback : value === "true";
};

const getStoredString = (key: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
};

const setStoredBoolean = (key: string, value: boolean) => {
  if (typeof window !== "undefined") localStorage.setItem(key, String(value));
};

const persistString = (key: string, value: string) => {
  if (typeof window !== "undefined") localStorage.setItem(key, value);
};

export type VideoLayerSettingsState = {
  videoLayerEnabled: boolean;
  videoLayerUrl: string;
  videoLayerOpacity: number;
  videoLayerFit: VideoLayerFit;
  /** Runtime only: a blob URL for the picked file, rebuilt from the stored handle/blob on start. */
  localFileUrl: string | null;
  localFileName: string | null;
  localFileStatus: VideoLayerLocalFileStatus;
  canPersistLocalFile: boolean;
  setVideoLayerEnabled: (enabled: boolean) => void;
  toggleVideoLayer: () => void;
  setVideoLayerUrl: (url: string) => void;
  setVideoLayerOpacity: (opacity: number) => void;
  setVideoLayerFit: (fit: VideoLayerFit) => void;
  /** Opens the file picker; resolves to the picked name, or null when cancelled. */
  pickLocalFile: () => Promise<string | null>;
  clearLocalFile: () => Promise<void>;
  /** Rebuilds the pick from the stored handle/blob without prompting. */
  restoreLocalFile: () => Promise<void>;
  /** Asks the browser again for a stored pick whose permission lapsed. Needs a user gesture. */
  regrantLocalFile: () => Promise<void>;
};

let restoreStarted = false;

export const useVideoLayerSettingsStore = create<VideoLayerSettingsState>((set, get) => {
  let fileRevision = 0;

  const showFile = (file: File) => {
    const previous = get().localFileUrl;
    if (previous) URL.revokeObjectURL(previous);
    set({
      localFileUrl: URL.createObjectURL(file),
      localFileName: file.name,
      localFileStatus: "ready",
    });
  };

  const dropFile = () => {
    const previous = get().localFileUrl;
    if (previous) URL.revokeObjectURL(previous);
    set({ localFileUrl: null, localFileName: null, localFileStatus: "none" });
  };

  const loadStoredFile = async (request: boolean) => {
    const revision = fileRevision;
    let result: Awaited<ReturnType<typeof loadStoredVideoLayerFile>>;
    try {
      result = await loadStoredVideoLayerFile(request);
    } catch (error) {
      console.warn("[VideoLayer] Failed to read stored video:", error);
      return;
    }
    if (revision !== fileRevision || !result) return;
    if (result.status === "ready") {
      showFile(result.file);
    } else if (result.status === "needs-permission") {
      set({ localFileName: result.name, localFileStatus: "needs-permission" });
    } else {
      await clearVideoLayerFile();
      if (revision === fileRevision) dropFile();
    }
  };

  return {
    videoLayerEnabled: getStoredBoolean(VIDEO_LAYER_ENABLED_KEY, false),
    videoLayerUrl: getStoredString(VIDEO_LAYER_URL_KEY, ""),
    videoLayerOpacity: clampVideoLayerOpacity(
      Number(getStoredString(VIDEO_LAYER_OPACITY_KEY, String(VIDEO_LAYER_OPACITY_DEFAULT))),
    ),
    videoLayerFit:
      getStoredString(VIDEO_LAYER_FIT_KEY, "cover") === "contain" ? "contain" : "cover",
    localFileUrl: null,
    localFileName: null,
    localFileStatus: "none",
    canPersistLocalFile: canPersistVideoLayerFile(),
    setVideoLayerEnabled: (enabled) => {
      set({ videoLayerEnabled: enabled });
      setStoredBoolean(VIDEO_LAYER_ENABLED_KEY, enabled);
    },
    toggleVideoLayer: () => {
      const next = !get().videoLayerEnabled;
      set({ videoLayerEnabled: next });
      setStoredBoolean(VIDEO_LAYER_ENABLED_KEY, next);
    },
    setVideoLayerUrl: (url) => {
      const normalized = url.trim();
      set({ videoLayerUrl: normalized });
      persistString(VIDEO_LAYER_URL_KEY, normalized);
    },
    setVideoLayerOpacity: (opacity) => {
      const normalized = clampVideoLayerOpacity(opacity);
      set({ videoLayerOpacity: normalized });
      persistString(VIDEO_LAYER_OPACITY_KEY, String(normalized));
    },
    setVideoLayerFit: (fit) => {
      set({ videoLayerFit: fit });
      persistString(VIDEO_LAYER_FIT_KEY, fit);
    },
    pickLocalFile: async () => {
      const picked = await pickVideoLayerFile();
      if (!picked) return null;
      fileRevision += 1;
      restoreStarted = true;
      await saveVideoLayerFile(picked);
      showFile(picked.file);
      get().setVideoLayerEnabled(true);
      return picked.file.name;
    },
    clearLocalFile: async () => {
      fileRevision += 1;
      restoreStarted = true;
      dropFile();
      await clearVideoLayerFile();
    },
    restoreLocalFile: () => loadStoredFile(false),
    regrantLocalFile: () => loadStoredFile(true),
  };
});

/**
 * Restores the pick from an earlier session, once. Called lazily by the layer and the settings
 * section rather than at import time.
 */
export const ensureVideoLayerFileRestored = () => {
  if (restoreStarted) return;
  restoreStarted = true;
  void useVideoLayerSettingsStore.getState().restoreLocalFile();
};
