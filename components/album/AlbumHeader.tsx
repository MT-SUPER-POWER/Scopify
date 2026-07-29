import Image from "next/image";

import type { AlbumInfo } from "@/types/album";

import { useI18n } from "@/store/module/i18n";

interface AlbumHeaderProps {
  info: AlbumInfo;
  onArtistClick: () => void;
}

function getTitleFontSizeClass(title?: string): string {
  const len = title?.length || 0;
  if (len > 30) return "text-2xl sm:text-3xl md:text-4xl lg:text-5xl";
  if (len > 18) return "text-3xl sm:text-4xl md:text-5xl lg:text-6xl";
  return "text-4xl sm:text-5xl md:text-6xl lg:text-7xl";
}

export function AlbumHeader({ info, onArtistClick }: AlbumHeaderProps) {
  const { t } = useI18n();
  const titleSizeClass = getTitleFontSizeClass(info.title);

  return (
    <div className="relative z-10 flex flex-col items-start gap-7 px-6 pt-24 pb-7 md:flex-row md:items-stretch md:gap-8 md:px-8 lg:px-10 xl:px-12">
      <div className="hover:scale-1.02 size-48 shrink-0 overflow-hidden rounded-md bg-black/20 shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 lg:size-56">
        <Image
          width={400}
          height={400}
          src={info.cover || ""}
          alt={info.title}
          className="size-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-end text-white md:min-h-48 lg:min-h-56">
        {/* Top: Album Type Badges */}
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2 md:mb-4">
          <span className="rounded-sm bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase drop-shadow-md">
            {info.type || "专辑"}
          </span>
          {info.subType && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium drop-shadow-md">
              {info.subType}
            </span>
          )}
        </div>

        {/* Album Title */}
        <h1
          className={`m-0 mb-3 line-clamp-2 leading-[1.15] font-black tracking-normal wrap-break-word text-white drop-shadow-lg md:mb-4 ${titleSizeClass}`}
          title={info.title}
        >
          {info.title}
        </h1>

        {/* Description */}
        {info.description && (
          <p
            className="mb-4 line-clamp-2 max-w-2xl text-xs leading-relaxed font-normal text-white/70 drop-shadow-md md:mb-5 lg:text-sm"
            title={info.description}
          >
            {info.description}
          </p>
        )}

        {/* Bottom: Artist & Metadata line */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/80 drop-shadow-md lg:text-sm">
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
