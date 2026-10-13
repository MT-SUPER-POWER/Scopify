import {
  clearVideoLayerBlob,
  clearVideoLayerFileHandle,
  loadVideoLayerBlob,
  loadVideoLayerFileHandle,
  saveVideoLayerBlob,
  saveVideoLayerFileHandle,
} from "@/lib/lyrics/foliaVideoStorage";

// src/services/videoLayerFile.ts
// Local video file for the video layer behind the lyrics. Where the File System Access API exists
// (Chromium, Electron) the pick is a FileSystemFileHandle kept in IndexedDB, so it survives a
// restart without copying the video anywhere. Where showOpenFilePicker is unavailable, the fallback
// persists the picked video Blob into Scopify's foliaAssetStorage.

type PermissionAwareFileHandle = FileSystemFileHandle & {
  queryPermission?: (descriptor: { mode: "read" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "read" }) => Promise<PermissionState>;
};

type OpenFilePickerWindow = Window & {
  showOpenFilePicker?: (options: {
    multiple?: boolean;
    excludeAcceptAllOption?: boolean;
    types?: Array<{ description?: string; accept: Record<string, string[]> }>;
  }) => Promise<FileSystemFileHandle[]>;
};

export type PickedVideoFile = {
  file: File;
  /** Null when the pick came from the <input> fallback and is persisted as a blob in foliaAssetStorage. */
  handle: FileSystemFileHandle | null;
};

export const canPersistVideoLayerFile = (): boolean => typeof window !== "undefined";

const pickWithInput = (): Promise<File | null> =>
  new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener("cancel", () => resolve(null), { once: true });
    input.click();
  });

/** Opens the native picker for one video; null when the user cancels. Must run inside a user gesture. */
export const pickVideoLayerFile = async (): Promise<PickedVideoFile | null> => {
  const picker = (window as OpenFilePickerWindow).showOpenFilePicker;
  if (!picker) {
    const file = await pickWithInput();
    return file ? { file, handle: null } : null;
  }
  try {
    const [handle] = await picker({
      multiple: false,
      types: [
        {
          description: "Video",
          accept: { "video/*": [".mp4", ".webm", ".mov", ".m4v", ".mkv", ".ogv"] },
        },
      ],
    });
    if (!handle) return null;
    return { file: await handle.getFile(), handle };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return null;
    throw error;
  }
};

export const saveVideoLayerFile = async (picked: PickedVideoFile): Promise<void> => {
  if (picked.handle) {
    await saveVideoLayerFileHandle(picked.handle);
    await clearVideoLayerBlob();
  } else {
    await clearVideoLayerFileHandle();
    await saveVideoLayerBlob({
      blob: picked.file,
      name: picked.file.name,
      mimeType: picked.file.type || "video/mp4",
    });
  }
};

export const clearVideoLayerFile = async (): Promise<void> => {
  await Promise.all([clearVideoLayerFileHandle(), clearVideoLayerBlob()]);
};

export type VideoLayerFileReadResult =
  | { status: "ready"; file: File }
  | { status: "needs-permission"; name: string }
  | { status: "missing" };

/**
 * Reads the stored handle's file. Without `request` it never prompts: a handle whose read
 * permission lapsed reports `needs-permission`.
 */
export const readVideoLayerFileHandle = async (
  handle: FileSystemFileHandle,
  request: boolean,
): Promise<VideoLayerFileReadResult> => {
  try {
    const permissionAware = handle as PermissionAwareFileHandle;
    let permission: PermissionState = "granted";
    if (permissionAware.queryPermission) {
      permission = await permissionAware.queryPermission({ mode: "read" });
    }
    if (permission === "prompt" && request && permissionAware.requestPermission) {
      permission = await permissionAware.requestPermission({ mode: "read" });
    }
    if (permission === "prompt") return { status: "needs-permission", name: handle.name };
    if (permission !== "granted") return { status: "missing" };
    return { status: "ready", file: await handle.getFile() };
  } catch {
    return { status: "missing" };
  }
};

/** Loads the stored handle or stored blob from foliaAssetStorage. */
export const loadStoredVideoLayerFile = async (
  request: boolean,
): Promise<VideoLayerFileReadResult | null> => {
  const handle = await loadVideoLayerFileHandle().catch(() => undefined);
  if (handle) {
    return readVideoLayerFileHandle(handle, request);
  }
  const storedBlob = await loadVideoLayerBlob().catch(() => undefined);
  if (storedBlob) {
    const file = new File([storedBlob.blob], storedBlob.name, {
      type: storedBlob.mimeType || "video/mp4",
    });
    return { status: "ready", file };
  }
  return null;
};
