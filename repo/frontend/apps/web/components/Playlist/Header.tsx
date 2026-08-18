"use client";

import Image from "next/image";
import React from "react";

import { HeaderDescription } from "@/components/shared/HeaderDescription";
import { ResponsiveHeaderTitle } from "@/components/shared/ResponsiveHeaderTitle";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import type { PlaylistInfo } from "@/types/playlist";

const DailyCalendarCover = ({ dailyDate }: { dailyDate?: string }) => {
  const requestedDate = dailyDate ? new Date(`${dailyDate}T00:00:00`) : new Date();
  const displayDate = Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate;
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const dayOfWeek = days[displayDate.getDay()];
  const dateNum = displayDate.getDate();

  return (
    <div className="z-10 flex size-full shrink-0 flex-col overflow-hidden rounded-md bg-calendar-surface shadow-calendar select-none">
      <div className="flex h-[22%] items-center justify-center border-b border-calendar-divider bg-linear-to-b from-calendar-accent to-calendar-accent-hover">
        <span className="text-lg font-medium tracking-widest text-calendar-surface md:text-xl">
          {dayOfWeek}
        </span>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-linear-to-b from-calendar-surface from-45% to-calendar-surface-muted to-45%">
        <div className="absolute top-[45%] left-0 h-0.5 w-full -translate-y-1/2 bg-calendar-divider" />
        <span className="z-10 -mt-3 font-sans text-7xl font-black tracking-tighter text-calendar-ink md:text-8xl">
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
    <div className="relative z-10 flex flex-col items-start gap-7 px-6 pt-24 pb-7 md:flex-row md:items-stretch md:gap-8 md:px-8 lg:px-10 xl:px-12">
      <div className="hover:scale-1.02 size-48 shrink-0 overflow-hidden rounded-md bg-surface-elevated shadow-floating transition-transform duration-300 lg:size-56">
        {isDaily || !info.cover ? (
          <DailyCalendarCover dailyDate={info.dailyDate} />
        ) : (
          <Image
            width={400}
            height={400}
            src={info.cover}
            alt={info.title || "cover"}
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="[container-type:inline-size] flex min-w-0 flex-1 flex-col justify-end text-content md:min-h-48 lg:min-h-56">
        {/* Top: Privacy & Style Pill Badges */}
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2 md:mb-4">
          <span className="rounded-sm bg-content/10 px-3 py-1 text-sm tracking-wider uppercase">
            {info.privacy || "歌单"}
          </span>
          {info.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-content/10 px-3 py-1 text-[12px] font-medium transition-colors hover:bg-content/20"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <div className="mb-3 flex h-16 min-w-0 items-center overflow-hidden md:mb-4 lg:h-20">
          <ResponsiveHeaderTitle title={info.title} />
        </div>

        {/* Description */}
        <HeaderDescription
          cover={info.cover}
          description={info.description}
          title={info.title}
          triggerClassName="mb-4 md:mb-5"
        />

        {/* Bottom: Creator & Metadata line */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-content/80 lg:text-sm">
          {!info.isSpecial && (
            <>
              <div className="group mr-1 flex cursor-pointer items-center gap-2 text-content">
                {info.creatorAvatar ? (
                  <Image
                    src={info.creatorAvatar}
                    alt={info.creator || "creator"}
                    width={28}
                    height={28}
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-content/20 text-xs font-bold">
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
              <span className="hidden sm:inline">
                {info.createTimeLabel ?? `${info.createTime} 创建`}
              </span>
              <span className="opacity-60">•</span>
              <span>{info.likesLabel ?? `${info.likes.toLocaleString()} 次收藏`}</span>
              <span className="opacity-60">•</span>
            </>
          )}
          <span className="font-medium text-content">
            {info.totalSongsLabel ?? `共 ${info.totalSongs} 首歌`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PlaylistHeader);
