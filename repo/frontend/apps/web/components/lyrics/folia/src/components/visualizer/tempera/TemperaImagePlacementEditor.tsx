import React, { useMemo } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import type { TranslateFn } from "@/types/i18n.generated";
import type {
  TemperaLayerImage,
  TemperaLayerImageAlign,
  TemperaLayerImageVerticalAlign,
} from "../../../types";
import { hashTemperaSeed } from "./temperaRandom";
import { resolveTemperaImagePlacement } from "./temperaImageLayer";
import { TemperaRangeControl } from "./TemperaSettingsControls";

// src/components/visualizer/tempera/TemperaImagePlacementEditor.tsx
// Edits one image through the same seeded placement calculation used by the Pixi runtime.
const CHECKER_BACKGROUND = {
  backgroundImage:
    "linear-gradient(45deg, rgba(255,255,255,0.07) 25%, transparent 25%)," +
    "linear-gradient(-45deg, rgba(255,255,255,0.07) 25%, transparent 25%)," +
    "linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.07) 75%)," +
    "linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.07) 75%)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0",
};

const HORIZONTAL_POSITIONS: Exclude<TemperaLayerImageAlign, "free">[] = ["left", "center", "right"];
const VERTICAL_POSITIONS: Exclude<TemperaLayerImageVerticalAlign, "free">[] = [
  "top",
  "center",
  "bottom",
];

interface TemperaImagePlacementEditorProps {
  image: TemperaLayerImage;
  thumbnail?: string;
  t: TranslateFn;
  rangeInputClass: string;
  onPatch: (id: string, next: Partial<TemperaLayerImage>) => void;
  onRemove: (id: string) => void;
}

interface ModeButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

const ModeButton: React.FC<ModeButtonProps> = ({ active, label, onClick }) => (
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

const TemperaImagePlacementEditor: React.FC<TemperaImagePlacementEditorProps> = ({
  image,
  thumbnail,
  t,
  rangeInputClass,
  onPatch,
  onRemove,
}) => {
  const placement = useMemo(
    () => resolveTemperaImagePlacement(image, hashTemperaSeed(`settings:${image.id}`)),
    [image],
  );
  const horizontalLabels: Record<Exclude<TemperaLayerImageAlign, "free">, string> = {
    left: t("folia.options.temperaLayerAlignLeft"),
    center: t("folia.options.temperaLayerAlignCenter"),
    right: t("folia.options.temperaLayerAlignRight"),
  };
  const verticalLabels: Record<Exclude<TemperaLayerImageVerticalAlign, "free">, string> = {
    top: t("folia.options.temperaLayerAlignTop"),
    center: t("folia.options.temperaLayerAlignMiddle"),
    bottom: t("folia.options.temperaLayerAlignBottom"),
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 p-3">
      <div
        className="relative w-full overflow-hidden rounded-xl border border-white/10"
        style={{ ...CHECKER_BACKGROUND, aspectRatio: "16 / 9" }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={image.name}
            className="pointer-events-none absolute w-auto max-w-none object-contain"
            style={{
              height: `${placement.scale * 100}%`,
              left: `${placement.x * 100}%`,
              top: `${placement.y * 100}%`,
              transform: `translate(-50%, -50%) rotate(${placement.rotation}rad) scaleX(${placement.flip ? -1 : 1})`,
              opacity: placement.opacity,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImagePlus
              size={18}
              className="opacity-30"
              style={{ color: "var(--text-secondary)" }}
            />
          </div>
        )}

        <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">
          {VERTICAL_POSITIONS.flatMap((verticalAlign) =>
            HORIZONTAL_POSITIONS.map((align) => {
              const active = image.align === align && image.verticalAlign === verticalAlign;
              const label = t("folia.options.temperaLayerAlignPosition", {
                vertical: verticalLabels[verticalAlign],
                horizontal: horizontalLabels[align],
              });
              return (
                <button
                  key={`${verticalAlign}-${align}`}
                  type="button"
                  onClick={() => onPatch(image.id, { align, verticalAlign })}
                  aria-label={label}
                  aria-pressed={active}
                  title={label}
                  className="group flex items-center justify-center border border-white/[0.06] transition-colors hover:bg-white/10"
                >
                  <span
                    className="size-2.5 rounded-full border transition-all group-hover:scale-125"
                    style={{
                      borderColor: active ? "var(--text-accent)" : "rgba(255,255,255,0.45)",
                      backgroundColor: active ? "var(--text-accent)" : "rgba(0,0,0,0.2)",
                      boxShadow: active ? "0 0 0 3px rgba(0,0,0,0.35)" : undefined,
                    }}
                  />
                </button>
              );
            }),
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="absolute top-2 right-2 z-20 rounded-full border border-white/15 bg-black/50 p-1.5 backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label={t("folia.options.temperaRemoveLayerImage")}
          style={{ color: "var(--text-primary)" }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="space-y-2">
        <span
          className="block text-xs leading-snug break-all opacity-70"
          style={{ color: "var(--text-primary)" }}
        >
          {image.name}
        </span>
        <p className="text-xs opacity-50" style={{ color: "var(--text-secondary)" }}>
          {t("folia.options.temperaLayerAlignGridHint")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <ModeButton
            label={t("folia.options.temperaLayerAlignVerticalRandom")}
            active={image.verticalAlign === "free" && image.align !== "free"}
            onClick={() =>
              onPatch(image.id, {
                align: image.align === "free" ? "center" : image.align,
                verticalAlign: "free",
              })
            }
          />
          <ModeButton
            label={t("folia.options.temperaLayerAlignHorizontalRandom")}
            active={image.align === "free" && image.verticalAlign !== "free"}
            onClick={() =>
              onPatch(image.id, {
                align: "free",
                verticalAlign: image.verticalAlign === "free" ? "center" : image.verticalAlign,
              })
            }
          />
          <ModeButton
            label={t("folia.options.temperaLayerAlignFree")}
            active={image.align === "free" && image.verticalAlign === "free"}
            onClick={() => onPatch(image.id, { align: "free", verticalAlign: "free" })}
          />
        </div>
      </div>

      <TemperaRangeControl
        label={t("folia.options.temperaLayerImageScale")}
        value={image.scale}
        min={0.05}
        max={2}
        step={0.01}
        rangeInputClass={rangeInputClass}
        onChange={(scale) => onPatch(image.id, { scale })}
      />
      <TemperaRangeControl
        label={t("folia.options.temperaLayerImageOpacity")}
        value={image.opacity}
        min={0}
        max={1}
        step={0.01}
        rangeInputClass={rangeInputClass}
        onChange={(opacity) => onPatch(image.id, { opacity })}
      />
    </div>
  );
};

export default React.memo(TemperaImagePlacementEditor);
