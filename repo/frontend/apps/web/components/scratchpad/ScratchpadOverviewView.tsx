"use client";

import {
  ChevronRight,
  FolderPlus,
  History,
  ListMusic,
  ListPlus,
  NotebookPen,
  Shuffle,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ScratchpadCard } from "@/components/scratchpad/ScratchpadCard";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import {
  OVERVIEW_CARD_SPACING,
  columnsFor,
  rectFromPoints,
  rectsIntersect,
} from "@/lib/scratchpad/canvasLayout";
import { groupScratchpadEntries, providerLabel } from "@/lib/scratchpad/scratchpadModel";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/module/player";
import { collectTracksToScratchpad, useScratchpadStore } from "@/store/module/scratchpad";
import type { PlayerTrack } from "@/types/player/model";
import type { CanvasEntry, CanvasPoint, CanvasRect, CardMotion } from "@/types/scratchpad/canvas";
import type { ScratchpadOverviewViewProps } from "@/types/scratchpad/components";

type OverviewRowId = "notes" | "queue" | "history";

interface OverviewEntry extends CanvasEntry {
  row: OverviewRowId;
  sourceKey: string;
}

const noopRegister = (_key: string, _motion: CardMotion | null) => undefined;

const MAX_CARDS_PER_ROW = 10;

/**
 * 速记簿工作区总览页：横向陈列速记簿、播放队列与播放历史三大板块，
 * 支持单选、Ctrl/Cmd 多选、跨行拉框选择、一键批量入队/存歌单/移出与快速展开对应全屏画布。
 */
export function ScratchpadOverviewView({
  onOpenTab,
  onCloseWorkspace,
}: ScratchpadOverviewViewProps) {
  const { t, i18n } = useTranslation();
  const entries = useScratchpadStore((s) => s.entries);
  const localHistory = useScratchpadStore((s) => s.localHistory);
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
  const stripRefs = useRef(new Map<OverviewRowId, HTMLDivElement>());
  const dragRef = useRef<{
    pointerId: number;
    start: CanvasPoint;
    base: ReadonlySet<string>;
    moved: boolean;
  } | null>(null);

  const [cardsPerRow, setCardsPerRow] = useState(6);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [boxing, setBoxing] = useState(false);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const update = () => {
      if (element.clientWidth === 0) return;
      // Leave room for the tail "View All" tile inside the row strip.
      const available = Math.max(
        OVERVIEW_CARD_SPACING.card.width,
        element.clientWidth - OVERVIEW_CARD_SPACING.card.width - 48,
      );
      setCardsPerRow(Math.min(MAX_CARDS_PER_ROW, columnsFor(available, OVERVIEW_CARD_SPACING)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const currentKey = currentTrack ? playerTrackKey(currentTrack) : null;

  const sections = useMemo(() => {
    const flatNotes = groupScratchpadEntries(entries).flatMap((group) => group.entries);
    const notesItems: OverviewEntry[] = flatNotes.slice(0, cardsPerRow).map((entry) => ({
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
    const queueSlice = queue.slice(queueStart, queueStart + cardsPerRow);
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
    const historyItems: OverviewEntry[] = localHistory.slice(0, cardsPerRow).map((item) => ({
      key: `history|${item.key}`,
      row: "history",
      sourceKey: item.key,
      track: item.track,
      badge: timeFormatter.format(item.playedAt),
      isCurrent: currentKey === item.key,
    }));

    return [
      {
        id: "notes" as const,
        title: t("scratchpad.title"),
        icon: NotebookPen,
        total: flatNotes.length,
        more: Math.max(0, flatNotes.length - notesItems.length),
        items: notesItems,
        allTracks: flatNotes.map((entry) => entry.track),
        emptyText: t("scratchpad.overviewNotesEmpty"),
      },
      {
        id: "queue" as const,
        title: t("scratchpad.tabQueue"),
        icon: ListMusic,
        total: queue.length,
        more: Math.max(0, queue.length - queueStart - queueItems.length),
        items: queueItems,
        allTracks: queue,
        emptyText: t("scratchpad.queueEmpty"),
      },
      {
        id: "history" as const,
        title: t("scratchpad.tabHistory"),
        icon: History,
        total: localHistory.length,
        more: Math.max(0, localHistory.length - historyItems.length),
        items: historyItems,
        allTracks: localHistory.map((item) => item.track),
        emptyText: t("scratchpad.historyEmpty"),
      },
    ];
  }, [cardsPerRow, currentKey, entries, i18n.language, localHistory, queue, queueIndex, t]);

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
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const cardBoxInContainer = (rowId: OverviewRowId, index: number): CanvasRect | null => {
    const container = containerRef.current;
    const strip = stripRefs.current.get(rowId);
    if (!container || !strip) return null;
    const containerRect = container.getBoundingClientRect();
    const stripRect = strip.getBoundingClientRect();
    const step = OVERVIEW_CARD_SPACING.card.width + OVERVIEW_CARD_SPACING.x;
    const left = stripRect.left - containerRect.left + index * step;
    const top = stripRect.top - containerRect.top;
    return {
      left,
      top,
      right: left + OVERVIEW_CARD_SPACING.card.width,
      bottom: top + OVERVIEW_CARD_SPACING.card.height,
    };
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
    for (const entry of selectedEntries) {
      if (entry.row === "history") historyTracks.push(entry.track);
      else if (entry.row === "queue") queueTracks.push(entry.track);
    }
    if (historyTracks.length > 0) {
      collectTracksToScratchpad(historyTracks, { label: t("scratchpad.originHistory") });
    }
    if (queueTracks.length > 0) {
      collectTracksToScratchpad(queueTracks, { label: t("scratchpad.originQueue") });
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
      if (!selectedEntries.some((entry) => entry.row === "queue")) {
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
  const includesQueue = selectedEntries.some((entry) => entry.row === "queue");
  const collectableCount = selectedEntries.filter((entry) => entry.row !== "notes").length;
  const stepWidth = OVERVIEW_CARD_SPACING.card.width + OVERVIEW_CARD_SPACING.x;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        "relative min-h-0 flex-1 overflow-y-auto outline-none",
        boxing && "select-none",
      )}
    >
      <div ref={containerRef} className="relative mx-auto max-w-400 space-y-5 px-6 py-6 pb-24">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              className="rounded-2xl border border-border/70 bg-surface-raised/75 p-5 shadow-xs"
            >
              <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-content/8 text-content">
                    <Icon className="size-4" />
                  </span>
                  <h2 className="text-base font-bold text-content">{section.title}</h2>
                  <span className="rounded-full bg-content/8 px-2 py-0.5 text-xs font-medium text-content-muted tabular-nums">
                    {section.total}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {section.id === "notes" && section.total > 0 && (
                    <button
                      type="button"
                      onClick={() => actions.enqueueTracks(section.allTracks)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-content/8 px-3 py-1 text-xs font-medium text-content transition-colors hover:bg-content/14"
                    >
                      <ListPlus className="size-3.5" />
                      <span>{t("scratchpad.enqueueAll")}</span>
                    </button>
                  )}
                  {section.id === "queue" && section.total > 1 && !isFm && (
                    <button
                      type="button"
                      onClick={() => reshuffleQueue()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-content/8 px-3 py-1 text-xs font-medium text-content transition-colors hover:bg-content/14"
                    >
                      <Shuffle className="size-3.5" />
                      <span>{t("scratchpad.shuffleQueue")}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenTab(section.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-content px-3 py-1 text-xs font-semibold text-surface transition-opacity hover:opacity-90"
                  >
                    <span>{t("scratchpad.expandPage")}</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </header>

              {section.items.length === 0 ? (
                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border/70 bg-surface-sunken/35 px-4 text-sm text-content-muted">
                  {section.emptyText}
                </div>
              ) : (
                <div
                  ref={(element) => {
                    if (element) stripRefs.current.set(section.id, element);
                    else stripRefs.current.delete(section.id);
                  }}
                  className="relative overflow-hidden"
                  style={{ height: OVERVIEW_CARD_SPACING.card.height }}
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
                      width={OVERVIEW_CARD_SPACING.card.width}
                      height={OVERVIEW_CARD_SPACING.card.height}
                      variant={section.id === "notes" ? "note" : section.id}
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
                      width: OVERVIEW_CARD_SPACING.card.width,
                      height: OVERVIEW_CARD_SPACING.card.height,
                    }}
                    className="absolute top-0 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-surface-sunken/40 p-3 text-center transition-colors hover:border-brand/50 hover:bg-content/5"
                  >
                    <span className="text-lg font-bold text-content tabular-nums">
                      {section.more > 0 ? `+${section.more}` : t("scratchpad.allCount")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-content-muted">
                      <span>{t("scratchpad.expandPage")}</span>
                      <ChevronRight className="size-3.5" />
                    </span>
                  </button>
                </div>
              )}
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
            className="sticky bottom-5 z-30 mx-auto flex w-fit max-w-full flex-wrap items-center gap-1.5 rounded-full border border-border/80 bg-surface-elevated/95 px-3.5 py-2 shadow-2xl backdrop-blur-xl"
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
              disabled={includesQueue}
              title={includesQueue ? t("scratchpad.overviewRemoveQueueHint") : undefined}
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
