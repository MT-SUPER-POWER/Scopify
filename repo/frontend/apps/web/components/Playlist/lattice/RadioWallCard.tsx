"use client";

import { lazy, memo, Suspense, useEffect, useState } from "react";
import { Disc3, Radio } from "lucide-react";
import { motion, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";

import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { radioCardPose, radioRedactionWidths } from "@/lib/playlist/lattice/radioWall";
import { getLatticeTrackCopy } from "@/lib/playlist/lattice/trackCopy";
import { cn } from "@/lib/utils";
import type { RadioWallCardProps } from "@/types/playlist/radioWall";

const LatticeLyrics = lazy(() => import("./LatticeLyrics"));

const FLIP_TRANSITION = { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const };
const BACK_REVEAL_MS = 950;
const FLIP_MS = FLIP_TRANSITION.duration * 1_000;

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
  reducedMotion,
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
  const revealed = !faceDown;
  const [shownRevealed, setShownRevealed] = useState(revealed);
  const [revealStage, setRevealStage] = useState<"back" | "flip" | "done">(
    revealed ? "done" : "back",
  );
  if (shownRevealed !== revealed) {
    setShownRevealed(revealed);
    if (revealed) {
      setRevealStage(reducedMotion ? "done" : "back");
    } else {
      setRevealStage("back");
    }
  }
  useEffect(() => {
    if (!revealed || revealStage === "done") return;
    const delay = reducedMotion ? 0 : revealStage === "back" ? BACK_REVEAL_MS : FLIP_MS;
    const timer = window.setTimeout(
      () => setRevealStage(revealStage === "back" && !reducedMotion ? "flip" : "done"),
      delay,
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion, revealStage, revealed]);

  const flipReady = revealStage !== "back" || reducedMotion;
  const flipAngle = revealed && flipReady ? 0 : 180;
  const copy = track ? getLatticeTrackCopy(track) : null;
  const label = !copy || faceDown ? t("playlist.radio.unknown") : copy.title;
  const redaction = copy ? radioRedactionWidths(copy.key) : null;
  const frontCoverUrl = copy?.cover ? getSizedImageUrl(copy.cover, 600) : null;
  const veilCoverUrl = copy?.cover ? getSizedImageUrl(copy.cover, 64) : null;
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

  const unknownBack = (
    <span className="absolute inset-0 grid place-content-center justify-items-center gap-2 bg-[repeating-linear-gradient(135deg,#fff1_0_1px,transparent_1px_8px),linear-gradient(145deg,#222,#080808)] px-3 text-center">
      <Radio className="size-10 text-primary" aria-hidden />
      <span className="text-sm font-medium text-white/75">{label}</span>
    </span>
  );
  const trackBack = copy && redaction && (
    <span
      aria-hidden={revealed}
      data-revealed={revealed}
      className="group/back absolute inset-0 [transform:rotateY(180deg)] overflow-hidden rounded-lg border border-white/20 bg-[#111] backface-hidden"
    >
      {veilCoverUrl && (
        <span
          className="pointer-events-none absolute -inset-[12%] scale-110 bg-cover bg-center opacity-75 blur-xl"
          style={{ backgroundImage: `url("${veilCoverUrl}")` }}
        />
      )}
      {revealed && revealStage !== "done" && !reducedMotion && frontCoverUrl && (
        <span
          key={`unveil-${copy.key}`}
          className="pointer-events-none absolute -inset-[12%] bg-cover bg-center"
          style={{
            animation: "radio-card-unveil-in 850ms cubic-bezier(0.22, 1, 0.36, 1) backwards",
            backgroundImage: `url("${frontCoverUrl}")`,
          }}
        />
      )}
      <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/10%)_0_1px,transparent_1px_5px,rgb(0_0_0/14%)_5px_6px),linear-gradient(180deg,transparent_38%,rgb(0_0_0/48%)_100%)]" />
      <span className="pointer-events-none absolute inset-x-[8%] bottom-[8%] flex flex-col gap-[3cqmin]">
        <span
          className="relative block h-[8cqmin] overflow-hidden"
          style={{ width: `${redaction.title}%` }}
        >
          <span
            dir="auto"
            className="absolute inset-0 block truncate text-[5.4cqmin] leading-[8cqmin] font-semibold tracking-[0.02em] text-white/92 transition-[clip-path] delay-[90ms] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] [clip-path:inset(0_100%_0_0)] group-data-[revealed=true]/back:[clip-path:inset(0_0_0_0)] motion-reduce:transition-none"
          >
            {copy.title}
          </span>
          <span className="absolute inset-0 translate-x-0 bg-white/90 transition-transform duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[revealed=true]/back:translate-x-[102%] motion-reduce:transition-none" />
        </span>
        <span
          className="relative block h-[3.6cqmin] overflow-hidden"
          style={{ width: `${redaction.artist}%` }}
        >
          <span
            dir="auto"
            className="absolute inset-0 block truncate text-[2.6cqmin] leading-[3.6cqmin] font-semibold tracking-[0.02em] text-white/58 transition-[clip-path] delay-[150ms] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] [clip-path:inset(0_100%_0_0)] group-data-[revealed=true]/back:[clip-path:inset(0_0_0_0)] motion-reduce:transition-none"
          >
            {copy.artist || copy.album}
          </span>
          <span className="absolute inset-0 translate-x-0 bg-white/50 transition-transform delay-[70ms] duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[revealed=true]/back:translate-x-[102%] motion-reduce:transition-none" />
        </span>
      </span>
    </span>
  );
  const front = copy && track && (
    <span
      aria-hidden={!revealed}
      className="absolute inset-0 overflow-hidden rounded-lg bg-secondary backface-hidden"
    >
      <Disc3 className="absolute inset-[23%] size-[54%] text-content/15" aria-hidden />
      {frontCoverUrl && (
        <img
          src={frontCoverUrl}
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
      {revealed && revealStage === "flip" && !reducedMotion && frontCoverUrl && (
        <span
          key={`focus-${copy.key}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{
            animation: "radio-card-focus-clear 480ms cubic-bezier(0.22, 1, 0.36, 1) 60ms forwards",
            backgroundImage: `url("${frontCoverUrl}")`,
            filter: "blur(8px) saturate(1.08)",
            transform: "scale(1.03)",
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
    </span>
  );

  return (
    <motion.div
      className="absolute top-0 left-0"
      style={{ width: cardSize, height: cardSize, transform, zIndex }}
    >
      <div className="[container-type:size] relative size-full motion-safe:animate-in motion-safe:duration-400 motion-safe:fade-in motion-safe:slide-in-from-bottom-3">
        {track && slot.trackIndex !== null ? (
          <button
            type="button"
            data-wall-track={slot.trackIndex}
            data-radio-position={slot.position}
            tabIndex={centered ? 0 : -1}
            aria-label={label}
            aria-current={current ? "true" : undefined}
            className={cn(
              cardClass,
              "cursor-pointer overflow-visible border-0 bg-transparent shadow-none [perspective:1400px]",
            )}
          >
            <motion.span
              className={cn(
                "relative block size-full rounded-lg border border-white/20 shadow-[0_14px_30px_#0005] [transform-style:preserve-3d]",
                current && "border-primary",
              )}
              initial={false}
              animate={{ rotateY: flipAngle }}
              transition={reducedMotion ? { duration: 0 } : FLIP_TRANSITION}
            >
              {front}
              {trackBack}
            </motion.span>
            <span
              aria-hidden
              data-current={current}
              className="absolute top-[6%] left-[6%] z-2 rounded bg-black/45 px-1.5 text-xs font-medium tabular-nums group-data-[current-number-only=true]/radio:not-data-[current=true]:hidden"
            >
              {String(slot.trackIndex + 1).padStart(2, "0")}
            </span>
          </button>
        ) : (
          <div className={cn(cardClass, "opacity-65")} role="img" aria-label={label}>
            {unknownBack}
          </div>
        )}
      </div>
    </motion.div>
  );
});
