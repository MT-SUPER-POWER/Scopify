import { Grid3x3, PanelsTopLeft, type LucideIcon } from "lucide-react";
import type { PlaylistViewMode } from "@/types/playlist/lattice";

export const PLAYLIST_VIEW_MODES: readonly {
  mode: PlaylistViewMode;
  icon: LucideIcon;
  labelKey: "playlist.view.lattice" | "playlist.view.grid";
}[] = [
  { mode: "lattice", icon: PanelsTopLeft, labelKey: "playlist.view.lattice" },
  { mode: "grid", icon: Grid3x3, labelKey: "playlist.view.grid" },
];

export const LATTICE_PREFERENCES_STORAGE_KEY = "scopify-lattice-preferences";
