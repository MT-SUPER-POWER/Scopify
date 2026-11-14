import type { ReactNode } from "react";
import type { SongDetail } from "@/types/song/api";
import type { PlaylistViewMode, QueueInstance, ReflowTile } from "@/types/playlist/lattice";

/** Which cards of a wall flip from skeleton to content, and the gate they all wait on. */
export interface CardFlipPlan {
  /** Milliseconds each on-screen card waits after the gate opens, by card key. */
  delays: Map<string, number>;
  gate: Promise<void>;
}

export interface PlaylistLatticeProps {
  tracks: SongDetail[];
  title: string;
  sourceId: string | null;
  onDislikeTrack?: (track: SongDetail) => void;
  onTrackPlay?: (track: SongDetail) => void;
  onClose: () => void;
  /** Jumps to another immersive view without going back to the list first. */
  onModeChange: (mode: PlaylistViewMode) => void;
}

export interface PlaylistLatticeViewProps extends Omit<
  PlaylistLatticeProps,
  "onClose" | "onModeChange"
> {
  /** The page's songs are still loading: an immersive view that is open shows its skeleton meanwhile. */
  loading?: boolean;
  children: (open: (mode?: PlaylistViewMode) => void) => ReactNode;
}

export interface PlaylistViewButtonProps {
  onOpen: (mode?: PlaylistViewMode) => void;
  disabled?: boolean;
}

export interface LatticePosterProps {
  instance: QueueInstance;
  rect: Omit<ReflowTile, "instanceId">;
  track: SongDetail;
  expanded: boolean;
  current: boolean;
  focused: boolean;
  onDislikeTrack?: (track: SongDetail) => void;
  onFocus: (instance: QueueInstance) => void;
  onSelect: (instance: QueueInstance) => void;
  onPlay: (track: SongDetail) => void;
  flipPlan: CardFlipPlan | null;
}

export interface PlaylistViewToolsProps {
  /** The wall is flipping into place: the tools fade in with it instead of popping up. */
  revealing: boolean;
  title: string;
  count: number;
  mode: PlaylistViewMode;
  onModeChange: (mode: PlaylistViewMode) => void;
  /** Usage hint for the current view, shown at the bottom of the options menu. */
  hint: string;
  /** Multiplies the zoom by a factor. */
  onZoom: (factor: number) => void;
  canLocate: boolean;
  onLocate: () => void;
  onClose: () => void;
}
export interface LatticeProgressProps {
  current: boolean;
  durationMs: number;
  trackId: number;
}

export interface LatticePlaybackControlsProps {
  track: SongDetail;
  current: boolean;
  revealed: boolean;
  onPlay: (track: SongDetail) => void;
}

export type LatticePosterArtworkProps = Pick<
  LatticePosterProps,
  "track" | "instance" | "current" | "expanded"
>;
export interface LatticeLyricsProps {
  track: SongDetail;
}
