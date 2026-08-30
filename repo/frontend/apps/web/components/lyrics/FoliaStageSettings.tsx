"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Disc, ListMusic, RadioTower, Settings2, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/store/module/i18n";

import { FoliaPanelControls } from "@/components/lyrics/FoliaPanelControls";
import { FoliaAudioEqualizerDialog } from "@/components/lyrics/FoliaAudioEqualizerDialog";
import { FoliaPanelQueue } from "@/components/lyrics/FoliaPanelQueue";
import { FoliaPanelSettings } from "@/components/lyrics/FoliaPanelSettings";
import { FoliaPersonalFmControlsTab } from "@/components/lyrics/FoliaPersonalFmControlsTab";
import { FoliaFontPicker } from "@/components/lyrics/FoliaFontPicker";
import { FoliaLyricMatchDialog } from "@/components/lyrics/FoliaLyricMatchDialog";
import { FoliaThemeLibraryDialog } from "@/components/lyrics/FoliaThemeLibraryDialog";
import { FoliaSonnetPerformanceWarningDialog } from "@/components/lyrics/FoliaSonnetPerformanceWarningDialog";
import { FoliaVisualSettingsDialog } from "@/components/lyrics/FoliaVisualSettingsDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FOLIA_THEME_LIBRARY_PENDING_KEY,
  FOLIA_THEME_LIBRARY_TOGGLE_EVENT,
  FOLIA_VISUAL_SETTINGS_OPEN_EVENT,
  FOLIA_VISUAL_SETTINGS_PENDING_KEY,
} from "@/constants/desktopPlaybackController";
import { usePlayerStore } from "@/store/module/player";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaStageSettingsProps } from "@/types/components/lyrics";
import type { FoliaPanelTab, FoliaStageEditSection } from "@/types/foliaStage";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";

export function FoliaStageSettings({
  assets,
  isChromeHidden,
  isOpen,
  onOpenChange,
  onVisualSettingsOpenChange,
  theme,
  themeLibraryRequestId,
}: FoliaStageSettingsProps) {
  const { t } = useI18n();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const isPersonalFm = usePlayerStore((state) => isPersonalFmPlaybackSource(state.playlistId));
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
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isVisualSettingsOpen, setIsVisualSettingsOpen] = useState(false);
  const [isThemeLibraryOpen, setIsThemeLibraryOpen] = useState(false);
  const isVisualSettingsOpenRef = useRef(false);
  const isThemeLibraryOpenRef = useRef(false);

  const setVisualSettingsOpen = useCallback(
    (open: boolean) => {
      isVisualSettingsOpenRef.current = open;
      setIsVisualSettingsOpen(open);
      onVisualSettingsOpenChange(open);
    },
    [onVisualSettingsOpenChange],
  );

  const setThemeLibraryOpen = useCallback((open: boolean) => {
    isThemeLibraryOpenRef.current = open;
    setIsThemeLibraryOpen(open);
  }, []);

  const openVisualSettings = (section: FoliaStageEditSection) => {
    setActiveSection(section);
    setVisualSettingsOpen(true);
  };

  useEffect(() => {
    if (themeLibraryRequestId <= 0) return;
    setActiveTab("settings");
    setThemeLibraryOpen(true);
  }, [setThemeLibraryOpen, themeLibraryRequestId]);

  useEffect(() => {
    const clearThemeLibraryShortcutPendingState = () => {
      try {
        window.sessionStorage.removeItem(FOLIA_THEME_LIBRARY_PENDING_KEY);
      } catch {
        // Opening the theme library does not depend on session storage cleanup.
      }
    };

    const openThemeLibraryFromShortcut = () => {
      clearThemeLibraryShortcutPendingState();
      setActiveTab("settings");
      setThemeLibraryOpen(true);
    };

    const toggleThemeLibraryFromShortcut = () => {
      clearThemeLibraryShortcutPendingState();
      if (isThemeLibraryOpenRef.current) {
        setThemeLibraryOpen(false);
        return;
      }
      openThemeLibraryFromShortcut();
    };

    try {
      if (window.sessionStorage.getItem(FOLIA_THEME_LIBRARY_PENDING_KEY) === "1") {
        openThemeLibraryFromShortcut();
      }
    } catch {
      // The live event below remains available when session storage is blocked.
    }

    window.addEventListener(FOLIA_THEME_LIBRARY_TOGGLE_EVENT, toggleThemeLibraryFromShortcut);
    return () =>
      window.removeEventListener(FOLIA_THEME_LIBRARY_TOGGLE_EVENT, toggleThemeLibraryFromShortcut);
  }, [setThemeLibraryOpen]);

  useEffect(() => {
    const clearVisualSettingsShortcutPendingState = () => {
      try {
        window.sessionStorage.removeItem(FOLIA_VISUAL_SETTINGS_PENDING_KEY);
      } catch {
        // Opening the visual settings does not depend on session storage cleanup.
      }
    };

    const openVisualSettingsFromShortcut = () => {
      clearVisualSettingsShortcutPendingState();
      setActiveSection("common");
      setVisualSettingsOpen(true);
    };

    const toggleVisualSettingsFromShortcut = () => {
      clearVisualSettingsShortcutPendingState();
      if (isVisualSettingsOpenRef.current) {
        setVisualSettingsOpen(false);
        return;
      }
      openVisualSettingsFromShortcut();
    };

    try {
      if (window.sessionStorage.getItem(FOLIA_VISUAL_SETTINGS_PENDING_KEY) === "1") {
        openVisualSettingsFromShortcut();
      }
    } catch {
      // The live event below remains available when session storage is blocked.
    }

    window.addEventListener(FOLIA_VISUAL_SETTINGS_OPEN_EVENT, toggleVisualSettingsFromShortcut);
    return () =>
      window.removeEventListener(
        FOLIA_VISUAL_SETTINGS_OPEN_EVENT,
        toggleVisualSettingsFromShortcut,
      );
  }, [setVisualSettingsOpen]);

  useEffect(() => {
    if (!isPersonalFm && activeTab === "fm") setActiveTab("queue");
  }, [activeTab, isPersonalFm]);

  useEffect(
    () => () => {
      onVisualSettingsOpenChange(false);
    },
    [onVisualSettingsOpenChange],
  );

  const panelTabs = [
    ["controls", SlidersHorizontal, "folia.panel.controls"],
    ["queue", ListMusic, "folia.queue.title"],
    ...(isPersonalFm ? ([["fm", RadioTower, "personalFm.title"]] as const) : []),
    ["settings", Settings2, "folia.options.visualSettings"],
  ] as const;

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
                  {panelTabs.map(([tab, Icon, label]) => (
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
                        onOpenThemeLibrary={() => setThemeLibraryOpen(true)}
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
        onClose={() => setVisualSettingsOpen(false)}
        onOpenFontPicker={setFontPickerTarget}
        onOpenThemeLibrary={() => setThemeLibraryOpen(true)}
        onSectionChange={setActiveSection}
        section={activeSection}
        theme={theme}
      />

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

      <FoliaThemeLibraryDialog
        assets={assets}
        isOpen={isThemeLibraryOpen}
        onClose={() => setThemeLibraryOpen(false)}
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
