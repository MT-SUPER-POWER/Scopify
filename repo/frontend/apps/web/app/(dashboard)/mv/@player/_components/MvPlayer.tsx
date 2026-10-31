"use client";

import {
  Fullscreen,
  LoaderCircle,
  Maximize,
  Minimize,
  Pause,
  Play,
  Shrink,
  SkipForward,
  RectangleHorizontal,
  PanelsTopLeft,
  PanelBottom,
} from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { MvProgressBar } from "./player/MvProgressBar";
import { MvSettingsMenu } from "./player/MvSettingsMenu";
import { MvVolumeControl } from "./player/MvVolumeControl";
import { useMVUrlQuery } from "@/hooks/mv/useMVQueries";
import { useMvSongExclusivity } from "@/hooks/mv/useMvSongExclusivity";
import { useMvVideoState } from "@/hooks/mv/useMvVideoState";
import { useMvQualitySwitch } from "@/hooks/mv/useMvQualitySwitch";
import { getMvResolutions } from "@/lib/music/mvQuality";
import { cn, formatDuration } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useMvPlaybackStore } from "@/store/module/mvPlayback";
import type { MvPlayerProps } from "@/types/mv/components";

const CONTROLS_IDLE_MS = 2_500;
const VOLUME_STORAGE_KEY = "scopify-mv-volume";
const CONTROL_BTN =
  "flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15";

function readStoredVolume() {
  try {
    const value = Number(localStorage.getItem(VOLUME_STORAGE_KEY));
    return Number.isFinite(value) && value > 0 && value <= 1 ? value : 1;
  } catch {
    return 1;
  }
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/**
 * MV 页播放器（YouTube 式控件）：进度条、播放/下一个、音量、时间、画质、网页全屏（铺满应用窗口，
 * 同 Bilibili）与真全屏。快捷键：空格/K 播放暂停，J/L 进退 10 秒，←/→ 5 秒，↑/↓ 音量，M 静音，
 * T 剧场模式，W 网页全屏，F 全屏，Esc 退出网页全屏。这些无修饰键优先控制 MV。
 */
export function MvPlayer({
  mvid,
  resolutions,
  poster,
  onNext,
  isTheater,
  isPlayerBarHidden,
  onTogglePlayerBar,
  onToggleTheater,
}: MvPlayerProps) {
  const { t } = useI18n();
  const { videoRef, handleVideoPlay } = useMvSongExclusivity();
  const { resolution, autoPlay, changeResolution, restorePlayback } = useMvQualitySwitch(
    videoRef,
    resolutions,
  );
  const quality = useMvPlaybackStore((state) => state.quality);
  const playbackRate = useMvPlaybackStore((state) => state.playbackRate);
  const setPlaybackRate = useMvPlaybackStore((state) => state.setPlaybackRate);
  const autoNext = useMvPlaybackStore((state) => state.autoNext);
  const setAutoNext = useMvPlaybackStore((state) => state.setAutoNext);
  const urlQuery = useMVUrlQuery(mvid, resolution);
  const url = urlQuery.data?.data?.url ?? null;
  const currentResolution = urlQuery.data?.data?.r || resolution;
  const available = getMvResolutions(resolutions, currentResolution);
  const video = useMvVideoState(videoRef, url);
  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | undefined>(undefined);
  const [isWebFullscreen, setIsWebFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isTheaterMenuOpen, setIsTheaterMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const showControls = !isIdle || video.isPaused || isTheaterMenuOpen || isSettingsOpen;

  const togglePlay = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;
    if (element.paused) void element.play();
    else element.pause();
  }, [videoRef]);

  const seekBy = useCallback(
    (seconds: number) => {
      const element = videoRef.current;
      if (element) element.currentTime = Math.max(0, element.currentTime + seconds);
    },
    [videoRef],
  );

  const setVolume = useCallback(
    (volume: number) => {
      const element = videoRef.current;
      if (!element) return;
      element.volume = Math.min(1, Math.max(0, volume));
      element.muted = element.volume === 0;
      try {
        if (element.volume > 0) localStorage.setItem(VOLUME_STORAGE_KEY, String(element.volume));
      } catch {
        // 音量记忆只是便利功能
      }
    },
    [videoRef],
  );

  const toggleMute = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;
    element.muted = !element.muted;
    if (!element.muted && element.volume === 0) element.volume = readStoredVolume();
  }, [videoRef]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void containerRef.current?.requestFullscreen();
  }, []);

  const wakeControls = useCallback(() => {
    setIsIdle(false);
    window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => setIsIdle(true), CONTROLS_IDLE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(idleTimerRef.current), []);

  // 网页全屏需要把页面内容层提到顶栏与播放栏之上（见 RouteScrollSurface）
  useEffect(() => {
    if (!isWebFullscreen) return;
    document.documentElement.setAttribute("data-mv-web-fullscreen", "");
    return () => document.documentElement.removeAttribute("data-mv-web-fullscreen");
  }, [isWebFullscreen]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTheaterMenuOpen || isSettingsOpen) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (isTypingTarget(event.target) || document.querySelector("[role=dialog]")) return;
      const actions: Record<string, () => void> = {
        Space: togglePlay,
        KeyK: togglePlay,
        KeyJ: () => seekBy(-10),
        KeyL: () => seekBy(10),
        ArrowLeft: () => seekBy(-5),
        ArrowRight: () => seekBy(5),
        ArrowUp: () => setVolume((videoRef.current?.volume ?? 1) + 0.05),
        ArrowDown: () => setVolume((videoRef.current?.volume ?? 1) - 0.05),
        KeyM: toggleMute,
        KeyF: toggleFullscreen,
        KeyW: () => setIsWebFullscreen((value) => !value),
        KeyT: onToggleTheater,
        ...(isWebFullscreen && !document.fullscreenElement
          ? { Escape: () => setIsWebFullscreen(false) }
          : {}),
      };
      const action = actions[event.code];
      if (!action) return;
      event.preventDefault();
      event.stopPropagation();
      action();
      wakeControls();
    };
    // 捕获阶段处理，抢在全局快捷键之前
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [
    onToggleTheater,
    isTheaterMenuOpen,
    isSettingsOpen,
    isWebFullscreen,
    seekBy,
    setVolume,
    toggleFullscreen,
    toggleMute,
    togglePlay,
    videoRef,
    wakeControls,
  ]);

  return (
    <div
      ref={containerRef}
      data-no-window-drag={isWebFullscreen || undefined}
      onPointerMove={wakeControls}
      onPointerLeave={() => setIsIdle(true)}
      className={cn(
        "group/player relative overflow-hidden bg-black select-none",
        isWebFullscreen
          ? "fixed inset-0 z-200"
          : isFullscreen
            ? "size-full"
            : isTheater
              ? isPlayerBarHidden
                ? "h-[min(82dvh,calc(100dvh-8rem))] min-h-64 w-full"
                : "h-[min(75dvh,calc(100dvh-8rem))] min-h-64 w-full"
              : "aspect-video w-full rounded-xl shadow-panel",
        !showControls && "cursor-none",
      )}
    >
      {url ? (
        <video
          ref={videoRef}
          key={url}
          src={url}
          poster={poster}
          autoPlay={autoPlay}
          playsInline
          onPlay={handleVideoPlay}
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
          onEnded={autoNext ? onNext : undefined}
          onLoadedMetadata={(event) => {
            event.currentTarget.volume = readStoredVolume();
            event.currentTarget.playbackRate = playbackRate;
            restorePlayback(event);
          }}
          className="size-full object-contain"
        />
      ) : urlQuery.isError || (urlQuery.isSuccess && !url) ? (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
          {t("mv.status.unavailable")}
        </p>
      ) : null}

      {(!url || video.isBuffering) && !urlQuery.isError && (
        <LoaderCircle className="pointer-events-none absolute inset-0 m-auto size-12 animate-spin text-white/80" />
      )}

      {(url || urlQuery.isError || urlQuery.isSuccess) && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/30 to-transparent px-3 pt-16 pb-1 transition-opacity duration-200 focus-within:pointer-events-auto focus-within:opacity-100",
            showControls ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <MvProgressBar
            currentTime={video.currentTime}
            duration={video.duration}
            buffered={video.buffered}
            onSeek={video.seekTo}
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={t(video.isPaused ? "mv.player.play" : "mv.player.pause")}
              className={CONTROL_BTN}
            >
              {video.isPaused ? (
                <Play className="size-5 fill-current" />
              ) : (
                <Pause className="size-5 fill-current" />
              )}
            </button>
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                aria-label={t("mv.player.next")}
                className={CONTROL_BTN}
              >
                <SkipForward className="size-5 fill-current" />
              </button>
            )}
            <MvVolumeControl
              volume={video.volume}
              isMuted={video.isMuted}
              onVolumeChange={setVolume}
              onToggleMute={toggleMute}
            />
            <span className="ml-2 text-sm text-white tabular-nums">
              {formatDuration(video.currentTime * 1_000)} / {formatDuration(video.duration * 1_000)}
            </span>

            <div className="ml-auto flex items-center gap-1">
              <MvSettingsMenu
                resolutions={available}
                current={currentResolution}
                quality={quality}
                playbackRate={playbackRate}
                autoNext={autoNext}
                onQualityChange={changeResolution}
                onPlaybackRateChange={(rate) => {
                  setPlaybackRate(rate);
                  if (videoRef.current) videoRef.current.playbackRate = rate;
                }}
                onAutoNextChange={setAutoNext}
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
              />
              <PopoverPrimitive.Root open={isTheaterMenuOpen} onOpenChange={setIsTheaterMenuOpen}>
                <PopoverPrimitive.Trigger asChild>
                  <button
                    type="button"
                    aria-label={t("mv.player.theater")}
                    title={`${t("mv.player.theater")} (t)`}
                    className={CONTROL_BTN}
                  >
                    {isTheater ? (
                      <PanelsTopLeft className="size-5" />
                    ) : (
                      <RectangleHorizontal className="size-5" />
                    )}
                  </button>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Content
                  side="top"
                  align="end"
                  sideOffset={8}
                  className="z-20 w-56 rounded-xl bg-black/90 p-1.5 text-white shadow-xl ring-1 ring-white/10 outline-none"
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isTheater}
                    onClick={onToggleTheater}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/15"
                  >
                    <RectangleHorizontal className="size-4" />
                    <span className="flex-1">{t("mv.player.theater")}</span>
                    <span
                      aria-hidden
                      className={cn(
                        "h-5 w-9 rounded-full p-0.5 transition-colors",
                        isTheater ? "bg-white" : "bg-white/30",
                      )}
                    >
                      <span
                        className={cn(
                          "block size-4 rounded-full transition-transform",
                          isTheater ? "translate-x-4 bg-black" : "bg-white",
                        )}
                      />
                    </span>
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!isPlayerBarHidden}
                    disabled={!isTheater}
                    onClick={onTogglePlayerBar}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/15 disabled:opacity-40"
                  >
                    <PanelBottom className="size-4" />
                    <span className="flex-1">{t("playerBar.show")}</span>
                    <span
                      aria-hidden
                      className={cn(
                        "h-5 w-9 rounded-full p-0.5 transition-colors",
                        !isPlayerBarHidden ? "bg-white" : "bg-white/30",
                      )}
                    >
                      <span
                        className={cn(
                          "block size-4 rounded-full transition-transform",
                          !isPlayerBarHidden ? "translate-x-4 bg-black" : "bg-white",
                        )}
                      />
                    </span>
                  </button>
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Root>
              <button
                type="button"
                onClick={() => setIsWebFullscreen((value) => !value)}
                aria-label={t(
                  isWebFullscreen ? "mv.player.exitWebFullscreen" : "mv.player.webFullscreen",
                )}
                title={`${t(isWebFullscreen ? "mv.player.exitWebFullscreen" : "mv.player.webFullscreen")} (w)`}
                className={CONTROL_BTN}
              >
                {isWebFullscreen ? (
                  <Shrink className="size-5" />
                ) : (
                  <Fullscreen className="size-5" />
                )}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={t(isFullscreen ? "mv.player.exitFullscreen" : "mv.player.fullscreen")}
                title={`${t(isFullscreen ? "mv.player.exitFullscreen" : "mv.player.fullscreen")} (f)`}
                className={CONTROL_BTN}
              >
                {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
