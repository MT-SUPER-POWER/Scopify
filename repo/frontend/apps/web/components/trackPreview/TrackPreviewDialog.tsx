"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, Volume2, VolumeX, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TrackPreviewActions } from "./TrackPreviewActions";
import { TrackPreviewVideo } from "./TrackPreviewVideo";
import { MvChannel } from "@/components/mv/MvChannel";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { useI18n } from "@/store/module/i18n";
import type { TrackPreviewDialogProps } from "@/types/components/trackPreview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";

/** 滚轮翻页的最小间隔，防止触控板一次滑动连翻好几首。 */
const WHEEL_LOCK_MS = 700;

const ICON_BTN =
  "flex size-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white";

/**
 * 歌单/专辑的「预览」（参考 Spotify 歌单预览）：逐首播放带 MV 的歌曲，
 * 左侧歌曲信息与艺人，中间 MV，右侧操作；↑/↓、滚轮或按钮切换，M 静音，Esc 关闭。
 */
export function TrackPreviewDialog({
  open,
  onOpenChange,
  title,
  tags,
  tracks,
  allTracks,
  playlistId,
}: TrackPreviewDialogProps) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const wheelLockedAtRef = useRef(0);
  const song = tracks[Math.min(index, tracks.length - 1)];

  const go = useCallback(
    (step: 1 | -1) => {
      setIndex((current) => {
        const next = current + step;
        if (next < 0 || next >= tracks.length) return current;
        setDirection(step);
        setProgress(0);
        return next;
      });
    },
    [tracks.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") go(1);
      else if (event.key === "ArrowUp") go(-1);
      else if (event.key.toLowerCase() === "m") setMuted((value) => !value);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, open]);

  if (!song) return null;

  const artworkUrl = resolveCoverUrl(song.al?.picUrl, song.al?.coverUrl);
  const mainArtist = song.ar?.find((artist) => artist.id);
  const year = song.publishTime > 0 ? new Date(song.publishTime).getFullYear() : null;
  const chips = [...tags.map((tag) => `#${tag}`), ...(year ? [String(year)] : [])];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onWheel={(event) => {
          if (Math.abs(event.deltaY) < 20) return;
          const now = performance.now();
          if (now - wheelLockedAtRef.current < WHEEL_LOCK_MS) return;
          wheelLockedAtRef.current = now;
          go(event.deltaY > 0 ? 1 : -1);
        }}
        className="grid h-[min(780px,90vh)] w-[min(1240px,94vw)] max-w-none grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_72px] gap-8 overflow-hidden rounded-2xl border-white/10 bg-[#121212] p-8 text-white sm:max-w-none"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{t("trackPreview.description")}</DialogDescription>

        {/* 左：歌曲信息 */}
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-2xl font-bold">{title}</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: direction * 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction * -24 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-1 flex-col justify-center gap-3"
            >
              <h2 className="line-clamp-3 text-5xl leading-tight font-black break-words">
                {song.name}
              </h2>
              <p className="truncate text-base text-white/70">
                {song.ar?.map((artist) => artist.name).join(", ")}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded bg-white/10">
                  {artworkUrl && (
                    <Image
                      fill
                      sizes="56px"
                      src={getSizedImageUrl(artworkUrl, 120)}
                      alt=""
                      className="object-cover"
                    />
                  )}
                </span>
                <span className="h-1 w-full max-w-60 overflow-hidden rounded-full bg-white/20">
                  <span
                    className="block h-full rounded-full bg-white transition-[width] duration-200 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                  />
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex flex-col gap-4">
            {mainArtist && <MvChannel key={mainArtist.id} artist={mainArtist} />}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
            {song.al?.id ? (
              <Link
                href={`/album?id=${song.al.id}`}
                scroll={false}
                onClick={() => onOpenChange(false)}
                className="w-fit truncate text-sm text-white/60 hover:text-white hover:underline"
              >
                {song.al.name}
              </Link>
            ) : null}
          </div>
        </div>

        {/* 中：MV */}
        <div className="flex min-w-0 flex-col items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: `${direction * 30}%` }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: `${direction * -30}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl"
            >
              <TrackPreviewVideo
                mvId={song.mv ?? 0}
                muted={muted}
                onProgress={setProgress}
                onEnded={() => go(1)}
              />
            </motion.div>
          </AnimatePresence>
          <p className="mt-4 text-sm text-white/50 tabular-nums">
            {t("trackPreview.position", { index: index + 1, total: tracks.length })}
          </p>
        </div>

        {/* 右：静音/关闭、操作、翻页 */}
        <div className="flex flex-col items-center justify-between">
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={t("common.action.close")}
              className={ICON_BTN}
            >
              <X className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setMuted((value) => !value)}
              aria-label={t(muted ? "trackPreview.unmute" : "trackPreview.mute")}
              aria-pressed={muted}
              className={ICON_BTN}
            >
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
          </div>

          <TrackPreviewActions
            song={song}
            songs={allTracks}
            playlistId={playlistId}
            onClose={() => onOpenChange(false)}
          />

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label={t("trackPreview.previous")}
              className={`${ICON_BTN} disabled:pointer-events-none disabled:opacity-30`}
            >
              <ArrowUp className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={index >= tracks.length - 1}
              aria-label={t("trackPreview.next")}
              className="flex size-12 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowDown className="size-5" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
