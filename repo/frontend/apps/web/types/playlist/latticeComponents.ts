import type { ReactNode } from "react";
import type { SongDetail } from "@/types/song/api";
import type { PlaylistViewMode, QueueInstance, ReflowTile } from "@/types/playlist/lattice";

export interface PlaylistLatticeProps {
  tracks: SongDetail[];
  title: string;
  sourceId: string | null;
  onTrackPlay?: (track: SongDetail) => void;
  onClose: () => void;
  /** Jumps to another immersive view without going back to the list first. */
  onModeChange: (mode: PlaylistViewMode) => void;
}

export interface PlaylistLatticeViewProps extends Omit<
  PlaylistLatticeProps,
  "onClose" | "onModeChange"
> {
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
  onFocus: (instance: QueueInstance) => void;
  onSelect: (instance: QueueInstance) => void;
  onPlay: (track: SongDetail) => void;
}

export interface PlaylistViewToolsProps {
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
