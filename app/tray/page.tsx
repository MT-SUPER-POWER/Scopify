"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useEffect, useMemo, useState } from "react";

// 引入 UI 组件
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SongTitle } from "@/components/Marquee";
import { VolumeControl } from "@/components/VolumeControl";
import { SkipBack, Play, SkipForward, Heart, MicVocal, Settings, Power, Minimize, Pause } from "lucide-react";

// 引入自定义 Hook 和状态管理
import { usePlayerStore, useUserStore } from "@/store";
import { useSmartRouter } from '@/lib/hooks/useSmartRouter';
import { IS_ELECTRON } from "@/lib/utils";
import { likeSong } from "@/lib/api/playlist";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function TrayPage() {
  const smartRouter = useSmartRouter();
  const [mounted, setMounted] = useState(false);
  const isElectron = IS_ELECTRON;

  // 建立通信频道
  const commandChannel = useMemo(() => {
    return IS_ELECTRON ? new BroadcastChannel('momo-player-controls') : null;
  }, []);

  // 播放器核心状态（仅读取用于展示）
  const volume = usePlayerStore((state) => state.volume);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const likeList = useUserStore((state) => state.likeListIDs) || [];
  const isLiked = currentSong && likeList.includes(currentSong.id);

  // ━━━━━━ 发送遥控指令，不直接执行 ━━━━━━
  const playNext = () => commandChannel?.postMessage({ type: 'PLAY_NEXT' });
  const playPrev = () => commandChannel?.postMessage({ type: 'PLAY_PREV' });
  const togglePlay = () => commandChannel?.postMessage({ type: 'TOGGLE_PLAY' });
  const handleVolumeChange = (newVolume: number) => {
    commandChannel?.postMessage({ type: 'SET_VOLUME', payload: newVolume });
  };
  const toggleLike = (isLiked: boolean) => {
    commandChannel?.postMessage({ type: 'TOGGLE_LIKE', payload: isLiked });
  }

  // Main 和 Tray 之间的状态同步逻辑
  useEffect(() => {
    if (!IS_ELECTRON) return;
    const stateChannel = new BroadcastChannel('momo-player-state');
    const commandChannel = new BroadcastChannel('momo-player-controls');

    // 收到主窗口的状态，直接同步到托盘的 Zustand 内存中
    stateChannel.onmessage = (event) => {
      usePlayerStore.setState(event.data);
    };

    // 托盘刚打开时，向主窗口要一次当前最新的状态（防止主窗口没变化时托盘数据滞后）
    commandChannel?.postMessage({ type: 'REQUEST_STATE' });

    return () => stateChannel.close();
  }, [commandChannel]);

  // 路由跳转副作用，必须放在所有 Hook 之前
  useEffect(() => {
    if (isElectron === false && typeof window !== "undefined") {
      smartRouter.replace("/");
    }
  }, [isElectron, smartRouter]);

  // 强制 body 透明，防止背景黑色
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
    }
  }, []);

  // 水合问题
  useEffect(() => {
    Promise.resolve().then(() => { setMounted(true); });
  }, []);

  if (!mounted) {
    return <div className="w-full h-full" />;
  }

  if (!isElectron) return null;

  // 提取公共样式
  const iconClass = "w-4 h-4 mr-2";
  // 覆盖 Button 的默认样式，让其更像一个菜单项
  const menuItemClass = "w-full justify-start px-3 py-5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-md font-normal transition-colors h-9";

  return (
    <div className="w-full h-full bg-[#222226] text-white flex flex-col font-sans select-none overflow-hidden rounded-xl border border-white/10 shadow-2xl p-2 gap-1 text-[13px] font-medium animate-in fade-in zoom-in-95 duration-200">

      {/* 头部：当前歌曲 - 固定 */}
      <SongTitle title={`${currentSong?.name || "Unknown Song"} -
        ${currentSong?.ar?.[0]?.name || "Unknown Artist"}`} />

      <Separator className="my-1.5 bg-white/10" />

      {/* 可滚动区域 */}
      <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden pr-1">

        {/* 播放控制区 - 固定 */}
        <div className="flex items-center justify-between px-4 py-1 shrink-0">
          <button
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            onClick={playPrev}
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
          >
            {/* 修复：这里正确判断并显示 Pause 或 Play 图标 */}
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current" />
            )}
          </button>

          <button
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            onClick={playNext}
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button
            className={`p-1.5 rounded-full transition-all ${isLiked ? "text-[#1ed760]" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
            onClick={() => toggleLike(!isLiked)}
            title={isLiked ? "Unlike" : "Like"}
          >
            <Heart className={`w-6 h-6 ${isLiked ? "fill-[#1ed760]" : ""}`} />
          </button>
        </div>

        <Separator className="my-1.5 bg-white/10" />

        {/* 音量条区 */}
        <VolumeControl
          initialVolume={volume}
          onChange={handleVolumeChange}
          orientation="horizontal"
          variant="inline"
        />

        <Separator className="my-1.5 bg-white/10" />

        <Button variant="ghost" className={menuItemClass}>
          <MicVocal className={iconClass} />
          打开桌面歌词
        </Button>

        <Separator className="my-1.5 bg-white/10" />

        {/* 主窗口跳转设置页面 */}
        <Button
          variant="ghost"
          className={`${menuItemClass}`}
          onClick={() => window.electronAPI?.navigateTo("/setting")}
        >
          <Settings className={iconClass} />
          <span>设置</span>
        </Button>

        <Separator className="my-1.5 bg-white/10" />

        {/* 最小化和退出 */}
        <Button variant="ghost" className={menuItemClass} onClick={() => window.electronAPI?.minimizeApp()}>
          <Minimize className={iconClass} />
          <span>最小化</span>
        </Button>

        <Button variant="ghost" className={menuItemClass} onClick={() => window.electronAPI?.exitApp()}>
          <Power className={iconClass} />
          <span>退出</span>
        </Button>
      </ScrollArea>
    </div>
  );
}
