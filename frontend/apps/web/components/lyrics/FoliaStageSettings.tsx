"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Captions, Disc, ListMusic, Settings2, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/store/module/i18n";

import { FoliaPanelControls } from "@/components/lyrics/FoliaPanelControls";
import { FoliaPanelQueue } from "@/components/lyrics/FoliaPanelQueue";
import { FoliaFontPicker } from "@/components/lyrics/FoliaFontPicker";
import { FoliaLyricsControls } from "@/components/lyrics/FoliaLyricsControls";
import { FoliaLyricMatchDialog } from "@/components/lyrics/FoliaLyricMatchDialog";
import { FoliaThemeLibraryDialog } from "@/components/lyrics/FoliaThemeLibraryDialog";
import { FoliaSonnetPerformanceWarningDialog } from "@/components/lyrics/FoliaSonnetPerformanceWarningDialog";
import { FoliaVisualSettingsDialog } from "@/components/lyrics/FoliaVisualSettingsDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerStore } from "@/store/module/player";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaStageSettingsProps } from "@/types/components/lyrics";
import type { FoliaPanelTab, FoliaStageEditSection } from "@/types/foliaStage";

export function FoliaStageSettings({
  assets,
  isChromeHidden,
  isOpen,
  onOpenChange,
  theme,
  themeLibraryRequestId,
}: FoliaStageSettingsProps) {
  const { t } = useI18n();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const sonnetPerformanceWarningOpen = useLyricStageStore(
    (state) => state.sonnetPerformanceWarningOpen,
  );
  const sonnetPerformanceWarningDontShowAgain = useLyricStageStore(
    (state) => state.sonnetPerformanceWarningDontShowAgain,
  );
  const cancelSonnetPerformanceWarning = useLyricStageStore(
    (state) => state.cancelSonnetPerformanceWarning,
  );
  const confirmSonnetPerformanceWarning = useLyricStageStore(
    (state) => state.confirmSonnetPerformanceWarning,
  );
  const setSonnetPerformanceWarningDontShowAgain = useLyricStageStore(
    (state) => state.setSonnetPerformanceWarningDontShowAgain,
  );
  const isDaylight = theme.name === "snow";
  const [activeSection, setActiveSection] = useState<FoliaStageEditSection>("common");
  const [activeTab, setActiveTab] = useState<FoliaPanelTab>("controls");
  const [fontPickerTarget, setFontPickerTarget] = useState<"lyrics" | "subtitle" | null>(null);
  const [isLyricMatchOpen, setIsLyricMatchOpen] = useState(false);
  const [isVisualSettingsOpen, setIsVisualSettingsOpen] = useState(false);
  const [isThemeLibraryOpen, setIsThemeLibraryOpen] = useState(false);

  useEffect(() => {
    if (themeLibraryRequestId <= 0) return;
    setIsThemeLibraryOpen(true);
  }, [themeLibraryRequestId]);

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
              aria-label={String(t("folia.ui.close"))}
              onClick={() => onOpenChange(false)}
              className="pointer-events-auto absolute inset-0 cursor-default"
            />
            <aside
              className={`pointer-events-auto fixed right-4 bottom-8 z-10 flex h-[calc(100dvh-6rem)] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl shadow-2xl backdrop-blur-3xl md:right-8 ${
                isDaylight ? "bg-white/60 text-zinc-900" : "bg-black/55 text-white"
              }`}
            >
              {/* 封面 — 固定，不滚动 */}
              <div className="shrink-0 p-5 pb-3">
                <div
                  className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl shadow-lg ${
                    isDaylight ? "bg-black/3" : "bg-white/5"
                  }`}
                >
                  {currentSong?.al.picUrl ? (
                    <img src={currentSong.al.picUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <Disc size={40} className={isDaylight ? "text-black/20" : "text-white/20"} />
                  )}
                  <button
                    type="button"
                    title={String(t("folia.ui.close"))}
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
              </div>

              {/* Tab 切换栏 — 固定，不滚动 */}
              <div className="shrink-0 px-5 pb-3">
                <div className={`flex rounded-xl p-1 ${isDaylight ? "bg-black/5" : "bg-black/20"}`}>
                  {(
                    [
                      ["controls", SlidersHorizontal, "folia.panel.controls"],
                      ["queue", ListMusic, "folia.queue.title"],
                      ["lyrics", Captions, "folia.options.lyricsRenderer"],
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
              </div>

              {/* Tab 内容区 — 可滚动 */}
              <div className="min-h-0 flex-1">
                <ScrollArea className="h-full w-full">
                  <div className="px-5 pt-1 pb-8">
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
                </ScrollArea>
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

      <FoliaSonnetPerformanceWarningDialog
        dontShowAgain={sonnetPerformanceWarningDontShowAgain}
        isDaylight={isDaylight}
        isOpen={sonnetPerformanceWarningOpen}
        onClose={cancelSonnetPerformanceWarning}
        onConfirm={confirmSonnetPerformanceWarning}
        onDontShowAgainChange={setSonnetPerformanceWarningDontShowAgain}
      />

      {!isOpen && !isChromeHidden ? (
        <motion.button
          type="button"
          title={String(t("folia.options.visualSettings"))}
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
