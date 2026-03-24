"use client";

import { useState, useEffect, PointerEvent } from "react";
import { ChevronDown, ListMusic, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { ModalBackground } from "./ModalBackground";
import { PlayerControls } from "./PlayerControls";
import { LyricRenderer } from "./LyricRenderer";
import { QueuePanel } from "./QueuePanel";
import Image from "next/image";
import { PlayerProgressBar } from "../PlayBar/ProgressBar";

type MobileView = "cover" | "lyric" | "queue";
type DesktopView = "lyric" | "queue";
const MOBILE_VIEWS: MobileView[] = ["cover", "lyric", "queue"];

export const LyricModalContent = ({
  onClose = () => console.log("关闭"),
}: {
  onClose?: () => void;
}) => {
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const coverUrl = currentSongDetail?.al?.picUrl || "";

  const [mobileView, setMobileView] = useState<MobileView>("cover");
  const [desktopView, setDesktopView] = useState<DesktopView>("lyric");
  const [isClosing, setIsClosing] = useState(false);

  // 指针滑动相关状态 (兼容鼠标和触摸)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragEndX, setDragEndX] = useState<number | null>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 统一指针事件：支持鼠标按住拖拽 & 触摸滑动
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const onPointerDown = (e: PointerEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragEndX(null);
    // 可选：捕获指针，即使鼠标稍微移出元素外部也能继续追踪
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    setDragEndX(e.clientX);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (dragStartX !== null && dragEndX !== null) {
      const distance = dragStartX - dragEndX;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;
      const currentIndex = MOBILE_VIEWS.indexOf(mobileView);

      if (isLeftSwipe && currentIndex < MOBILE_VIEWS.length - 1) {
        setMobileView(MOBILE_VIEWS[currentIndex + 1]);
      }
      if (isRightSwipe && currentIndex > 0) {
        setMobileView(MOBILE_VIEWS[currentIndex - 1]);
      }
    }

    setDragStartX(null);
    setDragEndX(null);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-100 flex flex-col text-white h-dvh bg-[#0a0a0a] overflow-hidden transform-gpu",
        isClosing ? "animate-modal-exit" : "animate-modal-enter"
      )}
    >
      <ModalBackground coverUrl={coverUrl} />

      {/* ━━━━━━━━━━ 顶部控制栏 (全局公用) ━━━━━━━━━━ */}
      <div className="absolute top-0 left-0 w-full h-20 flex items-center justify-center z-50 px-6">
        <button
          onClick={handleClose}
          className="absolute left-6 p-2 bg-transparent text-white/80 hover:text-white transition-all active:scale-90"
        >
          <ChevronDown className="w-8 h-8" />
        </button>

        {/* 移动端：居中点状指示器 (Pagination Dots) */}
        <div className="flex lg:hidden items-center gap-2.5">
          {MOBILE_VIEWS.map((view) => (
            <button
              key={view}
              onClick={() => setMobileView(view)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 ease-out",
                mobileView === view ? "w-6 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "w-1.5 bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Switch to ${view}`}
            />
          ))}
        </div>
      </div>

      {/* ━━━━━━━━━━ 大屏：左侧垂直居中排版 + 右侧无边界歌词 ━━━━━━━━━━ */}
      <div className="hidden lg:flex relative z-10 w-full h-full max-w-350 mx-auto px-10
          flex-row items-center justify-between gap-12 xl:gap-20 overflow-hidden min-h-0">

        {/* 左侧播放区 */}
        <div className="w-[45%] max-w-125 h-full flex flex-col justify-center items-center shrink-0 min-h-0">
          <div className="w-full max-w-[clamp(240px,45vh,480px)] aspect-square rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.6)] bg-white/5 relative mb-8 group">
            {coverUrl ? (
              <Image fill src={coverUrl} alt="Cover" className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700 ease-out" draggable={false} />
            ) : (
              <div className="w-full h-full bg-[#1a1a1a]" />
            )}
          </div>

          <div className="flex flex-col w-full text-left mb-6 shrink-0 items-center">
            <h2 className="text-3xl xl:text-4xl font-extrabold truncate text-white tracking-tight">
              {currentSongDetail?.name || "Unknown Song"}
            </h2>
            <p className="text-lg xl:text-xl font-medium text-white/70 mt-1.5 truncate">
              {currentSongDetail?.ar?.map((a: any) => a.name).join(", ") || "Unknown Artist"}
            </p>
          </div>

          <div className="w-full shrink-0">
            <PlayerProgressBar />
            <PlayerControls />
          </div>
        </div>

        {/* 右侧 */}
        <div className="flex-1 h-[85%] min-h-0 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-6 z-20 flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/5 shadow-lg">
            <button
              onClick={() => setDesktopView("lyric")}
              className={cn("p-2 rounded-full transition-all", desktopView === "lyric" ? "bg-white/20 text-white shadow-sm" : "text-white/50 hover:text-white/80")}
            >
              <Mic2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDesktopView("queue")}
              className={cn("p-2 rounded-full transition-all", desktopView === "queue" ? "bg-white/20 text-white shadow-sm" : "text-white/50 hover:text-white/80")}
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 w-full h-full min-h-0 pt-16">
            {desktopView === "lyric" ? <LyricRenderer /> : <QueuePanel />}
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━ 小屏：统一指针滑动 + Pagination 点 ━━━━━━━━━━ */}
      {/* 核心改动：使用 onPointer 家族替代 onTouch，并增加 select-none 避免鼠标拖拽选中文字 */}
      <div
        className="flex lg:hidden relative z-10 w-full h-full flex-col overflow-hidden touch-pan-y min-h-0 cursor-default! active:cursor-default!
        select-none "
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp} // 鼠标移出屏幕中断时，也走结算逻辑
      >
        <div
          className="flex w-full h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${MOBILE_VIEWS.indexOf(mobileView) * 100}%)` }}
        >
          {/* === 第一页：Cover === */}
          <div className="w-full h-full shrink-0 flex flex-col justify-end px-6 pb-12 pt-24 overflow-y-auto min-h-0">
            <div className="flex-1 min-h-0 flex flex-col justify-center items-center">
              <div className="w-full max-w-[clamp(240px,40vh,360px)] aspect-square rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-white/5 relative">
                {coverUrl ? (
                  <Image fill src={coverUrl}
                    alt="Cover"
                    className="w-full h-full object-cover absolute inset-0 pointer-events-none" draggable={false}
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1a]" />
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col w-full text-left mb-6 shrink-0">
              <h2 className="text-3xl font-extrabold truncate text-white tracking-tight">
                {currentSongDetail?.name || "Unknown Song"}
              </h2>
              <p className="text-lg font-medium text-white/70 mt-1 truncate">
                {currentSongDetail?.ar?.map((a: any) => a.name).join(", ") || "Unknown Artist"}
              </p>
            </div>
            <div className="w-full shrink-0">
              <PlayerProgressBar />
              <PlayerControls />
            </div>
          </div>

          {/* === 第二页：Lyric === */}
          <div className="w-full h-full shrink-0 flex flex-col pt-24 pb-8 px-4 min-h-0">
            <div className="flex-1 min-h-0 px-2">
              <LyricRenderer />
            </div>
          </div>

          {/* === 第三页：Queue === */}
          <div className="w-full h-full shrink-0 flex flex-col pt-24 pb-8 px-4 min-h-0">
            <div className="flex-1 min-h-0">
              <QueuePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
