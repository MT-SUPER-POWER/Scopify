import { ArrowDownCircle, Heart, List, MoreHorizontal, Pause, Play, Search, Shuffle, X } from "lucide-react";
import Image from "next/image";
import type { AlbumInfo } from "@/hooks/album/useAlbumData";
import { formatDuration } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

interface AlbumHeaderProps {
  info: AlbumInfo;
  themeColor: string;
  onArtistClick: () => void;
}

export function AlbumHeader({ info, themeColor, onArtistClick }: AlbumHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 px-6 pt-24 pb-6">
      <div className="w-48 h-48 lg:w-56 lg:h-56 shrink-0 transition-transform duration-300 hover:scale-[1.02]
        shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-md overflow-hidden bg-black/20">
        <Image width={200} height={200} src={info.cover || ""} alt={info.title}
          className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col flex-1 min-w-0 text-white pt-1 md:pt-2">
        <div className="flex flex-row gap-2 flex-wrap items-center mb-3 md:mb-4">
          <span className="text-sm drop-shadow-md uppercase tracking-wider bg-white/10 px-3 py-1 rounded-sm">
            {info.type}
          </span>
          {info.subType && (
            <span className="text-[12px] font-medium drop-shadow-md px-3 py-1 bg-white/10 rounded-full">
              {info.subType}
            </span>
          )}
        </div>
        <h1 className="m-0 font-black tracking-tighter leading-[1.1] drop-shadow-lg mb-4 md:mb-6 wrap-break-word text-4xl md:text-5xl lg:text-6xl line-clamp-3" title={info.title}>
          {info.title}
        </h1>
        {info.description && (
          <p className="text-sm text-white/70 drop-shadow-md mb-4 line-clamp-2 font-normal max-w-2xl leading-relaxed">
            {info.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
          <button type="button" onClick={onArtistClick}
            className="flex items-center gap-2 group cursor-pointer mr-1 text-white">
            {info.artistAvatar ? (
              <Image width={28} height={28} src={info.artistAvatar} alt={info.artistName}
                className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-600 flex items-center justify-center text-xs font-bold">
                {info.artistName?.charAt(0) || "A"}
              </div>
            )}
            <span className="font-bold group-hover:underline text-[15px]">{info.artistName}</span>
          </button>
          <span className="opacity-60 hidden sm:inline">•</span>
          <span>{info.releaseYear}</span>
          <span className="opacity-60">•</span>
          <span className="font-medium text-white">{t("album.totalSongs", { count: info.totalSongs })}</span>
        </div>
      </div>
    </div>
  );
}
