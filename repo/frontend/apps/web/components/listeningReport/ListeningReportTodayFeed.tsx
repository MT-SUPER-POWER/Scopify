"use client";

import { Play, Radio } from "lucide-react";

import { useReportSongPlayback } from "@/hooks/listeningReport/useReportSongPlayback";
import { useI18n } from "@/store/module/i18n";
import type { ListeningReportTodayFeedProps } from "@/types/components/listeningReport";

function formatPlayTime(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp > 2_000_000_000 ? timestamp : timestamp * 1000);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function ListeningReportTodayFeed({ songs }: ListeningReportTodayFeedProps) {
  const { t } = useI18n();
  const { playSong, playingSongId } = useReportSongPlayback();

  if (!songs || songs.length === 0) return null;

  return (
    <div className="rounded-3xl border border-border/80 bg-surface-overlay/90 p-6 shadow-panel backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-500">
          <Radio className="size-4 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-black tracking-tight text-content">
            {t("library.listeningReport.todayFeed")}
          </h3>
          <p className="text-xs text-content-muted">
            {t("library.listeningReport.todayFeedSubtitle")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  {artists && <p className="truncate text-[11px] text-content-muted">{artists}</p>}
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
  );
}
