import React, { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/store/module/i18n";
import { ImagePlus, Settings2 } from "lucide-react";
import type { TemperaLayerImage } from "../../../types";
import { DEFAULT_TEMPERA_LAYER_IMAGE, TEMPERA_MAX_LAYER_IMAGES } from "../../../types";
import {
  clearTemperaLayerImage,
  isSupportedTemperaLayerImageFile,
  prepareTemperaLayerImage,
  saveTemperaLayerImage,
} from "../../../services/temperaLayerImages";
import TemperaImageLayerDialog from "./TemperaImageLayerDialog";
import { useTemperaLayerImageThumbnails } from "./useTemperaLayerImageThumbnails";

// src/components/visualizer/tempera/TemperaImageLayerControls.tsx
// Summary row for the user's own canvas images (character art, logos, textures): a strip of
// previews and the way into the dialog where they are actually managed. The files go straight
// to IndexedDB; only ids and placement are written back to the tuning.
//
// Everything the dialog edits is held here as a draft and written to the tuning only when the
// dialog closes. Editing the live tuning instead meant a synchronous localStorage write and a
// global store update on every pointermove of a slider, which pinned a core; the card preview
// is what gives feedback during the edit, so nothing is lost by holding the commit back.
export interface TemperaImageLayerCommit {
  layerImages: TemperaLayerImage[];
  layerImageDepth: "back" | "front";
  layerImageFrequency: number;
}

interface TemperaImageLayerControlsProps {
  images: TemperaLayerImage[];
  depth: "back" | "front";
  frequency: number;
  rangeInputClass: string;
  isDaylight: boolean;
  /** One patch for the whole layer, so a session of edits costs a single store write. */
  onCommit: (next: TemperaImageLayerCommit) => void;
}

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

const TemperaImageLayerControls: React.FC<TemperaImageLayerControlsProps> = ({
  images,
  depth,
  frequency,
  rangeInputClass,
  isDaylight,
  onCommit,
}) => {
  const { t } = useI18n();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<TemperaImageLayerCommit>({
    layerImages: images,
    layerImageDepth: depth,
    layerImageFrequency: frequency,
  });
  // Files deleted in the draft. The record is only dropped from IndexedDB on commit, so a
  // removal is undone by simply not committing it.
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const previewImages = isDialogOpen ? draft.layerImages : images;
  const thumbnails = useTemperaLayerImageThumbnails(previewImages);

  const open = useCallback(() => {
    setDraft({ layerImages: images, layerImageDepth: depth, layerImageFrequency: frequency });
    setRemovedIds([]);
    setDialogOpen(true);
  }, [depth, frequency, images]);

  const commit = useCallback(() => {
    setDialogOpen(false);
    void Promise.all(removedIds.map((id) => clearTemperaLayerImage(id).catch(() => undefined)));
    setRemovedIds([]);
    const changed =
      draft.layerImageDepth !== depth ||
      draft.layerImageFrequency !== frequency ||
      !sameImages(draft.layerImages, images);
    if (changed) onCommit(draft);
  }, [depth, draft, frequency, images, onCommit, removedIds]);

  // Closing the whole playground while the dialog is open must not strand an upload the user
  // already made in IndexedDB with nothing in the tuning pointing at it. Unmount only - keying
  // this on `isDialogOpen` would fire the same commit a second time on every ordinary close.
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const isOpenRef = useRef(isDialogOpen);
  isOpenRef.current = isDialogOpen;
  useEffect(
    () => () => {
      if (isOpenRef.current) commitRef.current();
    },
    [],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const room = TEMPERA_MAX_LAYER_IMAGES - draft.layerImages.length;
      const accepted = files.filter(isSupportedTemperaLayerImageFile).slice(0, Math.max(0, room));
      if (accepted.length === 0) return;
      const stored = await Promise.all(accepted.map(prepareTemperaLayerImage));
      await Promise.all(stored.map(saveTemperaLayerImage));
      setDraft((current) => ({
        ...current,
        layerImages: [
          ...current.layerImages,
          ...stored.map((image) => ({
            ...DEFAULT_TEMPERA_LAYER_IMAGE,
            id: image.id,
            name: image.name,
          })),
        ].slice(0, TEMPERA_MAX_LAYER_IMAGES),
      }));
    },
    [draft.layerImages.length],
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

  return (
    <div className="space-y-3">
      {/* The hint gets the panel's full width. Inside the button it had to share the row
                with the previews, which in a 360px settings column left it one word wide. */}
      <p className="text-xs leading-relaxed opacity-55" style={{ color: "var(--text-secondary)" }}>
        {t("folia.options.temperaLayerImageHint") ||
          "每个分镜会从图片池里随机取一张，位置由对齐倾向决定。"}
      </p>
      <button
        type="button"
        onClick={open}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
      >
        {images.length === 0 ? (
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/15"
            style={{ color: "var(--text-secondary)" }}
          >
            <ImagePlus size={16} className="opacity-60" />
          </span>
        ) : (
          <span className="flex shrink-0 -space-x-2">
            {images.slice(0, 4).map((image) => (
              <span
                key={image.id}
                className="size-12 overflow-hidden rounded-xl border border-white/15 bg-black/30"
              >
                {thumbnails.get(image.id) && (
                  <img
                    src={thumbnails.get(image.id)}
                    alt={image.name}
                    className="size-full object-cover"
                  />
                )}
              </span>
            ))}
            {images.length > 4 && (
              <span
                className="flex size-12 items-center justify-center rounded-xl border border-white/15 bg-black/50 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                +{images.length - 4}
              </span>
            )}
          </span>
        )}
        <span className="ml-auto shrink-0 text-sm" style={{ color: "var(--text-primary)" }}>
          {images.length === 0
            ? t("folia.options.temperaAddLayerImage") || "添加图片"
            : `${images.length} / ${TEMPERA_MAX_LAYER_IMAGES}`}
        </span>
        <Settings2
          size={16}
          className="shrink-0 opacity-50"
          style={{ color: "var(--text-secondary)" }}
        />
      </button>

      <TemperaImageLayerDialog
        isOpen={isDialogOpen}
        onClose={commit}
        isDaylight={isDaylight}
        t={t}
        images={draft.layerImages}
        thumbnails={thumbnails}
        depth={draft.layerImageDepth}
        frequency={draft.layerImageFrequency}
        maxImages={TEMPERA_MAX_LAYER_IMAGES}
        rangeInputClass={rangeInputClass}
        onAddFiles={(files) => void handleFiles(files)}
        onPatch={patch}
        onRemove={remove}
        onClearAll={clearAll}
        onDepthChange={(layerImageDepth) =>
          setDraft((current) => ({ ...current, layerImageDepth }))
        }
        onFrequencyChange={(layerImageFrequency) =>
          setDraft((current) => ({ ...current, layerImageFrequency }))
        }
      />
    </div>
  );
};

export default TemperaImageLayerControls;
