import type { Metadata } from "next";
import { Suspense } from "react";
import { MvPageProvider } from "./_components/MvPageProvider";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "MV",
  description: "观看 MV 并浏览相似 MV",
};

/**
 * MV 页（参考 YouTube 观看页）：播放器与信息评论在左，相似 MV 在右（窄窗口时排到下方）。
 * 剧场模式由 MvPageProvider 写在祖先的 data-theater 上，栅格切换全部用样式完成，播放器不会重建。
 */
export default function MvLayout({
  children,
  player,
  similar,
}: {
  children: React.ReactNode;
  player: React.ReactNode;
  similar: React.ReactNode;
}) {
  return (
    <Suspense>
      <MvPageProvider>
        <div
          className={cn(
            "mx-auto grid w-full gap-x-6 pb-10 text-content xl:grid-rows-[min-content_1fr]",
            "group-data-[theater=true]/mv:max-w-none group-data-[theater=true]/mv:bg-surface xl:group-data-[theater=true]/mv:grid-cols-[minmax(0,1fr)_520px] dark:group-data-[theater=true]/mv:bg-[#0f0f0f]",
            "group-data-[theater=false]/mv:max-w-400 group-data-[theater=false]/mv:px-6 group-data-[theater=false]/mv:pt-6 xl:group-data-[theater=false]/mv:grid-cols-[minmax(0,1fr)_402px]",
          )}
        >
          <div className="min-w-0 group-data-[theater=true]/mv:col-span-full xl:col-start-1 xl:row-start-1">
            {player}
          </div>
          <div className="min-w-0 group-data-[theater=true]/mv:px-6 xl:col-start-1 xl:row-start-2">
            {children}
          </div>
          <aside
            className={cn(
              "min-w-0 xl:col-start-2",
              "group-data-[theater=true]/mv:p-6 xl:group-data-[theater=true]/mv:row-start-2",
              "group-data-[theater=false]/mv:mt-6 xl:group-data-[theater=false]/mv:row-span-2 xl:group-data-[theater=false]/mv:row-start-1 xl:group-data-[theater=false]/mv:mt-0",
            )}
          >
            {similar}
          </aside>
        </div>
      </MvPageProvider>
    </Suspense>
  );
}
