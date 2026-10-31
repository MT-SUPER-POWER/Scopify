"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createTemperaImageArchive,
  readTemperaImageArchiveFile,
  TemperaArchiveTooLargeError,
} from "@/components/lyrics/folia/src/services/temperaImageArchive";
import {
  clearTemperaLayerImage,
  isSupportedTemperaLayerImageFile,
  prepareTemperaLayerImage,
  saveTemperaLayerImage,
  type StoredTemperaLayerImage,
} from "@/components/lyrics/folia/src/services/temperaLayerImages";
import {
  DEFAULT_TEMPERA_LAYER_IMAGE,
  TEMPERA_MAX_LAYER_IMAGES,
  type TemperaLayerImage,
} from "@/components/lyrics/folia/src/types";
import { isTemperaPoolWriteLocked } from "@/lib/lyrics/folia/temperaImagePool";
import { downloadBlob, formatLocalDateStamp, sanitizeDownloadFileName } from "@/lib/web/download";
import { useTranslation } from "react-i18next";

import type {
  TemperaImageLayerCommit,
  TemperaPoolBusyAction,
  TemperaPoolImportMode,
  UseTemperaImagePoolOptions,
} from "@/types/lyrics/folia/temperaImagePool";

const sameImages = (a: TemperaLayerImage[], b: TemperaLayerImage[]) =>
  a.length === b.length &&
  a.every(
    (image, index) =>
      image.id === b[index].id &&
      image.align === b[index].align &&
      image.verticalAlign === b[index].verticalAlign &&
      image.scale === b[index].scale &&
      image.opacity === b[index].opacity,
  );

/**
 * Draft and file actions for Tempera's canvas-image pool (Folia 3e081df8, 2bd16cbc, acf7ffc9).
 * Everything the dialog edits stays in a draft committed on close; removed files leave the asset
 * store only on commit. Add, import and export share one busy gate so two runs never claim the
 * same free slots, and an unmount mid-write aborts and rolls back what that run stored.
 */
export function useTemperaImagePool({
  images,
  depth,
  frequency,
  onCommit,
}: UseTemperaImagePoolOptions) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<TemperaImageLayerCommit>({
    layerImages: images,
    layerImageDepth: depth,
    layerImageFrequency: frequency,
  });
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<TemperaPoolBusyAction>("idle");
  const activeWriteAbortRef = useRef<AbortController | null>(null);

  const open = useCallback(() => {
    setDraft({ layerImages: images, layerImageDepth: depth, layerImageFrequency: frequency });
    setRemovedIds([]);
    setIsOpen(true);
  }, [depth, frequency, images]);

  const commit = useCallback(() => {
    // The dialog blocks its own close paths; an outer unmount aborts the write first and then
    // reaches here with the lock still set, leaving the live tuning untouched.
    if (isTemperaPoolWriteLocked(busy)) return;
    setIsOpen(false);
    void Promise.all(removedIds.map((id) => clearTemperaLayerImage(id).catch(() => undefined)));
    setRemovedIds([]);
    const changed =
      draft.layerImageDepth !== depth ||
      draft.layerImageFrequency !== frequency ||
      !sameImages(draft.layerImages, images);
    if (changed) onCommit(draft);
  }, [busy, depth, draft, frequency, images, onCommit, removedIds]);

  // Closing the whole settings surface while the dialog is open must not strand uploads with
  // nothing in the tuning pointing at them. Unmount only.
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const isMountedRef = useRef(true);
  useEffect(() => {
    // StrictMode replays setup after its development-only cleanup.
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeWriteAbortRef.current?.abort();
      if (isOpenRef.current) commitRef.current();
    };
  }, []);

  // The toast carries only what landed and what did not; the breakdown goes to the console.
  const reportResult = useCallback(
    (verb: "add" | "import", added: number, notAdded: number, detail: Record<string, unknown>) => {
      if (!isMountedRef.current) return;
      const notes: string[] = [];
      if (added > 0) {
        notes.push(
          verb === "add"
            ? t("folia.options.temperaLayerImagesAdded", { count: added })
            : t("folia.options.temperaPoolImported", { count: added }),
        );
      }
      if (notAdded > 0) {
        notes.push(
          verb === "add"
            ? t("folia.options.temperaLayerImagesNotAdded", { count: notAdded })
            : t("folia.options.temperaPoolImportNotAdded", { count: notAdded }),
        );
        console.info("[Tempera] canvas image pool left files out", detail);
      }
      if (added === 0) toast.error(notes.join(" · "));
      else toast.success(notes.join(" · "));
    },
    [t],
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || busy !== "idle") return;
      const abortController = new AbortController();
      activeWriteAbortRef.current = abortController;
      setBusy("adding");
      try {
        const room = Math.max(0, TEMPERA_MAX_LAYER_IMAGES - draft.layerImages.length);
        const supported = files.filter(isSupportedTemperaLayerImageFile);
        const accepted = supported.slice(0, room);
        const overCap = supported.length - accepted.length;
        const unsupported = files.length - supported.length;
        if (accepted.length === 0) {
          reportResult("add", 0, files.length, { total: files.length, unsupported, overCap });
          return;
        }
        const prepared = (
          await Promise.all(
            accepted.map((file) =>
              prepareTemperaLayerImage(file).catch((error) => {
                console.error("[Tempera] canvas image could not be stored:", error);
                return null;
              }),
            ),
          )
        ).filter((image): image is StoredTemperaLayerImage => image !== null);
        if (abortController.signal.aborted) return;
        // Only what the asset store accepted may enter the pool.
        const saved = (
          await Promise.all(
            prepared.map((image) =>
              saveTemperaLayerImage(image)
                .then(() => image)
                .catch((error) => {
                  console.error("[Tempera] canvas image could not be saved:", error);
                  return null;
                }),
            ),
          )
        ).filter((image): image is StoredTemperaLayerImage => image !== null);
        if (abortController.signal.aborted || !isMountedRef.current) {
          await Promise.all(
            saved.map((image) => clearTemperaLayerImage(image.id).catch(() => undefined)),
          );
          return;
        }
        setDraft((current) => ({
          ...current,
          layerImages: [
            ...current.layerImages,
            ...saved.map((image) => ({
              ...DEFAULT_TEMPERA_LAYER_IMAGE,
              id: image.id,
              name: image.name,
            })),
          ].slice(0, TEMPERA_MAX_LAYER_IMAGES),
        }));
        reportResult(
          "add",
          saved.length,
          unsupported + overCap + (accepted.length - saved.length),
          {
            total: files.length,
            unsupported,
            overCap,
            unreadable: accepted.length - prepared.length,
            unsaved: prepared.length - saved.length,
          },
        );
      } finally {
        if (activeWriteAbortRef.current === abortController) activeWriteAbortRef.current = null;
        if (isMountedRef.current) setBusy("idle");
      }
    },
    [busy, draft.layerImages.length, reportResult],
  );

  const patch = useCallback((id: string, next: Partial<TemperaLayerImage>) => {
    setDraft((current) => ({
      ...current,
      layerImages: current.layerImages.map((image) =>
        image.id === id ? { ...image, ...next } : image,
      ),
    }));
  }, []);

  const remove = useCallback((id: string) => {
    setDraft((current) => ({
      ...current,
      layerImages: current.layerImages.filter((image) => image.id !== id),
    }));
    setRemovedIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const clearAll = useCallback(() => {
    setDraft((current) => ({ ...current, layerImages: [] }));
    setRemovedIds((current) =>
      Array.from(new Set([...current, ...draft.layerImages.map((image) => image.id)])),
    );
  }, [draft.layerImages]);

  const exportPool = useCallback(async () => {
    if (busy !== "idle") return;
    setBusy("exporting");
    try {
      const archive = await createTemperaImageArchive({ layerImages: draft.layerImages });
      if (archive.exported === 0) throw new Error("Tempera pool export held no image");
      const baseName = sanitizeDownloadFileName(t("folia.options.temperaExportBaseName"));
      downloadBlob(archive.blob, `${baseName}-${formatLocalDateStamp()}.zip`);
      // A picture whose file has gone missing is left out of the zip; say so now rather than
      // letting the user discover it on a restore.
      const notes = [t("folia.options.temperaPoolExported", { count: archive.exported })];
      if (archive.skipped > 0) {
        notes.push(t("folia.options.temperaPoolExportSkipped", { count: archive.skipped }));
      }
      toast.success(notes.join(" · "));
    } catch (error) {
      console.error("[Tempera] canvas image pool export failed:", error);
      toast.error(t("folia.options.temperaPoolExportFailed"));
    } finally {
      if (isMountedRef.current) setBusy("idle");
    }
  }, [busy, draft.layerImages, t]);

  // The replace confirmation happens in the import menu before the picker opens.
  const importPool = useCallback(
    async (file: File, mode: TemperaPoolImportMode) => {
      if (busy !== "idle") return;
      const abortController = new AbortController();
      activeWriteAbortRef.current = abortController;
      setBusy("importing");
      try {
        const result = await readTemperaImageArchiveFile(file, {
          existing: mode === "append" ? draft.layerImages : [],
          signal: abortController.signal,
        });
        if (abortController.signal.aborted || !isMountedRef.current) {
          await Promise.all(
            result.layerImages.map((image) =>
              clearTemperaLayerImage(image.id).catch(() => undefined),
            ),
          );
          return;
        }
        if (result.layerImages.length === 0) {
          console.warn("[Tempera] canvas image pool import added nothing", {
            file: file.name,
            skipped: result.skipped,
            truncated: result.truncated,
          });
          // A full pool is a "make room" problem; a backup without pictures is a "bad backup".
          toast.error(
            result.truncated > 0
              ? t("folia.options.temperaPoolImportNotAdded", {
                  count: result.skipped + result.truncated,
                })
              : t("folia.options.temperaPoolImportEmpty"),
          );
          return;
        }
        if (mode === "replace") {
          // Old files stay intact until the new draft is committed, so abandoning the draft
          // never breaks the live tuning's existing ids.
          setRemovedIds((current) =>
            Array.from(new Set([...current, ...draft.layerImages.map((image) => image.id)])),
          );
        }
        setDraft((current) => ({
          ...current,
          layerImages: (mode === "append" ? current.layerImages : []).concat(result.layerImages),
        }));
        reportResult("import", result.layerImages.length, result.skipped + result.truncated, {
          file: file.name,
          mode,
          skipped: result.skipped,
          truncated: result.truncated,
        });
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        console.error("[Tempera] canvas image pool import failed:", error);
        toast.error(
          error instanceof TemperaArchiveTooLargeError
            ? t("folia.options.temperaPoolImportTooLarge")
            : t("folia.options.temperaPoolImportFailed"),
        );
      } finally {
        if (activeWriteAbortRef.current === abortController) activeWriteAbortRef.current = null;
        if (isMountedRef.current) setBusy("idle");
      }
    },
    [busy, draft.layerImages, reportResult, t],
  );

  return {
    addFiles,
    busy,
    clearAll,
    commit,
    draft,
    exportPool,
    importPool,
    isOpen,
    open,
    patch,
    remove,
    setDepth: (layerImageDepth: TemperaImageLayerCommit["layerImageDepth"]) =>
      setDraft((current) => ({ ...current, layerImageDepth })),
    setFrequency: (layerImageFrequency: number) =>
      setDraft((current) => ({ ...current, layerImageFrequency })),
  };
}
