"use client";

import Image from "next/image";
import { useI18n } from "@/store/module/i18n";
import type { CommentHeaderArtist, CommentHeaderProps } from "@/types/components/comment";

function ArtistAvatar({ artist }: { artist: CommentHeaderArtist }) {
  const initial = artist.name.trim().charAt(0).toUpperCase() || "A";

  if (!artist.avatarUrl) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-white ring-2 ring-[#121212]">
        {initial}
      </span>
    );
  }

  return (
    <Image
      src={artist.avatarUrl}
      alt={artist.name}
      width={28}
      height={28}
      className="h-7 w-7 rounded-full object-cover ring-2 ring-[#121212]"
    />
  );
}

export function CommentHeader({
  coverUrl,
  title,
  albumName,
  artists,
  total,
  onArtistClick,
}: CommentHeaderProps) {
  const { t } = useI18n();
  const visibleArtists = artists.slice(0, 4);
  const remainingArtistCount = Math.max(0, artists.length - visibleArtists.length);

  return (
    <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 px-6 pt-24 pb-6">
      <div className="w-48 h-48 lg:w-56 lg:h-56 shrink-0 transition-transform duration-300 hover:scale-[1.02] shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-md overflow-hidden bg-black/20">
        <Image
          width={400}
          height={400}
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 text-white pt-1 md:pt-2">
        <div className="flex flex-row gap-2 flex-wrap items-center mb-3 md:mb-4">
          <span className="text-sm drop-shadow-md uppercase tracking-wider bg-white/10 px-3 py-1 rounded-sm">
            {t("comments.page.trackTag")}
          </span>
          {albumName && (
            <span className="text-[12px] font-medium drop-shadow-md px-3 py-1 bg-white/10 rounded-full">
              {albumName}
            </span>
          )}
        </div>

        <h1
          className="m-0 font-black tracking-tighter leading-[1.1] drop-shadow-lg mb-4 md:mb-6 wrap-break-word text-4xl md:text-5xl lg:text-6xl line-clamp-3"
          title={title}
        >
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
          {artists.length > 0 && (
            <>
              <div className="flex items-center gap-3 mr-1 text-white">
                <div className="flex -space-x-2">
                  {visibleArtists.map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => onArtistClick(artist.id)}
                      title={artist.name}
                      className="rounded-full transition-transform hover:z-10 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
                    >
                      <ArtistAvatar artist={artist} />
                    </button>
                  ))}
                  {remainingArtistCount > 0 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-white ring-2 ring-[#121212]">
                      +{remainingArtistCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {artists.map((artist, index) => (
                    <span key={artist.id} className="inline-flex items-center gap-1">
                      {index > 0 && <span className="text-white/40">/</span>}
                      <button
                        type="button"
                        onClick={() => onArtistClick(artist.id)}
                        className="font-bold text-[15px] text-white hover:underline"
                      >
                        {artist.name}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <span className="opacity-60 hidden sm:inline">•</span>
            </>
          )}
          <span>
            {total > 0
              ? `${t("comments.page.allComments")}: ${total.toLocaleString()}`
              : t("comments.page.allComments")}
          </span>
        </div>
      </div>
    </div>
  );
}
