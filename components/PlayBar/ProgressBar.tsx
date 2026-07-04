import { memo, useEffect, useRef, useState } from "react";
import { SmoothSlider } from "@/components/SmoothSlider";
import { formatDuration } from "@/lib/utils";
import { useTimeStore } from "@/store/module/time";

export const PlayerProgressBar = memo(() => {
  // 1. 低频数据：直接从 Zustand 读，因为它本来就不怎么变
  const totalTime = useTimeStore((s) => s.totalTime);
  const bufferedTime = useTimeStore((s) => s.bufferedTime);

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

  // 3. isMounted 防止 SSR 水合不匹配：水合期间始终显示 0:00（服务端产物）
  const [isMounted, setIsMounted] = useState(false);

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

  // ── 客户端挂载后 ───────────────────────────────────────────────────────
  // 1) 标记已挂载，让 UI 改用真实的 localTime（而非水合期的 0）
  // 2) 监听高频的播放时间广播
  useEffect(() => {
    setIsMounted(true);

    // 只接收高频的播放时间广播，局部刷新 UI
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

  // 水合期间：显示 0:00 以匹配服务端 HTML；水合完成后：显示真实进度
  const displayTime = isMounted ? localTime : 0;
  const progressPercent = totalTime > 0 ? (displayTime / totalTime) * 100 : 0;
  const bufferedPercent = totalTime > 0 ? (bufferedTime / totalTime) * 100 : 0;

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[11px] text-[#b3b3b3] w-10 text-right tabular-nums tracking-widest font-normal shrink-0">
        {formatDuration(displayTime)}
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
      />

      <span className="text-[11px] text-[#b3b3b3] w-10 tabular-nums tracking-widest font-normal shrink-0">
        {formatDuration(totalTime)}
      </span>
    </div>
  );
});

PlayerProgressBar.displayName = "PlayerProgressBar";
