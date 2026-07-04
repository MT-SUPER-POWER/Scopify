import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";
import SPOTIFYANIME from "@/resources/eq-playing.svg";
import { useI18n } from "@/store/module/i18n";

interface PlayingAnimationProps {
  className?: string;
  size?: number;
}

export const PlayingAnimation = React.memo(function PlayingAnimation({
  className,
  size = 14,
}: PlayingAnimationProps) {
  const { t } = useI18n();

  return (
    <div className={cn("flex items-end gap-0.5 shrink-0", className)}>
      <Image
        src={SPOTIFYANIME}
        alt={t("common.status.playing")}
        width={size}
        height={size}
        unoptimized
      />
    </div>
  );
});
