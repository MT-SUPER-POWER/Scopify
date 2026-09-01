"use client";

import { IconMusic } from "@tabler/icons-react";
import { useMemo } from "react";

import type { ListeningReportTopArtistsProps } from "@/types/components/listeningReport";

export function ListeningReportTopArtists({ summary }: ListeningReportTopArtistsProps) {
  const topArtist = summary.topArtist;
  const allArtists = useMemo(() => {
    const list: Array<{
      id: string | number;
      name: string;
      imageUrl: string | null;
      stats: string;
    }> = [];

    if (topArtist) {
      list.push({
        id: "top-1",
        imageUrl: topArtist.imageUrl,
        name: topArtist.title,
        stats: topArtist.details[0]?.primary ?? "最常听创作者",
      });
    }

    const remaining = summary.topArtistsList.slice(topArtist ? 1 : 0, 3);
    for (const a of remaining) {
      list.push({
        id: a.artistId,
        imageUrl: a.avatarUrl ?? null,
        name: a.artistName,
        stats: a.playCountText ?? `${a.rank} 顺位`,
      });
    }

    return list;
  }, [summary.topArtistsList, topArtist]);

  if (allArtists.length === 0) return null;

  return (
    <section
      aria-labelledby="listening-report-artists-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="border-t border-border/70 pt-10 sm:pt-14">
        <h2
          id="listening-report-artists-title"
          className="text-3xl font-black tracking-[-0.035em] text-content sm:text-4xl"
        >
          陪你最久的声音创作者
        </h2>

        <div className="mt-8 flex flex-col gap-4 sm:gap-4.5">
          {allArtists.map((artist) => (
            <article
              key={artist.id}
              className="group relative flex h-28 w-full items-center overflow-hidden rounded-2xl border border-border/60 bg-surface-raised/40 transition-colors hover:border-border hover:bg-surface-raised/70 sm:h-32 lg:h-36"
            >
              {/* 左侧封面与向右渐变消融 */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-[42%] overflow-hidden sm:w-[36%] lg:w-[30%]">
                {artist.imageUrl ? (
                  <img
                    alt={artist.name}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={artist.imageUrl}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-surface-elevated text-content-muted">
                    <IconMusic className="size-10" stroke={1.2} />
                  </div>
                )}
                {/* 向右淡色平滑过渡渐变 */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-surface-raised/75 to-surface-raised" />
              </div>

              {/* 右侧艺人文本信息 */}
              <div className="relative z-10 flex flex-col justify-center pl-[44%] sm:pl-[38%] lg:pl-[32%]">
                <h3 className="text-xl font-black tracking-tight text-content transition-colors group-hover:text-brand sm:text-2xl lg:text-3xl">
                  {artist.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-content-muted sm:text-base">
                  {artist.stats}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
