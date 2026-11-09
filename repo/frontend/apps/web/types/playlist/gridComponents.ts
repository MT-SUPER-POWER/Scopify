import type { GridCell } from "@/types/playlist/grid";
import type { CardFlipPlan } from "@/types/playlist/latticeComponents";
import type { PlayerTrack } from "@/types/player/model";

export interface GridCardProps {
  track: PlayerTrack;
  cell: GridCell;
  current: boolean;
  playing: boolean;
  /** Registers the card element with the wall so the falloff can position it. */
  register: (cell: GridCell, element: HTMLElement | null) => void;
  /** Click on a card: pan to it, or play it when it is already the focused one. */
  onSelect: (cell: GridCell, centered: boolean) => void;
  flipPlan: CardFlipPlan | null;
  onPlay: (track: PlayerTrack) => void;
}
