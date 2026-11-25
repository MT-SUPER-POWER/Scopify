"use client";

import { FolderPlus, History, ListPlus, NotebookPen, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ScratchpadCanvas } from "@/components/scratchpad/ScratchpadCanvas";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { spacingForDensity } from "@/lib/scratchpad/canvasLayout";
import { groupPlaysByDay } from "@/lib/scratchpad/historyDays";
import { providerLabel, scratchpadCanvasTips } from "@/lib/scratchpad/scratchpadModel";
import { usePlayerStore } from "@/store/module/player";
import { collectTracksToScratchpad, useScratchpadStore } from "@/store/module/scratchpad";
import type {
  CanvasAction,
  CanvasEntry,
  CanvasGroup,
  CanvasSideConfig,
} from "@/types/scratchpad/canvas";
import type { ScratchpadFilterProps } from "@/types/scratchpad/components";
import type { HistoryDayGroup } from "@/types/scratchpad/model";

interface ScratchpadHistoryCanvasProps extends ScratchpadFilterProps {
  onEscape: () => void;
}

/**
 * 播放历史卡片画布：按日归档本地播放足迹，支持快速跳日导航、入队、收进速记簿与移除记录。
 */
export function ScratchpadHistoryCanvas({
  searchQuery,
  providerFilter,
  density,
  onEscape,
}: ScratchpadHistoryCanvasProps) {
  const { t, i18n } = useTranslation();
  const localHistory = useScratchpadStore((s) => s.localHistory);
  const removeHistoryKeys = useScratchpadStore((s) => s.removeHistoryKeys);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const actions = useScratchpadActions();

  const currentKey = currentTrack ? playerTrackKey(currentTrack) : null;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    return localHistory.filter((entry) => {
      if (providerFilter !== "all" && entry.track.ref.provider !== providerFilter) return false;
      if (!normalizedQuery) return true;
      const title = entry.track.title.toLowerCase();
      const artists = formatTrackArtists(entry.track).toLowerCase();
      const album = entry.track.album?.title.toLowerCase() ?? "";
      return (
        title.includes(normalizedQuery) ||
        artists.includes(normalizedQuery) ||
        album.includes(normalizedQuery)
      );
    });
  }, [localHistory, normalizedQuery, providerFilter]);

  const days = useMemo(() => groupPlaysByDay(filtered), [filtered]);

  const formats = useMemo(
    () => ({
      time: new Intl.DateTimeFormat(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }),
      day: new Intl.DateTimeFormat(i18n.language, {
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
    }),
    [i18n.language],
  );

  const dayLabel = useCallback(
    (day: HistoryDayGroup) =>
      day.kind === "today"
        ? t("scratchpad.today")
        : day.kind === "yesterday"
          ? t("scratchpad.yesterday")
          : formats.day.format(day.start),
    [formats.day, t],
  );

  const groups = useMemo<CanvasGroup[]>(() => {
    return days.map((day) => {
      const label = dayLabel(day);
      const dayTracks = day.entries.map((item) => item.track);
      return {
        key: String(day.start),
        label,
        sublabel: day.kind !== "earlier" ? formats.day.format(day.start) : undefined,
        jumpLabel: label,
        entries: day.entries.map((item) => ({
          key: item.key,
          track: item.track,
          badge: formats.time.format(item.playedAt),
          meta: `${formatTrackArtists(item.track)} · ${providerLabel(item.track.ref.provider, t)}`,
          isCurrent: currentKey === item.key,
        })),
        buttons: [
          {
            id: "enqueue-day",
            label: t("scratchpad.enqueueGroup"),
            icon: ListPlus,
            run: () => actions.enqueueTracks(dayTracks),
          },
        ],
      };
    });
  }, [actions, currentKey, dayLabel, days, formats.day, formats.time, t]);

  const side = useMemo<CanvasSideConfig>(
    () => ({
      jumpLabel: t("scratchpad.jumpTo"),
      tipsLabel: t("scratchpad.tipsTitle"),
      tips: scratchpadCanvasTips("history", t),
    }),
    [t],
  );

  const handleDelete = useCallback(
    (selected: CanvasEntry[]) => {
      const keys = selected.map((item) => item.key);
      removeHistoryKeys(keys);
      toast.success(t("scratchpad.toastHistoryDeleted", { count: keys.length }));
    },
    [removeHistoryKeys, t],
  );

  const selectionActions = useCallback(
    (selected: CanvasEntry[]): CanvasAction[] => {
      const tracks = selected.map((item) => item.track);
      return [
        {
          id: "enqueue",
          label: t("scratchpad.enqueue"),
          icon: ListPlus,
          run: () => actions.enqueueTracks(tracks),
        },
        {
          id: "collect",
          label: t("scratchpad.collect"),
          icon: NotebookPen,
          run: () => collectTracksToScratchpad(tracks, { label: t("scratchpad.originHistory") }),
        },
        {
          id: "save-to-playlist",
          label: t("scratchpad.saveToPlaylist"),
          icon: FolderPlus,
          run: () => actions.openSaveToPlaylist(tracks, "history"),
        },
        {
          id: "delete-history",
          label: t("scratchpad.deleteFromHistory"),
          icon: Trash2,
          destructive: true,
          run: () => handleDelete(selected),
        },
      ];
    },
    [actions, handleDelete, t],
  );

  if (localHistory.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-content/6 text-content-muted">
          <History className="size-8" />
        </span>
        <h3 className="text-base font-semibold text-content">{t("scratchpad.historyEmpty")}</h3>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-content-muted">
        {t("scratchpad.noSearchResults")}
      </div>
    );
  }

  return (
    <ScratchpadCanvas
      groups={groups}
      ariaLabel={t("scratchpad.tabHistory")}
      playLabel={t("scratchpad.play")}
      onPlay={(entry) => actions.playNow(entry.track)}
      onDelete={handleDelete}
      selectionActions={selectionActions}
      onEscape={onEscape}
      spacing={spacingForDensity(density)}
      focusKey={currentKey ?? undefined}
      variant="history"
      side={side}
      currentLabel={t("scratchpad.nowPlaying")}
    />
  );
}
