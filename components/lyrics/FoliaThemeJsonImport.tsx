"use client";

import { FileInput, Upload } from "lucide-react";
import { useI18n } from "@/store/module/i18n";

import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import { FoliaThemeJsonImportPreview } from "@/components/lyrics/FoliaThemeJsonImportPreview";
import type { FoliaThemeJsonImportProps } from "@/types/components/lyrics";

export function FoliaThemeJsonImport({
  colors,
  currentThemeName,
  fileInputRef,
  importMode,
  isDragOver,
  json,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onImport,
  onImportModeChange,
  onJsonChange,
  themeName,
  validation,
}: FoliaThemeJsonImportProps) {
  const { t } = useI18n();
  const isReady = validation === "valid";
  const surfaceStyle = {
    backgroundColor: colorWithAlpha(colors.backgroundColor, 0.42),
    borderColor: colorWithAlpha(colors.primaryColor, 0.12),
  };

  return (
    <section className="space-y-3 rounded-2xl border p-3" style={surfaceStyle}>
      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-50">
        {t("folia.options.import")}
      </span>

      <div
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed p-2 transition"
        style={{
          backgroundColor: isDragOver
            ? colorWithAlpha(colors.accentColor, 0.12)
            : colorWithAlpha(colors.backgroundColor, 0.7),
          borderColor: isDragOver
            ? colorWithAlpha(colors.accentColor, 0.75)
            : colorWithAlpha(colors.secondaryColor, 0.28),
        }}
      >
        <textarea
          aria-label={String(t("folia.options.pasteJsonOrDropFile"))}
          value={json}
          onChange={(event) => onJsonChange(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          placeholder={String(t("folia.options.pasteJsonOrDropFile"))}
          className="min-h-28 w-full resize-none bg-transparent p-1 font-mono text-[11px] leading-relaxed outline-none placeholder:opacity-35"
          style={{ color: colors.primaryColor }}
          spellCheck={false}
        />
        {json ? null : (
          <Upload
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute right-3 bottom-3 opacity-35"
            style={{ color: colors.secondaryColor }}
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={onFileSelect}
          className="hidden"
        />
      </div>

      <FoliaThemeJsonImportPreview
        colors={colors}
        currentThemeName={currentThemeName}
        importMode={importMode}
        onImportModeChange={onImportModeChange}
        themeName={themeName}
        validation={validation}
      />

      <button
        type="button"
        onClick={onImport}
        disabled={!isReady}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
        style={{
          backgroundColor: isReady
            ? colors.accentColor
            : colorWithAlpha(colors.secondaryColor, 0.16),
          color: isReady ? colors.backgroundColor : colors.secondaryColor,
        }}
      >
        <FileInput size={14} />
        {t("folia.options.importThemeJson")}
      </button>
    </section>
  );
}
