"use client";

import Image from "next/image";
import { useI18n } from "@/store/module/i18n";
import type { CommentHeaderArtist, CommentHeaderProps } from "@/types/components/comment";

function ArtistAvatar({ artist }: { artist: CommentHeaderArtist }) {
  const initial = artist.name.trim().charAt(0).toUpperCase() || "A";

  if (!artist.avatarUrl) {
    return (
      <span className="bg-surface-elevated text-content ring-surface-raised flex size-7 items-center justify-center rounded-full text-xs font-bold ring-2">
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
      className="ring-surface-raised size-7 rounded-full object-cover ring-2"
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
  tagLabel,
}: CommentHeaderProps) {
  const { t } = useI18n();
  const visibleArtists = artists.slice(0, 4);
  const remainingArtistCount = Math.max(0, artists.length - visibleArtists.length);

  return (
    <div className="relative z-10 flex flex-col items-start gap-6 px-6 pt-24 pb-6 md:flex-row md:px-8 lg:px-10 xl:px-12">
      <div className="bg-surface-elevated hover:scale-1.02 shadow-floating size-48 shrink-0 overflow-hidden rounded-md transition-transform duration-300 lg:size-56">
        <Image
          width={400}
          height={400}
          src={coverUrl}
          alt={title}
          className="size-full object-cover"
        />
      </div>

      <div className="text-content flex min-w-0 flex-1 flex-col pt-1 md:pt-2">
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2 md:mb-4">
          <span className="bg-content/10 rounded-sm px-3 py-1 text-sm tracking-wider uppercase">
            {tagLabel ?? t("comments.page.trackTag")}
          </span>
          {albumName && (
            <span className="bg-content/10 rounded-full px-3 py-1 text-[12px] font-medium">
              {albumName}
            </span>
          )}
        </div>

        <h1
          className="leading-1.1 m-0 mb-4 line-clamp-3 text-4xl font-black tracking-tighter wrap-break-word md:mb-6 md:text-5xl lg:text-6xl"
          title={title}
        >
          {title}
        </h1>

        {artists.length > 0 && (
          <div className="text-content/80 flex flex-wrap items-center gap-2.5 text-sm">
            <div className="text-content mr-1 flex items-center gap-3">
              <div className="flex -space-x-2">
                {visibleArtists.map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={() => onArtistClick(artist.id)}
                    title={artist.name}
                    className="focus-visible:ring-brand rounded-full transition-transform hover:z-10 hover:scale-110 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <ArtistAvatar artist={artist} />
                  </button>
                ))}
                {remainingArtistCount > 0 && (
                  <span className="bg-surface-elevated text-content ring-surface-raised flex size-7 items-center justify-center rounded-full text-[11px] font-bold ring-2">
                    +{remainingArtistCount}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                {artists.map((artist, index) => (
                  <span key={artist.id} className="inline-flex items-center gap-1">
                    {index > 0 && <span className="text-content/40">/</span>}
                    <button
                      type="button"
                      onClick={() => onArtistClick(artist.id)}
                      className="text-content text-[15px] font-bold hover:underline"
                    >
                      {artist.name}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
