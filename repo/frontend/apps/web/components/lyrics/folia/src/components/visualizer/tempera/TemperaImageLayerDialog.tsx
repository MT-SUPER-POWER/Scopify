import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import type { TranslateFn } from "@/types/i18n.generated";
import type { TemperaLayerImage } from "../../../types";
import ThemedDialog from "../../shared/ThemedDialog";
import TemperaImagePlacementEditor from "./TemperaImagePlacementEditor";
import { TemperaRangeControl } from "./TemperaSettingsControls";

// src/components/visualizer/tempera/TemperaImageLayerDialog.tsx
// The one place canvas images are managed: upload, preview, per-image tendency and size, and
// the two pool-wide settings. Split out of the settings panel because a list of filenames with
// two sliders each is unreadable inline - the picture is the thing being chosen.
//
// Every control here edits the caller's draft, never the live tuning; the caller commits on
// close. Per-image placement lives in TemperaImagePlacementEditor so this dialog stays focused
// on pool-wide actions and composition.

interface TemperaImageLayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isDaylight: boolean;
  t: TranslateFn;
  images: TemperaLayerImage[];
  thumbnails: Map<string, string>;
  depth: "back" | "front";
  frequency: number;
  maxImages: number;
  rangeInputClass: string;
  onAddFiles: (files: File[]) => void;
  onPatch: (id: string, next: Partial<TemperaLayerImage>) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onDepthChange: (depth: "back" | "front") => void;
  onFrequencyChange: (frequency: number) => void;
}

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const Chip: React.FC<ChipProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className="rounded-full border px-3 py-1.5 text-xs transition-colors"
    style={{
      borderColor: active ? "var(--text-primary)" : "rgba(255,255,255,0.15)",
      color: "var(--text-primary)",
      opacity: active ? 1 : 0.55,
    }}
  >
    {label}
  </button>
);

const TemperaImageLayerDialog: React.FC<TemperaImageLayerDialogProps> = ({
  isOpen,
  onClose,
  isDaylight,
  t,
  images,
  thumbnails,
  depth,
  frequency,
  maxImages,
  rangeInputClass,
  onAddFiles,
  onPatch,
  onRemove,
  onClearAll,
  onDepthChange,
  onFrequencyChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = images.length >= maxImages;

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      onAddFiles(Array.from(event.dataTransfer.files ?? []));
    },
    [onAddFiles],
  );

  // Portalled to the document body like the app's other dialogs: both hosts of this panel -
  // VisPlayground and the settings modal - animate a transformed ancestor, and a transformed
  // ancestor is what a `position: fixed` overlay is measured against instead of the viewport.
  if (typeof document === "undefined") return null;

  return createPortal(
    <ThemedDialog
      isOpen={isOpen}
      onClose={onClose}
      isDaylight={isDaylight}
      title={t("folia.options.temperaImageSection") || "画布图片"}
      description={`${t("folia.options.temperaLayerImageHint") || "每个分镜会从图片池里随机取一张，位置由对齐倾向决定。"}\n${t("folia.options.temperaLayerImageSaveHint") || "改动会在关闭本窗口时写入。"}`}
      maxWidthClass="max-w-3xl"
      headerActions={
        <button
          type="button"
          disabled={images.length === 0}
          onClick={onClearAll}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs transition-colors hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent"
          style={{ color: "var(--text-primary)" }}
        >
          <Trash2 size={13} />
          {t("folia.options.temperaClearLayerImages")}
        </button>
      }
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/15 px-5 py-2 text-sm transition-colors hover:bg-white/10"
          style={{ color: "var(--text-primary)" }}
        >
          {t("folia.options.temperaLayerImageSave") || "保存"}
        </button>
      }
    >
      <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-1">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-2">
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              {t("folia.options.temperaLayerImageDepth") || "图层位置"}
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["back", t("folia.options.temperaLayerImageBack") || "歌词之后"],
                  ["front", t("folia.options.temperaLayerImageFront") || "歌词之前"],
                ] as const
              ).map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  active={depth === value}
                  onClick={() => onDepthChange(value)}
                />
              ))}
            </div>
          </div>
          <TemperaRangeControl
            label={t("folia.options.temperaLayerImageFrequency") || "出现频率"}
            value={frequency}
            min={0}
            max={1}
            step={0.05}
            rangeInputClass={rangeInputClass}
            onChange={onFrequencyChange}
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={(event) => {
            onAddFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-5 text-center transition-colors"
          style={{
            borderColor: dragging ? "var(--text-primary)" : "rgba(255,255,255,0.18)",
            backgroundColor: dragging ? "rgba(255,255,255,0.06)" : "transparent",
          }}
        >
          <ImagePlus size={20} style={{ color: "var(--text-secondary)" }} className="opacity-60" />
          <button
            type="button"
            disabled={full}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs transition-colors hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
            style={{ color: "var(--text-primary)" }}
          >
            <Upload size={14} />
            {t("folia.options.temperaAddLayerImage") || "添加图片"}
          </button>
          <span className="text-xs opacity-50" style={{ color: "var(--text-secondary)" }}>
            {t("folia.options.temperaLayerImageDropHint") || "也可以把文件拖到这里"} ·{" "}
            {images.length} / {maxImages}
          </span>
        </div>

        {images.length === 0 ? (
          <p
            className="py-6 text-center text-xs opacity-50"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("folia.options.temperaLayerImageEmpty") ||
              "还没有图片。加入立绘、logo 或纹理后，每个分镜会随机取用。"}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {images.map((image) => (
              <TemperaImagePlacementEditor
                key={image.id}
                image={image}
                thumbnail={thumbnails.get(image.id)}
                t={t}
                rangeInputClass={rangeInputClass}
                onPatch={onPatch}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>
    </ThemedDialog>,
    document.body,
  );
};

export default TemperaImageLayerDialog;
