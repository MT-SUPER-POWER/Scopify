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
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MvProgressBar } from "./player/MvProgressBar";
import { MvQualityMenu } from "./player/MvQualityMenu";
import { MvVolumeControl } from "./player/MvVolumeControl";
import { useMVUrlQuery } from "@/hooks/mv/useMVQueries";
import { useMvSongExclusivity } from "@/hooks/mv/useMvSongExclusivity";
import { useMvVideoState } from "@/hooks/mv/useMvVideoState";
import { useMvQualitySwitch } from "@/hooks/mv/useMvQualitySwitch";
import { getMvResolutions } from "@/lib/music/mvQuality";
import { cn, formatDuration } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvPlayerProps } from "@/types/components/mv";

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
 * W 网页全屏，F 全屏，Esc 退出网页全屏。页面上这些无修饰键优先控制 MV，而不是全局的歌曲播放。
 */
export function MvPlayer({ mvid, resolutions, poster, onNext }: MvPlayerProps) {
  const { t } = useI18n();
  const { videoRef, handleVideoPlay } = useMvSongExclusivity();
  const { resolution, autoPlay, changeResolution, restorePlayback } = useMvQualitySwitch(videoRef);
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
  const showControls = !isIdle || video.isPaused;

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
          onEnded={onNext}
          onLoadedMetadata={(event) => {
            event.currentTarget.volume = readStoredVolume();
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
              <MvQualityMenu
                resolutions={available}
                current={currentResolution}
                onChange={changeResolution}
              />
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
