"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SongDetail } from "@/types/api/music";

export function useTrackSelection(tracks: SongDetail[]) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const lastFocusedIdRef = useRef<number | null>(null);

  // 按列表当前顺序获取已选中的歌曲数组
  const selectedTracks = useMemo(
    () => tracks.filter((track) => selectedIds.has(track.id)),
    [tracks, selectedIds],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastFocusedIdRef.current = null;
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(tracks.map((t) => t.id)));
  }, [tracks]);

  const handleRowClick = useCallback(
    (trackId: number, event: React.MouseEvent) => {
      // 忽略右键点击（右键由 contextmenu 处理）
      if (event.button !== 0) return;

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      if (isCtrlOrCmd) {
        // Ctrl/Cmd: 增减选择
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(trackId)) {
            next.delete(trackId);
          } else {
            next.add(trackId);
          }
          return next;
        });
        lastFocusedIdRef.current = trackId;
      } else if (isShift) {
        // Shift: 区间连选
        if (lastFocusedIdRef.current !== null) {
          const lastId = lastFocusedIdRef.current;
          const lastIdx = tracks.findIndex((t) => t.id === lastId);
          const currIdx = tracks.findIndex((t) => t.id === trackId);

          if (lastIdx !== -1 && currIdx !== -1) {
            const start = Math.min(lastIdx, currIdx);
            const end = Math.max(lastIdx, currIdx);
            const rangeIds = tracks.slice(start, end + 1).map((t) => t.id);

            setSelectedIds((prev) => {
              const next = new Set(prev);
              rangeIds.forEach((id) => next.add(id));
              return next;
            });
          }
        } else {
          // 若之前无锚点，则以当前项作为多选起点
          setSelectedIds(new Set([trackId]));
          lastFocusedIdRef.current = trackId;
        }
      } else {
        // 普通单击：清空多选状态，不产生选中高亮，仅更新焦点锚点
        setSelectedIds(new Set());
        lastFocusedIdRef.current = trackId;
      }
    },
    [tracks],
  );

  const handleRowContextMenu = useCallback(
    (trackId: number) => {
      setSelectedIds((prev) => {
        // 如果右键点击的歌曲已经处于多选集合中，保留多选状态以便右键批量操作
        if (prev.has(trackId)) {
          return prev;
        }
        // 否则清空多选集合（单首操作，不进入多选高亮）
        lastFocusedIdRef.current = trackId;
        return new Set();
      });
    },
    [],
  );

  // 监听键盘按键：Esc 清空，Ctrl/Cmd+A 全选
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果处于 input/textarea/editable 中则不干预
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        clearSelection();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        // 仅在已有选中的情况下拦截全局全选，或者当前表格获得焦点时
        if (selectedIds.size > 0) {
          e.preventDefault();
          selectAll();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearSelection, selectAll, selectedIds.size]);

  return {
    selectedIds,
    selectedTracks,
    isSelected: useCallback((id: number) => selectedIds.has(id), [selectedIds]),
    handleRowClick,
    handleRowContextMenu,
    clearSelection,
    selectAll,
    setSelectedIds,
  };
}
