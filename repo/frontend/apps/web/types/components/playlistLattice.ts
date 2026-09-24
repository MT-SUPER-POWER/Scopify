import type { ReactNode } from "react";
import type { SongDetail } from "@/types/api/music";
import type { QueueInstance, ReflowTile } from "@/types/playlistLattice";

export interface PlaylistLatticeProps {
  tracks: SongDetail[];
  title: string;
  sourceId: string | null;
  onTrackPlay?: (track: SongDetail) => void;
  onClose: () => void;
}

export interface PlaylistLatticeViewProps extends Omit<PlaylistLatticeProps, "onClose"> {
  children: (open: () => void) => ReactNode;
}

export interface PlaylistViewButtonProps {
  onOpen: () => void;
  disabled?: boolean;
}

export interface LatticePosterProps {
  instance: QueueInstance;
  rect: Omit<ReflowTile, "instanceId">;
  track: SongDetail;
  expanded: boolean;
  current: boolean;
  playing: boolean;
  onSelect: (instance: QueueInstance) => void;
  onPlay: (track: SongDetail) => void;
}

export interface LatticeToolbarProps {
  title: string;
  count: number;
  canLocate: boolean;
  onLocate: () => void;
  onClose: () => void;
}
