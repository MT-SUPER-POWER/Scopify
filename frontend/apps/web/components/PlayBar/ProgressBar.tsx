import { memo, useEffect, useMemo, useRef, useState } from "react";
import { SmoothSlider } from "@/components/SmoothSlider";
import { useSongChorus } from "@/hooks/lyrics/useSongChorus";
import { getChorusProgressRanges } from "@/lib/player/chorusMarkers";
import { formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";

export const PlayerProgressBar = memo(() => {
  // 1. 低频数据：直接从 Zustand 读，因为它本来就不怎么变
  const totalTime = useTimeStore((s) => s.totalTime);
  const bufferedTime = useTimeStore((s) => s.bufferedTime);
  const currentSongId = usePlayerStore((state) => state.currentSongDetail?.id ?? null);
  const chorusQuery = useSongChorus(currentSongId);
  const chorusRanges = useMemo(
    () => getChorusProgressRanges(chorusQuery.data ?? [], totalTime),
    [chorusQuery.data, totalTime],
  );

  // 2. 高频数据：完全使用本地 State，初始值从 localStorage 直读（绕过 Zustand 异步水合）
  const [localTime, setLocalTime] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = localStorage.getItem("player-time-storage");
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return parsed.state?.currentTime ?? 0;
    } catch {
      return 0;
    }
  });

  const lastUpdateRef = useRef(0); // 节流
  const hydrationSyncedRef = useRef(false);

  // ── Zustand async hydration sync ──────────────────────────────────────────
  // ProgressBar mount 时 Zustand persist 可能还没完成异步水合，导致
  // storeCurrentTime 为 0。订阅 store 值，首次非零更新时同步到 localTime。
  const storeCurrentTime = useTimeStore((s) => s.currentTime);

  useEffect(() => {
    if (!hydrationSyncedRef.current && storeCurrentTime > 0) {
      setLocalTime(storeCurrentTime);
      hydrationSyncedRef.current = true;
    }
  }, [storeCurrentTime]);

  useEffect(() => {
    // 客户端挂载后同步持久化的播放位置（SSR 阶段 localStorage 不可用，初始值为 0）
    const persisted = useTimeStore.getState().currentTime;
    if (persisted > 0) {
      setLocalTime(persisted);
    }

    // 3. 只接收高频的播放时间广播，局部刷新 UI
    const onTime = (e: Event) => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= 800) {
        setLocalTime((e as CustomEvent<number>).detail);
        lastUpdateRef.current = now;
      }
    };

    window.addEventListener("player-time", onTime);
    return () => window.removeEventListener("player-time", onTime);
  }, []);

  // 4. 用户拖拽进度条
  const handleSeek = (value: number, isCommit: boolean) => {
    const newTimeMs = (value / 100) * totalTime;
    setLocalTime(newTimeMs); // 优先让本地滑块跟手

    if (isCommit) {
      window.dispatchEvent(new CustomEvent("player-seek", { detail: newTimeMs }));
    }
  };

  const progressPercent = totalTime > 0 ? (localTime / totalTime) * 100 : 0;
  const bufferedPercent = totalTime > 0 ? (bufferedTime / totalTime) * 100 : 0;

  return (
    <div className="flex w-full items-center gap-2">
      <span className="w-10 shrink-0 text-right text-[11px] font-normal tracking-widest text-[#b3b3b3] tabular-nums">
        {formatDuration(localTime)}
      </span>

      <SmoothSlider
        value={progressPercent}
        bufferedValue={bufferedPercent}
        onChange={handleSeek}
        orientation="horizontal"
        className="flex-1"
        trackThickness={4}
        thumbSize={12}
        thumbOnHover={true}
        rangeMarkers={chorusRanges}
        markerAppearance="glow"
        markerColor="rgba(30, 215, 96, 0.85)"
      />

      <span className="w-10 shrink-0 text-[11px] font-normal tracking-widest text-[#b3b3b3] tabular-nums">
        {formatDuration(totalTime)}
      </span>
    </div>
  );
});

PlayerProgressBar.displayName = "PlayerProgressBar";
