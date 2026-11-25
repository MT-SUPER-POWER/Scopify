import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Command, Play, Pause } from "lucide-react";
import { useProgressChorusMarker } from "@/hooks/player/useProgressChorusMarker";
import { useTranslation } from "react-i18next";
import {
  FOLIA_CAPSULE_BUTTON_CLASS,
  FoliaCapsuleActionContents,
  FoliaCapsuleSlotControl,
} from "@/components/lyrics/stage/FoliaCapsuleActions";
import { FOLIA_CAPSULE_QUICK_ACTIONS } from "@/constants/foliaCapsule";
import { FoliaCapsuleVolume } from "@/components/lyrics/stage/FoliaCapsuleVolume";
import { useFoliaCapsuleActions } from "@/hooks/player/useFoliaCapsuleActions";
import { useFoliaCapsuleActivation } from "@/hooks/player/useFoliaCapsuleActivation";
import { useFoliaPlaybackControlsStore } from "@/store/module/foliaPlaybackControls";
import { useUiStore } from "@/store/module/ui";
import type { CommandWorkspacePage } from "@/types/commandWorkspace/model";

import { FoliaTrackTitleNavigator } from "@/components/lyrics/stage/FoliaTrackTitleNavigator";
import { usePlayerStore } from "@/store/module/player";
import { getNeteaseTrackId } from "@/lib/providers/netease/adapters/track";
import type {
  CollapsedFoliaCapsuleProps,
  ExpandedFoliaCapsuleProps,
  FloatingPlayerControlsProps,
} from "@/types/player/foliaControls";
import ProgressBar from "./ProgressBar";
import { PlayerState } from "../types";
import LyricsTimelineModal from "./modal/LyricsTimelineModal";

const CONTROL_LAYOUT_SPRING = {
  type: "spring" as const,
  stiffness: 280,
  damping: 24,
};

const HOVER_HITBOX_BOTTOM_BUFFER_PX = 32;

const FloatingPlayerControls: React.FC<FloatingPlayerControlsProps> = ({
  currentSong,
  playerState,
  currentTime,
  lyricCurrentTime,
  duration,
  loopMode,
  currentView,
  canTogglePlay = false,
  lyrics,
  onSeek,
  onTogglePlay,
  onToggleLoop,
  onNavigateToPlayer,
  noTrackText,
  primaryColor = "var(--text-primary)",
  secondaryColor = "var(--text-secondary)",
  theme,
  isDaylight,
  isHidden = false,
  hideControlBar = false,
  controlsDisabled = false,
}) => {
  const { t } = useTranslation();
  const currentSongId = usePlayerStore((state) => getNeteaseTrackId(state.currentTrack) ?? null);
  const { chorusMarkerFraction, chorusRanges } = useProgressChorusMarker({
    durationMs: duration * 1_000,
    lyrics,
    songId: currentSongId,
  });
  const resolvedNoTrackText = noTrackText ?? t("folia.ui.noTrack");
  const themeMarkerColor = theme?.accentColor || theme?.primaryColor || primaryColor;
  const glassBgExpanded = isDaylight
    ? "bg-white/60 border border-white/20 shadow-xl"
    : "bg-black/40 border border-white/5";
  const glassBgCollapsed = isDaylight
    ? "bg-white/40 border border-white/20 shadow-lg hover:bg-white/50"
    : "bg-black/20 border border-white/5 hover:bg-black/30";
  const trackColor = isDaylight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)";

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isSlotMenuOpen, setIsSlotMenuOpen] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);
  const isWorkspaceOpen = useUiStore((state) => state.isSearchOpen);
  const launch = useFoliaPlaybackControlsStore((state) => state.commandWorkspaceLaunch);
  const capsuleSlots = useFoliaPlaybackControlsStore((state) => state.capsuleSlots);
  const isPlayerView = currentView === "player";
  const canAutoExpand = canTogglePlay && duration > 0;
  const isPaused = canAutoExpand && playerState !== PlayerState.PLAYING;
  const openWorkspace = (page: CommandWorkspacePage) => {
    const rect = capsuleRef.current?.getBoundingClientRect();
    const frame =
      rect && rect.width && page !== "folia-subtitles"
        ? {
            centerX: rect.left + rect.width / 2,
            bottom: Math.max(0, window.innerHeight - rect.bottom),
            width: rect.width,
            height: rect.height,
          }
        : undefined;
    useFoliaPlaybackControlsStore.getState().openCommandWorkspace(page, frame);
  };
  const { actions, volumeAnchor, closeVolume, onMute } = useFoliaCapsuleActions({
    controlsDisabled,
    currentView,
    hasLyrics: !!lyrics,
    loopMode,
    onToggleLoop,
    onToggleTimeline: () => setIsTimelineOpen(true),
    openWorkspace,
  });
  const { hoverExpanded, hoverActions, touchActions, mayOpenOnClick, handlers } =
    useFoliaCapsuleActivation({ controlsRef, isPaused, isPlayerView });
  const attachedWorkspaceOpen = isWorkspaceOpen && !!launch?.frame;
  const pinned = hasFocus || hoverExpanded || isSlotMenuOpen || !!volumeAnchor || touchActions;
  const hidden = attachedWorkspaceOpen || (isHidden && !pinned);
  const showExpanded =
    hoverExpanded || isSlotMenuOpen || !!volumeAnchor || touchActions || (isPaused && isPlayerView);
  const showQuickActions =
    isPlayerView && !isSlotMenuOpen && (hoverActions || touchActions || hasFocus);
  const quickActions = FOLIA_CAPSULE_QUICK_ACTIONS.filter(
    (id) =>
      !capsuleSlots.includes(id) &&
      actions[id].enabled !== false &&
      (id !== "volume" || !touchActions),
  );
  const commandLabel = t("shortcuts.command.openCommandPalette");

  if (hideControlBar) {
    return null;
  }

  return (
    <>
      <motion.div
        inert={hidden}
        className={`pointer-events-none absolute bottom-8 left-1/2 z-60 flex w-full -translate-x-1/2 justify-center transition-all duration-300 ${currentView === "home" ? "max-w-[calc(100vw-120px)] md:max-w-lg" : "max-w-lg px-4"}`}
        initial={false}
        // Once faded out, nothing here paints: the glass blur is costly and the progress keeps writing behind it.
        animate={
          hidden
            ? { opacity: 0, y: 24, scale: 0.97, transitionEnd: { visibility: "hidden" } }
            : { opacity: 1, y: 0, scale: 1, visibility: "visible" }
        }
        transition={{ duration: 0.26, ease: "easeOut" }}
        style={{ pointerEvents: hidden ? "none" : "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={controlsRef}
          className="pointer-events-auto relative flex w-full justify-center"
          {...handlers}
          onFocusCapture={(event) => setHasFocus(event.target.matches(":focus-visible"))}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
          }}
          style={{
            paddingBottom: `${HOVER_HITBOX_BOTTOM_BUFFER_PX}px`,
            marginBottom: `${-HOVER_HITBOX_BOTTOM_BUFFER_PX}px`,
          }}
        >
          {showQuickActions && (
            <div className="absolute bottom-full left-1/2 z-10 w-max max-w-full -translate-x-1/2 pb-2">
              <div
                aria-label={t("folia.floatingControls.quickActions")}
                role="group"
                className={`flex items-center justify-center gap-0.5 rounded-full p-1.5 shadow-xl backdrop-blur-3xl ${glassBgExpanded}`}
                style={{ color: primaryColor }}
              >
                {quickActions.map((id) => {
                  const action = actions[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-label={action.label}
                      aria-pressed={action.pressed}
                      title={action.label}
                      onClick={action.run}
                      className={FOLIA_CAPSULE_BUTTON_CLASS}
                    >
                      <FoliaCapsuleActionContents {...action} />
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-label={commandLabel}
                  title={commandLabel}
                  onClick={() => openWorkspace("root")}
                  className={FOLIA_CAPSULE_BUTTON_CLASS}
                >
                  <Command className="size-4.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          <motion.div
            ref={capsuleRef}
            layout={!hidden}
            transition={{ layout: CONTROL_LAYOUT_SPRING }}
            onClick={(event) => {
              if (!mayOpenOnClick(event)) return;
              if (!isPlayerView) {
                onNavigateToPlayer();
                return;
              }
              if (
                event.target instanceof Element &&
                !event.target.closest('button, input, a, [role="button"]')
              ) {
                openWorkspace("root");
              }
            }}
            className={`relative cursor-pointer overflow-hidden rounded-full shadow-2xl backdrop-blur-3xl transition-colors duration-300 ${showExpanded ? `p-3 ${glassBgExpanded} w-full` : `px-4 py-2 ${glassBgCollapsed} w-[80%] md:w-[60%]`}`}
          >
            <motion.div
              layout={!hidden}
              transition={{ layout: CONTROL_LAYOUT_SPRING }}
              className="w-full"
            >
              {showExpanded ? (
                <ExpandedView
                  currentSong={currentSong}
                  playerState={playerState}
                  currentTime={currentTime}
                  duration={duration}
                  canTogglePlay={canTogglePlay}
                  onSeek={onSeek}
                  onTogglePlay={onTogglePlay}
                  slots={capsuleSlots.map((_, index) => (
                    <FoliaCapsuleSlotControl
                      key={index}
                      actions={actions}
                      slot={index === 0 ? 0 : 1}
                      onMenuOpenChange={setIsSlotMenuOpen}
                    />
                  ))}
                  noTrackText={resolvedNoTrackText}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  trackColor={trackColor}
                  isDaylight={isDaylight}
                  controlsDisabled={controlsDisabled}
                  rangeMarkers={chorusRanges}
                  chorusMarkerFraction={chorusMarkerFraction}
                  markerColor={themeMarkerColor}
                />
              ) : (
                <CollapsedView
                  commandButton={
                    isPlayerView ? (
                      <button
                        type="button"
                        aria-label={commandLabel}
                        title={commandLabel}
                        style={{ color: primaryColor }}
                        className={FOLIA_CAPSULE_BUTTON_CLASS}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (mayOpenOnClick(event)) openWorkspace("root");
                        }}
                      >
                        <Command className="size-4.5" aria-hidden="true" />
                      </button>
                    ) : null
                  }
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={onSeek}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  trackColor={trackColor}
                  controlsDisabled={controlsDisabled}
                  rangeMarkers={chorusRanges}
                  chorusMarkerFraction={chorusMarkerFraction}
                  markerColor={themeMarkerColor}
                />
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {volumeAnchor && (
        <FoliaCapsuleVolume anchor={volumeAnchor} onClose={closeVolume} onToggleMute={onMute} />
      )}

      <LyricsTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        lyrics={lyrics}
        duration={duration}
        currentTime={lyricCurrentTime ?? currentTime}
        onSeek={(time) => {
          const offset = currentTime.get() - (lyricCurrentTime?.get() ?? currentTime.get());
          onSeek(Math.max(0, time + offset));
        }}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor="var(--text-accent)"
        theme={theme}
        isDaylight={isDaylight}
        disabled={controlsDisabled}
      />
    </>
  );
};

// 展开视图组件
const ExpandedView: React.FC<ExpandedFoliaCapsuleProps> = ({
  currentSong,
  playerState,
  currentTime,
  duration,
  canTogglePlay,
  onSeek,
  onTogglePlay,
  slots,
  noTrackText,
  primaryColor,
  secondaryColor,
  trackColor,
  isDaylight,
  controlsDisabled = false,
  rangeMarkers = [],
  chorusMarkerFraction = null,
  markerColor,
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-x-4 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      {/* Desktop Layout - responsive grid positions apply from the sm breakpoint */}
      {/* Mobile Layout - base grid positions apply below the sm breakpoint */}
      {/* Row 1: Centered Title */}
      <FoliaTrackTitleNavigator
        color={primaryColor}
        disabled={controlsDisabled}
        fallback={currentSong?.name || noTrackText}
        isDaylight={isDaylight}
      />

      {/* Row 3: Loop Button, Play Button, Lyrics Button */}
      <button
        type="button"
        aria-label={t(playerState === PlayerState.PLAYING ? "ui.pause" : "ui.play")}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        disabled={!canTogglePlay || controlsDisabled}
        className={`col-start-2 row-start-2 flex size-12 shrink-0 items-center justify-center rounded-full border-none bg-(--text-primary) text-black shadow-lg transition-transform sm:col-start-1 sm:row-span-2 sm:row-start-1 ${controlsDisabled ? "cursor-not-allowed opacity-45" : "hover:scale-105"}`}
        style={{ backgroundColor: primaryColor, color: "var(--bg-color)" }}
      >
        {playerState === PlayerState.PLAYING ? (
          <Pause size={20} fill="currentColor" />
        ) : (
          <Play size={20} fill="currentColor" className="ml-1" />
        )}
      </button>

      <div
        className="contents sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:flex sm:items-center sm:gap-1"
        style={{ color: primaryColor }}
      >
        <div className="col-start-1 row-start-2 justify-self-end">{slots[0]}</div>
        <div className="col-start-3 row-start-2 justify-self-start">{slots[1]}</div>
      </div>

      {/* Row 2: Current Time, Progress Bar, Duration */}
      <div className="col-span-3 row-start-3 w-full px-2 sm:col-span-1 sm:col-start-2 sm:row-start-2">
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          trackColor={trackColor}
          disabled={controlsDisabled}
          rangeMarkers={rangeMarkers}
          chorusMarkerFraction={chorusMarkerFraction}
          markerColor={markerColor}
        />
      </div>
    </div>
  );
};

// 折叠视图组件
const CollapsedView: React.FC<CollapsedFoliaCapsuleProps> = ({
  commandButton,
  currentTime,
  duration,
  onSeek,
  primaryColor,
  secondaryColor,
  trackColor,
  controlsDisabled = false,
  rangeMarkers = [],
  chorusMarkerFraction = null,
  markerColor,
}) => {
  return (
    <div className="flex h-8 w-full items-center justify-center gap-1 px-2">
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        trackColor={trackColor}
        disabled={controlsDisabled}
        rangeMarkers={rangeMarkers}
        chorusMarkerFraction={chorusMarkerFraction}
        markerColor={markerColor}
      />
      {commandButton}
    </div>
  );
};

export default FloatingPlayerControls;
