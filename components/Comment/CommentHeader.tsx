"use client";

import Image from "next/image";
import { useI18n } from "@/store/module/i18n";
import type { CommentHeaderArtist, CommentHeaderProps } from "@/types/components/comment";

function ArtistAvatar({ artist }: { artist: CommentHeaderArtist }) {
  const initial = artist.name.trim().charAt(0).toUpperCase() || "A";

  if (!artist.avatarUrl) {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-white ring-2 ring-[#121212]">
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
      className="size-7 rounded-full object-cover ring-2 ring-[#121212]"
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
    <div className="relative z-10 flex flex-col items-start gap-6 px-6 pt-24 pb-6 md:flex-row">
      <div className="hover:scale-1.02 size-48 shrink-0 overflow-hidden rounded-md bg-black/20 shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 lg:size-56">
        <Image
          width={400}
          height={400}
          src={coverUrl}
          alt={title}
          className="size-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-1 text-white md:pt-2">
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2 md:mb-4">
          <span className="rounded-sm bg-white/10 px-3 py-1 text-sm tracking-wider uppercase drop-shadow-md">
            {t("comments.page.trackTag")}
          </span>
          {albumName && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium drop-shadow-md">
              {albumName}
            </span>
          )}
        </div>

        <h1
          className="leading-1.1 m-0 mb-4 line-clamp-3 text-4xl font-black tracking-tighter wrap-break-word drop-shadow-lg md:mb-6 md:text-5xl lg:text-6xl"
          title={title}
        >
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
          {artists.length > 0 && (
            <>
              <div className="mr-1 flex items-center gap-3 text-white">
                <div className="flex -space-x-2">
                  {visibleArtists.map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => onArtistClick(artist.id)}
                      title={artist.name}
                      className="rounded-full transition-transform hover:z-10 hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:outline-none"
                    >
                      <ArtistAvatar artist={artist} />
                    </button>
                  ))}
                  {remainingArtistCount > 0 && (
                    <span className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-white ring-2 ring-[#121212]">
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
                        className="text-[15px] font-bold text-white hover:underline"
                      >
                        {artist.name}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <span className="hidden opacity-60 sm:inline">•</span>
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
