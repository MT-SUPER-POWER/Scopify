"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useEffect, useState } from "react";
import { SkipBack, Play, SkipForward, Heart, Minus, MicVocal, Settings, Power } from "lucide-react";
import { useRouter } from "next/navigation";

// 引入 shadcn 组件
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SongTitle } from "@/components/Marquee";
import { VolumeControl } from "@/components/VolumeControl";

// 引入自定义 Hook 和状态管理
import { usePlayerStore } from "@/store";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function useIsElectron() {
  const [isElectron, setIsElectron] = useState<boolean | null>(null);
  useEffect(() => {
    const isE = typeof window !== "undefined" && (window.navigator.userAgent.includes("Electron") || !!(window as any).electronAPI);
    setIsElectron(isE);
  }, []);
  return isElectron;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function TrayPage() {
  const router = useRouter();
  const isElectron = useIsElectron();
  const volume = usePlayerStore((state) => state.volume);
  const handleVolumeChange = (newVolume: number) => {
    usePlayerStore.getState().setVolume(newVolume);
  };

  // 路由跳转副作用，必须放在所有 Hook 之前
  useEffect(() => {
    if (isElectron === false && typeof window !== "undefined") {
      router.replace("/");
    }
  }, [isElectron, router]);

  useEffect(() => {
    // 强制 body 透明，防止背景黑色
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
    }
  }, []);

  if (isElectron === null) return null;
  if (!isElectron) return null;

  // 提取公共样式
  const iconClass = "w-4 h-4 mr-2";
  // 覆盖 Button 的默认样式，让其更像一个菜单项
  const menuItemClass = "w-full justify-start px-3 py-5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-md font-normal transition-colors h-9";

  return (
    <div className="w-full h-full bg-[#222226] text-white flex flex-col font-sans select-none overflow-hidden rounded-xl border border-white/10 shadow-2xl p-2 gap-1 text-[13px] font-medium animate-in fade-in zoom-in-95 duration-200">

      {/* 头部：当前歌曲 - 固定 */}

      {/* TODO: 动态接入正在播放的歌曲 */}
      <SongTitle title="Cold Cold Man - FITZ and The Tantrums" />

      <Separator className="my-1.5 bg-white/10" />

      {/* 可滚动区域 */}
      <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden pr-1">

        {/* 播放控制区 - 固定 */}
        <div className="flex items-center justify-between px-4 py-1 shrink-0">
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <Play className="w-6 h-6 fill-current" />
          </button>
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <Heart className="w-6 h-6" />
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

        {/* 其他普通菜单项 */}
        <Button variant="ghost" className={menuItemClass}>
          <Minus className={iconClass} />
          最小化
        </Button>

        <Separator className="my-1.5 bg-white/10" />

        <Button variant="ghost" className={menuItemClass}>
          <MicVocal className={iconClass} />
          打开桌面歌词
        </Button>

        <Separator className="my-1.5 bg-white/10" />

        <Button variant="ghost" className={`${menuItemClass}`}>
          <Settings className={iconClass} />
          <span>设置</span>
        </Button>

        <Separator className="my-1.5 bg-white/10" />

        <Button variant="ghost" className={menuItemClass}>
          <Power className={iconClass} />
          <span>退出</span>
        </Button>
      </ScrollArea>

    </div>
  );
}
