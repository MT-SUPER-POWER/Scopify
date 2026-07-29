"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  fitTracklistColumnWidths,
  getDefaultTracklistColumnWidths,
  getTracklistMinimumTableWidth,
  getTracklistResizePairs,
  getTracklistVisibleColumns,
  resetTracklistColumnPair,
  resizeTracklistColumnPair,
} from "@/lib/playlist/tracklistColumnLayout";
import type {
  TracklistColumnId,
  TracklistColumnResizeDragState,
  TracklistColumnVisibility,
  TracklistResizableColumnId,
} from "@/types/tracklist";

export function useTracklistColumnLayout(visibility: TracklistColumnVisibility) {
  const { showAlbumColumn, showDateColumn, showLikeColumn } = visibility;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<TracklistColumnResizeDragState | null>(null);
  const bodyStyleRef = useRef({ cursor: "", userSelect: "" });
  const visibleColumns = useMemo(
    () => getTracklistVisibleColumns({ showAlbumColumn, showDateColumn, showLikeColumn }),
    [showAlbumColumn, showDateColumn, showLikeColumn],
  );
  const resizePairs = useMemo(() => getTracklistResizePairs(visibleColumns), [visibleColumns]);
  const layoutKey = visibleColumns.join("|");
  const appliedLayoutKeyRef = useRef(layoutKey);
  const hasMeasuredRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeDivider, setActiveDivider] = useState<TracklistResizableColumnId | null>(null);
  const [widths, setWidths] = useState(() => getDefaultTracklistColumnWidths(0, visibleColumns));

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const updateWidth = () => {
      setContainerWidth(Math.round(container.getBoundingClientRect().width));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (containerWidth === 0) return;

    setWidths((currentWidths) => {
      if (!hasMeasuredRef.current || appliedLayoutKeyRef.current !== layoutKey) {
        hasMeasuredRef.current = true;
        appliedLayoutKeyRef.current = layoutKey;
        return getDefaultTracklistColumnWidths(containerWidth, visibleColumns);
      }

      return fitTracklistColumnWidths(currentWidths, containerWidth, visibleColumns);
    });
  }, [containerWidth, layoutKey, visibleColumns]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    event.preventDefault();
    setWidths(
      resizeTracklistColumnPair(drag.initialWidths, drag.pair, event.clientX - drag.startX),
    );
  }, []);

  const stopResize = useCallback(
    (event?: PointerEvent) => {
      const drag = dragRef.current;
      if (event && drag && event.pointerId !== drag.pointerId) return;

      dragRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      document.body.style.cursor = bodyStyleRef.current.cursor;
      document.body.style.userSelect = bodyStyleRef.current.userSelect;
      setActiveDivider(null);
    },
    [handlePointerMove],
  );

  useEffect(() => () => stopResize(), [stopResize]);

  const startResize = useCallback(
    (left: TracklistResizableColumnId, event: ReactPointerEvent<HTMLSpanElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const pair = resizePairs.find((candidate) => candidate.left === left);
      if (!pair) return;

      event.preventDefault();
      event.stopPropagation();
      stopResize();

      dragRef.current = {
        initialWidths: widths,
        pair,
        pointerId: event.pointerId,
        startX: event.clientX,
      };
      bodyStyleRef.current = {
        cursor: document.body.style.cursor,
        userSelect: document.body.style.userSelect,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      setActiveDivider(left);
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", stopResize);
      window.addEventListener("pointercancel", stopResize);
    },
    [handlePointerMove, resizePairs, stopResize, widths],
  );

  const resetResizePair = useCallback(
    (left: TracklistResizableColumnId, event: ReactMouseEvent<HTMLSpanElement>) => {
      const pair = resizePairs.find((candidate) => candidate.left === left);
      if (!pair) return;

      event.preventDefault();
      event.stopPropagation();
      setWidths((currentWidths) => resetTracklistColumnPair(currentWidths, pair, visibleColumns));
    },
    [resizePairs, visibleColumns],
  );

  const getColumnStyle = useCallback(
    (column: TracklistColumnId) => ({ width: widths[column] }),
    [widths],
  );

  return {
    activeDivider,
    containerRef,
    getColumnStyle,
    minimumTableWidth: getTracklistMinimumTableWidth(visibleColumns),
    resetResizePair,
    startResize,
    visibleColumns,
  };
}
