import type { GridCell } from "@/types/playlist/grid";
import type { CardFlipPlan } from "@/types/playlist/latticeComponents";
import type { SongDetail } from "@/types/song/api";

export interface GridCardProps {
  track: SongDetail;
  cell: GridCell;
  current: boolean;
  playing: boolean;
  /** Registers the card element with the wall so the falloff can position it. */
  register: (cell: GridCell, element: HTMLElement | null) => void;
  /** Click on a card: pan to it, or play it when it is already the focused one. */
  onSelect: (cell: GridCell, centered: boolean) => void;
  flipPlan: CardFlipPlan | null;
  onDislikeTrack?: (track: SongDetail) => void;
  onPlay: (track: SongDetail) => void;
}
