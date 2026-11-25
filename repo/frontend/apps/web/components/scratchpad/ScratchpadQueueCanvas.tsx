"use client";

import { FolderPlus, ListEnd, ListMusic, ListStart, NotebookPen, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ScratchpadCanvas } from "@/components/scratchpad/ScratchpadCanvas";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { spacingForDensity } from "@/lib/scratchpad/canvasLayout";
import { applyScratchpadQueueBatch, moveBlockToIndex } from "@/lib/scratchpad/queueBatch";
import { providerLabel, scratchpadCanvasTips } from "@/lib/scratchpad/scratchpadModel";
import { usePlayerStore } from "@/store/module/player";
import { collectTracksToScratchpad } from "@/store/module/scratchpad";
import type {
  CanvasAction,
  CanvasEntry,
  CanvasGroup,
  CanvasSideConfig,
} from "@/types/scratchpad/canvas";
import type { ScratchpadFilterProps } from "@/types/scratchpad/components";
import type { ScratchpadQueueBatchAction } from "@/types/scratchpad/model";

interface ScratchpadQueueCanvasProps extends ScratchpadFilterProps {
  onEscape: () => void;
}

const QUEUE_GROUP_KEY = "queue";

/**
 * 播放队列卡片画布：完整呈现队列顺序、高亮当前播放、已播曲目柔化展示，
 * 支持单张/多张拖拽调整顺序（通过 replaceQueueOrder 原子写回），以及下一首播放、移到末尾、批量收藏与移出。
 */
export function ScratchpadQueueCanvas({
  searchQuery,
  providerFilter,
  density,
  onEscape,
}: ScratchpadQueueCanvasProps) {
  const { t } = useTranslation();
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playlistId = usePlayerStore((s) => s.playlistId);
  const replaceQueueOrder = usePlayerStore((s) => s.replaceQueueOrder);
  const readOnly = isPersonalFmPlaybackSource(playlistId);
  const actions = useScratchpadActions();

  const allRows = useMemo<CanvasEntry[]>(() => {
    const seen = new Map<string, number>();
    return queue.map((track, index) => {
      const baseKey = playerTrackKey(track);
      const count = seen.get(baseKey) ?? 0;
      seen.set(baseKey, count + 1);
      return {
        key: `${baseKey}#${count}`,
        track,
        meta: `${formatTrackArtists(track)} · ${providerLabel(track.ref.provider, t)}`,
        isCurrent: index === queueIndex,
        isDimmed: queueIndex >= 0 && index < queueIndex,
        position: index + 1,
      };
    });
  }, [queue, queueIndex, t]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isFiltered = Boolean(normalizedQuery || providerFilter !== "all");
  const canReorder = !readOnly && !isFiltered;

  const visibleRows = useMemo(() => {
    if (!isFiltered) return allRows;
    return allRows.filter((row) => {
      if (providerFilter !== "all" && row.track.ref.provider !== providerFilter) return false;
      if (!normalizedQuery) return true;
      const title = row.track.title.toLowerCase();
      const artists = formatTrackArtists(row.track).toLowerCase();
      const album = row.track.album?.title.toLowerCase() ?? "";
      return (
        title.includes(normalizedQuery) ||
        artists.includes(normalizedQuery) ||
        album.includes(normalizedQuery)
      );
    });
  }, [allRows, isFiltered, normalizedQuery, providerFilter]);

  const latest = useRef({ allRows, queue, currentTrack, readOnly, replaceQueueOrder });
  latest.current = { allRows, queue, currentTrack, readOnly, replaceQueueOrder };

  const runBatch = useCallback(
    (action: ScratchpadQueueBatchAction, targets: CanvasEntry[]) => {
      const {
        allRows: rows,
        queue: currentQueue,
        currentTrack: current,
        replaceQueueOrder: commit,
      } = latest.current;
      const indexOf = new Map(rows.map((row, index) => [row.key, index]));
      const targetIndices = targets
        .map((item) => indexOf.get(item.key) ?? -1)
        .filter((index) => index >= 0);

      const result = applyScratchpadQueueBatch({
        queue: currentQueue,
        targetIndices,
        currentTrack: current,
        action,
      });
      if (result.affectedCount === 0) return;
      if (result.changed) commit(result.nextQueue);

      const message =
        action === "remove"
          ? t("scratchpad.toastQueueBatchRemoved", { count: result.affectedCount })
          : action === "next"
            ? t("scratchpad.toastQueueBatchNext", { count: result.affectedCount })
            : t("scratchpad.toastQueueBatchEnd", { count: result.affectedCount });
      toast.success(message);
    },
    [t],
  );

  const handleReorder = useCallback((_groupKey: string, keys: string[], targetIndex: number) => {
    const { allRows: rows, queue: currentQueue, replaceQueueOrder: commit } = latest.current;
    const indexOf = new Map(rows.map((row, index) => [row.key, index]));
    const next = moveBlockToIndex(
      currentQueue,
      keys.map((key) => indexOf.get(key) ?? -1),
      targetIndex,
    );
    commit(next);
  }, []);

  const groups = useMemo<CanvasGroup[]>(
    () => [
      {
        key: QUEUE_GROUP_KEY,
        label: t("scratchpad.tabQueue"),
        sublabel: readOnly ? t("scratchpad.queueReadOnlyHint") : undefined,
        entries: visibleRows,
      },
    ],
    [readOnly, t, visibleRows],
  );

  const side = useMemo<CanvasSideConfig>(
    () => ({
      jumpLabel: t("scratchpad.jumpTo"),
      tipsLabel: t("scratchpad.tipsTitle"),
      chunk: 50,
      locateLabel: t("scratchpad.locateCurrent"),
      tips: scratchpadCanvasTips("queue", t, canReorder),
    }),
    [canReorder, t],
  );

  const selectionActions = useCallback(
    (selected: CanvasEntry[]): CanvasAction[] => {
      const tracks = selected.map((item) => item.track);
      const list: CanvasAction[] = [];
      if (!latest.current.readOnly) {
        list.push(
          {
            id: "play-next",
            label: t("scratchpad.playNext"),
            icon: ListStart,
            run: () => runBatch("next", selected),
          },
          {
            id: "move-to-end",
            label: t("scratchpad.moveToEnd"),
            icon: ListEnd,
            run: () => runBatch("end", selected),
          },
        );
      }
      list.push(
        {
          id: "collect",
          label: t("scratchpad.collect"),
          icon: NotebookPen,
          run: () => collectTracksToScratchpad(tracks, { label: t("scratchpad.originQueue") }),
        },
        {
          id: "save-to-playlist",
          label: t("scratchpad.saveToPlaylist"),
          icon: FolderPlus,
          run: () => actions.openSaveToPlaylist(tracks, "queue"),
        },
      );
      if (!latest.current.readOnly) {
        list.push({
          id: "remove-from-queue",
          label: t("scratchpad.removeFromQueue"),
          icon: Trash2,
          destructive: true,
          run: () => runBatch("remove", selected),
        });
      }
      return list;
    },
    [actions, runBatch, t],
  );

  if (queue.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-content/6 text-content-muted">
          <ListMusic className="size-8" />
        </span>
        <h3 className="text-base font-semibold text-content">{t("scratchpad.queueEmpty")}</h3>
      </div>
    );
  }

  if (visibleRows.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-content-muted">
        {t("scratchpad.noSearchResults")}
      </div>
    );
  }

  const focusKey = queueIndex >= 0 && allRows[queueIndex] ? allRows[queueIndex].key : undefined;

  return (
    <ScratchpadCanvas
      groups={groups}
      ariaLabel={t("scratchpad.tabQueue")}
      playLabel={t("scratchpad.playFromQueue")}
      onPlay={(entry) => {
        const idx = (entry.position ?? 1) - 1;
        actions.playQueueTrack(entry.track, idx);
      }}
      onMove={canReorder ? handleReorder : undefined}
      onDelete={readOnly ? undefined : (selected) => runBatch("remove", selected)}
      selectionActions={selectionActions}
      onEscape={onEscape}
      spacing={spacingForDensity(density)}
      focusKey={focusKey}
      variant="queue"
      side={side}
      currentLabel={t("scratchpad.nowPlaying")}
    />
  );
}
