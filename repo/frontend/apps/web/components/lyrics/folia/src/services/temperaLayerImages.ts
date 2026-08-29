import {
  clearTemperaLayerImage,
  getTemperaLayerImage,
  loadTemperaLayerImageBlobs,
  saveTemperaLayerImage,
  type StoredTemperaLayerImage,
} from "@/lib/lyrics/foliaAssetStorage";
import type { TemperaLayerImage } from "../types";

const SUPPORTED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const THUMBNAIL_MAX_EDGE = 256;

export type { StoredTemperaLayerImage };
export { clearTemperaLayerImage, getTemperaLayerImage, saveTemperaLayerImage };

export const isSupportedTemperaLayerImageFile = (file: File) =>
  file.type.startsWith("image/") ||
  SUPPORTED_IMAGE_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension));

const buildStoredTemperaLayerImage = (file: File): StoredTemperaLayerImage => ({
  blob: file,
  id: `${Date.now()}-${globalThis.crypto?.randomUUID?.() ?? file.name}`,
  mimeType: file.type || "application/octet-stream",
  name: file.name,
});

async function createThumbnail(file: Blob): Promise<Blob | undefined> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const scale = THUMBNAIL_MAX_EDGE / Math.max(bitmap.width, bitmap.height);
    if (scale >= 1) return;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return (
      (await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82))) ??
      undefined
    );
  } catch {
    return;
  } finally {
    bitmap?.close();
  }
}

export async function prepareTemperaLayerImage(file: File): Promise<StoredTemperaLayerImage> {
  const stored = buildStoredTemperaLayerImage(file);
  const thumbnail = await createThumbnail(file);
  return thumbnail ? { ...stored, thumbnail } : stored;
}

export const loadTemperaLayerImageThumbnails = (placements: Pick<TemperaLayerImage, "id">[]) =>
  loadTemperaLayerImageBlobs(placements, true);

export { loadTemperaLayerImageBlobs };
