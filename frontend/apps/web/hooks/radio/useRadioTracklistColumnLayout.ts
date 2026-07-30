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
  fitRadioTracklistColumnWidths,
  getDefaultRadioTracklistColumnWidths,
  getRadioTracklistMinimumTableWidth,
  getRadioTracklistResizePairs,
  getRadioTracklistVisibleColumns,
  resetRadioTracklistColumnPair,
  resizeRadioTracklistColumnPair,
} from "@/lib/radio/radioTracklistColumnLayout";
import type {
  RadioTracklistColumnId,
  RadioTracklistColumnResizeDragState,
  RadioTracklistColumnVisibility,
  RadioTracklistResizableColumnId,
} from "@/types/radio";

export function useRadioTracklistColumnLayout(visibility: RadioTracklistColumnVisibility) {
  const { showPlayCountColumn, showUpdatedAtColumn } = visibility;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<RadioTracklistColumnResizeDragState | null>(null);
  const bodyStyleRef = useRef({ cursor: "", userSelect: "" });
  const visibleColumns = useMemo(
    () => getRadioTracklistVisibleColumns({ showPlayCountColumn, showUpdatedAtColumn }),
    [showPlayCountColumn, showUpdatedAtColumn],
  );
  const resizePairs = useMemo(() => getRadioTracklistResizePairs(visibleColumns), [visibleColumns]);
  const layoutKey = visibleColumns.join("|");
  const appliedLayoutKeyRef = useRef(layoutKey);
  const hasMeasuredRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeDivider, setActiveDivider] = useState<RadioTracklistResizableColumnId | null>(null);
  const [widths, setWidths] = useState(() =>
    getDefaultRadioTracklistColumnWidths(0, visibleColumns),
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const updateWidth = () =>
      setContainerWidth(Math.round(container.getBoundingClientRect().width));

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const measuredContainerWidth = Math.round(
      containerRef.current?.getBoundingClientRect().width ?? 0,
    );
    const layoutWidth = measuredContainerWidth || containerWidth;
    if (layoutWidth === 0) return;

    setWidths((currentWidths) => {
      if (!hasMeasuredRef.current || appliedLayoutKeyRef.current !== layoutKey) {
        hasMeasuredRef.current = true;
        appliedLayoutKeyRef.current = layoutKey;
        return getDefaultRadioTracklistColumnWidths(layoutWidth, visibleColumns);
      }

      return fitRadioTracklistColumnWidths(currentWidths, layoutWidth, visibleColumns);
    });
  }, [containerWidth, layoutKey, visibleColumns]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    event.preventDefault();
    setWidths(
      resizeRadioTracklistColumnPair(drag.initialWidths, drag.pair, event.clientX - drag.startX),
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
    (left: RadioTracklistResizableColumnId, event: ReactPointerEvent<HTMLSpanElement>) => {
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
    (left: RadioTracklistResizableColumnId, event: ReactMouseEvent<HTMLSpanElement>) => {
      const pair = resizePairs.find((candidate) => candidate.left === left);
      if (!pair) return;

      event.preventDefault();
      event.stopPropagation();
      setWidths((currentWidths) =>
        resetRadioTracklistColumnPair(currentWidths, pair, visibleColumns),
      );
    },
    [resizePairs, visibleColumns],
  );

  const getColumnStyle = useCallback(
    (column: RadioTracklistColumnId) => ({ width: widths[column] }),
    [widths],
  );

  return {
    activeDivider,
    containerRef,
    getColumnStyle,
    minimumTableWidth: getRadioTracklistMinimumTableWidth(visibleColumns),
    resetResizePair,
    startResize,
    visibleColumns,
  };
}
