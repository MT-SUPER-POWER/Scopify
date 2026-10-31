import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { isTemperaPoolWriteLocked } from "@/lib/lyrics/folia/temperaImagePool";
import type { TranslateFn } from "@/types/i18n/model";
import type {
  TemperaPoolBusyAction,
  TemperaPoolImportMode,
} from "@/types/lyrics/folia/temperaImagePool";
import type { TemperaLayerImage } from "../../../types";
import ThemedDialog from "../../shared/ThemedDialog";
import TemperaImageImportMenu from "./TemperaImageImportMenu";
import TemperaImagePlacementEditor from "./TemperaImagePlacementEditor";
import { TemperaRangeControl } from "./TemperaSettingsControls";

// src/components/visualizer/tempera/TemperaImageLayerDialog.tsx
// The one place canvas images are managed: upload, preview, per-image tendency and size, the
// two pool-wide settings, and the zip backup (Folia 3e081df8, 2bd16cbc, acf7ffc9). Split out of
// the settings panel because a list of filenames with two sliders each is unreadable inline.
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
  /** Whole-pool zip backup. `mode` decides whether incoming images replace the pool or join it. */
  onImportPool: (file: File, mode: TemperaPoolImportMode) => void;
  onExportPool: () => void;
  busy: TemperaPoolBusyAction;
}

const BUSY_LABEL_KEYS = {
  adding: "folia.options.temperaPoolBusyAdd",
  exporting: "folia.options.temperaPoolBusyExport",
  importing: "folia.options.temperaPoolBusyImport",
} as const;

const actionClass =
  "inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs transition-colors hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent";

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
  onImportPool,
  onExportPool,
  busy,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const pendingImportModeRef = useRef<TemperaPoolImportMode>("append");
  const [dragging, setDragging] = useState(false);
  const full = images.length >= maxImages;
  // A run outlives the click that started it and writes the draft after awaiting storage, so
  // every close path owned by this dialog funnels through the same lock.
  const writeLocked = isTemperaPoolWriteLocked(busy);
  const waitTitle = writeLocked ? t("folia.options.temperaPoolWaitToSave") : undefined;

  const requestClose = useCallback(() => {
    if (writeLocked) return;
    onClose();
  }, [writeLocked, onClose]);

  const openImportPicker = useCallback((mode: TemperaPoolImportMode) => {
    pendingImportModeRef.current = mode;
    importInputRef.current?.click();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const files = Array.from(event.dataTransfer.files ?? []);
      // A dropped zip is a pool backup, not an image. It always appends: only the menu can
      // choose `replace`, because a drop cannot ask first.
      const archive = files.find((file) => file.name.toLowerCase().endsWith(".zip"));
      if (archive) {
        onImportPool(archive, "append");
        return;
      }
      onAddFiles(files);
    },
    [onAddFiles, onImportPool],
  );

  // Portalled to the document body like the app's other dialogs: both hosts of this panel
  // animate a transformed ancestor, which a `position: fixed` overlay would be measured against.
  if (typeof document === "undefined") return null;

  return createPortal(
    <ThemedDialog
      isOpen={isOpen}
      onClose={requestClose}
      closeDisabled={writeLocked}
      closeDisabledTitle={waitTitle}
      isDaylight={isDaylight}
      title={t("folia.options.temperaImageSection") || "画布图片"}
      description={`${t("folia.options.temperaLayerImageHint") || "每个分镜会从图片池里随机取一张，位置由对齐倾向决定。"}\n${t("folia.options.temperaLayerImageSaveHint") || "改动会在关闭本窗口时写入。"}`}
      maxWidthClass="max-w-3xl"
      headerActions={
        <button
          type="button"
          disabled={images.length === 0 || busy !== "idle"}
          onClick={onClearAll}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs transition-colors hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent"
          style={{ color: "var(--text-primary)" }}
        >
          <Trash2 size={13} />
          {t("folia.options.temperaClearLayerImages")}
        </button>
      }
      footer={
        <div className="flex w-full flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={full || busy !== "idle"}
            onClick={() => fileInputRef.current?.click()}
            className={actionClass}
            style={{ color: "var(--text-primary)" }}
          >
            <ImagePlus size={14} />
            {t("folia.options.temperaAddLayerImage") || "添加图片"}
          </button>
          <TemperaImageImportMenu
            disabled={busy !== "idle"}
            appendDisabled={full}
            poolSize={images.length}
            isDaylight={isDaylight}
            t={t}
            onChoose={openImportPicker}
          />
          <button
            type="button"
            disabled={images.length === 0 || busy !== "idle"}
            onClick={onExportPool}
            className={actionClass}
            style={{ color: "var(--text-primary)" }}
          >
            <Download size={14} />
            {t("folia.options.temperaExportImages")}
          </button>
          <span className="ml-auto flex items-center gap-3">
            {/* Busy takes the count's slot: a run started from a native picker outlives the
                picker, and this slot never dims or moves. */}
            {busy === "idle" ? (
              <span className="text-xs opacity-60" style={{ color: "var(--text-secondary)" }}>
                {t("folia.options.temperaImagePoolCount", { count: images.length, max: maxImages })}
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 text-xs"
                style={{ color: "var(--text-primary)" }}
                role="status"
              >
                <Loader2 size={13} className="animate-spin" />
                {t(BUSY_LABEL_KEYS[busy])}
              </span>
            )}
            <button
              type="button"
              onClick={requestClose}
              disabled={writeLocked}
              title={waitTitle}
              className="rounded-full border border-white/15 px-5 py-2 text-sm transition-colors hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent"
              style={{ color: "var(--text-primary)" }}
            >
              {t("folia.options.temperaLayerImageSave") || "保存"}
            </button>
          </span>
        </div>
      }
    >
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="flex min-h-0 flex-col gap-4 rounded-2xl border border-dashed p-4 transition-colors"
        style={{
          borderColor: dragging ? "var(--text-primary)" : "transparent",
          backgroundColor: dragging ? "rgba(255,255,255,0.06)" : "transparent",
        }}
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

        {/* Stays below the scrolling list so it is on screen while a file is dragged in; hidden
            once the pool is full, when only a zip drop can still do anything. */}
        {!full && (
          <p className="text-xs opacity-50" style={{ color: "var(--text-secondary)" }}>
            {t("folia.options.temperaLayerImageDropHint") || "也可以把文件拖到这里"}
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        multiple
        className="hidden"
        onChange={(event) => {
          onAddFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <input
        ref={importInputRef}
        type="file"
        accept="application/zip,.zip"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImportPool(file, pendingImportModeRef.current);
          event.target.value = "";
        }}
      />
    </ThemedDialog>,
    document.body,
  );
};

export default TemperaImageLayerDialog;
