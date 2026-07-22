"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Captions, Disc, ListMusic, Settings2, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FoliaPanelControls } from "@/components/lyrics/FoliaPanelControls";
import { FoliaPanelQueue } from "@/components/lyrics/FoliaPanelQueue";
import { FoliaFontPicker } from "@/components/lyrics/FoliaFontPicker";
import { FoliaLyricsControls } from "@/components/lyrics/FoliaLyricsControls";
import { FoliaVisualSettingsDialog } from "@/components/lyrics/FoliaVisualSettingsDialog";
import { usePlayerStore } from "@/store/module/player";
import type { FoliaStageSettingsProps } from "@/types/components/lyrics";
import type { FoliaPanelTab, FoliaStageEditSection } from "@/types/foliaStage";

export function FoliaStageSettings({
  assets,
  bridge,
  isChromeHidden,
  isOpen,
  onOpenChange,
  theme,
}: FoliaStageSettingsProps) {
  const { t } = useTranslation();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const [activeSection, setActiveSection] = useState<FoliaStageEditSection>("common");
  const [activeTab, setActiveTab] = useState<FoliaPanelTab>("controls");
  const [fontPickerTarget, setFontPickerTarget] = useState<"lyrics" | "subtitle" | null>(null);
  const [isVisualSettingsOpen, setIsVisualSettingsOpen] = useState(false);

  const openVisualSettings = (section: FoliaStageEditSection) => {
    setActiveSection(section);
    setIsVisualSettingsOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.aside
            initial={{ opacity: 0, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed right-4 bottom-8 z-70 flex max-h-[calc(100dvh-6rem)] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-3xl bg-black/55 p-5 text-white shadow-2xl backdrop-blur-3xl md:right-8"
          >
            <div className="relative mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-white/5 shadow-lg">
              {currentSong?.al.picUrl ? (
                <img src={currentSong.al.picUrl} alt="" className="size-full object-cover" />
              ) : (
                <Disc size={40} className="text-white/20" />
              )}
              <button
                type="button"
                title={String(t("ui.close"))}
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white/90 backdrop-blur-md hover:bg-black/40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 flex rounded-xl bg-black/20 p-1">
              {(
                [
                  ["controls", SlidersHorizontal, "panel.controls"],
                  ["queue", ListMusic, "queue.title"],
                  ["lyrics", Captions, "options.lyricsRenderer"],
                ] as const
              ).map(([tab, Icon, label]) => (
                <button
                  key={tab}
                  type="button"
                  title={String(t(label))}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-1 items-center justify-center rounded-lg py-2 transition-all ${activeTab === tab ? "bg-white/20 shadow-sm" : "opacity-40 hover:opacity-100"}`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1">
              {activeTab === "controls" ? <FoliaPanelControls /> : null}
              {activeTab === "queue" ? <FoliaPanelQueue /> : null}
              {activeTab === "lyrics" ? (
                <FoliaLyricsControls theme={theme} onOpenSettings={openVisualSettings} />
              ) : null}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {fontPickerTarget ? (
        <FoliaFontPicker
          assets={assets}
          onClose={() => setFontPickerTarget(null)}
          target={fontPickerTarget}
        />
      ) : null}

      <FoliaVisualSettingsDialog
        assets={assets}
        bridge={bridge}
        isOpen={isVisualSettingsOpen}
        onClose={() => setIsVisualSettingsOpen(false)}
        onOpenFontPicker={setFontPickerTarget}
        onSectionChange={setActiveSection}
        section={activeSection}
        theme={theme}
      />

      {!isOpen && !isChromeHidden ? (
        <motion.button
          type="button"
          title="Visualizer settings"
          initial={{ opacity: 0, x: 20, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          onClick={() => onOpenChange(true)}
          className="fixed right-4 bottom-8 z-60 flex size-12 items-center justify-center rounded-full border-none bg-black/40 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-105 md:right-8"
        >
          <Settings2 size={20} />
        </motion.button>
      ) : null}
    </>
  );
}
