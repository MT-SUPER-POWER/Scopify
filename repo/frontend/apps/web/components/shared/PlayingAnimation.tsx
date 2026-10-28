import React from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { PlayingAnimationProps } from "@/types/shared/playingAnimation";
import styles from "./PlayingAnimation.module.css";

export const PlayingAnimation = React.memo(function PlayingAnimation({
  className,
  size = 14,
}: PlayingAnimationProps) {
  const { t } = useI18n();

  return (
    <div className={cn("flex shrink-0 items-end gap-0.5", className)}>
      <svg
        viewBox="0 0 14 14"
        role="img"
        aria-label={t("common.status.playing")}
        width={size}
        height={size}
        className="text-brand"
      >
        <rect
          className={styles.bar}
          x="1.5"
          y="2"
          width="3"
          height="12"
          rx="1"
          fill="currentColor"
        />
        <rect
          className={styles.bar}
          x="5.5"
          y="2"
          width="3"
          height="12"
          rx="1"
          fill="currentColor"
        />
        <rect
          className={styles.bar}
          x="9.5"
          y="2"
          width="3"
          height="12"
          rx="1"
          fill="currentColor"
        />
      </svg>
    </div>
  );
});
