"use client";

import { FolderPlus, ListPlus, NotebookPen, Play, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScratchpadCanvas } from "@/components/scratchpad/ScratchpadCanvas";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { spacingForDensity } from "@/lib/scratchpad/canvasLayout";
import {
  filterScratchpadEntries,
  groupScratchpadEntries,
  providerLabel,
  scratchpadCanvasTips,
} from "@/lib/scratchpad/scratchpadModel";
import { usePlayerStore } from "@/store/module/player";
import { useScratchpadStore } from "@/store/module/scratchpad";
import type { MusicProvider } from "@scopify/music-domain/identity";
import type {
  CanvasAction,
  CanvasEntry,
  CanvasGroup,
  CanvasSideConfig,
} from "@/types/scratchpad/canvas";
import type { ScratchpadFilterProps } from "@/types/scratchpad/components";

interface ScratchpadNotesCanvasProps extends ScratchpadFilterProps {
  onEscape: () => void;
}

/**
 * 速记簿画布页：按音源展示卡片网格，支持搜索/筛选、框选批量操作与组内拖拽重排。
 */
export function ScratchpadNotesCanvas({
  searchQuery,
  providerFilter,
  density,
  onEscape,
}: ScratchpadNotesCanvasProps) {
  const { t } = useTranslation();
  const entries = useScratchpadStore((s) => s.entries);
  const lastAddedKeys = useScratchpadStore((s) => s.lastAddedKeys);
  const addNonce = useScratchpadStore((s) => s.addNonce);
  const removeKeys = useScratchpadStore((s) => s.removeKeys);
  const moveGroupEntries = useScratchpadStore((s) => s.moveGroupEntries);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const actions = useScratchpadActions();

  const [freshKeys, setFreshKeys] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    if (addNonce === 0 || lastAddedKeys.length === 0) return;
    setFreshKeys(new Set(lastAddedKeys));
    const timer = window.setTimeout(() => setFreshKeys(new Set()), 1600);
    return () => window.clearTimeout(timer);
  }, [addNonce, lastAddedKeys]);

  const currentKey = currentTrack ? playerTrackKey(currentTrack) : null;
  const canReorder = !searchQuery.trim();

  const filtered = useMemo(
    () => filterScratchpadEntries(entries, searchQuery, providerFilter),
    [entries, providerFilter, searchQuery],
  );

  const groups = useMemo<CanvasGroup[]>(() => {
    return groupScratchpadEntries(filtered).map((group) => {
      const label = providerLabel(group.provider, t);
      const groupTracks = group.entries.map((entry) => entry.track);
      return {
        key: group.key,
        label,
        entries: group.entries.map((entry) => ({
          key: entry.key,
          track: entry.track,
          meta: entry.origin?.label
            ? `${formatTrackArtists(entry.track)} · ${entry.origin.label}`
            : formatTrackArtists(entry.track),
          isCurrent: currentKey === entry.key,
        })),
        buttons: [
          {
            id: "enqueue-group",
            label: t("scratchpad.enqueueGroup"),
            icon: ListPlus,
            run: () => actions.enqueueTracks(groupTracks),
          },
          {
            id: "save-group",
            label: t("scratchpad.saveToPlaylist"),
            icon: FolderPlus,
            run: () => actions.openSaveToPlaylist(groupTracks, "scratchpad"),
          },
        ],
      };
    });
  }, [actions, currentKey, filtered, t]);

  const side = useMemo<CanvasSideConfig>(
    () => ({
      jumpLabel: t("scratchpad.jumpTo"),
      tipsLabel: t("scratchpad.tipsTitle"),
      tips: scratchpadCanvasTips("notes", t, canReorder),
    }),
    [canReorder, t],
  );

  const selectionActions = useCallback(
    (selected: CanvasEntry[]): CanvasAction[] => {
      const tracks = selected.map((item) => item.track);
      return [
        {
          id: "play-selected",
          label: t("scratchpad.replaceQueueSelected"),
          icon: Play,
          run: () => actions.replaceQueueAndPlay(tracks),
        },
        {
          id: "enqueue",
          label: t("scratchpad.enqueue"),
          icon: ListPlus,
          run: () => actions.enqueueTracks(tracks),
        },
        {
          id: "save-to-playlist",
          label: t("scratchpad.saveToPlaylist"),
          icon: FolderPlus,
          run: () => actions.openSaveToPlaylist(tracks, "scratchpad"),
        },
        {
          id: "remove",
          label: t("scratchpad.remove"),
          icon: Trash2,
          destructive: true,
          run: () => removeKeys(selected.map((item) => item.key)),
        },
      ];
    },
    [actions, removeKeys, t],
  );

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-content/6 text-content-muted">
          <NotebookPen className="size-8" />
        </span>
        <h3 className="text-base font-semibold text-content">{t("scratchpad.emptyTitle")}</h3>
        <p className="max-w-md text-sm text-content-muted">{t("scratchpad.emptyDescription")}</p>
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
      freshKeys={freshKeys}
      ariaLabel={t("scratchpad.title")}
      playLabel={t("scratchpad.play")}
      onPlay={(entry) => actions.playNow(entry.track)}
      onMove={
        canReorder
          ? (groupKey, keys, targetIndex) =>
              moveGroupEntries(groupKey as MusicProvider, keys, targetIndex)
          : undefined
      }
      onDelete={(selected) => removeKeys(selected.map((item) => item.key))}
      selectionActions={selectionActions}
      onEscape={onEscape}
      spacing={spacingForDensity(density)}
      focusKey={currentKey ?? undefined}
      variant="note"
      side={side}
      currentLabel={t("scratchpad.nowPlaying")}
    />
  );
}
