"use client";

import { lazy, memo, Suspense } from "react";
import { Disc3, Radio } from "lucide-react";
import { motion, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";

import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { radioCardPose } from "@/lib/playlist/lattice/radioWall";
import { getLatticeTrackCopy } from "@/lib/playlist/lattice/trackCopy";
import { cn } from "@/lib/utils";
import type { RadioWallCardProps } from "@/types/playlist/radioWall";

const LatticeLyrics = lazy(() => import("./LatticeLyrics"));

const cardClass =
  "absolute inset-0 size-full overflow-hidden rounded-lg border border-white/20 bg-secondary text-left text-white shadow-[0_14px_30px_#0005] outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary";

export const RadioWallCard = memo(function RadioWallCard({
  slot,
  metrics,
  rail,
  track,
  centered,
  current,
  faceDown,
  showLyrics,
}: RadioWallCardProps) {
  const { t } = useTranslation();
  const { cardSize } = metrics;
  const half = cardSize / 2;
  const transform = useTransform(rail, (value) => {
    const pose = radioCardPose(slot.position - value, metrics);
    return `translate3d(${pose.x - half}px, ${pose.y - half}px, 0) rotate(${pose.rotation}deg) scale(${pose.scale})`;
  });
  const zIndex = useTransform(
    rail,
    (value) => 12 - Math.floor(Math.abs(slot.position - value) * 2),
  );
  const copy = track ? getLatticeTrackCopy(track) : null;
  const label = !copy || faceDown ? t("playlist.radio.unknown") : copy.title;
  const copyText = copy && (
    <span className="absolute inset-x-[8%] bottom-[8%] flex flex-col gap-1 drop-shadow-sm">
      <span dir="auto" className="line-clamp-2 text-lg leading-tight font-semibold">
        {copy.title}
      </span>
      <span dir="auto" className="truncate text-sm text-white/75">
        {copy.artist || copy.album}
      </span>
    </span>
  );

  const back = (
    <span className="absolute inset-0 grid place-content-center justify-items-center gap-2 bg-[repeating-linear-gradient(135deg,#fff1_0_1px,transparent_1px_8px),linear-gradient(145deg,#222,#080808)] px-3 text-center">
      <Radio className="size-10 text-primary" aria-hidden />
      <span className="text-sm font-medium text-white/75">{label}</span>
    </span>
  );
  const front = copy && track && (
    <>
      <Disc3 className="absolute inset-[23%] size-[54%] text-content/15" aria-hidden />
      {copy.cover && (
        <img
          src={getSizedImageUrl(copy.cover, 600)}
          alt=""
          draggable={false}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
          onLoad={(event) => {
            event.currentTarget.style.visibility = "";
          }}
          onError={(event) => {
            event.currentTarget.style.visibility = "hidden";
          }}
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
      {showLyrics ? (
        <Suspense fallback={copyText}>
          <LatticeLyrics track={track} compact />
        </Suspense>
      ) : (
        copyText
      )}
    </>
  );

  return (
    <motion.div
      className="absolute top-0 left-0"
      style={{ width: cardSize, height: cardSize, transform, zIndex }}
    >
      <div className="relative size-full motion-safe:animate-in motion-safe:duration-400 motion-safe:fade-in motion-safe:slide-in-from-bottom-3">
        {track && slot.trackIndex !== null ? (
          <button
            type="button"
            data-wall-track={slot.trackIndex}
            data-radio-position={slot.position}
            tabIndex={centered ? 0 : -1}
            aria-label={label}
            aria-current={current ? "true" : undefined}
            className={cn(cardClass, "cursor-pointer", current && "border-primary")}
          >
            {faceDown ? back : front}
            <span
              aria-hidden
              data-current={current}
              className="absolute top-[6%] left-[6%] rounded bg-black/45 px-1.5 text-xs font-medium tabular-nums group-data-[current-number-only=true]/radio:not-data-[current=true]:hidden"
            >
              {String(slot.trackIndex + 1).padStart(2, "0")}
            </span>
          </button>
        ) : (
          <div className={cn(cardClass, "opacity-65")} role="img" aria-label={label}>
            {back}
          </div>
        )}
      </div>
    </motion.div>
  );
});
