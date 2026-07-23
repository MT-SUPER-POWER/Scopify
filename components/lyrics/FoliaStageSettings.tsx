"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Captions, Disc, ListMusic, Settings2, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FoliaPanelControls } from "@/components/lyrics/FoliaPanelControls";
import { FoliaPanelQueue } from "@/components/lyrics/FoliaPanelQueue";
import { FoliaFontPicker } from "@/components/lyrics/FoliaFontPicker";
import { FoliaLyricsControls } from "@/components/lyrics/FoliaLyricsControls";
import { FoliaLyricMatchDialog } from "@/components/lyrics/FoliaLyricMatchDialog";
import { FoliaThemeLibraryDialog } from "@/components/lyrics/FoliaThemeLibraryDialog";
import { FoliaVisualSettingsDialog } from "@/components/lyrics/FoliaVisualSettingsDialog";
import { usePlayerStore } from "@/store/module/player";
import type { FoliaStageSettingsProps } from "@/types/components/lyrics";
import type { FoliaPanelTab, FoliaStageEditSection } from "@/types/foliaStage";

export function FoliaStageSettings({
  assets,
  isChromeHidden,
  isOpen,
  onOpenChange,
  theme,
}: FoliaStageSettingsProps) {
  const { t } = useTranslation();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const isDaylight = theme.name === "snow";
  const [activeSection, setActiveSection] = useState<FoliaStageEditSection>("common");
  const [activeTab, setActiveTab] = useState<FoliaPanelTab>("controls");
  const [fontPickerTarget, setFontPickerTarget] = useState<"lyrics" | "subtitle" | null>(null);
  const [isLyricMatchOpen, setIsLyricMatchOpen] = useState(false);
  const [isVisualSettingsOpen, setIsVisualSettingsOpen] = useState(false);
  const [isThemeLibraryOpen, setIsThemeLibraryOpen] = useState(false);

  const openVisualSettings = (section: FoliaStageEditSection) => {
    setActiveSection(section);
    setIsVisualSettingsOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-60"
          >
            <button
              type="button"
              aria-label={String(t("ui.close"))}
              onClick={() => onOpenChange(false)}
              className="pointer-events-auto absolute inset-0 cursor-default"
            />
            <aside
              className={`visualizer-overlay-scrollbar pointer-events-auto fixed right-4 bottom-8 z-10 flex max-h-[calc(100dvh-6rem)] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-3xl p-5 shadow-2xl backdrop-blur-3xl md:right-8 ${
                isDaylight ? "bg-white/60 text-zinc-900" : "bg-black/55 text-white"
              }`}
              style={{
                ["--scrollbar-thumb-color" as string]: isDaylight
                  ? "rgba(0, 0, 0, 0.16)"
                  : "rgba(255, 255, 255, 0.22)",
                ["--scrollbar-thumb-hover-color" as string]: isDaylight
                  ? "rgba(0, 0, 0, 0.28)"
                  : "rgba(255, 255, 255, 0.35)",
              }}
            >
              <div
                className={`relative mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl shadow-lg ${
                  isDaylight ? "bg-black/[0.03]" : "bg-white/5"
                }`}
              >
                {currentSong?.al.picUrl ? (
                  <img src={currentSong.al.picUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Disc size={40} className={isDaylight ? "text-black/20" : "text-white/20"} />
                )}
                <button
                  type="button"
                  title={String(t("ui.close"))}
                  onClick={() => onOpenChange(false)}
                  className={`absolute top-3 right-3 flex size-11 items-center justify-center rounded-full border backdrop-blur-md ${
                    isDaylight
                      ? "border-black/10 bg-white/70 text-zinc-700 hover:bg-white"
                      : "border-white/15 bg-black/25 text-white/90 hover:bg-black/40"
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                className={`mb-4 flex rounded-xl p-1 ${isDaylight ? "bg-black/5" : "bg-black/20"}`}
              >
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
                    className={`flex flex-1 items-center justify-center rounded-lg py-2 transition-all ${
                      activeTab === tab
                        ? isDaylight
                          ? "bg-black/10 shadow-sm"
                          : "bg-white/20 shadow-sm"
                        : "opacity-40 hover:opacity-100"
                    }`}
                    style={{ color: theme.primaryColor }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>

              <div className="min-h-0 flex-1">
                {activeTab === "controls" ? (
                  <FoliaPanelControls
                    onOpenSettings={openVisualSettings}
                    onOpenThemeLibrary={() => setIsThemeLibraryOpen(true)}
                    theme={theme}
                  />
                ) : null}
                {activeTab === "queue" ? <FoliaPanelQueue /> : null}
                {activeTab === "lyrics" ? (
                  <FoliaLyricsControls
                    onOpenLyricMatch={() => setIsLyricMatchOpen(true)}
                    theme={theme}
                  />
                ) : null}
              </div>
            </aside>
          </motion.div>
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
        isOpen={isVisualSettingsOpen}
        onClose={() => setIsVisualSettingsOpen(false)}
        onOpenFontPicker={setFontPickerTarget}
        onOpenThemeLibrary={() => setIsThemeLibraryOpen(true)}
        onSectionChange={setActiveSection}
        section={activeSection}
        theme={theme}
      />

      <FoliaLyricMatchDialog
        isOpen={isLyricMatchOpen}
        onClose={() => setIsLyricMatchOpen(false)}
        theme={theme}
      />

      <FoliaThemeLibraryDialog
        assets={assets}
        isOpen={isThemeLibraryOpen}
        onClose={() => setIsThemeLibraryOpen(false)}
        theme={theme}
      />

      {!isOpen && !isChromeHidden ? (
        <motion.button
          type="button"
          title={String(t("options.visualSettings"))}
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
