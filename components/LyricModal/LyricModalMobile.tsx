"use client";

import { useState, PointerEvent } from "react";
import Image from "next/image";
import { PlayerProgressBar } from "../PlayBar/ProgressBar";
import { PlayerControls } from "./PlayerControls";
import { LyricRenderer } from "./LyricRenderer";
import { QueuePanel } from "./QueuePanel";

export type MobileView = "cover" | "lyric" | "queue";
export const MOBILE_VIEWS: MobileView[] = ["cover", "lyric", "queue"];

interface MobilePlayerViewProps {
  mobileView: MobileView;
  setMobileView: (view: MobileView) => void;
  coverUrl: string;
  currentSongDetail: any;
}

export const MobilePlayerView = ({
  mobileView,
  setMobileView,
  coverUrl,
  currentSongDetail,
}: MobilePlayerViewProps) => {
  // 仅在移动端视图内部使用的手势状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragEndX, setDragEndX] = useState<number | null>(null);

  const onPointerDown = (e: PointerEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragEndX(null);
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
      className="flex lg:hidden relative z-10 w-full h-full flex-col overflow-hidden touch-pan-y min-h-0 cursor-default! active:cursor-default! select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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
                <Image
                  fill
                  src={coverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover absolute inset-0 pointer-events-none"
                  draggable={false}
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
  );
};
