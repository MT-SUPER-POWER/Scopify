import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { PlayingAnimationProps } from "@/types/shared/playingAnimation";

export const PlayingAnimation = React.memo(function PlayingAnimation({
  className,
  size = 14,
}: PlayingAnimationProps) {
  const { t } = useTranslation();

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
          className="origin-bottom [transform-box:fill-box] motion-safe:animate-equalizer"
          x="1.5"
          y="2"
          width="3"
          height="12"
          rx="1"
          fill="currentColor"
        />
        <rect
          className="origin-bottom [transform-box:fill-box] motion-safe:animate-equalizer"
          style={{ animationDelay: "0.2s" }}
          x="5.5"
          y="2"
          width="3"
          height="12"
          rx="1"
          fill="currentColor"
        />
        <rect
          className="origin-bottom [transform-box:fill-box] motion-safe:animate-equalizer"
          style={{ animationDelay: "0.4s" }}
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
