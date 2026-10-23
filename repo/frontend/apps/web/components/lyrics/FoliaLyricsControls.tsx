"use client";

import { ArrowDownUp, Download, RotateCcw, Search, Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  FoliaGroupLine,
  FoliaIconButton,
  FoliaPanelButton,
  FoliaPanelRow,
  FoliaSegments,
  FoliaStepper,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { FoliaPopover } from "@scopify/ui/scopify/components/folia-panel/popover";

import { useOnlineLyricsTab } from "@/hooks/lyrics/useOnlineLyricsTab";
import { useI18n } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";
import type { FoliaLyricsControlsProps } from "@/types/components/lyrics";
import type { ReplayGainMode } from "@/types/player";

// The lyrics tab (Folia panelTab/SourceTab.tsx, LyricTimelineOffsetControl.tsx, LyricFileButton.tsx,
// ReplayGainControl.tsx): where the lyrics come from, the timeline offset in 250 ms steps, online
// matching and the lyric file menu (import, or export the lyric on stage), then replay gain.

const OFFSET_STEP_MS = 250;
const MENU_ROW_CLASS =
  "st-t-fast flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors enabled:hover:bg-[var(--st-fill)] disabled:cursor-not-allowed disabled:opacity-40";

const formatGain = (gain: number) => `${gain > 0 ? "+" : ""}${gain.toFixed(1)} dB`;

export function FoliaLyricsControls({ onOpenLyricMatch }: FoliaLyricsControlsProps) {
  const { t } = useI18n();
  const model = useOnlineLyricsTab();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileButtonRef = useRef<HTMLButtonElement>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const song = usePlayerStore((state) => state.currentSongDetail);
  const replayGainMode = usePlayerStore((state) => state.replayGainMode);
  const setReplayGainMode = usePlayerStore((state) => state.setReplayGainMode);
  const trackGain = song?.replayGainTrackGain ?? song?.replayGain;
  const albumGain = song?.replayGainAlbumGain;
  const measuredGain = [
    trackGain == null ? null : `${t("folia.localMusic.replayGainTrack")} ${formatGain(trackGain)}`,
    albumGain == null ? null : `${t("folia.localMusic.replayGainAlbum")} ${formatGain(albumGain)}`,
  ].filter(Boolean);
  const sources = [
    { label: t("lyrics.match.sourceNetease"), value: "online" as const },
    ...(model.importedLyric
      ? [{ label: model.importedLyric.fileName, value: "imported" as const }]
      : []),
  ];
  const hasOffset = model.lyricOffsetMs !== 0;
  const closeFileMenu = () => setIsFileMenuOpen(false);

  return (
    <div>
      <FoliaPanelRow label={t("lyrics.tab.title")}>
        {model.importedLyric ? (
          <FoliaIconButton
            size="s"
            label={t("lyrics.tab.clear")}
            disabled={model.isUpdating}
            onClick={() => void model.clearLyricsState()}
          >
            <RotateCcw size={15} />
          </FoliaIconButton>
        ) : null}
        {sources.length > 1 ? (
          <FoliaSegments
            fill
            value={model.source}
            onChange={(source) => void model.selectSource(source)}
            options={sources}
          />
        ) : (
          <span className="truncate text-[13px] text-[color:var(--st-t2)]">{sources[0].label}</span>
        )}
      </FoliaPanelRow>

      <FoliaPanelRow label={t("lyrics.tab.offset")}>
        {/* Keeps its place at 0, so the number beside it does not move. */}
        <span
          inert={!hasOffset}
          className={`st-t-move inline-flex transition-[opacity,scale,visibility] ${hasOffset ? "" : "invisible scale-80 opacity-0"}`}
        >
          <FoliaIconButton
            size="s"
            label={t("lyrics.tab.resetOffset")}
            onClick={() => model.setLyricOffsetMs(0)}
          >
            <RotateCcw size={15} />
          </FoliaIconButton>
        </span>
        <FoliaStepper
          value={model.lyricOffsetMs}
          onChange={(next) => model.setLyricOffsetMs(Math.round(next))}
          step={OFFSET_STEP_MS}
          unit="ms"
          signed
          label={t("lyrics.tab.offset")}
        />
      </FoliaPanelRow>

      <div className="flex flex-wrap gap-2 px-1 py-2">
        <FoliaPanelButton grow icon={Search} onClick={onOpenLyricMatch}>
          {t("lyrics.match.open")}
        </FoliaPanelButton>
        <FoliaPanelButton
          grow
          icon={ArrowDownUp}
          buttonRef={fileButtonRef}
          disabled={model.isUpdating}
          aria-haspopup="true"
          aria-expanded={isFileMenuOpen}
          onClick={() => setIsFileMenuOpen((open) => !open)}
        >
          {t("lyrics.tab.importExport")}
        </FoliaPanelButton>
      </div>

      <FoliaPopover
        anchorRef={fileButtonRef}
        open={isFileMenuOpen}
        onClose={closeFileMenu}
        align="end"
        role="menu"
        aria-label={t("lyrics.tab.importExport")}
        className="min-w-48 p-1.5"
      >
        <button
          type="button"
          role="menuitem"
          className={MENU_ROW_CLASS}
          onClick={() => {
            closeFileMenu();
            inputRef.current?.click();
          }}
        >
          <Upload size={15} className="text-[color:var(--st-t3)]" />
          {t("lyrics.tab.import")}
        </button>
        <div className="mx-2.5 my-1 h-px bg-[var(--st-line)]" />
        {(["lrc", "yrc"] as const).map((format) => (
          <button
            key={format}
            type="button"
            role="menuitem"
            disabled={!model.exportableFormats.includes(format)}
            className={MENU_ROW_CLASS}
            onClick={() => {
              closeFileMenu();
              model.exportLyric(format);
            }}
          >
            <Download size={15} className="text-[color:var(--st-t3)]" />
            {t(format === "lrc" ? "lyrics.tab.exportLrc" : "lyrics.tab.exportYrc")}
          </button>
        ))}
      </FoliaPopover>
      <input
        accept=".awlrc,.lrc,.yrc,.txt"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void model.importLyricFile(file);
          event.currentTarget.value = "";
        }}
        ref={inputRef}
        type="file"
      />

      <FoliaGroupLine />

      <FoliaPanelRow
        label={t("audioSettings.replayGain")}
        hint={
          measuredGain.length > 0
            ? measuredGain.join(" · ")
            : t("folia.localMusic.replayGainUnavailable")
        }
      >
        <FoliaSegments<ReplayGainMode>
          fill
          value={replayGainMode}
          onChange={setReplayGainMode}
          options={[
            { label: t("folia.localMusic.replayGainOff"), value: "off" },
            {
              disabled: trackGain == null,
              label: t("folia.localMusic.replayGainTrack"),
              value: "track",
            },
            {
              disabled: albumGain == null,
              label: t("folia.localMusic.replayGainAlbum"),
              value: "album",
            },
          ]}
        />
      </FoliaPanelRow>
    </div>
  );
}
