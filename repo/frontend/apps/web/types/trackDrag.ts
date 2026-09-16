import type { SongDetail } from "@/types/api/music";

export interface AppDragState {
  isDragging: boolean;
  draggedTracks: SongDetail[];
  sourcePlaylistId: string | null;
  overTargetId: string | null;
  pendingTargetIds: string[];
  startDrag: (tracks: SongDetail[], sourcePlaylistId?: string | null) => void;
  endDrag: () => void;
  setOverTarget: (id: string | null) => void;
  setTargetPending: (id: string, pending: boolean) => void;
}

export interface TrackDropTarget {
  id: string;
  enabled: boolean;
  onDrop: (tracks: SongDetail[]) => Promise<void>;
}

export interface TrackDragPoint {
  x: number;
  y: number;
}

export interface PlaylistDropRequest {
  playlistId: number;
  tracks: SongDetail[];
}
