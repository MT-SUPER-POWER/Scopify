"use client";

import { parseLrc } from "@applemusic-like-lyrics/lyric";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef } from "react";
import "@applemusic-like-lyrics/core/style.css";
import { usePlayerStore } from "@/store";
import { useTimeStore } from "@/store/module/time"; // 引入你刚才提到的 time store

const LyricPlayer = dynamic(
  () => import("@applemusic-like-lyrics/react").then((mod) => mod.LyricPlayer),
  { ssr: false },
);

export const LyricRenderer = () => {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const lyric = usePlayerStore((s) => s.lyric);
  const _currentSongId = usePlayerStore((s) => s.currentSongDetail?.id);

  // 换用 Zustand 管理时间
  const currentTimeMs = useTimeStore((s) => s.currentTime);
  const setCurrentTimeMs = useTimeStore((s) => s.setCurrentTime);

  // 点击歌词的跳转实现部分
  const handleClickLyricLine = (event: any) => {
    const targetTime = event?.line?.lyricLine?.startTime;

    if (targetTime !== undefined && Number.isFinite(targetTime)) {
      // 1. 告知 Audio 去更新当前时间和跳转位置一致
      window.dispatchEvent(new CustomEvent("player-seek", { detail: targetTime }));

      // 2. 状态机：乐观更新当前 UI 层的状态
      setCurrentTimeMs(targetTime);

      // 3. 操作 ref 来控制滚动区域 （临时方案）
      if (lyricRef.current?.lyricPlayer) {
        const player = lyricRef.current?.lyricPlayer;

        player.setCurrentTime(targetTime, true);

        // 强制重置缓冲行和滚动位置
        if (player.bufferedLines && player.hotLines && player.processedLines) {
          player.bufferedLines.clear();

          // 将即将高亮的行加入新缓冲
          for (const v of player.hotLines) {
            player.bufferedLines.add(v);
          }

          // 重新计算目标滚动索引 (Scroll Target)
          if (player.bufferedLines.size > 0) {
            player.scrollToIndex = Math.min(...player.bufferedLines);
          } else {
            // 如果 hotLines 为空，手动去全量数组里查第一个大于等于目标时间的行
            const foundIndex = player.processedLines.findIndex(
              (line: any) => line.startTime >= targetTime,
            );
            player.scrollToIndex = foundIndex === -1 ? player.processedLines.length : foundIndex;
          }

          // 强制执行底层的清理和重绘管线
          player.resetScroll?.();
          player.calcLayout?.();
        }
      }
    }
  };

  /**
   * FIXME: 这是一个临时的修补方案，用于解决使用 lyric 点击跳转位置不正确的情况，等待 AMLL 后续版本修复后可以删除。
   */
  // Lyric Ref
  const lyricRef = useRef<any>(null);

  // const [isScrolling, setIsScrolling] = useState(false); // 控制 UI 悬浮按钮的显隐
  const isScrollingRef = useRef(false); // 高性能逻辑锁，用于 60fps 渲染循环中判断
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 【核心修复1】将最新时间用 useRef 保存，打破 useEffect 的闭包陷阱
  const latestTimeMsRef = useRef(currentTimeMs);
  const lastPushedTimeRef = useRef(currentTimeMs);

  // 【新增】用于处理平滑跳转的保护期和帧间差
  const ignorePlayerTimeUntilRef = useRef(0);
  const lastTickTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(isPlaying);

  // 保持 isPlayingRef 与 store 同步，避免闭包陷阱
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    latestTimeMsRef.current = 0;
    lastPushedTimeRef.current = 0;
    ignorePlayerTimeUntilRef.current = 0;
  }, []);

  // 触发手动回溯模式（用户滚轮或滑动时触发）
  const handleUserInteraction = useCallback(() => {
    isScrollingRef.current = true;
    // setIsScrolling(true);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    // 停止交互 2 秒后，自动恢复歌词对齐
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      // setIsScrolling(false);
    }, 2000);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    // 确保每次 loop 能获取正确的初始时间戳
    lastTickTimeRef.current = performance.now();

    const onTimeUpdate = (e: Event) => {
      // 【核心优化】如果在跳转保护期内，果断丢弃底层播放器发来的旧时间
      if (Date.now() < ignorePlayerTimeUntilRef.current) return;
      latestTimeMsRef.current = (e as CustomEvent<number>).detail;
    };

    const renderLoop = (time: DOMHighResTimeStamp) => {
      // 计算两帧之间的时间差 (Delta Time)
      if (!lastTickTimeRef.current) lastTickTimeRef.current = time;
      const deltaTime = time - lastTickTimeRef.current;
      lastTickTimeRef.current = time;

      if (!isScrollingRef.current) {
        const now = Date.now();
        // 【工程化优化】处于跳转保护期内，且音乐正在播放时，我们手动推进时间。
        // 这样既屏蔽了播放器旧时间的干扰，又保证了传给组件的 currentTime 是连续变化的，促使其立刻执行滚动动画。
        if (now < ignorePlayerTimeUntilRef.current && isPlayingRef.current) {
          latestTimeMsRef.current += deltaTime;
        }

        const targetTime = latestTimeMsRef.current;
        // 避免重复 dispatch 给 Zustand
        if (lastPushedTimeRef.current !== targetTime) {
          setCurrentTimeMs(targetTime);
          lastPushedTimeRef.current = targetTime;
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener("player-time", onTimeUpdate);
    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("player-time", onTimeUpdate);
      cancelAnimationFrame(animationFrameId);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [setCurrentTimeMs]);

  // const yrcText = lyric?.yrc?.lyric?.trim() || "";
  const lrcText = lyric?.lrc?.lyric?.trim() || "";

  const parsedLyricLines = useMemo(() => {
    try {
      // const parsed = yrcText ? parseYrc(yrcText) : lrcText ? parseLrc(lrcText) : [];
      const parsed = lrcText ? parseLrc(lrcText) : [];
      return parsed.map((line: any, i: number, arr: any[]) => {
        const lineStart = line.words[0]?.startTime ?? 0;
        const nextLineStart = arr[i + 1]?.words[0]?.startTime;
        const lineEnd =
          nextLineStart !== undefined && Number.isFinite(nextLineStart)
            ? nextLineStart
            : Number.isFinite(line.endTime)
              ? line.endTime
              : lineStart + 5000;

        return {
          words: line.words.map((w: any, wi: number, warr: any[]) => {
            const wordStart = w.startTime ?? lineStart;
            const nextWordStart = warr[wi + 1]?.startTime;
            let wordEnd =
              nextWordStart !== undefined && Number.isFinite(nextWordStart)
                ? nextWordStart
                : lineEnd;
            if (!Number.isFinite(wordEnd)) wordEnd = wordStart + 500;
            return {
              word: w.word,
              startTime: Number.isFinite(wordStart) ? wordStart : 0,
              endTime: wordEnd,
              romanWord: "",
              obscene: false,
            };
          }),
          startTime: Number.isFinite(lineStart) ? lineStart : 0,
          endTime: Number.isFinite(lineEnd) ? lineEnd : lineStart + 5000,
          translatedLyric: "",
          romanLyric: "",
          isBG: false,
          isDuet: false,
        };
      });
    } catch (error) {
      console.error("Failed to parse lyrics:", error);
      return [];
    }
    // }, [yrcText, lrcText]);
  }, [lrcText]);

  return (
    <div
      className="w-full h-full relative overflow-hidden group"
      // 捕获用户的滑动意图，接管滚动
      onWheel={handleUserInteraction}
      onTouchMove={handleUserInteraction}
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      {false ? (
        <div className="w-full h-full flex items-center justify-center text-white/60 text-lg lg:text-xl font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          No Lyric available :(
        </div>
      ) : (
        <LyricPlayer
          ref={lyricRef} // 绑定实例指针
          className="w-full h-full font-bold"
          lyricLines={parsedLyricLines}
          currentTime={currentTimeMs}
          playing={isPlaying}
          alignAnchor="center"
          alignPosition={0.5}
          enableBlur={true}
          enableScale={true}
          hidePassedLines={false}
          onLyricLineClick={handleClickLyricLine}
        />
      )}
    </div>
  );
};
