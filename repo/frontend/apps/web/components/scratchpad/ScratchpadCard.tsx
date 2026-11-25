// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import { memo, useEffect, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { Check, Music2, Play, MessageSquareQuote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { formatDuration } from "@/lib/utils";
import { openTrackMoments } from "@/store/module/scratchpad";
import type { ScratchpadCardProps } from "@/types/scratchpad/components";
const PHOTO_ROTATIONS = [-2.2, 1.4, -0.6, 2, -1.5, 0.8, -2.4, 1.7, -0.9, 1.1];
const photoRotation = (key: string) => {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1)
    hash = (hash * 31 + key.charCodeAt(index)) | 0;
  return PHOTO_ROTATIONS[Math.abs(hash) % PHOTO_ROTATIONS.length];
};

const SNAP = { type: "spring", stiffness: 520, damping: 42, mass: 0.7 } as const;

export const ScratchpadCard = memo(function ScratchpadCard({
  entry,
  slotX,
  slotY,
  isMoving,
  isSelected,
  isFresh,
  movingCount = 0,
  width,
  height,
  variant: cardVariant = "note",
  currentLabel = "",
  playLabel,
  register,
  onPointerDown,
  onPlay,
}: ScratchpadCardProps) {
  const variant = { note: "note", history: "photo", queue: "film", moment: "catalog" }[cardVariant];
  const { t } = useTranslation();
  const x = useMotionValue(slotX);
  const y = useMotionValue(slotY);
  // 相片歪的角度也交给 framer：它把位移与旋转写进同一个 transform（先挪到格子、再绕自己的中心转）。用 CSS 的 rotate 属性的话，

  const photoTilt = variant === "photo" ? photoRotation(entry.key) : 0;
  const rotate = useMotionValue(photoTilt);
  const calm = useReducedMotion();
  // 悬停时摆正，离开时歪回去（降低动态效果时不动）。
  const straighten = (straight: boolean) => {
    if (variant !== "photo" || calm) return;
    animate(rotate, straight ? 0 : photoTilt, { duration: 0.26, ease: [0.22, 1, 0.36, 1] });
  };
  const [coverFailed, setCoverFailed] = useState(false);
  const coverUrl = getSizedImageUrl(entry.track.album?.coverUrl, width * 2);

  useEffect(() => {
    register(entry.key, { x, y });
    return () => register(entry.key, null);
  }, [entry.key, register, x, y]);

  // 不在被拖的时候，格子变了就弹过去（别的卡让位、松手吸附、窗口变宽换列数）。
  useEffect(() => {
    if (isMoving) return;
    const toX = animate(x, slotX, SNAP);
    const toY = animate(y, slotY, SNAP);
    return () => {
      toX.stop();
      toY.stop();
    };
  }, [isMoving, slotX, slotY, x, y]);

  const className = [
    "scratchpad-card",
    variant ? `is-${variant}` : "",
    isSelected ? "is-selected" : "",
    isMoving ? "is-moving" : "",
    isFresh ? "is-fresh" : "",
    entry.isCurrent ? "is-current" : "",
    entry.isDimmed ? "is-dimmed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      className={className}
      data-scratchpad-key={entry.key}
      aria-selected={isSelected}
      role="option"
      style={{
        x,
        y,
        width,
        height,
        ...(variant === "photo" ? { rotate } : null),
      }}
      onPointerEnter={() => straighten(true)}
      onPointerLeave={() => straighten(false)}
      title={
        variant === "film" ? `${entry.track.title} · ${formatTrackArtists(entry.track)}` : undefined
      }
      onPointerDown={(event) => onPointerDown(entry, event)}
      onDoubleClick={() => onPlay(entry)}
    >
      <span className="scratchpad-card-cover">
        {coverUrl && !coverFailed ? (
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <span className="scratchpad-card-placeholder">
            <Music2 aria-hidden="true" />
          </span>
        )}
        <button
          type="button"
          className="scratchpad-card-play"
          title={playLabel}
          aria-label={playLabel}
          // 按下不交给卡片：这颗按钮不开始拖动，也不改选择。
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onPlay(entry)}
        >
          <Play aria-hidden="true" fill="currentColor" />
        </button>
        {
          <button
            type="button"
            className="scratchpad-card-play is-comment"
            title={t("scratchpad.openMoments")}
            aria-label={t("scratchpad.openMoments")}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              openTrackMoments(entry.track);
            }}
          >
            <MessageSquareQuote aria-hidden="true" />
          </button>
        }
        {/* 这首的标签与评论数：贴在封面左上角的一小条（卡片高度是定的，不另起一行）。 */}
        {variant !== "catalog" && entry.badge && (
          <span className="scratchpad-card-noteline">{entry.badge}</span>
        )}
      </span>
      {movingCount > 1 && (
        <span className="scratchpad-card-count" aria-hidden="true">
          {movingCount}
        </span>
      )}
      {variant === "catalog" && entry.badge && (
        <span className="scratchpad-card-no" aria-hidden="true">
          {entry.badge}
        </span>
      )}
      <span className="scratchpad-card-name">{entry.track.title}</span>
      {variant === "catalog" ? (
        // 目录卡：歌手、一道点缀色的线、标签、最新一条评论（斜体，压在横格上）、计数。
        <>
          <span className="scratchpad-card-meta">
            {entry.meta ?? formatTrackArtists(entry.track)}
          </span>
          <span className="scratchpad-card-rule" aria-hidden="true" />
          {entry.tagLine && <span className="scratchpad-card-tags">{entry.tagLine}</span>}
          {entry.quote && <span className="scratchpad-card-quote">{entry.quote}</span>}
          <span className="scratchpad-card-foot">
            <span>{entry.counts}</span>
            {entry.isCurrent && <span className="scratchpad-card-playing">{currentLabel}</span>}
          </span>
        </>
      ) : variant === "film" ? (
        // 胶片的片边：左边印序号（正在播的那一格印「▶ 正在播放」），右边印时长。
        <span className="scratchpad-card-edge">
          <span>
            {entry.isCurrent
              ? `▶ ${currentLabel}`
              : entry.position !== undefined
                ? `▸ ${entry.position}`
                : ""}
          </span>
          <span>{formatDuration(entry.track.durationMs)}</span>
        </span>
      ) : (
        <span className="scratchpad-card-meta">
          {entry.meta ?? formatTrackArtists(entry.track)}
        </span>
      )}
      {/* 选中时左上角那颗勾（只在展开整页里画，scratchpad.css）。 */}
      <span className="scratchpad-card-check" aria-hidden="true">
        <Check />
      </span>
    </motion.div>
  );
});
