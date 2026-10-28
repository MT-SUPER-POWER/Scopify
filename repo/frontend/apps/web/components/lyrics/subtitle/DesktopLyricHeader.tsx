"use client";

import Image from "next/image";
import {
  Languages,
  Lock,
  LockOpen,
  Pause,
  Play,
  Settings2,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { DESKTOP_LYRIC_INTERACTIVE_ATTRIBUTE } from "@/hooks/lyrics/useDesktopLyricInteractiveRegion";
import { useDesktopSubtitleControlSync } from "@/hooks/player/useDesktopSubtitleControlSync";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { DESKTOP_LYRIC_HEADER_HEIGHT } from "@/lib/lyrics/desktopLyricLayout";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useAppearanceStore } from "@/store/module/appearance";
import { useDesktopSubtitleControl } from "@/store/module/desktopSubtitleControl";
import { useI18n } from "@/store/module/i18n";
import type { DesktopLyricHeaderProps } from "@/types/desktop/lyric";

const BUTTON_CLASS =
  "flex size-8 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white active:bg-white/30 disabled:opacity-50 aria-pressed:bg-white/25";

/**
 * 桌面歌词顶栏：左侧品牌标识与歌曲信息、中间播放控制、右侧设置与锁定。
 * 窗口尺寸固定，锁定按钮始终停在右上角；锁定后只有它在悬停时出现并可点击。
 */
export function DesktopLyricHeader({ hovered, locked }: DesktopLyricHeaderProps) {
  const { t } = useI18n();
  const control = useDesktopSubtitleControl();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const showTranslation = useAppearanceStore((state) => state.lyricsPreview.showTranslation);
  const updateLyricsPreview = useAppearanceStore((state) => state.updateLyricsPreview);
  useDesktopSubtitleControlSync();

  const section = cn(
    "flex min-w-0 items-center gap-1 transition-opacity duration-200",
    !locked && "group-focus-within/lyric:opacity-100",
    hovered && !locked ? "opacity-100" : "pointer-events-none opacity-0",
  );
  const artists = playback.track?.artistNames.join(" / ");
  const lockLabel = t(locked ? "desktopLyrics.unlock" : "desktopLyrics.lock");

  return (
    <header
      className="relative grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 text-white"
      style={{ height: DESKTOP_LYRIC_HEADER_HEIGHT }}
    >
      <div className={cn(section, "gap-2 leading-tight [text-shadow:0_0_4px_rgb(0_0_0/80%)]")}>
        <Image
          src="/scopify-monochrome.svg"
          alt="Scopify"
          width={28}
          height={28}
          loading="eager"
          unoptimized
          draggable={false}
          className="size-7 shrink-0 drop-shadow-[0_1px_2px_rgb(0_0_0/60%)]"
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">
            {playback.track?.title ?? t("subtitlePalette.waiting")}
          </p>
          {artists && <p className="truncate text-[11px] text-white/70">{artists}</p>}
        </div>
      </div>
      <div className={section}>
        <button
          type="button"
          aria-label={t("desktopLyrics.previous")}
          title={t("desktopLyrics.previous")}
          onClick={() => void commands.previous()}
          className={BUTTON_CLASS}
        >
          <SkipBack className="size-4 fill-current" />
        </button>
        <button
          type="button"
          aria-label={t("desktopLyrics.playPause")}
          title={t("desktopLyrics.playPause")}
          onClick={() => void commands.toggle()}
          className={cn(BUTTON_CLASS, "size-9")}
        >
          {playback.isPlaying ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 fill-current" />
          )}
        </button>
        <button
          type="button"
          aria-label={t("desktopLyrics.next")}
          title={t("desktopLyrics.next")}
          onClick={() => void commands.next()}
          className={BUTTON_CLASS}
        >
          <SkipForward className="size-4 fill-current" />
        </button>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-1">
        <div className={section}>
          <button
            type="button"
            aria-label={t("subtitlePreview.translation")}
            aria-pressed={showTranslation}
            title={t("subtitlePreview.translation")}
            onClick={() => updateLyricsPreview({ showTranslation: !showTranslation })}
            className={BUTTON_CLASS}
          >
            <Languages className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t("subtitleControl.style")}
            title={t("subtitleControl.style")}
            onClick={() =>
              runtime.navigation.navigateMainWindow("/setting?tab=appearance#subtitle-style")
            }
            className={BUTTON_CLASS}
          >
            <Settings2 className="size-4" />
          </button>
        </div>
        <button
          type="button"
          {...{ [DESKTOP_LYRIC_INTERACTIVE_ATTRIBUTE]: "" }}
          aria-label={lockLabel}
          aria-pressed={locked}
          title={lockLabel}
          disabled={control.busy || !control.preferences}
          onClick={() => void control.configure({ locked: !locked })}
          className={cn(
            BUTTON_CLASS,
            "size-9 transition-opacity duration-200 group-focus-within/lyric:opacity-100 aria-pressed:bg-transparent",
            hovered ? "opacity-100" : "opacity-0",
            locked && "drop-shadow-[0_1px_2px_rgb(0_0_0/60%)] hover:bg-black/40",
          )}
        >
          {locked ? <LockOpen className="size-5" /> : <Lock className="size-5" />}
        </button>
        <div className={section}>
          <button
            type="button"
            aria-label={t("desktopLyrics.close")}
            title={t("desktopLyrics.close")}
            disabled={control.busy}
            onClick={() => void control.close()}
            className={cn(BUTTON_CLASS, "hover:bg-red-600")}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      {control.failed && (
        <span
          role="alert"
          className="absolute top-full right-3 z-10 w-40 rounded bg-black/90 p-2 text-xs text-white"
        >
          {t("subtitleControl.failed")}
        </span>
      )}
    </header>
  );
}
