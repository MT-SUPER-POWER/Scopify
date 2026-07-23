"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/store/module/i18n";

import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import type { FoliaThemeColors } from "@/types/foliaStage";
import type { FoliaThemeJsonImportPreviewProps } from "@/types/components/lyrics";

const COLOR_FIELDS = [
  ["backgroundColor", "folia.options.aiThemeQuickEditBackground"],
  ["primaryColor", "folia.options.aiThemeQuickEditPrimary"],
  ["accentColor", "folia.options.aiThemeQuickEditAccent"],
  ["secondaryColor", "folia.options.aiThemeQuickEditSecondary"],
] as const satisfies readonly [keyof FoliaThemeColors, string][];

export function FoliaThemeJsonImportPreview({
  colors,
  currentThemeName,
  importMode,
  onImportModeChange,
  themeName,
  validation,
}: FoliaThemeJsonImportPreviewProps) {
  const { t } = useI18n();
  const isReady = validation === "valid";

  return (
    <div className="space-y-3">
      {isReady && themeName ? (
        <div
          className="flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs"
          style={{
            backgroundColor: colorWithAlpha(colors.accentColor, 0.1),
            borderColor: colorWithAlpha(colors.accentColor, 0.32),
            color: colors.primaryColor,
          }}
        >
          <CheckCircle2 size={14} style={{ color: colors.accentColor }} />
          <span className="min-w-0 truncate">
            {t("folia.options.importThemeName")}: {themeName}
          </span>
        </div>
      ) : null}

      {validation === "invalid" ? (
        <div
          className="flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs"
          style={{
            backgroundColor: "rgba(244, 63, 94, 0.08)",
            borderColor: "rgba(244, 63, 94, 0.26)",
            color: "#e11d48",
          }}
        >
          <AlertCircle size={14} />
          {t("folia.options.invalidJsonFormat")}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        {COLOR_FIELDS.map(([key, label]) => {
          const isAccent = key === "accentColor";
          return (
            <div
              key={key}
              className="flex min-w-0 items-center gap-2 rounded-xl border p-2.5"
              style={{
                backgroundColor: isAccent
                  ? colorWithAlpha(colors.accentColor, 0.08)
                  : colorWithAlpha(colors.backgroundColor, 0.36),
                borderColor: isAccent
                  ? colorWithAlpha(colors.accentColor, 0.8)
                  : colorWithAlpha(colors.primaryColor, 0.12),
              }}
            >
              <i
                aria-hidden="true"
                className="size-7 shrink-0 rounded-lg border"
                style={{
                  backgroundColor: colors[key],
                  borderColor: colorWithAlpha(colors.primaryColor, 0.15),
                }}
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{t(label)}</span>
                <span className="block truncate font-mono text-[10px] opacity-55">
                  {colors[key].toUpperCase()}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {isReady ? (
        <div
          className="grid grid-cols-2 rounded-xl p-1"
          style={{ backgroundColor: colorWithAlpha(colors.backgroundColor, 0.72) }}
        >
          {(["new", "overwrite"] as const).map((mode) => {
            const active = importMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onImportModeChange(mode)}
                className="min-h-9 rounded-lg border px-2 text-[11px] transition"
                style={{
                  backgroundColor: active
                    ? colorWithAlpha(colors.accentColor, 0.15)
                    : "transparent",
                  borderColor: active ? colorWithAlpha(colors.accentColor, 0.5) : "transparent",
                  color: active ? colors.primaryColor : `${colors.secondaryColor}99`,
                }}
              >
                {mode === "new"
                  ? t("folia.options.importAsNew")
                  : t("folia.options.importOverwrite", { name: currentThemeName })}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
