import type { BravaisSeat } from "@/types/playlist/bravais";
import type { SongDetail } from "@/types/song/api";

export interface BravaisTileProps {
  seat: BravaisSeat;
  /** Undefined for an empty seat. */
  track: SongDetail | undefined;
  selected: boolean;
  current: boolean;
  playing: boolean;
  /** Filtered out by the seam's filter box. */
  dimmed: boolean;
  onSelect: (index: number) => void;
  onPlay: (track: SongDetail) => void;
}

export interface BravaisSeamProps {
  title: string;
  tracks: SongDetail[];
  /** Width the panel's content is laid out at; the panel itself opens and closes around it. */
  contentWidth: number;
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
