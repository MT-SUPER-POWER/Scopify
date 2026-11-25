"use client";

import { ChevronRight, FolderPlus, ListPlus, NotebookPen, Shuffle, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  rowSpacing,
  overviewRowTops,
  overviewBottomInset,
} from "@/lib/scratchpad/foliaCanvasLayout";
import { SCRATCHPAD_TABS } from "@/lib/scratchpad/scratchpadLook";
import { clientToLocal } from "@/lib/scratchpad/scratchpadTilt";
import { ScratchpadCard } from "@/components/scratchpad/ScratchpadCard";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { rectFromPoints, rectsIntersect } from "@/lib/scratchpad/canvasLayout";
import { groupScratchpadEntries, providerLabel } from "@/lib/scratchpad/scratchpadModel";
import { formatMomentAt, getRecentMomentRecords } from "@/lib/scratchpad/songNotesModel";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/module/player";
import { collectTracksToScratchpad, useScratchpadStore } from "@/store/module/scratchpad";
import type { PlayerTrack } from "@/types/player/model";
import type { CanvasEntry, CanvasPoint, CanvasRect, CardMotion } from "@/types/scratchpad/canvas";
import type {
  OverviewEntry,
  ScratchpadSection,
  ScratchpadOverviewViewProps,
} from "@/types/scratchpad/components";

const noopRegister = (_key: string, _motion: CardMotion | null) => undefined;

const MAX_CARDS_PER_ROW = 10;

/**
 * 速记簿工作区总览页：横向陈列速记簿、播放队列与播放历史三大板块，
 * 支持单选、Ctrl/Cmd 多选、跨行拉框选择、一键批量入队/存歌单/移出与快速展开对应全屏画布。
 */
export function ScratchpadOverviewView({
  sheetWidth,
  viewHeight,
  tilt,
  onOpenTab,
  onCloseWorkspace,
}: ScratchpadOverviewViewProps) {
  const { t, i18n } = useTranslation();
  const entries = useScratchpadStore((s) => s.entries);
  const localHistory = useScratchpadStore((s) => s.localHistory);
  const momentsByKey = useScratchpadStore((s) => s.momentsByKey);
  const tags = useScratchpadStore((s) => s.tags);
  const removeKeys = useScratchpadStore((s) => s.removeKeys);
  const removeHistoryKeys = useScratchpadStore((s) => s.removeHistoryKeys);

  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playlistId = usePlayerStore((s) => s.playlistId);
  const reshuffleQueue = usePlayerStore((s) => s.reshuffleQueue);
  const isFm = isPersonalFmPlaybackSource(playlistId);
  const actions = useScratchpadActions();

  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef(new Map<ScratchpadSection, HTMLDivElement>());
  const dragRef = useRef<{
    pointerId: number;
    start: CanvasPoint;
    base: ReadonlySet<string>;
    moved: boolean;
  } | null>(null);

  const tops = overviewRowTops(viewHeight, overviewBottomInset(sheetWidth, tilt));
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [boxing, setBoxing] = useState(false);

  const currentKey = currentTrack ? playerTrackKey(currentTrack) : null;

  const sections = useMemo(() => {
    const fit = (tab: ScratchpadSection) => {
      const { card, x } = rowSpacing[tab];
      return Math.max(
        1,
        Math.min(MAX_CARDS_PER_ROW, Math.floor((sheetWidth - 550) / (card.width + x))),
      );
    };
    const flatNotes = groupScratchpadEntries(entries).flatMap((group) => group.entries);
    const notesItems: OverviewEntry[] = flatNotes.slice(0, fit("notes")).map((entry) => ({
      key: `notes|${entry.key}`,
      row: "notes",
      sourceKey: entry.key,
      track: entry.track,
      badge: providerLabel(entry.track.ref.provider, t),
      meta: entry.origin?.label
        ? `${formatTrackArtists(entry.track)} · ${entry.origin.label}`
        : formatTrackArtists(entry.track),
      isCurrent: currentKey === entry.key,
    }));

    const queueStart = Math.max(0, queueIndex);
    const queueSlice = queue.slice(queueStart, queueStart + fit("queue"));
    const queueItems: OverviewEntry[] = queueSlice.map((track, offset) => {
      const idx = queueStart + offset;
      const trackKey = playerTrackKey(track);
      return {
        key: `queue|${trackKey}#${idx}`,
        row: "queue",
        sourceKey: trackKey,
        track,
        position: idx + 1,
        isCurrent: idx === queueIndex,
      };
    });

    const timeFormatter = new Intl.DateTimeFormat(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const historyItems: OverviewEntry[] = localHistory.slice(0, fit("history")).map((item) => ({
      key: `history|${item.key}`,
      row: "history",
      sourceKey: item.key,
      track: item.track,
      badge: timeFormatter.format(item.playedAt),
      isCurrent: currentKey === item.key,
    }));

    const tagMap = new Map(tags.map((tag) => [tag.key, tag.name]));
    const momentCount = Object.keys(momentsByKey).length;
    const momentItems: OverviewEntry[] = getRecentMomentRecords(momentsByKey, fit("moments")).map(
      (record) => {
        const latest = record.comments[0];
        return {
          key: `moments|${record.key}`,
          row: "moments",
          sourceKey: record.key,
          track: record.track,
          tagLine: record.tags
            .slice(0, 2)
            .map((key) => `#${tagMap.get(key) ?? key}`)
            .join(" "),
          quote:
            latest?.text ||
            (latest?.at !== undefined
              ? t("scratchpad.momentMarkOnly", { time: formatMomentAt(latest.at) })
              : undefined),
          counts:
            record.comments.length > 0
              ? t("scratchpad.momentsCommentCount", { count: record.comments.length })
              : t("scratchpad.momentsTagsOnly", { count: record.tags.length }),
          isCurrent: currentKey === record.key,
        };
      },
    );

    return [
      {
        id: "notes" as const,
        total: flatNotes.length,
        more: Math.max(0, flatNotes.length - notesItems.length),
        items: notesItems,
        allTracks: flatNotes.map((entry) => entry.track),
        emptyText: t("scratchpad.overviewNotesEmpty"),
      },
      {
        id: "queue" as const,
        total: queue.length,
        more: Math.max(0, queue.length - queueStart - queueItems.length),
        items: queueItems,
        allTracks: queue,
        emptyText: t("scratchpad.queueEmpty"),
      },
      {
        id: "history" as const,
        total: localHistory.length,
        more: Math.max(0, localHistory.length - historyItems.length),
        items: historyItems,
        allTracks: localHistory.map((item) => item.track),
        emptyText: t("scratchpad.historyEmpty"),
      },
      {
        id: "moments" as const,
        total: momentCount,
        more: momentCount - momentItems.length,
        items: momentItems,
        emptyText: t("scratchpad.momentsEmptyDesc"),
      },
    ];
  }, [
    sheetWidth,
    currentKey,
    entries,
    i18n.language,
    localHistory,
    momentsByKey,
    queue,
    queueIndex,
    t,
    tags,
  ]);

  const allItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);

  useEffect(() => {
    const valid = new Set(allItems.map((item) => item.key));
    setSelected((current) => {
      const next = new Set([...current].filter((key) => valid.has(key)));
      return next.size === current.size ? current : next;
    });
  }, [allItems]);

  const selectedEntries = useMemo(
    () => allItems.filter((item) => selected.has(item.key)),
    [allItems, selected],
  );

  const handleCardPointerDown = useCallback(
    (entry: CanvasEntry, event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      rootRef.current?.focus({ preventScroll: true });
      const toggle = event.ctrlKey || event.metaKey || event.shiftKey;
      setSelected((current) => {
        if (!toggle) return new Set([entry.key]);
        const next = new Set(current);
        if (next.has(entry.key)) next.delete(entry.key);
        else next.add(entry.key);
        return next;
      });
    },
    [],
  );

  const handlePlay = useCallback(
    (entry: CanvasEntry) => {
      const item = entry as OverviewEntry;
      if (item.row === "queue") {
        actions.playQueueTrack(item.track);
      } else {
        actions.playNow(item.track);
      }
    },
    [actions],
  );

  const clientToContainer = (clientX: number, clientY: number): CanvasPoint => {
    return clientToLocal(containerRef.current!, { x: clientX, y: clientY }, tilt);
  };
  const cardBoxInContainer = (rowId: ScratchpadSection, index: number): CanvasRect | null => {
    const strip = stripRefs.current.get(rowId);
    if (!strip) return null;
    const { card, x } = rowSpacing[rowId];
    const left = strip.offsetLeft + index * (card.width + x);
    const top = strip.parentElement!.offsetTop;
    return { left, top, right: left + card.width, bottom: top + card.height };
  };

  const applyMarquee = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    const drag = dragRef.current;
    if (!container || !drag) return;
    const point = clientToContainer(clientX, clientY);
    if (!drag.moved && Math.hypot(point.x - drag.start.x, point.y - drag.start.y) < 4) return;
    if (!drag.moved) setBoxing(true);
    drag.moved = true;
    const area = rectFromPoints(drag.start, point);
    const box = marqueeRef.current;
    if (box) {
      box.hidden = false;
      box.style.transform = `translate(${area.left}px, ${area.top}px)`;
      box.style.width = `${area.right - area.left}px`;
      box.style.height = `${area.bottom - area.top}px`;
    }
    const next = new Set(drag.base);
    for (const section of sections) {
      section.items.forEach((item, index) => {
        const rect = cardBoxInContainer(section.id, index);
        if (rect && rectsIntersect(area, rect)) next.add(item.key);
      });
    }
    setSelected((current) =>
      current.size === next.size && [...next].every((key) => current.has(key)) ? current : next,
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.pointerType === "touch" || !containerRef.current) return;
    if ((event.target as HTMLElement).closest("button, [data-scratchpad-key], [role='toolbar']")) {
      return;
    }
    rootRef.current?.focus({ preventScroll: true });
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    dragRef.current = {
      pointerId: event.pointerId,
      start: clientToContainer(event.clientX, event.clientY),
      base: additive ? selected : new Set(),
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    applyMarquee(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setBoxing(false);
    if (marqueeRef.current) marqueeRef.current.hidden = true;
    if (!drag.moved && drag.base.size === 0) setSelected(new Set());
  };

  const removeSelected = () => {
    const noteKeys = selectedEntries
      .filter((entry) => entry.row === "notes")
      .map((entry) => entry.sourceKey);
    const historyKeys = selectedEntries
      .filter((entry) => entry.row === "history")
      .map((entry) => entry.sourceKey);
    if (noteKeys.length > 0) removeKeys(noteKeys);
    if (historyKeys.length > 0) {
      removeHistoryKeys(historyKeys);
      toast.success(t("scratchpad.toastHistoryDeleted", { count: historyKeys.length }));
    }
    setSelected(new Set());
  };

  const collectSelected = () => {
    const historyTracks: PlayerTrack[] = [];
    const queueTracks: PlayerTrack[] = [];
    const momentTracks: PlayerTrack[] = [];
    for (const entry of selectedEntries) {
      if (entry.row === "history") historyTracks.push(entry.track);
      else if (entry.row === "queue") queueTracks.push(entry.track);
      else if (entry.row === "moments") momentTracks.push(entry.track);
    }
    if (historyTracks.length > 0) {
      collectTracksToScratchpad(historyTracks, { label: t("scratchpad.originHistory") });
    }
    if (queueTracks.length > 0) {
      collectTracksToScratchpad(queueTracks, { label: t("scratchpad.originQueue") });
    }
    if (momentTracks.length > 0) {
      collectTracksToScratchpad(momentTracks, { label: t("scratchpad.tabMoments") });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (selected.size > 0) setSelected(new Set());
      else onCloseWorkspace();
      return;
    }
    if ((event.key === "Delete" || event.key === "Backspace") && selected.size > 0) {
      event.preventDefault();
      event.stopPropagation();
      if (!selectedEntries.some((entry) => entry.row === "queue" || entry.row === "moments")) {
        removeSelected();
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      event.stopPropagation();
      setSelected(new Set(allItems.map((item) => item.key)));
    }
  };

  const selectedTracks = selectedEntries.map((entry) => entry.track);
  const onlyFromNotes =
    selectedEntries.length > 0 && selectedEntries.every((entry) => entry.row === "notes");
  const cannotRemove = selectedEntries.some(
    (entry) => entry.row === "queue" || entry.row === "moments",
  );
  const collectableCount = selectedEntries.filter((entry) => entry.row !== "notes").length;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn("scratchpad-overview", boxing && "select-none")}
    >
      <div ref={containerRef} className="absolute inset-0">
        {sections.map((section) => {
          const { card, x } = rowSpacing[section.id];
          const stepWidth = card.width + x;
          return (
            <section
              key={section.id}
              className="scratchpad-overview-row"
              data-page={section.id}
              style={{
                top: 130 + tops[SCRATCHPAD_TABS.indexOf(section.id)] + 84,
                height: card.height,
              }}
            >
              {section.items.length === 0 ? (
                <div className="scratchpad-overview-cards scratchpad-hint">{section.emptyText}</div>
              ) : (
                <div
                  ref={(element) => {
                    if (element) stripRefs.current.set(section.id, element);
                    else stripRefs.current.delete(section.id);
                  }}
                  className="scratchpad-overview-cards"
                  style={{ height: card.height }}
                >
                  {section.items.map((item, index) => (
                    <ScratchpadCard
                      key={item.key}
                      entry={item}
                      slotX={index * stepWidth}
                      slotY={0}
                      isMoving={false}
                      isSelected={selected.has(item.key)}
                      isFresh={false}
                      width={card.width}
                      height={card.height}
                      variant={
                        section.id === "notes"
                          ? "note"
                          : section.id === "moments"
                            ? "moment"
                            : section.id
                      }
                      currentLabel={t("scratchpad.nowPlaying")}
                      playLabel={t(
                        section.id === "queue" ? "scratchpad.playFromQueue" : "scratchpad.play",
                      )}
                      register={noopRegister}
                      onPointerDown={handleCardPointerDown}
                      onPlay={handlePlay}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => onOpenTab(section.id)}
                    style={{
                      left: section.items.length * stepWidth,
                      width: card.width,
                      height: card.height,
                    }}
                    className="scratchpad-overview-more"
                  >
                    <span className="scratchpad-overview-more-count">
                      {section.more > 0 ? `+${section.more}` : t("scratchpad.allCount")}
                    </span>
                    <span className="scratchpad-slim-open">
                      <span>{t("scratchpad.expandPage")}</span>
                      <ChevronRight className="size-3.5" />
                    </span>
                  </button>
                </div>
              )}
              <div className="scratchpad-overview-row-tools">
                {section.id === "notes" && section.total > 0 && (
                  <button
                    type="button"
                    onClick={() => actions.enqueueTracks(section.allTracks)}
                    className="scratchpad-pill is-small"
                  >
                    <ListPlus className="size-3.5" />
                    <span>{t("scratchpad.enqueueAll")}</span>
                  </button>
                )}
                {section.id === "queue" && section.total > 1 && !isFm && (
                  <button
                    type="button"
                    onClick={() => reshuffleQueue()}
                    className="scratchpad-pill is-small"
                  >
                    <Shuffle className="size-3.5" />
                    <span>{t("scratchpad.shuffleQueue")}</span>
                  </button>
                )}
              </div>
            </section>
          );
        })}

        <div
          ref={marqueeRef}
          hidden
          className="pointer-events-none absolute top-0 left-0 z-20 rounded-lg border border-brand/70 bg-brand/12"
        />

        {selectedEntries.length > 0 && !boxing && (
          <div
            role="toolbar"
            aria-label={t("scratchpad.selectedCount", { count: selectedEntries.length })}
            onPointerDown={(event) => event.stopPropagation()}
            className="absolute top-[45%] left-[25%] z-30 mx-auto flex w-fit max-w-full flex-wrap items-center gap-1.5 rounded-full border border-border/80 bg-surface-elevated/95 px-3.5 py-2 shadow-2xl backdrop-blur-xl"
          >
            <span className="px-1.5 text-xs font-semibold text-content tabular-nums">
              {t("scratchpad.selectedCount", { count: selectedEntries.length })}
            </span>
            <span className="h-4 w-px bg-border/80" />
            <button
              type="button"
              onClick={() => actions.enqueueTracks(selectedTracks)}
              className="inline-flex items-center gap-1.5 rounded-full bg-content/8 px-3 py-1 text-xs font-medium text-content transition-colors hover:bg-content/15"
            >
              <ListPlus className="size-3.5" />
              <span>{t("scratchpad.enqueue")}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                actions.openSaveToPlaylist(selectedTracks, onlyFromNotes ? "scratchpad" : undefined)
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-content/8 px-3 py-1 text-xs font-medium text-content transition-colors hover:bg-content/15"
            >
              <FolderPlus className="size-3.5" />
              <span>{t("scratchpad.saveToPlaylist")}</span>
            </button>
            {collectableCount > 0 && (
              <button
                type="button"
                onClick={collectSelected}
                className="inline-flex items-center gap-1.5 rounded-full bg-content/8 px-3 py-1 text-xs font-medium text-content transition-colors hover:bg-content/15"
              >
                <NotebookPen className="size-3.5" />
                <span>{t("scratchpad.collect")}</span>
              </button>
            )}
            <button
              type="button"
              disabled={cannotRemove}
              title={cannotRemove ? t("scratchpad.overviewRemoveQueueHint") : undefined}
              onClick={removeSelected}
              className="inline-flex items-center gap-1.5 rounded-full bg-destructive/12 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-40"
            >
              <Trash2 className="size-3.5" />
              <span>{t("scratchpad.remove")}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              title={t("scratchpad.clearSelection")}
              aria-label={t("scratchpad.clearSelection")}
              className="rounded-full p-1.5 text-content-muted transition-colors hover:bg-content/12 hover:text-content"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
