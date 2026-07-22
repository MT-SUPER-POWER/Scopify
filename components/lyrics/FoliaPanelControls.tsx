"use client";

import {
  Heart,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RepeatOff,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";

export function FoliaPanelControls() {
  const { t } = useTranslation();
  const model = useFoliaPanelControls();
  const RepeatIcon =
    model.repeatMode === "off" ? RepeatOff : model.repeatMode === "one" ? Repeat1 : Repeat;
  const VolumeIcon = model.volume === 0 ? VolumeX : model.volume < 50 ? Volume1 : Volume2;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <IconButton title={String(t("ui.previous"))} onClick={model.playPrev}>
          <SkipBack size={20} />
        </IconButton>
        <IconButton
          title={String(t(model.isPlaying ? "ui.pause" : "ui.play"))}
          onClick={model.togglePlay}
        >
          {model.isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </IconButton>
        <IconButton title={String(t("ui.next"))} onClick={model.playNext}>
          <SkipForward size={20} />
        </IconButton>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <IconButton title={String(t("ui.loopMode"))} onClick={model.toggleRepeat}>
          <RepeatIcon size={20} />
        </IconButton>
        <IconButton active={model.isLiked} title={String(t("ui.like"))} onClick={model.toggleLike}>
          <Heart size={20} fill={model.isLiked ? "currentColor" : "none"} />
        </IconButton>
        <IconButton
          active={model.isShuffle}
          title={String(t("queue.shuffle"))}
          onClick={model.toggleShuffle}
        >
          <Shuffle size={20} />
        </IconButton>
      </div>

      <label className="block space-y-2 border-t border-white/5 pt-4">
        <span className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase opacity-55">
          <span>{t("ui.volume")}</span>
          <span>{Math.round(model.volume)}%</span>
        </span>
        <span className="flex items-center gap-3 rounded-xl bg-black/20 p-2">
          <button
            type="button"
            title={String(t("ui.mute"))}
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
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
          />
        </span>
      </label>

      <label className="block space-y-2 border-t border-white/5 pt-4">
        <span className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase opacity-55">
          <span>{t("options.lyricTimelineOffset")}</span>
          <span>{(model.lyricOffsetMs / 1_000).toFixed(1)}s</span>
        </span>
        <span className="flex items-center gap-3 rounded-xl bg-black/20 p-2">
          <input
            type="range"
            min="-5000"
            max="5000"
            step="100"
            value={model.lyricOffsetMs}
            onChange={(event) => model.setLyricOffsetMs(Number(event.currentTarget.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
          />
          <button
            type="button"
            title={String(t("ui.default"))}
            onClick={() => model.setLyricOffsetMs(0)}
            className="opacity-50 hover:opacity-100"
          >
            <RotateCcw size={15} />
          </button>
        </span>
      </label>
    </div>
  );
}

function IconButton({
  active = false,
  children,
  onClick,
  title,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-12 items-center justify-center rounded-xl transition-colors ${
        active ? "bg-white/20 text-white" : "bg-white/5 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
