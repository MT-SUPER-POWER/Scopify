import type { CommandWorkspacePage } from "@/types/commandWorkspace/model";
import type { FOLIA_CAPSULE_ACTIONS } from "@/constants/foliaCapsule";
import type { LyricData, PlayerState, Theme } from "@/components/lyrics/folia/src/types";
import type { ProgressRangeMarker } from "@/types/shared/sliderComponents";
import type { MotionValue } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { MouseEvent, ReactNode, RefObject } from "react";

export interface FloatingPlayerControlsProps {
  currentSong: { name: string } | null;
  playerState: PlayerState;
  currentTime: MotionValue<number>;
  lyricCurrentTime?: MotionValue<number>;
  duration: number;
  loopMode: "off" | "all" | "one";
  currentView: "home" | "player";
  audioSrc: string | null;
  canTogglePlay?: boolean;
  lyrics: LyricData | null;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onNavigateToPlayer: () => void;
  noTrackText?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: Theme;
  isDaylight: boolean;
  isHidden?: boolean;
  hideControlBar?: boolean;
  controlsDisabled?: boolean;
}

export interface CollapsedFoliaCapsuleProps {
  commandButton?: ReactNode;
  currentTime: MotionValue<number>;
  duration: number;
  onSeek: (time: number) => void;
  primaryColor: string;
  secondaryColor: string;
  trackColor?: string;
  controlsDisabled?: boolean;
  rangeMarkers?: readonly ProgressRangeMarker[];
  markerColor?: string;
}

export interface ExpandedFoliaCapsuleProps extends Omit<
  CollapsedFoliaCapsuleProps,
  "commandButton"
> {
  currentSong: { name: string } | null;
  playerState: PlayerState;
  canTogglePlay: boolean;
  onTogglePlay: () => void;
  slots: ReactNode[];
  noTrackText: string;
  isDaylight?: boolean;
}

export type FoliaCapsuleAction = (typeof FOLIA_CAPSULE_ACTIONS)[number];

export type FoliaCapsuleSlot = 0 | 1;

export interface FoliaCapsuleActionBinding {
  label: string;
  Icon: LucideIcon;
  enabled?: boolean;
  pressed?: boolean;
  run: (event: MouseEvent<HTMLButtonElement>) => void;
}

export interface FoliaCapsuleSlotControlProps {
  actions: Record<FoliaCapsuleAction, FoliaCapsuleActionBinding>;
  slot: FoliaCapsuleSlot;
  onMenuOpenChange: (open: boolean) => void;
}

export interface FoliaCapsuleVolumeAnchor {
  x: number;
  y: number;
  trigger: HTMLButtonElement;
}

export interface FoliaCapsuleVolumeProps {
  anchor: FoliaCapsuleVolumeAnchor;
  onClose: () => void;
  onToggleMute: () => void;
}

export interface UseFoliaCapsuleActionsOptions {
  currentView: "home" | "player";
  controlsDisabled: boolean;
  hasLyrics: boolean;
  loopMode: "off" | "all" | "one";
  onToggleLoop: () => void;
  onToggleTimeline: () => void;
  openWorkspace: (page: CommandWorkspacePage) => void;
}

export interface UseFoliaCapsuleActivationOptions {
  controlsRef: RefObject<HTMLDivElement | null>;
  isPaused: boolean;
  isPlayerView: boolean;
}

export interface FoliaCapsulePress {
  x: number;
  y: number;
  pointerId: number;
  pointerType: string;
  wasTouchOpen: boolean;
  ownControl: Element | null;
}

export interface FoliaCapsuleFrame {
  centerX: number;
  bottom: number;
  width: number;
  height: number;
}

export interface FoliaCommandWorkspaceLaunch {
  page: CommandWorkspacePage;
  frame?: FoliaCapsuleFrame;
}

export interface FoliaPlaybackControlsPreferences {
  capsuleSlots: [FoliaCapsuleAction, FoliaCapsuleAction];
  visualizerPickerKeepOpen: boolean;
}

export interface FoliaPlaybackControlsStore extends FoliaPlaybackControlsPreferences {
  commandWorkspaceLaunch: FoliaCommandWorkspaceLaunch | null;
  setCapsuleSlot: (slot: FoliaCapsuleSlot, action: FoliaCapsuleAction) => void;
  setVisualizerPickerKeepOpen: (enabled: boolean) => void;
  openCommandWorkspace: (page: CommandWorkspacePage, frame?: FoliaCapsuleFrame) => void;
  clearCommandWorkspaceLaunch: () => void;
}
