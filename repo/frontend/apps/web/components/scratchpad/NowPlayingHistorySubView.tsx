"use client";

import Image from "next/image";
import {
  Check,
  FolderPlus,
  History,
  ListPlus,
  Maximize2,
  Music2,
  NotebookPen,
  Play,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";
import type { HistoryListRowProps } from "@/types/scratchpad/components";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ScratchpadShape from "./ScratchpadShape";
import { ScratchpadEmpty } from "@/components/scratchpad/ScratchpadEmpty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { groupPlaysByDay } from "@/lib/scratchpad/historyDays";
import { providerLabel } from "@/lib/scratchpad/scratchpadModel";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/module/player";
import { collectTracksToScratchpad, useScratchpadStore } from "@/store/module/scratchpad";
import type { HistoryDayGroup } from "@/types/scratchpad/model";

/**
 * 右侧面板中的播放历史子视图：按天分段列出本地播放记录，风格与正在播放面板一致。
 */
export function NowPlayingHistorySubView() {
  const { t, i18n } = useTranslation();
  const localHistory = useScratchpadStore((s) => s.localHistory);
  const entries = useScratchpadStore((s) => s.entries);
  const removeHistoryKeys = useScratchpadStore((s) => s.removeHistoryKeys);
  const openWorkspace = useScratchpadStore((s) => s.openWorkspace);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const actions = useScratchpadActions();

  const currentKey = currentTrack ? playerTrackKey(currentTrack) : null;
  const collectedKeys = useMemo(() => new Set(entries.map((entry) => entry.key)), [entries]);
  const days = useMemo(() => groupPlaysByDay(localHistory), [localHistory]);

  const formats = useMemo(
    () => ({
      time: new Intl.DateTimeFormat(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }),
      day: new Intl.DateTimeFormat(i18n.language, {
        month: "short",
        day: "numeric",
        weekday: "short",
      }),
    }),
    [i18n.language],
  );

  const dayLabel = (day: HistoryDayGroup) =>
    day.kind === "today"
      ? t("scratchpad.today")
      : day.kind === "yesterday"
        ? t("scratchpad.yesterday")
        : formats.day.format(day.start);

  if (localHistory.length === 0) {
    return (
      <ScratchpadEmpty icon={History} title={t("scratchpad.historyEmpty")}>
        <button
          type="button"
          onClick={() => openWorkspace("overview")}
          className="inline-flex items-center gap-1.5 rounded-sm border-b border-brand/40 py-1 text-xs font-semibold text-content hover:text-brand"
        >
          <Maximize2 className="size-3.5" />
          <span>{t("scratchpad.openOverview")}</span>
        </button>
      </ScratchpadEmpty>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="scratchpad-list">
        {days.map((day) => (
          <section key={day.start} className="scratchpad-list-group">
            <div className="scratchpad-group-header is-day">
              <ScratchpadShape kind="tri" size={11} fill="var(--scratchpad-mark-wall)" />
              <span className="scratchpad-day-number">
                {String(new Date(day.start).getDate()).padStart(2, "0")}
              </span>
              <span className="scratchpad-group-label">{dayLabel(day)}</span>
              <span className="scratchpad-group-count">
                {t("scratchpad.count", { count: day.entries.length })}
              </span>
              <button
                type="button"
                onClick={() => actions.enqueueTracks(day.entries.map((item) => item.track))}
                title={t("scratchpad.enqueueGroup")}
                aria-label={t("scratchpad.enqueueGroup")}
                className="rounded-full p-1 text-content-muted transition-colors hover:bg-content/10 hover:text-content"
              >
                <ListPlus className="size-3.5" />
              </button>
            </div>

            <ul>
              {day.entries.map((entry) => (
                <HistoryListRow
                  key={entry.key}
                  entry={entry}
                  isActive={entry.key === currentKey}
                  isCollected={collectedKeys.has(entry.key)}
                  timeLabel={formats.time.format(entry.playedAt)}
                  sourceLabel={providerLabel(entry.track.ref.provider, t)}
                  onPlay={() => actions.playNow(entry.track)}
                  onEnqueue={() => actions.enqueueTracks([entry.track])}
                  onCollect={() =>
                    collectTracksToScratchpad([entry.track], {
                      label: t("scratchpad.originHistory"),
                    })
                  }
                  onSave={() => actions.openSaveToPlaylist([entry.track], "history")}
                  onRemove={() => {
                    removeHistoryKeys([entry.key]);
                    toast.success(t("scratchpad.toastHistoryDeleted", { count: 1 }));
                  }}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ScrollArea>
  );
}

function HistoryListRow({
  entry,
  isActive,
  isCollected,
  timeLabel,
  sourceLabel,
  onPlay,
  onEnqueue,
  onCollect,
  onSave,
  onRemove,
}: HistoryListRowProps) {
  const { t } = useTranslation();
  const coverUrl = resolveCoverUrl(entry.track.album?.coverUrl ?? undefined);
  const subtitle = `${formatTrackArtists(entry.track)} · ${sourceLabel}`;

  return (
    <li className={cn("scratchpad-row", isActive && "is-current")}>
      <span className="scratchpad-cover scratchpad-photo" aria-hidden>
        {coverUrl ? (
          <Image width={76} height={76} src={getSizedImageUrl(coverUrl, 96)} alt="" />
        ) : (
          <Music2 size={16} />
        )}
      </span>
      <button
        type="button"
        className="scratchpad-song"
        onClick={onPlay}
        title={t("scratchpad.play")}
      >
        <span className="scratchpad-name">{entry.track.title}</span>
        <span className="scratchpad-meta">{subtitle}</span>
      </button>
      <span className="scratchpad-group-count">{timeLabel}</span>
      <span className="scratchpad-row-actions">
        <button
          type="button"
          className="scratchpad-icon-button"
          onClick={onPlay}
          title={t("scratchpad.play")}
          aria-label={t("scratchpad.play")}
        >
          <Play />
        </button>
        <button
          type="button"
          className="scratchpad-icon-button"
          onClick={onEnqueue}
          title={t("scratchpad.enqueue")}
          aria-label={t("scratchpad.enqueue")}
        >
          <ListPlus />
        </button>
        <button
          type="button"
          className="scratchpad-icon-button"
          disabled={isCollected}
          onClick={onCollect}
          title={t(isCollected ? "scratchpad.alreadyIn" : "scratchpad.collect")}
          aria-label={t(isCollected ? "scratchpad.alreadyIn" : "scratchpad.collect")}
        >
          {isCollected ? <Check /> : <NotebookPen />}
        </button>
        <button
          type="button"
          className="scratchpad-icon-button"
          onClick={onSave}
          title={t("scratchpad.saveToPlaylist")}
          aria-label={t("scratchpad.saveToPlaylist")}
        >
          <FolderPlus />
        </button>
        <button
          type="button"
          className="scratchpad-icon-button"
          onClick={onRemove}
          title={t("scratchpad.deleteFromHistory")}
          aria-label={t("scratchpad.deleteFromHistory")}
        >
          <Trash2 />
        </button>
      </span>
    </li>
  );
}
