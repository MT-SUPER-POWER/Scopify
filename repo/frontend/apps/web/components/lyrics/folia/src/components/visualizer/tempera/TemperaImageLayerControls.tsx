import React from "react";
import { useI18n } from "@/store/module/i18n";
import { ImagePlus, Settings2 } from "lucide-react";
import { useTemperaImagePool } from "@/hooks/lyrics/useTemperaImagePool";
import type { TemperaImageLayerCommit } from "@/types/lyrics/folia/temperaImagePool";
import type { TemperaLayerImage } from "../../../types";
import { TEMPERA_MAX_LAYER_IMAGES } from "../../../types";
import TemperaImageLayerDialog from "./TemperaImageLayerDialog";
import { useTemperaLayerImageThumbnails } from "./useTemperaLayerImageThumbnails";

// src/components/visualizer/tempera/TemperaImageLayerControls.tsx
// Summary row for the user's own canvas images (character art, logos, textures): a strip of
// previews and the way into the dialog where they are actually managed. The files go straight
// to the asset store; only ids and placement are written back to the tuning.
//
// The draft, file actions and zip backup live in Scopify's `useTemperaImagePool`: the dialog
// edits a draft that is written to the tuning only when it closes, so a session of slider moves
// costs a single store write.
export type { TemperaImageLayerCommit };

interface TemperaImageLayerControlsProps {
  images: TemperaLayerImage[];
  depth: "back" | "front";
  frequency: number;
  rangeInputClass: string;
  isDaylight: boolean;
  /** One patch for the whole layer, so a session of edits costs a single store write. */
  onCommit: (next: TemperaImageLayerCommit) => void;
}

const TemperaImageLayerControls: React.FC<TemperaImageLayerControlsProps> = ({
  images,
  depth,
  frequency,
  rangeInputClass,
  isDaylight,
  onCommit,
}) => {
  const { t } = useI18n();
  const pool = useTemperaImagePool({ images, depth, frequency, onCommit });
  const previewImages = pool.isOpen ? pool.draft.layerImages : images;
  const thumbnails = useTemperaLayerImageThumbnails(previewImages);

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
        onClick={pool.open}
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
            : t("folia.options.temperaImagePoolCount", {
                count: images.length,
                max: TEMPERA_MAX_LAYER_IMAGES,
              })}
        </span>
        <Settings2
          size={16}
          className="shrink-0 opacity-50"
          style={{ color: "var(--text-secondary)" }}
        />
      </button>

      <TemperaImageLayerDialog
        isOpen={pool.isOpen}
        onClose={pool.commit}
        isDaylight={isDaylight}
        t={t}
        images={pool.draft.layerImages}
        thumbnails={thumbnails}
        depth={pool.draft.layerImageDepth}
        frequency={pool.draft.layerImageFrequency}
        maxImages={TEMPERA_MAX_LAYER_IMAGES}
        rangeInputClass={rangeInputClass}
        onAddFiles={(files) => void pool.addFiles(files)}
        onPatch={pool.patch}
        onRemove={pool.remove}
        onClearAll={pool.clearAll}
        onDepthChange={pool.setDepth}
        onFrequencyChange={pool.setFrequency}
        onImportPool={(file, mode) => void pool.importPool(file, mode)}
        onExportPool={() => void pool.exportPool()}
        busy={pool.busy}
      />
    </div>
  );
};

export default TemperaImageLayerControls;
