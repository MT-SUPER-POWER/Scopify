import type { SongDetail } from "@/types/api/music";
import type { RadioDetail, RadioProgram } from "@/types/api/radio";
import type { ReactNode } from "react";

export interface PodcastContextMenuProps {
  children: ReactNode;
  isActive?: boolean;
  isFavorited?: boolean;
  isPlaying?: boolean;
  onPause?: () => void | Promise<void>;
  onPlay: () => void | Promise<void>;
  podcast: Pick<RadioDetail, "id">;
}

export interface RadioProgramRowProps {
  currentTime: number;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: (track: SongDetail) => void;
  program: RadioProgram;
  setIsPlaying: (isPlaying: boolean) => void;
  showPlayCountColumn: boolean;
  showUpdatedAtColumn: boolean;
  track: SongDetail;
}

export interface RadioTracklistTableProps {
  programs: RadioProgram[];
  radioId: string;
  searchQuery?: string;
  tracks: SongDetail[];
}
