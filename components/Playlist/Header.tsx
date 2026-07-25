"use client";

import Image from "next/image";
import React from "react";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import type { PlaylistInfo } from "@/types/playlist";

const DailyCalendarCover = ({ dailyDate }: { dailyDate?: string }) => {
  const requestedDate = dailyDate ? new Date(`${dailyDate}T00:00:00`) : new Date();
  const displayDate = Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate;
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const dayOfWeek = days[displayDate.getDay()];
  const dateNum = displayDate.getDate();

  return (
    <div className="z-10 flex size-full shrink-0 flex-col overflow-hidden rounded-md bg-white shadow-[4px_0_10px_rgba(0,0,0,0.3)] select-none">
      <div className="flex h-[22%] items-center justify-center border-b border-black/10 bg-linear-to-b from-[#e34242] to-[#c42b2b]">
        <span className="text-lg font-medium tracking-widest text-white md:text-xl">
          {dayOfWeek}
        </span>
      </div>
      <div className="from-momo-light relative flex flex-1 items-center justify-center bg-linear-to-b from-45% to-[#e6e6e6] to-45%">
        <div className="absolute top-[45%] left-0 h-0.5 w-full -translate-y-1/2 bg-black/5 shadow-[0_1px_1px_rgba(255,255,255,0.8)]" />
        <span className="z-10 -mt-3 font-sans text-7xl font-black tracking-tighter text-[#2a2a2a] md:text-8xl">
          {dateNum}
        </span>
      </div>
    </div>
  );
};

interface PlaylistHeaderProps {
  info: PlaylistInfo;
  isDaily: boolean;
}

const PlaylistHeader = ({ info, isDaily }: PlaylistHeaderProps) => {
  const smartRouter = useSmartRouter();

  const handleCreatorClick = () => {
    if (info.creatorHref) {
      smartRouter.push(info.creatorHref);
      return;
    }
    if (info.creatorID !== null) {
      smartRouter.push(`/profile?userId=${info.creatorID}`);
    }
  };

  return (
    <div className="relative z-10 flex flex-col items-start gap-6 px-6 pt-24 pb-6 md:flex-row">
      <div className="hover:scale-1.02 size-48 shrink-0 overflow-hidden rounded-md bg-black/20 shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 lg:size-56">
        {isDaily || !info.cover ? (
          <DailyCalendarCover dailyDate={info.dailyDate} />
        ) : (
          <Image
            width={400}
            height={400}
            src={info.cover}
            alt={info.title}
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-1 text-white md:pt-2">
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2 md:mb-4">
          <span className="rounded-sm bg-white/10 px-3 py-1 text-sm tracking-wider uppercase drop-shadow-md">
            {info.privacy}
          </span>
          {info.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium drop-shadow-md transition-colors hover:bg-white/20"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1
          className="leading-1.1 m-0 mb-4 line-clamp-3 text-4xl font-black tracking-tighter wrap-break-word drop-shadow-lg md:mb-6 md:text-5xl lg:text-6xl"
          title={info.title}
        >
          {info.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
          {!info.isSpecial && (
            <>
              <div className="group mr-1 flex cursor-pointer items-center gap-2 text-white">
                {info.creatorAvatar ? (
                  <Image
                    src={info.creatorAvatar}
                    alt={info.creator}
                    width={28}
                    height={28}
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-zinc-600 text-xs font-bold">
                    M
                  </div>
                )}
                <span className="text-[15px] font-bold group-hover:underline">
                  <button type="button" onClick={handleCreatorClick}>
                    {info.creator}
                  </button>
                </span>
              </div>
              <span className="hidden opacity-60 sm:inline">•</span>
              <span>{info.createTimeLabel ?? `${info.createTime} 创建`}</span>
              <span className="opacity-60">•</span>
              <span>{info.likesLabel ?? `${info.likes.toLocaleString()} 次收藏`}</span>
              <span className="opacity-60">•</span>
            </>
          )}
          <span className="font-medium text-white">
            {info.totalSongsLabel ?? `共 ${info.totalSongs} 首歌`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PlaylistHeader);
