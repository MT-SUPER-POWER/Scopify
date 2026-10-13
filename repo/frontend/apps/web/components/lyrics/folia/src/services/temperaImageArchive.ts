import {
  strFromU8,
  strToU8,
  unzip,
  unzipSync,
  zip,
  type AsyncZippable,
  type Unzipped,
} from "fflate";
import type {
  TemperaImageArchiveExportResult,
  TemperaImageArchiveImportResult,
  TemperaImageArchiveReadOptions,
  TemperaImagePoolSnapshot,
} from "@/types/lyrics/folia/temperaImagePool";
import { TEMPERA_MAX_LAYER_IMAGES, type TemperaLayerImage } from "../types";
import {
  clearTemperaLayerImage,
  getTemperaLayerImage,
  prepareTemperaLayerImage,
  saveTemperaLayerImage,
  type StoredTemperaLayerImage,
} from "./temperaLayerImages";
import {
  buildTemperaArchiveEntryPath,
  collectTemperaArchiveEntries,
} from "./temperaImageArchiveFormat";

// src/services/temperaImageArchive.ts (Folia 3e081df8, 2bd16cbc, acf7ffc9)
// Moves the Tempera canvas-image pool in and out of a zip.
//
// The files only ever live in Scopify's `scopify-folia-stage` asset store; the tuning carries
// ids and placement, which keeps it small enough to persist and sync. So the pool gets a binary
// sidecar: a zip holding the placements plus the original bytes, rebuilt on import through the
// same `prepareTemperaLayerImage` path a drag-and-drop upload takes, thumbnails included.
//
// The zip carries the pool and nothing else: `layerImageDepth` / `layerImageFrequency` are
// pool-wide tuning the user is still looking at, so a restore must not move them.
//
// Compression and decompression run off-thread through fflate's async `zip` / `unzip`: the pool
// holds up to sixteen images at print resolution, and deflating tens of megabytes on the main
// thread would stall the lyric animation that is usually playing behind this dialog.

const ARCHIVE_KIND = "folia-tempera-pool";
const SCHEMA_VERSION = 1;

// Declared uncompressed size above which a backup is treated as corrupt or a zip bomb. Checked
// from the central directory before anything is inflated.
const TEMPERA_ARCHIVE_MAX_UNCOMPRESSED_BYTES = 512 * 1024 * 1024;

/** Thrown when a backup would expand past the limit; the UI reports it and cancels the import. */
export class TemperaArchiveTooLargeError extends Error {
  constructor() {
    super("Tempera pool backup is too large to import");
    this.name = "TemperaArchiveTooLargeError";
  }
}

/** Sums each entry's declared size from the central directory; the filter inflates nothing. */
const probeUncompressedSize = (bytes: Uint8Array): number => {
  let total = 0;
  unzipSync(bytes, {
    filter: (file) => {
      total += file.originalSize;
      return false;
    },
  });
  return total;
};

const encodeJson = (value: unknown) => strToU8(JSON.stringify(value, null, 2));

const readJsonEntry = (files: Unzipped, path: string): unknown => {
  const file = files[path];
  if (!file) throw new Error(`Tempera pool zip is missing ${path}`);
  return JSON.parse(strFromU8(file));
};

const runZip = (files: AsyncZippable): Promise<Uint8Array<ArrayBuffer>> =>
  new Promise((resolve, reject) => {
    zip(files, { level: 6 }, (error, data) => (error ? reject(error) : resolve(data)));
  });

const runUnzip = (bytes: Uint8Array): Promise<Unzipped> =>
  new Promise((resolve, reject) => {
    unzip(bytes, (error, files) => (error ? reject(error) : resolve(files)));
  });

const createAbortError = () => {
  const error = new Error("Tempera pool import was cancelled");
  error.name = "AbortError";
  return error;
};

/**
 * Reads the whole pool - placements and files - into a zip. Entries whose file has gone missing
 * are dropped from the manifest instead of producing a zip with holes in it, and counted so the
 * caller can say so at the moment the backup is taken.
 */
export const createTemperaImageArchive = async (
  snapshot: TemperaImagePoolSnapshot,
): Promise<TemperaImageArchiveExportResult> => {
  const files: Record<string, Uint8Array> = {};
  const keptIds = new Set<string>();

  await Promise.all(
    snapshot.layerImages.map(async (image) => {
      const stored = await getTemperaLayerImage(image.id).catch(() => null);
      if (!stored?.blob) return;
      files[buildTemperaArchiveEntryPath(image, stored.mimeType || stored.blob.type)] =
        new Uint8Array(await stored.blob.arrayBuffer());
      keptIds.add(image.id);
    }),
  );

  // The pool is rendered in array order, so the zip has to replay the same order.
  const ordered = snapshot.layerImages.filter((image) => keptIds.has(image.id));
  files["pool.json"] = encodeJson({ layerImages: ordered });
  files["meta.json"] = encodeJson({
    kind: ARCHIVE_KIND,
    schemaVersion: SCHEMA_VERSION,
    imageCount: ordered.length,
  });

  return {
    blob: new Blob([await runZip(files)], { type: "application/zip" }),
    exported: ordered.length,
    skipped: snapshot.layerImages.length - ordered.length,
  };
};

/**
 * Restores a pool from a zip through `prepareTemperaLayerImage`, so an import arrives exactly as
 * a fresh drag-and-drop would. All-or-nothing: a quota error or cancellation after an earlier
 * successful write clears every record this run stored.
 */
export const readTemperaImageArchiveFile = async (
  file: File,
  options: TemperaImageArchiveReadOptions,
): Promise<TemperaImageArchiveImportResult> => {
  const maxImages = options.maxImages ?? TEMPERA_MAX_LAYER_IMAGES;
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (probeUncompressedSize(bytes) > TEMPERA_ARCHIVE_MAX_UNCOMPRESSED_BYTES) {
    throw new TemperaArchiveTooLargeError();
  }

  const files = await runUnzip(bytes);
  const meta = readJsonEntry(files, "meta.json") as { kind?: unknown; schemaVersion?: unknown };
  if (meta.kind !== ARCHIVE_KIND || meta.schemaVersion !== SCHEMA_VERSION) {
    throw new Error("Not a Folia canvas-image backup");
  }

  // Older backups also wrote `layerImageDepth` / `layerImageFrequency`; they are ignored.
  const pool = readJsonEntry(files, "pool.json") as { layerImages?: unknown };
  const manifest = Array.isArray(pool.layerImages) ? pool.layerImages : [];
  const entries = collectTemperaArchiveEntries(files, manifest);
  const existingIds = new Set(options.existing.map((image) => image.id));
  const skipped = manifest.length - entries.length;
  let truncated = 0;

  const layerImages: TemperaLayerImage[] = [];
  const savedIds: string[] = [];
  const throwIfAborted = () => {
    if (options.signal?.aborted) throw createAbortError();
  };
  try {
    throwIfAborted();
    for (let index = 0; index < entries.length; index += 1) {
      // An older backup can hold more entries than fit now; the tail is dropped and counted.
      if (layerImages.length + options.existing.length >= maxImages) {
        truncated = entries.length - index;
        break;
      }

      throwIfAborted();
      const entry = entries[index];
      const source = new File([new Uint8Array(entry.bytes)], entry.image.name, {
        type: entry.mimeType,
      });
      const prepared = await prepareTemperaLayerImage(source);
      throwIfAborted();
      // A colliding generated id is minted afresh, leaving the existing record untouched.
      const id =
        !existingIds.has(prepared.id) && !layerImages.some((image) => image.id === prepared.id)
          ? prepared.id
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${prepared.name}`;
      const stored: StoredTemperaLayerImage = { ...prepared, id };
      await saveTemperaLayerImage(stored);
      savedIds.push(id);
      throwIfAborted();
      layerImages.push({ ...entry.image, id, name: stored.name || entry.image.name });
      existingIds.add(id);
    }
  } catch (error) {
    await Promise.all(savedIds.map((id) => clearTemperaLayerImage(id).catch(() => undefined)));
    throw error;
  }

  return { layerImages, skipped, truncated };
};
