"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useMVDetailQuery } from "@/hooks/mv/useMVQueries";
import { useMvId } from "@/hooks/mv/useMvId";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { MvPageContextValue } from "@/types/mv/pageContext";

const MvPageContext = createContext<MvPageContextValue | null>(null);

export function useMvPage() {
  const value = use(MvPageContext);
  if (!value) throw new Error("useMvPage must be used within MvPageProvider");
  return value;
}

/** MV 主详情边界：id 无效显示空状态，详情首次取不到时整页进入错误态。 */
export function MvPageProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const mvid = useMvId();
  if (!mvid)
    return (
      <p className="flex min-h-[60vh] items-center justify-center text-content-muted">
        {t("mv.status.invalid")}
      </p>
    );
  return (
    <QueryBoundary resetKey={`mv:detail:${mvid}`}>
      <MvPageState mvid={mvid}>{children}</MvPageState>
    </QueryBoundary>
  );
}

/**
 * MV 页各区域共用的状态：剧场模式与「下一首」。剧场模式只通过 data-theater 切换 layout 的栅格，
 * 保持播放器实例和进度；详情请求失败时由外层 QueryBoundary 接住整页，各区域再自己读同一份缓存。
 */
function MvPageState({ mvid, children }: { mvid: number; children: ReactNode }) {
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
