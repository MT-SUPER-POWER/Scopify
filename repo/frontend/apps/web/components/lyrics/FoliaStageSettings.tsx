"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/store/module/i18n";

import { FoliaStagePanelHeader } from "@/components/lyrics/FoliaStagePanelHeader";
import { FoliaPanelControls } from "@/components/lyrics/FoliaPanelControls";
import { FoliaAudioEqualizerDialog } from "@/components/lyrics/FoliaAudioEqualizerDialog";
import { FoliaPanelQueue } from "@/components/lyrics/FoliaPanelQueue";
import { FoliaPanelSettings } from "@/components/lyrics/FoliaPanelSettings";
import { FoliaPersonalFmControlsTab } from "@/components/lyrics/FoliaPersonalFmControlsTab";
import { FoliaLyricMatchDialog } from "@/components/lyrics/FoliaLyricMatchDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { usePlayerStore } from "@/store/module/player";
import type { FoliaStageSettingsProps } from "@/types/components/lyrics";
import type { FoliaPanelTab } from "@/types/foliaStage";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";

export function FoliaStageSettings({
  isChromeHidden,
  isOpen,
  onOpenChange,
  theme,
}: FoliaStageSettingsProps) {
  const { t } = useI18n();
  const isPersonalFm = usePlayerStore((state) => isPersonalFmPlaybackSource(state.playlistId));
  const openVisualSettings = useFoliaSettingsStore((state) => state.openVisualSettings);
  const openThemeLibrary = useFoliaSettingsStore((state) => state.openThemeLibrary);
  const isDaylight = theme.name === "snow";
  const [activeTab, setActiveTab] = useState<FoliaPanelTab>("controls");
  const [isLyricMatchOpen, setIsLyricMatchOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  useEffect(() => {
    if (!isPersonalFm && activeTab === "fm") setActiveTab("queue");
  }, [activeTab, isPersonalFm]);

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
              <FoliaStagePanelHeader
                activeTab={activeTab}
                isPersonalFm={isPersonalFm}
                onClose={() => onOpenChange(false)}
                onTabChange={setActiveTab}
                theme={theme}
              />

              {/* Tab 内容区 — 可滚动 */}
              <div className="min-h-0 flex-1">
                <ScrollArea className="size-full">
                  <div className="px-5 pt-1 pb-8">
                    {activeTab === "controls" ? (
                      <FoliaPanelControls
                        onOpenEqualizer={() => setIsEqualizerOpen(true)}
                        onOpenFoliaSettings={() => openVisualSettings("common")}
                        onOpenLyricMatch={() => setIsLyricMatchOpen(true)}
                        theme={theme}
                      />
                    ) : null}
                    {activeTab === "queue" ? <FoliaPanelQueue /> : null}
                    {activeTab === "fm" && isPersonalFm ? (
                      <FoliaPersonalFmControlsTab theme={theme} />
                    ) : null}
                    {activeTab === "settings" ? (
                      <FoliaPanelSettings
                        onOpenSettings={openVisualSettings}
                        onOpenThemeLibrary={openThemeLibrary}
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

      <FoliaAudioEqualizerDialog
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        theme={theme}
      />

      <FoliaLyricMatchDialog
        isOpen={isLyricMatchOpen}
        onClose={() => setIsLyricMatchOpen(false)}
        theme={theme}
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
