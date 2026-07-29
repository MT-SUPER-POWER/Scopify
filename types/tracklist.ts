export type TracklistColumnId = "album" | "date" | "duration" | "index" | "like" | "title";

export type TracklistResizableColumnId = Exclude<TracklistColumnId, "index">;

export interface TracklistColumnPair {
  left: TracklistResizableColumnId;
  right: TracklistResizableColumnId;
}

export interface TracklistColumnResizeDragState {
  initialWidths: TracklistColumnWidths;
  pair: TracklistColumnPair;
  pointerId: number;
  startX: number;
}

export interface TracklistColumnVisibility {
  showAlbumColumn: boolean;
  showDateColumn: boolean;
  showLikeColumn: boolean;
}

export type TracklistColumnWidths = Record<TracklistColumnId, number>;
