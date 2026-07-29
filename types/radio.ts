import type { SongDetail } from "@/types/api/music";
import type { RadioDetail, RadioHost, RadioProgram } from "@/types/api/radio";

export interface RadioContent {
  host?: RadioHost;
  programs: RadioProgram[];
  radio: RadioDetail;
  tracks: SongDetail[];
}

export interface RadioSubscriptionVariables {
  radioId: number | string;
  subscribe: boolean;
}

export type RadioTracklistColumnId =
  "duration" | "index" | "playCount" | "progress" | "title" | "updatedAt";

export type RadioTracklistResizableColumnId = Exclude<RadioTracklistColumnId, "index">;

export interface RadioTracklistColumnPair {
  left: RadioTracklistResizableColumnId;
  right: RadioTracklistResizableColumnId;
}

export interface RadioTracklistColumnResizeDragState {
  initialWidths: RadioTracklistColumnWidths;
  pair: RadioTracklistColumnPair;
  pointerId: number;
  startX: number;
}

export interface RadioTracklistColumnVisibility {
  showPlayCountColumn: boolean;
  showUpdatedAtColumn: boolean;
}

export type RadioTracklistColumnWidths = Record<RadioTracklistColumnId, number>;
