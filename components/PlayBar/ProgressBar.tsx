import React, { memo, useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/utils";
import { SmoothSlider } from "@/components/SmoothSlider";

export const PlayerProgressBar = memo(() => {
  // 彻底告别 Zustand，所有时间数据全部变成组件内部的私有状态
  const [localTime, setLocalTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);


  // 用于记录上一次更新视图的时间戳
  const lastUpdateRef = useRef(0);

  // NOTE: 播放条防止频繁更新导致的性能问题，核心是节流控制，每 500 毫秒最多只更新一次视图
  useEffect(() => {
    const onTime = (e: Event) => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= 500) {
        setLocalTime((e as CustomEvent<number>).detail);
        lastUpdateRef.current = now;
      }
    };

    const onDuration = (e: Event) => setTotalTime((e as CustomEvent<number>).detail);
    const onBuffer = (e: Event) => setBufferedTime((e as CustomEvent<number>).detail);

    window.addEventListener("player-time", onTime);
    window.addEventListener("player-duration", onDuration);
    window.addEventListener("player-buffer", onBuffer);

    return () => {
      window.removeEventListener("player-time", onTime);
      window.removeEventListener("player-duration", onDuration);
      window.removeEventListener("player-buffer", onBuffer);
    };
  }, []);

  useEffect(() => {
    // 建立独立的信号接收器
    const onTime = (e: Event) => setLocalTime((e as CustomEvent<number>).detail);
    const onDuration = (e: Event) => setTotalTime((e as CustomEvent<number>).detail);
    const onBuffer = (e: Event) => setBufferedTime((e as CustomEvent<number>).detail);

    window.addEventListener("player-time", onTime);
    window.addEventListener("player-duration", onDuration);
    window.addEventListener("player-buffer", onBuffer);

    return () => {
      window.removeEventListener("player-time", onTime);
      window.removeEventListener("player-duration", onDuration);
      window.removeEventListener("player-buffer", onBuffer);
    };
  }, []);

  // 用户拖拽进度条
  const handleSeek = (value: number) => {
    const newTimeMs = (value / 100) * totalTime;
    setLocalTime(newTimeMs); // 优先让滑块自己动过去，防止拖拽闪烁

    // 发送原生指令，通知 PlayerBar 里的 audio 进行实际跳转
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
