"use client";

import { Play, Radio } from "lucide-react";

import { useReportSongPlayback } from "@/hooks/listeningReport/useReportSongPlayback";
import { useTranslation } from "react-i18next";

import type { ListeningReportTodayFeedProps } from "@/types/listeningReport/components";

function formatPlayTime(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp > 2_000_000_000 ? timestamp : timestamp * 1000);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function ListeningReportTodayFeed({ songs }: ListeningReportTodayFeedProps) {
  const { t } = useTranslation();
  const { playSong, playingSongId } = useReportSongPlayback();

  if (!songs || songs.length === 0) return null;

  return (
    <section
      aria-labelledby="listening-report-today-feed-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="border-t border-border/70 pt-10 sm:pt-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-brand uppercase">
              <Radio className="size-3.5 animate-pulse" />
              <span>实时声音</span>
            </div>
            <h2
              id="listening-report-today-feed-title"
              className="mt-1 text-3xl font-black tracking-[-0.035em] text-content sm:text-4xl"
            >
              {t("library.listeningReport.todayFeed")}
            </h2>
            <p className="mt-2 text-sm text-content-muted">
              {t("library.listeningReport.todayFeedSubtitle")}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {songs.slice(0, 8).map((song) => {
            const artists = (song.artists ?? []).map((a) => a.artistName).join(" / ");
            const timeText = formatPlayTime(song.lastPlayTime);

            return (
              <div
                key={`${song.songId}-${song.lastPlayTime}`}
                className="group flex items-center justify-between rounded-2xl border border-border/70 bg-surface-raised/60 p-3 transition-all hover:border-brand/40 hover:bg-surface-raised"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-surface-elevated">
                    {song.picUrl ? (
                      <img alt="" src={song.picUrl} className="size-full object-cover" />
                    ) : null}
                    <button
                      type="button"
                      aria-label={`${t("library.listeningReport.playAction")} ${song.songName}`}
                      onClick={() => void playSong(song.songId)}
                      disabled={playingSongId === song.songId}
                      className="absolute inset-0 flex items-center justify-center bg-overlay/60 text-overlay-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <Play className="size-4 fill-current" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-content group-hover:text-brand">
                      {song.songName}
                    </p>
                    {artists && (
                      <p className="truncate text-[11px] text-content-muted">{artists}</p>
                    )}
                  </div>
                </div>

                {timeText && (
                  <span className="shrink-0 text-[10px] font-bold text-content-subtle tabular-nums">
                    {timeText}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
