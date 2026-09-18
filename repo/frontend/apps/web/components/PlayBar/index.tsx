"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { PlayerBarCenterControls } from "./PlayerBarCenterControls";
import { PlayerBarLeftControls } from "./PlayerBarLeftControls";
import { PlayerBarRightControls } from "./PlayerBarRightControls";

export * from "./AudioOutputDeviceControl";
export * from "./AudioSettingsButton";
export * from "./FullscreenButton";
export * from "./LyricStageButton";
export * from "./PlayerBarCenterControls";
export * from "./PlayerBarLeftControls";
export * from "./PlayerBarRightControls";
export * from "./PlayerBarStatAction";
export * from "./ProgressBar";
export * from "./QueuePopoverLauncher";
export * from "./VolumeControl";

export const PlayerBar = ({
  className,
  onCloseLyricStage,
  style,
  bgClass,
  variant = "default",
}: {
  className?: string;
  onCloseLyricStage?: () => void;
  style?: React.CSSProperties;
  bgClass?: string;
  variant?: "default" | "lyric-stage";
}) => {
  const isLyricStageBar = variant === "lyric-stage";

  return (
    <div
      className={cn(
        "z-20 flex h-17 w-full items-center justify-between transition-all duration-300 ease-linear lg:h-20",
        bgClass ?? "bg-surface",
        className,
      )}
      style={style}
    >
      <div
        className={cn(
          "z-20 h-17 w-full items-center px-4 transition-all duration-300 ease-linear lg:h-20",
          isLyricStageBar
            ? "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4"
            : "flex justify-between md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4",
        )}
      >
        {/* ================= Left: Song Info ================= */}
        <PlayerBarLeftControls
          isLyricStageBar={isLyricStageBar}
          onCloseLyricStage={onCloseLyricStage}
        />

        {/* ================= Center: Controls ================= */}
        <PlayerBarCenterControls isLyricStageBar={isLyricStageBar} />

        {/* ================= Right: Extra Controls ================= */}
        <PlayerBarRightControls isLyricStageBar={isLyricStageBar} />
      </div>
    </div>
  );
};

export default PlayerBar;
