import type { QueueInstance } from "@/types/playlist/lattice";
import type { SongDetail } from "@/types/song/api";

/** The selected song, and the copy of it on the wall the camera went to. */
export interface BravaisSelection {
  index: number;
  instance: QueueInstance;
}

export interface BravaisTileProps {
  instance: QueueInstance;
  track: SongDetail;
  selected: boolean;
  current: boolean;
  playing: boolean;
  /** Filtered out by the panel's filter box. */
  dimmed: boolean;
  onSelect: (instance: QueueInstance) => void;
  onPlay: (track: SongDetail) => void;
}

export interface BravaisPanelProps {
  title: string;
  tracks: SongDetail[];
  width: number;
  query: string;
  onQueryChange: (query: string) => void;
  /** Indexes of the tracks the filter lets through, in playlist order. */
  matches: number[];
  selectedIndex: number | null;
  currentIndex: number;
  isPlaying: boolean;
  onSelect: (index: number) => void;
  onPlay: (track: SongDetail) => void;
}
