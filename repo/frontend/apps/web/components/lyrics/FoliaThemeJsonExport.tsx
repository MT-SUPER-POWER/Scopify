"use client";

import { Clipboard, Download } from "lucide-react";
import { useI18n } from "@/store/module/i18n";

import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import type { FoliaThemeJsonExportProps } from "@/types/components/lyrics";

export function FoliaThemeJsonExport({
  colors,
  json,
  onCopy,
  onDownload,
}: FoliaThemeJsonExportProps) {
  const { t } = useI18n();
  const surfaceStyle = {
    backgroundColor: colorWithAlpha(colors.backgroundColor, 0.42),
    borderColor: colorWithAlpha(colors.primaryColor, 0.12),
  };

  return (
    <section className="space-y-3 rounded-2xl border p-3" style={surfaceStyle}>
      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-50">
        {t("folia.options.export")}
      </span>

      <div
        className="visualizer-overlay-scrollbar max-h-36 overflow-y-auto rounded-xl border p-2.5"
        style={{
          backgroundColor: colorWithAlpha(colors.backgroundColor, 0.72),
          borderColor: colorWithAlpha(colors.primaryColor, 0.1),
          color: colors.secondaryColor,
        }}
      >
        <pre className="font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap">
          {json}
        </pre>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs transition hover:brightness-95"
          style={{
            borderColor: colorWithAlpha(colors.secondaryColor, 0.3),
            color: colors.primaryColor,
          }}
        >
          <Clipboard size={13} />
          {t("folia.options.copyThemeJson")}
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition hover:brightness-110"
          style={{
            backgroundColor: colors.accentColor,
            color: colors.backgroundColor,
          }}
        >
          <Download size={13} />
          {t("folia.options.downloadThemeJson")}
        </button>
      </div>
    </section>
  );
}
