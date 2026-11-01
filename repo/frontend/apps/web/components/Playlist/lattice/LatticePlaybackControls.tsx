"use client";

import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Heart,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { usePlayerStore } from "@/store/module/player";
import { useUiStore } from "@/store/module/ui";
import { useTranslation } from "react-i18next";

import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import type { LatticePlaybackControlsProps } from "@/types/playlist/latticeComponents";
import { LatticeProgress } from "./LatticeProgress";

const transportButton =
  "grid size-12 shrink-0 cursor-pointer place-items-center rounded-full opacity-72 transition-[opacity,background-color] duration-200 focus-visible:bg-white/10 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white enabled:hover:bg-white/10 enabled:hover:opacity-100 disabled:cursor-default disabled:opacity-25 aria-pressed:text-primary aria-pressed:opacity-100 [&_svg]:size-[25px]";

export function LatticePlaybackControls({
  track,
  current,
  revealed,
  onPlay,
}: LatticePlaybackControlsProps) {
  const { t } = useTranslation();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const shuffle = usePlayerStore((state) => state.isShuffle);
  const sourceId = usePlayerStore((state) => state.playlistId);
  const historyIndex = usePlayerStore((state) => state.historyIndex);
  const personalFm = isPersonalFmPlaybackSource(sourceId);
  const canControl = current && playback.connection === "connected";
  const playing = current && playback.isPlaying;
  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const toggleRepeat = () => {
    usePlayerStore
      .getState()
      .setRepeatMode(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off");
  };
  return (
    <div
      className="group/chrome absolute inset-x-10 bottom-8 z-2 cursor-auto text-white motion-reduce:**:transition-none"
      data-lattice-controls=""
      data-revealed={revealed}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          className={cn(transportButton, "size-14 opacity-100 [&_svg]:size-[34px]")}
          aria-label={`${t(playing ? "ui.pause" : "ui.play")} ${track.name}`}
          onClick={() => onPlay(track)}
        >
          {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
        <div
          className="flex translate-y-1 items-center gap-1 opacity-0 transition-[opacity,translate] duration-200 group-data-[revealed=true]/chrome:translate-y-0 group-data-[revealed=true]/chrome:opacity-100"
          inert={!revealed}
          aria-hidden={!revealed}
        >
          <button
            type="button"
            className={transportButton}
            disabled={!canControl || (personalFm && historyIndex <= 0)}
            aria-label={t("ui.previous")}
            title={t("ui.previous")}
            onClick={() => void commands.previous()}
          >
            <SkipBack />
          </button>
          <button
            type="button"
            className={transportButton}
            disabled={!canControl}
            aria-label={t("ui.like")}
            aria-pressed={current && playback.liked}
            title={t("ui.like")}
            onClick={() => void commands.toggleLike()}
          >
            <Heart fill={current && playback.liked ? "currentColor" : "none"} />
          </button>
          {!personalFm && (
            <button
              type="button"
              className={transportButton}
              disabled={!canControl}
              aria-label={t(
                repeatMode === "one"
                  ? "ui.repeatOne"
                  : repeatMode === "all"
                    ? "ui.repeatAll"
                    : "ui.repeatOff",
              )}
              aria-pressed={repeatMode !== "off"}
              onClick={toggleRepeat}
            >
              <RepeatIcon />
            </button>
          )}
          {!personalFm && (
            <button
              type="button"
              className={transportButton}
              disabled={!canControl}
              aria-label={t(shuffle ? "ui.shuffleOn" : "ui.shuffleOff")}
              aria-pressed={shuffle}
              onClick={() => usePlayerStore.getState().toggleShuffle()}
            >
              <Shuffle />
            </button>
          )}
          <button
            type="button"
            className={transportButton}
            disabled={!canControl}
            aria-label={t("ui.next")}
            title={t("ui.next")}
            onClick={() => void commands.next()}
          >
            <SkipForward />
          </button>
        </div>
        <button
          type="button"
          className={cn(transportButton, "ml-auto")}
          disabled={!current}
          aria-label={t("ui.showLyrics")}
          title={t("ui.showLyrics")}
          onClick={() => useUiStore.getState().setIsLyricsOpen(true)}
        >
          <ArrowUpRight />
        </button>
      </div>
      <LatticeProgress current={current} trackId={track.id} durationMs={track.dt} />
    </div>
  );
}
