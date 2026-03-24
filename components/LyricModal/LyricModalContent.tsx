"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { ModalBackground } from "./ModalBackground";
import { PlayerControls } from "./PlayerControls";
import { LyricRenderer } from "./LyricRenderer";
import { QueuePanel } from "./QueuePanel";
import Image from "next/image";
import { PlayerProgressBar } from "../PlayBar/ProgressBar";

type MobileView = "cover" | "lyric" | "queue";
type DesktopTab = "lyric" | "queue";

// TODO: 把里面所有的 motion.div 且是持续的动画换为原生 css 或者使用原本效果，防止 CPU 高占用问题
// TODO: 布局和样式优化

export const LyricModalContent = ({
  onClose = () => console.log('关闭按钮被点击')
}: { onClose?: () => void }) => {
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const coverUrl = currentSongDetail?.al?.picUrl || "";
  const [mobileView, setMobileView] = useState<MobileView>("cover");
  const [desktopTab, setDesktopTab] = useState<DesktopTab>("lyric");

  // 用于控制纯 CSS 退出动画的状态
  const [isClosing, setIsClosing] = useState(false);

  // 触发退出动画，等待动画执行完毕后再实际卸载组件
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // 300ms 和下面的退出动画时间保持一致
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[100] flex flex-col text-white h-dvh bg-[#0a0a0a] overflow-hidden transform-gpu",
          isClosing ? "animate-modal-exit" : "animate-modal-enter"
        )}
      >
        <ModalBackground coverUrl={coverUrl} />
        <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />

        {/* 关闭按钮 */}
        <div className="absolute top-8 left-8 z-50">
          <button
            onClick={handleClose}
            className="p-2 lg:p-3 bg-black/20 hover:bg-white/10 text-white/80 hover:text-white rounded-full backdrop-blur-md transition-all duration-300"
          >
            <ChevronDown className="w-6 h-6 lg:w-7 lg:h-7" />
          </button>
        </div>

        {/* 大屏：左右布局 */}
        <div className="hidden lg:flex relative z-10 w-full h-full max-w-[1400px] mx-auto px-20 py-10 flex-row items-center justify-center gap-24 overflow-hidden">
          <div className="shrink-0 w-[45%] max-w-[480px] flex flex-col">
            <div className="w-full aspect-square rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/5 border border-white/5 relative">
              {coverUrl ? (
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover absolute inset-0" />
              ) : (
                <div className="w-full h-full bg-[#1a1a1a]" />
              )}
            </div>
            <div className="mt-10 flex flex-col w-full text-left">
              <h2 className="text-3xl font-bold truncate text-white tracking-tight">
                {currentSongDetail?.name || "Unknown Song"}
              </h2>
              <p className="text-lg font-medium text-[#b3b3b3] mt-1.5 truncate">
                {currentSongDetail?.ar?.map((a: any) => a.name).join(", ") || "Unknown Artist"}
              </p>
            </div>
            <PlayerProgressBar />
            <PlayerControls />
          </div>

          {/* 右侧：歌词/队列 tab */}
          <div className="flex-1 h-[85%] flex flex-col gap-4">
            <div className="flex items-center gap-1 shrink-0 self-start bg-white/10 rounded-full p-1">
              {(["lyric", "queue"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDesktopTab(tab)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                    desktopTab === tab ? "bg-white text-black" : "text-white/60 hover:text-white"
                  )}
                >
                  {tab === "lyric" ? "Lyrics" : "Queue"}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 relative">
              {desktopTab === "lyric" ? <LyricRenderer /> : <QueuePanel />}
            </div>
          </div>
        </div>

        {/* 小屏：顶部胶囊 tab + 三视图 */}
        <div className="flex lg:hidden relative z-10 w-full h-full flex-col overflow-hidden">
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
            {(["cover", "lyric", "queue"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setMobileView(view)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  mobileView === view ? "bg-white text-black" : "text-white/60 hover:text-white"
                )}
              >
                {view === "cover" ? "Cover" : view === "lyric" ? "Lyrics" : "Queue"}
              </button>
            ))}
          </div>

          {/* 使用简单的原生条件渲染替代 AnimatePresence */}
          {mobileView === "cover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-start px-8 pt-20 pb-10 overflow-y-auto animate-view-enter transform-gpu">
              <div className="w-full max-w-80 aspect-square rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/5 border border-white/5 relative">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover absolute inset-0" />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1a]" />
                )}
              </div>
              <div className="mt-6 flex flex-col w-full max-w-80 text-left">
                <h2 className="text-2xl font-bold truncate text-white tracking-tight">
                  {currentSongDetail?.name || "Unknown Song"}
                </h2>
                <p className="text-base font-medium text-[#b3b3b3] mt-1.5 truncate">
                  {currentSongDetail?.ar?.map((a: any) => a.name).join(", ") || "Unknown Artist"}
                </p>
              </div>
              <div className="w-full max-w-80">
                <PlayerProgressBar />
                <PlayerControls />
              </div>
            </div>
          )}

          {mobileView === "lyric" && (
            <div className="absolute inset-0 flex flex-col pt-20 pb-4 animate-view-enter transform-gpu">
              <div className="flex-1 min-h-0">
                <LyricRenderer />
              </div>
            </div>
          )}

          {mobileView === "queue" && (
            <div className="absolute inset-0 flex flex-col pt-20 pb-4 animate-view-enter transform-gpu">
              <div className="flex-1 min-h-0">
                <QueuePanel />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
