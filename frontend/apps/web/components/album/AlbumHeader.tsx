"use client";

import Image from "next/image";
import { useState } from "react";

import { AlbumDescriptionDialog } from "@/components/album/AlbumDescriptionDialog";
import { ResponsiveHeaderTitle } from "@/components/shared/ResponsiveHeaderTitle";

import { useI18n } from "@/store/module/i18n";
import type { AlbumHeaderProps } from "@/types/components/album";

export function AlbumHeader({ info, onArtistClick }: AlbumHeaderProps) {
  const { t } = useI18n();
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  return (
    <div className="relative z-10 flex flex-col items-start gap-7 px-6 pt-24 pb-7 md:flex-row md:items-end md:gap-8 md:px-8 lg:px-10 xl:px-12">
      <div className="bg-surface-elevated hover:scale-1.02 shadow-floating size-48 shrink-0 overflow-hidden rounded-md transition-transform duration-300 lg:size-56">
        <Image
          width={400}
          height={400}
          src={info.cover || ""}
          alt={info.title}
          className="size-full object-cover"
        />
      </div>

      <div className="text-content [container-type:inline-size] grid h-48 w-full min-w-0 grid-rows-[1.5rem_4rem_3.5rem_1.75rem] content-end gap-y-1.5 overflow-hidden md:flex-1 lg:h-56 lg:grid-rows-[1.5rem_5rem_3.5rem_1.75rem]">
        {/* Top: Album Type Badges */}
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span className="bg-content/10 max-w-[45%] truncate rounded-sm px-3 py-1 text-xs font-semibold tracking-wider uppercase">
            {info.type || t("album.meta.type")}
          </span>
          {info.subType && (
            <span className="bg-content/10 max-w-[45%] truncate rounded-full px-3 py-1 text-[12px] font-medium">
              {info.subType}
            </span>
          )}
        </div>

        {/* Album Title */}
        <div className="flex min-w-0 items-center overflow-hidden">
          <ResponsiveHeaderTitle title={info.title} />
        </div>

        {/* Description */}
        {info.description && (
          <button
            type="button"
            aria-expanded={isDescriptionOpen}
            aria-haspopup="dialog"
            onClick={() => setIsDescriptionOpen(true)}
            className="group hover:bg-content/5 focus-visible:ring-brand/50 -ml-2 flex h-full max-w-2xl min-w-0 cursor-pointer flex-col justify-center overflow-hidden rounded-lg px-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="text-content/70 group-hover:text-content/85 line-clamp-2 text-xs leading-[18px] font-normal transition-colors lg:text-sm">
              {info.description}
            </span>
          </button>
        )}
        {!info.description && <div aria-hidden />}

        {/* Bottom: Artist & Metadata line */}
        <div className="text-content/80 flex min-w-0 flex-nowrap items-center gap-2.5 overflow-hidden text-xs whitespace-nowrap lg:text-sm">
          <button
            type="button"
            onClick={onArtistClick}
            className="text-content group mr-1 flex max-w-[45%] min-w-0 cursor-pointer items-center gap-2"
          >
            {info.artistAvatar ? (
              <Image
                width={28}
                height={28}
                src={info.artistAvatar}
                alt={info.artistName}
                className="size-7 rounded-full object-cover"
              />
            ) : (
              <div className="bg-content/20 flex size-7 items-center justify-center rounded-full text-xs font-bold">
                {info.artistName?.charAt(0) || "A"}
              </div>
            )}
            <span className="truncate text-[15px] font-bold group-hover:underline">
              {info.artistName}
            </span>
          </button>
          <span className="hidden shrink-0 opacity-60 sm:inline">•</span>
          <span className="shrink-0">{info.releaseYear}</span>
          <span className="shrink-0 opacity-60">•</span>
          <span className="text-content shrink-0 font-medium">
            {t("album.totalSongs", { count: info.totalSongs })}
          </span>
        </div>
      </div>

      {info.description && (
        <AlbumDescriptionDialog
          info={info}
          open={isDescriptionOpen}
          onOpenChange={setIsDescriptionOpen}
        />
      )}
    </div>
  );
}
