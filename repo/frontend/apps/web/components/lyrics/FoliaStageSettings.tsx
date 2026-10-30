"use client";

import {
  AudioLines,
  Disc,
  FileText,
  ListMusic,
  RadioTower,
  Settings2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FoliaIconButton } from "@scopify/ui/scopify/components/folia-panel/controls";
import {
  FoliaLikeButton,
  FoliaPanelShell,
  FoliaSongHeader,
  FoliaTabDock,
  type FoliaSongLike,
} from "@scopify/ui/scopify/components/folia-panel/panel-shell";

import { FoliaAudioEqualizerDialog } from "@/components/lyrics/FoliaAudioEqualizerDialog";
import { FoliaLyricMatchDialog } from "@/components/lyrics/FoliaLyricMatchDialog";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";
import { FoliaLyricsControls } from "@/components/lyrics/FoliaLyricsControls";
import { FoliaPanelControls } from "@/components/lyrics/FoliaPanelControls";
import { FoliaPanelQuality } from "@/components/lyrics/FoliaPanelQuality";
import { FoliaPanelQueue } from "@/components/lyrics/FoliaPanelQueue";
import { FoliaPersonalFmControlsTab } from "@/components/lyrics/FoliaPersonalFmControlsTab";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { useI18n } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";
import type { FoliaStageSettingsProps } from "@/types/lyrics/components";
import type { FoliaPanelTab } from "@/types/lyrics/folia/stage";

// The playback stage's panel (Folia components/UnifiedPanel.tsx): which tabs there are for the
// playing song and what each one is given. How it looks lives in the shared Folia panel kit
// (@scopify/ui/scopify/components/folia-panel) and in the tabs themselves.

export function FoliaStageSettings({
  assets,
  isChromeHidden,
  isOpen,
  onOpenChange,
  theme,
}: FoliaStageSettingsProps) {
  const { t } = useI18n();
  const model = useFoliaPanelControls();
  const song = usePlayerStore((state) => state.currentSongDetail);
  const isPersonalFm = usePlayerStore((state) => isPersonalFmPlaybackSource(state.playlistId));
  const openVisualSettings = useFoliaSettingsStore((state) => state.openVisualSettings);
  const openThemeLibrary = useFoliaSettingsStore((state) => state.openThemeLibrary);
  const isDaylight = theme.name === "snow";
  const [activeTab, setActiveTab] = useState<FoliaPanelTab>("controls");
  const [isLyricMatchOpen, setIsLyricMatchOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  useEffect(() => {
    if (!isPersonalFm && activeTab === "fm") setActiveTab("queue");
    if (isPersonalFm && activeTab === "queue") setActiveTab("fm");
  }, [activeTab, isPersonalFm]);

  const tabs = [
    { icon: Disc, id: "cover" as const, label: t("folia.panel.cover") },
    { icon: FileText, id: "lyrics" as const, label: t("folia.panel.lyrics") },
    { icon: SlidersHorizontal, id: "controls" as const, label: t("folia.panel.controls") },
    isPersonalFm
      ? { icon: RadioTower, id: "fm" as const, label: t("personalFm.title") }
      : { icon: ListMusic, id: "queue" as const, label: t("folia.panel.playlist") },
    { icon: AudioLines, id: "quality" as const, label: t("folia.panel.quality") },
  ];
  const artists = song?.ar?.map((artist) => artist.name).join(" / ") ?? "";
  const like: FoliaSongLike = {
    isLiked: model.isLiked,
    label: t(model.isLiked ? "folia.ui.unlike" : "folia.ui.like"),
    onLike: model.toggleLike,
  };
  // Opening a window that sits over the stage takes the panel out of its way.
  const openSettings = (section: Parameters<typeof openVisualSettings>[0]) => {
    onOpenChange(false);
    openVisualSettings(section);
  };

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label={String(t("folia.ui.close"))}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-60 cursor-default"
        />
      ) : null}

      <FoliaPanelShell
        isOpen={isOpen}
        hasHandle
        isCover={activeTab === "cover"}
        tabKey={activeTab}
        isDaylight={isDaylight}
        colors={{ accentColor: theme.accentColor, primaryColor: theme.primaryColor }}
        header={
          <FoliaSongHeader
            isBig={activeTab === "cover"}
            songKey={String(song?.id ?? "")}
            title={song?.name || t("folia.ui.noTrack")}
            artists={artists}
            coverUrl={song?.al?.picUrl ?? null}
            like={like}
            onShowCover={() => setActiveTab("cover")}
          >
            <div key={song?.id ?? ""} className="st-page-in">
              <h2 className="line-clamp-2 text-lg leading-[26px] font-semibold">
                {song?.name || t("folia.ui.noTrack")}
              </h2>
              {artists ? (
                <p className="mt-0.5 truncate text-[13px] leading-5 text-[color:var(--st-t2)]">
                  {artists}
                </p>
              ) : null}
              {song?.al?.name ? (
                <p className="truncate text-xs leading-[18px] text-[color:var(--st-t3)]">
                  {song.al.name}
                </p>
              ) : null}
            </div>
            <div className="mt-3.5 flex items-center gap-1.5">
              <FoliaLikeButton like={like} filled />
              <span className="min-w-1.5 flex-1" />
              <FoliaIconButton
                label={t("folia.options.visualSettings")}
                onClick={() => openSettings("common")}
              >
                <Settings2 size={17} />
              </FoliaIconButton>
            </div>
          </FoliaSongHeader>
        }
        dock={<FoliaTabDock tabs={tabs} currentTab={activeTab} onTabChange={setActiveTab} />}
        handle={
          isOpen || !isChromeHidden ? (
            <div className="pointer-events-auto pr-4 md:pr-8">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      aria-label={String(
                        t(isOpen ? "folia.ui.close" : "shortcuts.command.toggleStageSettings"),
                      )}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => onOpenChange(!isOpen)}
                      className="flex size-12 items-center justify-center rounded-full border-none bg-black/40 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-105"
                    >
                      {isOpen ? <X size={20} /> : <Settings2 size={20} />}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={12}>
                    <ShortcutHint
                      commandId="toggle-stage-settings"
                      label={t(isOpen ? "folia.ui.close" : "shortcuts.command.toggleStageSettings")}
                    />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : null
        }
      >
        {activeTab === "lyrics" ? (
          <FoliaLyricsControls onOpenLyricMatch={() => setIsLyricMatchOpen(true)} />
        ) : null}
        {activeTab === "controls" ? (
          <FoliaPanelControls
            assets={assets}
            onClosePanel={() => onOpenChange(false)}
            onOpenEqualizer={() => setIsEqualizerOpen(true)}
            onOpenSettings={openSettings}
            onOpenThemeLibrary={() => {
              onOpenChange(false);
              openThemeLibrary();
            }}
            theme={theme}
          />
        ) : null}
        {activeTab === "queue" ? <FoliaPanelQueue /> : null}
        {activeTab === "fm" && isPersonalFm ? <FoliaPersonalFmControlsTab theme={theme} /> : null}
        {activeTab === "quality" ? <FoliaPanelQuality /> : null}
      </FoliaPanelShell>

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
    </>
  );
}
