"use client";

import { Clock3, Film } from "lucide-react";
import { useState } from "react";

import { FoliaGlobalLyricOffsetDialog } from "@/components/lyrics/FoliaGlobalLyricOffsetDialog";
import { FoliaVideoExportDialog } from "@/components/lyrics/FoliaVideoExportDialog";
import { useI18n } from "@/store/module/i18n";
import type { FoliaGlobalSettingsCardProps } from "@/types/components/lyrics";
import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";

export function FoliaGlobalSettingsCard({ controlCardBg, theme }: FoliaGlobalSettingsCardProps) {
  const { t } = useI18n();
  const [isVideoExportOpen, setIsVideoExportOpen] = useState(false);
  const [isOffsetDialogOpen, setIsOffsetDialogOpen] = useState(false);
  const isDaylight = theme.name === "snow";
  const borderColor = isDaylight ? "border-black/8" : "border-white/10";

  return (
    <section
      className="space-y-4 rounded-[24px] border p-4"
      style={{
        backgroundColor: controlCardBg,
        borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
      }}
    >
      <div>
        <h3 className="text-sm font-semibold" style={{ color: theme.primaryColor }}>
          {t("folia.options.lyricsGlobalSettings")}
        </h3>
        <p className="mt-1 text-[11px] opacity-50" style={{ color: theme.secondaryColor }}>
          {t("folia.options.lyricsGlobalSettingsDesc")}
        </p>
      </div>

      <div className={`flex items-center justify-between gap-3 border-t pt-3 ${borderColor}`}>
        <div className="min-w-0">
          <div className="text-xs font-medium" style={{ color: theme.primaryColor }}>
            {t("folia.offset.title")}
          </div>
          <div className="mt-0.5 text-[10px] opacity-50" style={{ color: theme.secondaryColor }}>
            {t("folia.offset.subtitle")}
          </div>
        </div>
        <button
          aria-label={t("folia.offset.title")}
          className={`flex size-9 items-center justify-center rounded-xl border transition-colors ${
            isDaylight
              ? "border-black/8 bg-black/4 hover:bg-black/8"
              : "border-white/10 bg-white/6 hover:bg-white/10"
          }`}
          onClick={() => setIsOffsetDialogOpen(true)}
          style={{ color: theme.primaryColor }}
          title={t("folia.offset.title")}
          type="button"
        >
          <Clock3 size={15} />
        </button>
      </div>
      <div className={`flex items-center justify-between gap-3 border-t pt-3 ${borderColor}`}>
        <div>
          <div className="text-xs font-medium" style={{ color: theme.primaryColor }}>
            {t("folia.videoExport.title")}
          </div>
          <div className="mt-0.5 text-[10px] opacity-50" style={{ color: theme.secondaryColor }}>
            {t("folia.videoExport.cardDesc")}
          </div>
        </div>
        <button
          className={`flex size-9 items-center justify-center rounded-xl border transition-colors ${isDaylight ? "border-black/8 bg-black/4 hover:bg-black/8" : "border-white/10 bg-white/6 hover:bg-white/10"}`}
          onClick={() => setIsVideoExportOpen(true)}
          style={{ color: theme.primaryColor }}
          title={t("folia.videoExport.title")}
          type="button"
        >
          <Film size={15} />
        </button>
      </div>
      <FoliaVideoExportDialog
        isOpen={isVideoExportOpen}
        onClose={() => setIsVideoExportOpen(false)}
        theme={theme}
      />
      <FoliaGlobalLyricOffsetDialog
        isOpen={isOffsetDialogOpen}
        onClose={() => setIsOffsetDialogOpen(false)}
        theme={theme}
      />
    </section>
  );
}
