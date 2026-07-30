"use client";

import { Search, Upload, X } from "lucide-react";
import { useRef } from "react";
import { useI18n } from "@/store/module/i18n";

import { useFoliaFontPicker } from "@/hooks/player/useFoliaFontPicker";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FoliaStageAssets } from "@/types/foliaAssets";

interface FoliaFontPickerProps {
  assets: FoliaStageAssets;
  onClose: () => void;
  target: "lyrics" | "subtitle";
}

export function FoliaFontPicker({ assets, onClose, target }: FoliaFontPickerProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const model = useFoliaFontPicker(target, assets, onClose);

  return (
    <div
      className="fixed inset-0 z-90 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="flex max-h-[min(620px,calc(100dvh-2rem))] w-[min(520px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("folia.options.customFont")}</h2>
          <button
            type="button"
            title={String(t("folia.ui.close"))}
            onClick={onClose}
            className="rounded-full p-2 opacity-60 hover:bg-white/10 hover:opacity-100"
          >
            <X size={18} />
          </button>
        </header>

        <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/5 px-3">
          <Search size={15} className="opacity-45" />
          <input
            type="search"
            value={model.query}
            onChange={(event) => model.setQuery(event.currentTarget.value)}
            placeholder={String(t("folia.options.searchFonts"))}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"
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
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-white/10"
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

        {model.error ? <p className="mt-3 text-xs text-red-300">{model.error}</p> : null}
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
      </section>
    </div>
  );
}
