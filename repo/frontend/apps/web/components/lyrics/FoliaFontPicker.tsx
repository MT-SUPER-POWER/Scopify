"use client";

import { FoliaStudioWindow } from "@scopify/ui/scopify/components/folia-studio/window";
import { Search, Upload } from "lucide-react";
import { useRef } from "react";
import { useI18n } from "@/store/module/i18n";

import { useFoliaFontPicker } from "@/hooks/player/useFoliaFontPicker";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FoliaFontPickerProps } from "@/types/components/lyrics";
import { useFoliaModalFocus } from "@/hooks/lyrics/useFoliaModalFocus";
import { useLyricStageStore } from "@/store/module/lyrics";

export function FoliaFontPicker({ assets, onClose, target, theme }: FoliaFontPickerProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const warningOpen = useLyricStageStore((state) => state.sonnetPerformanceWarningOpen);
  const dialogRef = useFoliaModalFocus(!warningOpen, onClose);
  const model = useFoliaFontPicker(target, assets, onClose);

  return (
    <FoliaStudioWindow
      compact
      panelRef={dialogRef}
      layer={170}
      title={t("folia.options.customFont")}
      backLabel={t("folia.ui.close")}
      onClose={onClose}
      isDaylight={theme.name === "snow"}
      colors={theme}
    >
      <div className="flex min-h-0 flex-col px-5 pb-5">
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-[var(--st-fill)] px-3">
          <Search size={15} className="opacity-45" />
          <input
            type="search"
            value={model.query}
            onChange={(event) => model.setQuery(event.currentTarget.value)}
            placeholder={String(t("folia.options.searchFonts"))}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--st-t3)]"
          />
        </div>

        <ScrollArea className="min-h-0 flex-1 pr-1">
          <div className="space-y-1 pb-3">
            {!model.supportsSystemFonts ? (
              <p className="px-3 py-8 text-center text-xs opacity-50">
                {t("folia.options.systemFontUnsupported")}
              </p>
            ) : model.isLoading ? (
              <p className="px-3 py-8 text-center text-xs opacity-50">{t("folia.ui.loading")}</p>
            ) : model.filteredFonts.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs opacity-50">
                {t("folia.options.systemFontEmpty")}
              </p>
            ) : (
              model.filteredFonts.map((font) => (
                <button
                  key={font.postscriptName || font.family}
                  type="button"
                  onClick={() => model.applyFontFamily(font.family)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-[var(--st-fill)]"
                >
                  <span className="truncate text-sm" style={{ fontFamily: font.family }}>
                    {font.family}
                  </span>
                  <span className="ml-3 shrink-0 text-[10px] opacity-35">{font.style}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {model.error ? <p className="mt-3 text-xs text-red-500">{model.error}</p> : null}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-black hover:bg-white/90"
        >
          <Upload size={16} />
          {t("folia.options.uploadFont")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
          className="hidden"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void model.uploadFont(file);
          }}
        />
      </div>
    </FoliaStudioWindow>
  );
}
