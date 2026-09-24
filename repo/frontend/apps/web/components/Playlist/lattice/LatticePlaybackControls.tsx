"use client";

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
import { useI18n } from "@/store/module/i18n";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import type { LatticePlaybackControlsProps } from "@/types/components/playlistLattice";
import { LatticeProgress } from "./LatticeProgress";
import styles from "./LatticeControls.module.css";

export function LatticePlaybackControls({
  track,
  current,
  revealed,
  onPlay,
}: LatticePlaybackControlsProps) {
  const { t } = useI18n();
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
    <div className={styles.chrome} data-lattice-controls="" data-revealed={revealed}>
      <div className={styles.transport}>
        <button
          type="button"
          className={styles.play}
          aria-label={`${t(playing ? "ui.pause" : "ui.play")} ${track.name}`}
          onClick={() => onPlay(track)}
        >
          {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
        <div className={styles.details} inert={!revealed} aria-hidden={!revealed}>
          <button
            type="button"
            disabled={!canControl || (personalFm && historyIndex <= 0)}
            aria-label={t("ui.previous")}
            title={t("ui.previous")}
            onClick={() => void commands.previous()}
          >
            <SkipBack />
          </button>
          <button
            type="button"
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
          className={styles.open}
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
