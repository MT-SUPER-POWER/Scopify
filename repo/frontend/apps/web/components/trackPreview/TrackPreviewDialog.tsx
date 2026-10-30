"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TrackPreviewDetails } from "./TrackPreviewDetails";
import { TrackPreviewControls } from "./TrackPreviewControls";
import { TrackPreviewVideo } from "./TrackPreviewVideo";
import { useI18n } from "@/store/module/i18n";
import type { TrackPreviewDialogProps } from "@/types/player/trackPreviewComponents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";

/** 滚轮翻页的最小间隔，防止触控板一次滑动连翻好几首。 */
const WHEEL_LOCK_MS = 700;

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
        className="grid h-[min(780px,90vh)] w-[min(1240px,94vw)] max-w-none grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_72px] gap-8 overflow-hidden rounded-2xl border-border bg-surface-overlay p-8 text-content sm:max-w-none"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{t("trackPreview.description")}</DialogDescription>

        <TrackPreviewDetails
          song={song}
          title={title}
          tags={tags}
          direction={direction}
          progress={progress}
          onClose={() => onOpenChange(false)}
        />
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
          <p className="mt-4 text-sm text-content/50 tabular-nums">
            {t("trackPreview.position", { index: index + 1, total: tracks.length })}
          </p>
        </div>

        <TrackPreviewControls
          song={song}
          songs={allTracks}
          playlistId={playlistId}
          onClose={() => onOpenChange(false)}
          muted={muted}
          onToggleMute={() => setMuted((value) => !value)}
          onPrevious={() => go(-1)}
          onNext={() => go(1)}
          hasPrevious={index > 0}
          hasNext={index < tracks.length - 1}
        />
      </DialogContent>
    </Dialog>
  );
}
