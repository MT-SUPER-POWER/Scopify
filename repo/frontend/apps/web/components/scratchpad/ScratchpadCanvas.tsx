"use client";

import { clientToLocal } from "@/lib/scratchpad/scratchpadTilt";
import { SquareCheck, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { ScratchpadCanvasSide } from "@/components/scratchpad/ScratchpadCanvasSide";
import { ScratchpadCard } from "@/components/scratchpad/ScratchpadCard";
import {
  cardRect,
  columnsFor,
  dropIndexAt,
  gridHeight,
  previewSlots,
  rectFromPoints,
  rectsIntersect,
  slotPosition,
} from "@/lib/scratchpad/canvasLayout";
import { cn } from "@/lib/utils";
import type {
  CanvasEntry,
  CanvasGroup,
  CanvasJumpTarget,
  CanvasPoint,
  CanvasRect,
  CardMotion,
} from "@/types/scratchpad/canvas";
import type { ScratchpadCanvasProps } from "@/types/scratchpad/components";

const DRAG_THRESHOLD = 4;
const LONG_PRESS_MS = 400;
const TOUCH_SLOP = 10;
const STACK_OFFSET = 6;
const STACK_VISIBLE = 5;
const WINDOW_OVERSCAN = 800;
const WINDOW_STEP = 400;
const CONTENT_PADDING_X = 24;

interface PressState {
  entry: CanvasEntry;
  groupKey: string;
  pointerId: number;
  start: CanvasPoint;
  grab: CanvasPoint;
  modifiers: { shift: boolean; toggle: boolean };
  dragging: boolean;
  isTouch: boolean;
  longPress?: number;
}

interface DragState {
  groupKey: string;
  moving: ReadonlySet<string>;
  stack: readonly string[];
  dropIndex: number;
}

interface MarqueeState {
  pointerId: number;
  start: CanvasPoint;
  base: ReadonlySet<string>;
  moved: boolean;
  grids: { origin: CanvasPoint; keys: string[] }[];
  pending: { clientX: number; clientY: number } | null;
  frame: number;
}

interface BandRange {
  top: number;
  bottom: number;
}

const NO_KEYS: ReadonlySet<string> = new Set();

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  return a.size === b.size && [...a].every((key) => b.has(key));
}

function bandOf(scrollTop: number, height: number): BandRange {
  return {
    top: Math.floor((scrollTop - WINDOW_OVERSCAN) / WINDOW_STEP) * WINDOW_STEP,
    bottom: Math.ceil((scrollTop + height + WINDOW_OVERSCAN) / WINDOW_STEP) * WINDOW_STEP,
  };
}

function clientToElementLocal(element: HTMLElement, clientX: number, clientY: number): CanvasPoint {
  const sheet = element.closest(".scratchpad-f-sheet");
  const matrix = sheet && getComputedStyle(sheet).transform;
  const transform = matrix && matrix !== "none" ? new DOMMatrixReadOnly(matrix) : null;
  const deg = transform ? (Math.atan2(transform.b, transform.a) * 180) / Math.PI : 0;
  return clientToLocal(element, { x: clientX, y: clientY }, deg);
}

/**
 * 速记簿工作区交互卡片画布：支持响应式多列布局、窗口化按需挂载、空白处拉框多选、
 * Ctrl/Shift 点选、单张与多张卡片组内拖拽排序，以及底部毛玻璃悬浮批量工具条。
 */
export function ScratchpadCanvas<E extends CanvasEntry>({
  groups,
  freshKeys = NO_KEYS,
  ariaLabel,
  playLabel,
  onPlay,
  onMove,
  onDragStart,
  onDragEnd,
  onDelete,
  selectionActions,
  onEscape,
  spacing,
  focusKey,
  variant,
  side,
  currentLabel,
}: ScratchpadCanvasProps<E>) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const gridRefs = useRef(new Map<string, HTMLDivElement>());
  const motions = useRef(new Map<string, CardMotion>());
  const pressRef = useRef<PressState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const marqueeStateRef = useRef<MarqueeState | null>(null);
  const anchorRef = useRef<string | null>(null);

  const [columns, setColumns] = useState(1);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [band, setBand] = useState<BandRange>(() =>
    bandOf(0, typeof window === "undefined" ? 1200 : window.innerHeight),
  );
  const [gridTops, setGridTops] = useState<ReadonlyMap<string, number>>(() => new Map());

  const entries = useMemo(() => groups.flatMap((group) => group.entries), [groups]);
  const groupOf = useMemo(() => {
    const map = new Map<string, CanvasGroup<E>>();
    for (const group of groups) {
      for (const entry of group.entries) map.set(entry.key, group);
    }
    return map;
  }, [groups]);

  const latest = useRef({ groupOf, columns, selected, spacing, onMove, onDragStart, onDragEnd });
  latest.current = { groupOf, columns, selected, spacing, onMove, onDragStart, onDragEnd };

  useEffect(() => {
    setSelected((current) => {
      const next = new Set([...current].filter((key) => groupOf.has(key)));
      return next.size === current.size ? current : next;
    });
  }, [groupOf]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const measure = () => {
      if (element.clientWidth === 0) return;
      const edge = latest.current.spacing.edge ?? CONTENT_PADDING_X;
      const next = columnsFor(element.clientWidth - edge * 2, latest.current.spacing);
      setColumns((current) => (current === next ? current : next));
      const nextBand = bandOf(element.scrollTop, element.clientHeight);
      setBand((current) =>
        current.top === nextBand.top && current.bottom === nextBand.bottom ? current : nextBand,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [spacing]);

  useLayoutEffect(() => {
    const next = new Map<string, number>();
    for (const group of groups) {
      const grid = gridRefs.current.get(group.key);
      if (grid) next.set(group.key, grid.offsetTop);
    }
    setGridTops((current) =>
      current.size === next.size && [...next].every(([key, top]) => current.get(key) === top)
        ? current
        : next,
    );
  }, [columns, groups]);

  const focusTop = useCallback((): number | null => {
    if (!focusKey) return null;
    const group = groupOf.get(focusKey);
    const gridTop = group ? gridTops.get(group.key) : undefined;
    if (!group || gridTop === undefined) return null;
    const index = group.entries.findIndex((entry) => entry.key === focusKey);
    if (index < 0) return null;
    return gridTop + slotPosition(index, columns, spacing).y;
  }, [columns, focusKey, gridTops, groupOf, spacing]);

  const didFocusRef = useRef(false);
  useLayoutEffect(() => {
    if (didFocusRef.current || !focusKey) return;
    const scroller = scrollRef.current;
    const top = focusTop();
    if (!scroller || top === null) return;
    didFocusRef.current = true;
    scroller.scrollTop = Math.max(0, top - scroller.clientHeight / 3);
  }, [focusKey, focusTop]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const holdStill = (event: TouchEvent) => {
      if (dragRef.current && event.cancelable) event.preventDefault();
    };
    element.addEventListener("touchmove", holdStill, { passive: false });
    return () => element.removeEventListener("touchmove", holdStill);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const nextBand = bandOf(element.scrollTop, element.clientHeight);
        setBand((current) =>
          current.top === nextBand.top && current.bottom === nextBand.bottom ? current : nextBand,
        );
      });
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pressRef.current?.longPress) window.clearTimeout(pressRef.current.longPress);
      if (marqueeStateRef.current?.frame) cancelAnimationFrame(marqueeStateRef.current.frame);
    };
  }, []);

  const register = useCallback((key: string, motion: CardMotion | null) => {
    if (motion) motions.current.set(key, motion);
    else motions.current.delete(key);
  }, []);

  const selectedEntries = useMemo(
    () => (selected.size > 0 ? entries.filter((entry) => selected.has(entry.key)) : []),
    [entries, selected],
  );

  const endDrag = useCallback(() => {
    const wasDragging = dragRef.current !== null;
    dragRef.current = null;
    setDrag(null);
    if (wasDragging) latest.current.onDragEnd?.();
  }, []);

  const startDrag = useCallback((press: PressState) => {
    const { groupOf: groupsByKey, selected: chosen } = latest.current;
    press.dragging = true;
    const group = groupsByKey.get(press.entry.key);
    const moving =
      chosen.has(press.entry.key) && group
        ? new Set(group.entries.filter((entry) => chosen.has(entry.key)).map((entry) => entry.key))
        : new Set([press.entry.key]);
    if (!chosen.has(press.entry.key)) setSelected(new Set([press.entry.key]));
    const index = group?.entries.findIndex((entry) => entry.key === press.entry.key) ?? 0;
    const before =
      group?.entries.slice(0, index).filter((entry) => moving.has(entry.key)).length ?? 0;
    const stack = [
      press.entry.key,
      ...[...moving].filter((key) => key !== press.entry.key).slice(0, STACK_VISIBLE - 1),
    ];
    dragRef.current = {
      groupKey: press.groupKey,
      moving,
      stack,
      dropIndex: Math.max(0, index - before),
    };
    setDrag(dragRef.current);
    latest.current.onDragStart?.();
  }, []);

  const followPointer = useCallback((press: PressState, clientX: number, clientY: number) => {
    const { groupOf: groupsByKey, columns: columnCount, spacing: gaps } = latest.current;
    const grid = gridRefs.current.get(press.groupKey);
    const group = groupsByKey.get(press.entry.key);
    const current = dragRef.current;
    if (!grid || !group || !current) return;
    const point = clientToElementLocal(grid, clientX, clientY);
    const topLeft = { x: point.x - press.grab.x, y: point.y - press.grab.y };
    current.stack.forEach((key, order) => {
      const motion = motions.current.get(key);
      motion?.x.set(topLeft.x + order * STACK_OFFSET);
      motion?.y.set(topLeft.y + order * STACK_OFFSET);
    });
    const dropIndex = dropIndexAt(
      topLeft,
      columnCount,
      group.entries.length - current.moving.size,
      gaps,
    );
    if (dropIndex !== current.dropIndex) {
      dragRef.current = { ...current, dropIndex };
      setDrag(dragRef.current);
    }
  }, []);

  const handleCardPointerDown = useCallback(
    (entry: CanvasEntry, event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      if (pressRef.current && pressRef.current.pointerId !== event.pointerId) return;
      const group = groupOf.get(entry.key);
      const motion = motions.current.get(entry.key);
      const grid = group ? gridRefs.current.get(group.key) : undefined;
      if (!group || !motion || !grid) return;
      scrollRef.current?.focus({ preventScroll: true });
      const point = clientToElementLocal(grid, event.clientX, event.clientY);
      const press: PressState = {
        entry,
        groupKey: group.key,
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        grab: { x: point.x - motion.x.get(), y: point.y - motion.y.get() },
        modifiers: { shift: event.shiftKey, toggle: event.ctrlKey || event.metaKey },
        dragging: false,
        isTouch: event.pointerType === "touch",
      };
      if (pressRef.current?.longPress) window.clearTimeout(pressRef.current.longPress);
      pressRef.current = press;
      if (!press.isTouch) {
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
      if (!latest.current.onMove) return;
      press.longPress = window.setTimeout(() => {
        press.longPress = undefined;
        if (pressRef.current !== press) return;
        startDrag(press);
        followPointer(press, press.start.x, press.start.y);
      }, LONG_PRESS_MS);
    },
    [followPointer, groupOf, startDrag],
  );

  const handleCardPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const press = pressRef.current;
      if (!press || press.pointerId !== event.pointerId) return;
      if (!press.isTouch && (event.buttons & 1) === 0) {
        pressRef.current = null;
        if (press.dragging) endDrag();
        return;
      }
      if (!press.dragging) {
        const distance = Math.hypot(event.clientX - press.start.x, event.clientY - press.start.y);
        if (press.isTouch) {
          if (distance >= TOUCH_SLOP) {
            if (press.longPress) window.clearTimeout(press.longPress);
            pressRef.current = null;
          }
          return;
        }
        if (distance < DRAG_THRESHOLD) return;
        if (!latest.current.onMove) {
          pressRef.current = null;
          return;
        }
        startDrag(press);
      }
      followPointer(press, event.clientX, event.clientY);
    },
    [endDrag, followPointer, startDrag],
  );

  const handleCardPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const press = pressRef.current;
      if (!press || press.pointerId !== event.pointerId) return;
      if (press.longPress) window.clearTimeout(press.longPress);
      pressRef.current = null;
      if (press.dragging) {
        const current = dragRef.current;
        endDrag();
        if (current) {
          latest.current.onMove?.(current.groupKey, [...current.moving], current.dropIndex);
        }
        return;
      }
      const key = press.entry.key;
      if (
        press.modifiers.shift &&
        anchorRef.current &&
        groupOf.get(anchorRef.current) === groupOf.get(key)
      ) {
        const groupEntries = groupOf.get(key)!.entries;
        const from = groupEntries.findIndex((entry) => entry.key === anchorRef.current);
        const to = groupEntries.findIndex((entry) => entry.key === key);
        const range = groupEntries
          .slice(Math.min(from, to), Math.max(from, to) + 1)
          .map((entry) => entry.key);
        setSelected((current) => new Set([...(press.modifiers.toggle ? current : []), ...range]));
        return;
      }
      anchorRef.current = key;
      setSelected((current) => {
        if (!press.modifiers.toggle && !(press.isTouch && current.size > 0)) {
          return new Set([key]);
        }
        const next = new Set(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [endDrag, groupOf],
  );

  const handleCardPointerCancel = useCallback(() => {
    if (pressRef.current?.longPress) window.clearTimeout(pressRef.current.longPress);
    pressRef.current = null;
    endDrag();
  }, [endDrag]);

  const applyMarquee = (marquee: MarqueeState, client: { clientX: number; clientY: number }) => {
    const content = contentRef.current;
    if (!content) return;
    const point = clientToElementLocal(content, client.clientX, client.clientY);
    if (
      !marquee.moved &&
      Math.hypot(point.x - marquee.start.x, point.y - marquee.start.y) < DRAG_THRESHOLD
    ) {
      return;
    }
    if (!marquee.moved) setIsBoxSelecting(true);
    marquee.moved = true;
    const rect: CanvasRect = rectFromPoints(marquee.start, point);
    const box = marqueeRef.current;
    if (box) {
      box.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
      box.style.width = `${rect.right - rect.left}px`;
      box.style.height = `${rect.bottom - rect.top}px`;
      box.hidden = false;
    }
    const next = new Set(marquee.base);
    for (const grid of marquee.grids) {
      grid.keys.forEach((key, index) => {
        if (rectsIntersect(rect, cardRect(grid.origin, index, columns, spacing))) next.add(key);
      });
    }
    setSelected((current) => (sameSet(current, next) ? current : next));
  };

  const handleCanvasPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !contentRef.current || event.pointerType === "touch") return;
    if ((event.target as HTMLElement).closest("button, [data-scratchpad-key], [role='toolbar']")) {
      return;
    }
    const scroller = scrollRef.current;
    if (
      scroller &&
      clientToElementLocal(scroller, event.clientX, event.clientY).x >= scroller.clientWidth
    ) {
      return;
    }
    scrollRef.current?.focus({ preventScroll: true });
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    marqueeStateRef.current = {
      pointerId: event.pointerId,
      start: clientToElementLocal(contentRef.current, event.clientX, event.clientY),
      base: additive ? selected : new Set(),
      moved: false,
      grids: groups.flatMap((group) => {
        const grid = gridRefs.current.get(group.key);
        if (!grid) return [];
        return [
          {
            origin: { x: grid.offsetLeft, y: grid.offsetTop },
            keys: group.entries.map((entry) => entry.key),
          },
        ];
      }),
      pending: null,
      frame: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCanvasPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const marquee = marqueeStateRef.current;
    if (!marquee || marquee.pointerId !== event.pointerId) return;
    marquee.pending = { clientX: event.clientX, clientY: event.clientY };
    if (marquee.frame) return;
    marquee.frame = requestAnimationFrame(() => {
      marquee.frame = 0;
      const pending = marquee.pending;
      marquee.pending = null;
      if (pending && marqueeStateRef.current === marquee) applyMarquee(marquee, pending);
    });
  };

  const handleCanvasPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const marquee = marqueeStateRef.current;
    if (!marquee || marquee.pointerId !== event.pointerId) return;
    if (marquee.frame) cancelAnimationFrame(marquee.frame);
    if (marquee.pending) applyMarquee(marquee, marquee.pending);
    marqueeStateRef.current = null;
    setIsBoxSelecting(false);
    if (marqueeRef.current) marqueeRef.current.hidden = true;
    if (!marquee.moved && marquee.base.size === 0) setSelected(new Set());
  };

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    if (pressRef.current?.isTouch || dragRef.current) event.preventDefault();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (drag) handleCardPointerCancel();
      else if (selected.size > 0) setSelected(new Set());
      else onEscape?.();
      return;
    }
    if ((event.key === "Delete" || event.key === "Backspace") && selected.size > 0 && onDelete) {
      event.preventDefault();
      event.stopPropagation();
      onDelete(entries.filter((entry) => selected.has(entry.key)));
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      event.stopPropagation();
      setSelected(new Set(entries.map((entry) => entry.key)));
    }
  };

  const menuButtons = useMemo(
    () =>
      selectedEntries.length > 0 && !drag && !isBoxSelecting
        ? selectionActions(selectedEntries)
        : [],
    [drag, isBoxSelecting, selectedEntries, selectionActions],
  );

  const jumpTargets = useMemo(() => {
    if (!side) return [];
    const targets: CanvasJumpTarget[] = [];
    const span = (groupKey: string, from: number, to: number) => {
      const gridTop = gridTops.get(groupKey);
      if (gridTop === undefined) return null;
      return {
        top: gridTop + slotPosition(from, columns, spacing).y,
        bottom: gridTop + slotPosition(to, columns, spacing).y + spacing.card.height,
      };
    };
    const chunk = groups.length === 1 && side.chunk ? side.chunk : 0;
    for (const group of groups) {
      const focusIndex = focusKey ? group.entries.findIndex((entry) => entry.key === focusKey) : -1;
      if (chunk > 0) {
        for (let from = 0; from < group.entries.length; from += chunk) {
          const to = Math.min(group.entries.length, from + chunk) - 1;
          const box = span(group.key, from, to);
          if (!box) continue;
          const holdsFocus = focusIndex >= from && focusIndex <= to;
          targets.push({
            id: `${group.key}:${from}`,
            groupKey: group.key,
            index: from,
            count: to - from + 1,
            holdsFocus,
            label: holdsFocus
              ? `${from + 1}–${to + 1} · ▶ ${focusIndex + 1}`
              : `${from + 1}–${to + 1}`,
            ...box,
          });
        }
        continue;
      }
      const box = span(group.key, 0, Math.max(0, group.entries.length - 1));
      if (!box) continue;
      targets.push({
        id: group.key,
        groupKey: group.key,
        index: 0,
        count: group.entries.length,
        holdsFocus: focusIndex >= 0,
        label: group.jumpLabel ?? group.label,
        top: Math.max(0, box.top - 44),
        bottom: box.bottom,
      });
    }
    return targets;
  }, [columns, focusKey, gridTops, groups, side, spacing]);

  const locateCurrent = useCallback(() => {
    const top = focusTop();
    const scroller = scrollRef.current;
    if (top === null || !scroller) return;
    scroller.scrollTo({ top: Math.max(0, top - scroller.clientHeight / 3), behavior: "smooth" });
  }, [focusTop]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 overflow-hidden",
        spacing.card.height === 102 ? "scratchpad-compact" : "scratchpad-full-cards",
      )}
    >
      <div
        ref={scrollRef}
        role="listbox"
        aria-multiselectable="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        onContextMenu={handleContextMenu}
        className={cn(
          "relative min-h-0 flex-1 overflow-y-auto outline-none",
          isBoxSelecting && "select-none",
        )}
      >
        <div
          ref={contentRef}
          className="relative min-h-full py-5"
          style={{
            paddingLeft: spacing.edge ?? CONTENT_PADDING_X,
            paddingRight: spacing.edge ?? CONTENT_PADDING_X,
          }}
        >
          <div className="space-y-8 pb-20">
            {groups.map((group) => {
              const keys = group.entries.map((entry) => entry.key);
              const preview =
                drag?.groupKey === group.key
                  ? previewSlots(keys, drag.moving, drag.dropIndex)
                  : null;
              const height = gridHeight(group.entries.length, columns, spacing);
              const gridTop = gridTops.get(group.key);
              const groupSelectedCount = keys.filter((key) => selected.has(key)).length;
              const allGroupSelected = keys.length > 0 && groupSelectedCount === keys.length;

              return (
                <section key={group.key} className="space-y-3">
                  <header className="scratchpad-group-header flex-wrap">
                    <div className="flex min-w-0 items-baseline gap-2.5">
                      <h2 className="scratchpad-group-label">{group.label}</h2>
                      {group.sublabel && (
                        <span className="truncate text-xs text-content-muted">
                          {group.sublabel}
                        </span>
                      )}
                      <span className="scratchpad-group-count">{group.entries.length}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelected((current) => {
                            const next = new Set(current);
                            if (allGroupSelected) {
                              for (const key of keys) next.delete(key);
                            } else {
                              for (const key of keys) next.add(key);
                            }
                            return next;
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-full bg-content/8 px-3 py-1 text-xs font-medium text-content transition-colors hover:bg-content/14"
                      >
                        <SquareCheck className="size-3.5" />
                        <span>
                          {t(
                            allGroupSelected
                              ? "scratchpad.deselectGroup"
                              : "scratchpad.selectGroup",
                          )}
                        </span>
                      </button>
                      {group.buttons?.map(({ id, label, title, icon: Icon, run, disabled }) => (
                        <button
                          key={id}
                          type="button"
                          disabled={disabled}
                          title={title ?? label}
                          onClick={run}
                          className="inline-flex items-center gap-1.5 rounded-full bg-content/8 px-3 py-1 text-xs font-medium text-content transition-colors hover:bg-content/14 disabled:opacity-40"
                        >
                          <Icon className="size-3.5" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </header>

                  <div
                    ref={(element) => {
                      if (element) gridRefs.current.set(group.key, element);
                      else gridRefs.current.delete(group.key);
                    }}
                    className="relative w-full"
                    style={{ height: Math.max(spacing.card.height, height) }}
                    onPointerMove={handleCardPointerMove}
                    onPointerUp={handleCardPointerUp}
                    onPointerCancel={handleCardPointerCancel}
                  >
                    {group.entries.map((entry, index) => {
                      const isMoving = Boolean(drag?.moving.has(entry.key));
                      if (isMoving && !drag?.stack.includes(entry.key)) return null;
                      const slot = slotPosition(preview?.get(entry.key) ?? index, columns, spacing);
                      if (!isMoving) {
                        if (gridTop === undefined) return null;
                        const top = gridTop + slot.y;
                        if (top + spacing.card.height < band.top || top > band.bottom) return null;
                      }
                      return (
                        <ScratchpadCard
                          key={entry.key}
                          entry={entry}
                          slotX={slot.x}
                          slotY={slot.y}
                          isMoving={isMoving}
                          movingCount={
                            isMoving && drag?.stack[0] === entry.key && drag.moving.size > 1
                              ? drag.moving.size
                              : 0
                          }
                          isSelected={selected.has(entry.key)}
                          isFresh={freshKeys.has(entry.key)}
                          width={spacing.card.width}
                          height={spacing.card.height}
                          variant={variant}
                          currentLabel={currentLabel}
                          playLabel={playLabel}
                          register={register}
                          onPointerDown={handleCardPointerDown}
                          onPlay={onPlay as (target: CanvasEntry) => void}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <div
            ref={marqueeRef}
            hidden
            className="pointer-events-none absolute top-0 left-0 z-20 rounded-lg border border-brand/70 bg-brand/12"
          />

          {selectedEntries.length > 0 && !drag && !isBoxSelecting && (
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
              {menuButtons.map(({ id, label, title, icon: Icon, run, disabled, destructive }) => (
                <button
                  key={id}
                  type="button"
                  disabled={disabled}
                  title={title ?? label}
                  onClick={run}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40",
                    destructive
                      ? "bg-destructive/12 text-destructive hover:bg-destructive hover:text-white"
                      : "bg-content/8 text-content hover:bg-content/15",
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{label}</span>
                </button>
              ))}
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

      {side && (
        <ScratchpadCanvasSide
          mark={
            variant === "queue"
              ? "chev"
              : variant === "history"
                ? "tri"
                : variant === "moment"
                  ? "bracket"
                  : "circle"
          }
          side={side}
          targets={jumpTargets}
          scrollRef={scrollRef}
          onLocate={focusKey ? locateCurrent : undefined}
        />
      )}
    </div>
  );
}
