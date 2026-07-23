"use client";

import { LoaderCircle, Music2 } from "lucide-react";

import { useI18n } from "@/store/module/i18n";
import type { FoliaLyricMatchPreviewProps } from "@/types/components/lyrics";

export function FoliaLyricMatchPreview({
  candidate,
  isDaylight,
  isLoading,
  isPureMusic,
  previewLines,
  song,
  theme,
}: FoliaLyricMatchPreviewProps) {
  const { t } = useI18n();
  const title = candidate?.name ?? song?.name ?? t("lyrics.match.noSong");
  const artist =
    candidate?.artistNames.join(", ") ?? song?.ar.map((item) => item.name).join(", ") ?? "";
  const album = candidate?.albumName ?? song?.al.name ?? "";
  const coverUrl = candidate?.coverUrl ?? song?.al.picUrl ?? null;
  const textPrimary = isDaylight ? "text-zinc-900" : "text-white";
  const textSecondary = isDaylight ? "text-zinc-500" : "text-zinc-400";
  const previewBoxClass = isDaylight
    ? "border-black/5 bg-black/[0.02]"
    : "border-white/5 bg-white/[0.02]";

  return (
    <section className="flex min-h-0 flex-col items-center justify-between overflow-hidden border-l border-white/10 px-6 py-6 text-center">
      <div className="visualizer-overlay-scrollbar flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto pr-1">
        <div className="flex size-32 min-h-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800 shadow-md">
          {coverUrl ? (
            <img alt="" className="size-full object-cover" src={coverUrl} />
          ) : (
            <Music2 className="size-7 opacity-30" />
          )}
        </div>

        <div className="mt-4 w-full space-y-1.5 text-center">
          <h3 className={`line-clamp-2 px-2 text-base leading-snug font-bold ${textPrimary}`}>
            {title}
          </h3>
          {artist ? (
            <p className={`truncate text-sm font-medium opacity-75 ${textPrimary}`}>{artist}</p>
          ) : null}
          {album ? <p className={`truncate text-xs opacity-60 ${textPrimary}`}>{album}</p> : null}
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className={`text-[11px] ${textSecondary}`}>{t("lyrics.tab.source")}</span>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600">
              {t("lyrics.match.sourceNetease")}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`mt-4 flex h-28 w-full shrink-0 flex-col justify-center rounded-xl border p-4 text-left ${previewBoxClass}`}
      >
        {isLoading ? (
          <div
            className={`flex flex-col items-center gap-2 text-center text-xs opacity-60 ${textPrimary}`}
          >
            <LoaderCircle className="mb-2 size-5 animate-spin" />
            <span>{t("lyrics.match.loadingPreview")}</span>
          </div>
        ) : candidate === null ? (
          <div
            className={`flex flex-col items-center gap-2 text-center text-xs opacity-55 ${textSecondary}`}
          >
            <Music2 className="size-6" />
            <span>{t("lyrics.match.selectCandidate")}</span>
          </div>
        ) : isPureMusic ? (
          <div className={`text-center text-sm ${textSecondary}`}>
            <span className="font-medium text-blue-500">{t("lyrics.match.pureMusic")}</span>
            <span className="ml-1">{t("lyrics.match.pureMusicHint")}</span>
          </div>
        ) : previewLines.length === 0 ? (
          <div
            className={`flex flex-col items-center gap-2 text-center text-xs opacity-55 ${textSecondary}`}
          >
            <Music2 className="size-5" />
            <span>{t("lyrics.match.noPreview")}</span>
          </div>
        ) : (
          <div className={`space-y-1.5 text-sm leading-5 ${textPrimary}`}>
            {previewLines.slice(0, 3).map((line) => (
              <p className="truncate" key={`${line.startTimeMs}-${line.text}`}>
                {line.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
