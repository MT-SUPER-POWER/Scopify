import Image from "next/image";

import type { AlbumInfo } from "@/types/album";

import { useI18n } from "@/store/module/i18n";

interface AlbumHeaderProps {
  info: AlbumInfo;
  onArtistClick: () => void;
}

export function AlbumHeader({ info, onArtistClick }: AlbumHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="relative z-10 flex flex-col items-start gap-6 px-6 pt-24 pb-6 md:flex-row">
      <div className="hover:scale-1.02 size-48 shrink-0 overflow-hidden rounded-md bg-black/20 shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 lg:size-56">
        <Image
          width={200}
          height={200}
          src={info.cover || ""}
          alt={info.title}
          className="size-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col pt-1 text-white md:pt-2">
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2 md:mb-4">
          <span className="rounded-sm bg-white/10 px-3 py-1 text-sm tracking-wider uppercase drop-shadow-md">
            {info.type}
          </span>
          {info.subType && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium drop-shadow-md">
              {info.subType}
            </span>
          )}
        </div>
        <h1
          className="leading-1.1 m-0 mb-4 line-clamp-3 text-4xl font-black tracking-tighter wrap-break-word drop-shadow-lg md:mb-6 md:text-5xl lg:text-6xl"
          title={info.title}
        >
          {info.title}
        </h1>
        {info.description && (
          <p className="mb-4 line-clamp-2 max-w-2xl text-sm leading-relaxed font-normal text-white/70 drop-shadow-md">
            {info.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
          <button
            type="button"
            onClick={onArtistClick}
            className="group mr-1 flex cursor-pointer items-center gap-2 text-white"
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
              <div className="flex size-7 items-center justify-center rounded-full bg-zinc-600 text-xs font-bold">
                {info.artistName?.charAt(0) || "A"}
              </div>
            )}
            <span className="text-[15px] font-bold group-hover:underline">{info.artistName}</span>
          </button>
          <span className="hidden opacity-60 sm:inline">•</span>
          <span>{info.releaseYear}</span>
          <span className="opacity-60">•</span>
          <span className="font-medium text-white">
            {t("album.totalSongs", { count: info.totalSongs })}
          </span>
        </div>
      </div>
    </div>
  );
}
