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
    <div className="bg-calendar-surface shadow-calendar z-10 flex size-full shrink-0 flex-col overflow-hidden rounded-md select-none">
      <div className="border-calendar-divider from-calendar-accent to-calendar-accent-hover flex h-[22%] items-center justify-center border-b bg-linear-to-b">
        <span className="text-calendar-surface text-lg font-medium tracking-widest md:text-xl">
          {dayOfWeek}
        </span>
      </div>
      {/* eslint-disable-next-line tailwindcss/classnames-order -- Prettier owns the Tailwind v4 class order. */}
      <div className="from-calendar-surface to-calendar-surface-muted relative flex flex-1 items-center justify-center bg-linear-to-b from-45% to-45%">
        <div className="bg-calendar-divider absolute top-[45%] left-0 h-0.5 w-full -translate-y-1/2" />
        <span className="text-calendar-ink z-10 -mt-3 font-sans text-7xl font-black tracking-tighter md:text-8xl">
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
      <div className="bg-surface-elevated hover:scale-1.02 shadow-floating size-48 shrink-0 overflow-hidden rounded-md transition-transform duration-300 lg:size-56">
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

      <div className="text-content [container-type:inline-size] flex min-w-0 flex-1 flex-col justify-end md:min-h-48 lg:min-h-56">
        {/* Top: Privacy & Style Pill Badges */}
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2 md:mb-4">
          <span className="bg-content/10 rounded-sm px-3 py-1 text-sm tracking-wider uppercase">
            {info.privacy || "歌单"}
          </span>
          {info.tags?.map((tag) => (
            <span
              key={tag}
              className="bg-content/10 hover:bg-content/20 rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
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
        <div className="text-content/80 flex flex-wrap items-center gap-2.5 text-xs lg:text-sm">
          {!info.isSpecial && (
            <>
              <div className="text-content group mr-1 flex cursor-pointer items-center gap-2">
                {info.creatorAvatar ? (
                  <Image
                    src={info.creatorAvatar}
                    alt={info.creator || "creator"}
                    width={28}
                    height={28}
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-content/20 flex size-7 items-center justify-center rounded-full text-xs font-bold">
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
          <span className="text-content font-medium">
            {info.totalSongsLabel ?? `共 ${info.totalSongs} 首歌`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PlaylistHeader);
