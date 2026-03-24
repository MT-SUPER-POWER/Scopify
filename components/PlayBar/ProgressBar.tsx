import { memo, useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/utils";
import { SmoothSlider } from "@/components/SmoothSlider";
import { useTimeStore } from "@/store/module/time";

export const PlayerProgressBar = memo(() => {
  // 1. 低频数据：直接从 Zustand 读，因为它本来就不怎么变
  const totalTime = useTimeStore(s => s.totalTime);
  const bufferedTime = useTimeStore(s => s.bufferedTime);

  // console.log("PlayerProgressBar render", { bufferedTime });

  // 2. 高频数据：完全使用本地 State，初始值取一下 Store 里的记忆点
  const [localTime, setLocalTime] = useState(() => useTimeStore.getState().currentTime);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
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
  const handleSeek = (value: number) => {
    const newTimeMs = (value / 100) * totalTime;
    setLocalTime(newTimeMs); // 优先让本地滑块跟手

    // 发送跳转指令给 PlayerBar
    window.dispatchEvent(new CustomEvent("player-seek", { detail: newTimeMs }));
  };

  const progressPercent = totalTime > 0 ? (localTime / totalTime) * 100 : 0;
  const bufferedPercent = totalTime > 0 ? (bufferedTime / totalTime) * 100 : 0;

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[11px] text-[#b3b3b3] w-10 text-right tabular-nums tracking-widest font-normal shrink-0">
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
      />

      <span className="text-[11px] text-[#b3b3b3] w-10 tabular-nums tracking-widest font-normal shrink-0">
        {formatDuration(totalTime)}
      </span>
    </div>
  );
});

PlayerProgressBar.displayName = "PlayerProgressBar";
