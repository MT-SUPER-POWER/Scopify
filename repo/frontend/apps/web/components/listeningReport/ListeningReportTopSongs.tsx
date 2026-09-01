"use client";

import { IconHeadphones, IconPlayerPlayFilled, IconRepeat } from "@tabler/icons-react";
import { useMemo } from "react";

import { useReportSongPlayback } from "@/hooks/listeningReport/useReportSongPlayback";
import type { ListeningReportTopSongsProps } from "@/types/components/listeningReport";

export function ListeningReportTopSongs({ rankList, summary }: ListeningReportTopSongsProps) {
  const { playSong, playingSongId } = useReportSongPlayback();
  const topSong = summary.topSong;
  const topSongId = topSong?.songId;
  const songs = useMemo(
    () =>
      rankList && rankList.length > 0
        ? rankList.slice(0, 5).map((song, index) => ({
            artists: (song.artists ?? []).map((artist) => artist.artistName).join(" / "),
            coverUrl: song.picUrl,
            playCountText: `${song.playCount} 次收听`,
            rank: index + 1,
            songId: song.songId,
            songName: song.songName,
          }))
        : summary.topSongsList.slice(0, 5),
    [rankList, summary.topSongsList],
  );

  if (!topSong && songs.length === 0) return null;

  return (
    <section
      aria-labelledby="listening-report-songs-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="border-t border-border/70 pt-10 sm:pt-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2
              id="listening-report-songs-title"
              className="text-3xl font-black tracking-[-0.035em] text-content sm:text-4xl"
            >
              你反复回到的声音
            </h2>
            <p className="mt-2 text-sm text-content-muted">
              有些旋律不只是播放过，而是你在这段时间里一再的归宿。
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted">
            <IconRepeat className="size-4 text-brand" stroke={1.8} />
            <span>
              {summary.songCount ? `${summary.songCount} 首歌构成了这段记忆` : "本期高频回响"}
            </span>
          </div>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {topSong ? (
            <article className="group flex flex-col gap-5 sm:flex-row sm:items-start lg:flex-row lg:items-start">
              <div className="relative size-44 shrink-0 overflow-hidden bg-surface-raised shadow-xl sm:size-52 lg:size-48 xl:size-56">
                {topSong.imageUrl ? (
                  <img
                    alt={topSong.title}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={topSong.imageUrl}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-content-muted">
                    <IconHeadphones className="size-12" stroke={1.2} />
                  </div>
                )}
                {topSongId ? (
                  <button
                    type="button"
                    aria-label={`播放 ${topSong.title}`}
                    onClick={() => void playSong(topSongId)}
                    disabled={playingSongId === topSongId}
                    className="absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <IconPlayerPlayFilled className="size-4.5" />
                  </button>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <span className="text-xs font-bold tracking-wider text-brand uppercase">
                  {summary.period === "month"
                    ? "本月最常听"
                    : summary.period === "week"
                      ? "本周最常听"
                      : "年度最常听"}
                </span>
                <h3 className="mt-1.5 truncate text-xl font-black tracking-tight text-content lg:text-2xl">
                  {topSong.title}
                </h3>
                {topSong.subtitle ? (
                  <p className="mt-0.5 truncate text-xs font-medium text-content-muted">
                    {topSong.subtitle}
                  </p>
                ) : null}
                {topSong.details[0] ? (
                  <p className="mt-2 text-sm font-bold text-brand">{topSong.details[0].primary}</p>
                ) : null}
                <p className="mt-2 text-xs leading-relaxed text-content-muted">
                  在这个时间里，它是你最熟悉的声音与归宿。
                </p>
              </div>
            </article>
          ) : null}

          <ol className="divide-y divide-border/70 border-y border-border/70">
            {songs.map((song, idx) => (
              <li
                key={`${song.songId}-${song.rank}`}
                className="group flex min-h-18 items-center gap-4 py-3.5"
              >
                <span className="w-6 shrink-0 text-sm font-black text-content-subtle tabular-nums">
                  {idx + 1}
                </span>
                <div className="relative size-12 shrink-0 overflow-hidden bg-surface-raised">
                  {song.coverUrl ? (
                    <img alt="" className="size-full object-cover" src={song.coverUrl} />
                  ) : (
                    <IconHeadphones
                      className="absolute inset-0 m-auto size-5 text-content-muted"
                      stroke={1.5}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-content transition-colors group-hover:text-brand">
                    {song.songName}
                  </p>
                  {song.artists ? (
                    <p className="mt-0.5 truncate text-xs text-content-muted">{song.artists}</p>
                  ) : null}
                </div>
                {song.playCountText ? (
                  <span className="shrink-0 text-xs font-medium text-content-muted">
                    {song.playCountText}
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label={`播放 ${song.songName}`}
                  onClick={() => void playSong(song.songId)}
                  disabled={playingSongId === song.songId}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/80 text-content-muted opacity-100 transition-all hover:border-brand hover:bg-brand hover:text-brand-foreground focus-visible:opacity-100 disabled:opacity-40 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                >
                  <IconPlayerPlayFilled className="size-4" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
