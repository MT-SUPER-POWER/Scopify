import type { SongDetail } from "@/types/song/api";

export interface GridCardProps {
  track: SongDetail;
  index: number;
  current: boolean;
  playing: boolean;
  /** Registers the card element with the wall so the falloff can position it. */
  register: (index: number, element: HTMLElement | null) => void;
  /** Click on a card: pan to it, or play it when it is already the focused one. */
  onSelect: (index: number, centered: boolean) => void;
  onPlay: (track: SongDetail) => void;
}
