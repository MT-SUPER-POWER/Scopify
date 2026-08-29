"use client";

import {
  Heart,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RepeatOff,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useI18n } from "@/store/module/i18n";

import { FoliaAudioSettingsControl } from "@/components/lyrics/FoliaAudioSettingsControl";
import { FoliaReplayGainControl } from "@/components/lyrics/FoliaReplayGainControl";
import type { Theme } from "@/components/lyrics/folia/src/types";
import { FoliaLyricsControls } from "@/components/lyrics/FoliaLyricsControls";
import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";
import type { FoliaPanelControlsProps } from "@/types/components/lyrics";

export function FoliaPanelControls({
  onOpenEqualizer,
  onOpenFoliaSettings,
  onOpenLyricMatch,
  theme,
}: FoliaPanelControlsProps) {
  const { t } = useI18n();
  const model = useFoliaPanelControls();
  const isDaylight = theme.name === "snow";
  const RepeatIcon =
    model.repeatMode === "off" ? RepeatOff : model.repeatMode === "one" ? Repeat1 : Repeat;
  const VolumeIcon = model.volume === 0 ? VolumeX : model.volume < 50 ? Volume1 : Volume2;

  return (
    <div className="space-y-4">
      {/* 1st Section: Media Playback Controls (Boxed) */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <IconButton theme={theme} title={String(t("folia.ui.previous"))} onClick={model.playPrev}>
            <SkipBack size={20} />
          </IconButton>
          <IconButton
            title={String(t(model.isPlaying ? "folia.ui.pause" : "folia.ui.play"))}
            onClick={model.togglePlay}
            theme={theme}
          >
            {model.isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </IconButton>
          <IconButton theme={theme} title={String(t("folia.ui.next"))} onClick={model.playNext}>
            <SkipForward size={20} />
          </IconButton>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <IconButton
            theme={theme}
            title={String(t("folia.ui.loopMode"))}
            onClick={model.toggleRepeat}
          >
            <RepeatIcon size={20} />
          </IconButton>
          <IconButton
            active={model.isLiked}
            theme={theme}
            title={String(t("folia.ui.like"))}
            onClick={model.toggleLike}
          >
            <Heart size={20} fill={model.isLiked ? "currentColor" : "none"} />
          </IconButton>
          {model.isPersonalFm ? (
            <IconButton
              disabled={model.isDislikingPersonalFm}
              theme={theme}
              title={String(t("personalFm.action.dislike"))}
              onClick={model.dislikePersonalFm}
            >
              {model.isDislikingPersonalFm ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Trash2 size={20} />
              )}
            </IconButton>
          ) : (
            <IconButton
              active={model.isShuffle}
              theme={theme}
              title={String(t("folia.queue.shuffle"))}
              onClick={model.toggleShuffle}
            >
              <Shuffle size={20} />
            </IconButton>
          )}
        </div>
      </div>

      {/* 2nd Section: Volume */}
      <section
        className={`block space-y-2 border-t pt-4 ${isDaylight ? "border-black/5" : "border-white/5"}`}
      >
        <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase opacity-55">
          <span>{t("folia.ui.volume")}</span>
          <span className="font-mono">{Math.round(model.volume)}%</span>
        </div>
        <span
          className={`flex items-center gap-3 rounded-xl p-2 ${isDaylight ? "bg-black/5" : "bg-black/20"}`}
        >
          <button
            type="button"
            title={String(t("folia.ui.mute"))}
            onClick={model.toggleMute}
            className="opacity-50 hover:opacity-100"
          >
            <VolumeIcon size={16} />
          </button>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={model.volume}
            onChange={(event) => model.setVolume(Number(event.currentTarget.value))}
            onInput={(event) => model.setVolume(Number(event.currentTarget.value))}
            className={`h-1 flex-1 cursor-pointer appearance-none rounded-full ${isDaylight ? "bg-black/10" : "bg-white/10"}`}
            style={{ accentColor: theme.accentColor }}
          />
        </span>
      </section>

      {/* Audio Settings */}
      <section
        className={`flex items-center justify-between gap-3 border-t pt-4 ${isDaylight ? "border-black/5" : "border-white/5"}`}
      >
        <span className="text-[11px] font-semibold tracking-wider uppercase opacity-55">
          {t("audioSettings.title")}
        </span>
        <FoliaAudioSettingsControl onOpenEqualizer={onOpenEqualizer} theme={theme} />
      </section>

      <FoliaReplayGainControl theme={theme} />

      {/* 3rd Section: Lyrics */}
      <div className={`border-t pt-4 ${isDaylight ? "border-black/5" : "border-white/5"}`}>
        <FoliaLyricsControls
          onOpenFoliaSettings={onOpenFoliaSettings}
          onOpenLyricMatch={onOpenLyricMatch}
          theme={theme}
        />
      </div>
    </div>
  );
}

function IconButton({
  active = false,
  children,
  disabled = false,
  onClick,
  theme,
  title,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  theme: Theme;
  title: string;
}) {
  const isDaylight = theme.name === "snow";
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-12 items-center justify-center rounded-xl transition-colors disabled:cursor-wait disabled:opacity-40 ${
        isDaylight ? "hover:bg-black/10" : "hover:bg-white/10"
      }`}
      style={{
        backgroundColor: active
          ? `${theme.accentColor}${isDaylight ? "24" : "30"}`
          : isDaylight
            ? "rgba(0,0,0,0.035)"
            : "rgba(255,255,255,0.05)",
        color: active ? theme.accentColor : theme.primaryColor,
      }}
    >
      {children}
    </button>
  );
}
