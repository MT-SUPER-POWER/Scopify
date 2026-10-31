"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { MvPageContext } from "./MvPageContext";
import { useMVDetailQuery } from "@/hooks/mv/useMVQueries";
import { useUiStore } from "@/store/module/ui";

/**
 * MV 页各区域共用的状态：剧场模式与「下一首」。剧场模式只通过 data-theater 切换 layout 的栅格，
 * 保持播放器实例和进度；详情请求失败时由外层 QueryBoundary 接住整页，各区域再自己读同一份缓存。
 */
export function MvPageProvider({ mvid, children }: { mvid: number; children: ReactNode }) {
  useMVDetailQuery(mvid, { boundary: true });
  const [isTheater, setIsTheater] = useState(false);
  const [next, setNext] = useState<readonly [number, number | null] | null>(null);
  const nextId = next?.[0] === mvid ? next[1] : null;
  const onNextChange = useCallback((id: number | null) => setNext([mvid, id]), [mvid]);
  const setIsPlayerBarHidden = useUiStore((state) => state.setIsPlayerBarHidden);
  const toggleTheater = useCallback(() => {
    setIsTheater(!isTheater);
    setIsPlayerBarHidden(!isTheater);
  }, [isTheater, setIsPlayerBarHidden]);
  useEffect(() => () => setIsPlayerBarHidden(false), [setIsPlayerBarHidden]);

  const value = useMemo(
    () => ({ isTheater, toggleTheater, nextId, onNextChange }),
    [isTheater, toggleTheater, nextId, onNextChange],
  );

  return (
    <MvPageContext value={value}>
      <div data-theater={isTheater} className="group/mv contents">
        {children}
      </div>
    </MvPageContext>
  );
}
