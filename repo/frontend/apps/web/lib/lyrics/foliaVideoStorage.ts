import { createStore, del, get, set } from "idb-keyval";

// lib/lyrics/foliaVideoStorage.ts
// Video layer persistence in Scopify's scopify-folia-stage IndexedDB store.

const assetStore = createStore("scopify-folia-stage", "assets");
const VIDEO_LAYER_HANDLE_KEY = "video_layer_file_handle";
const VIDEO_LAYER_BLOB_KEY = "video_layer_blob";

export interface StoredVideoLayerBlob {
  blob: Blob;
  name: string;
  mimeType: string;
}

export const saveVideoLayerFileHandle = (handle: FileSystemFileHandle) =>
  set(VIDEO_LAYER_HANDLE_KEY, handle, assetStore);

export const loadVideoLayerFileHandle = () =>
  get<FileSystemFileHandle>(VIDEO_LAYER_HANDLE_KEY, assetStore);

export const clearVideoLayerFileHandle = () => del(VIDEO_LAYER_HANDLE_KEY, assetStore);

export const saveVideoLayerBlob = (stored: StoredVideoLayerBlob) =>
  set(VIDEO_LAYER_BLOB_KEY, stored, assetStore);

export const loadVideoLayerBlob = () => get<StoredVideoLayerBlob>(VIDEO_LAYER_BLOB_KEY, assetStore);

export const clearVideoLayerBlob = () => del(VIDEO_LAYER_BLOB_KEY, assetStore);
