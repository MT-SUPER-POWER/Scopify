import { Grid3x3, PanelsTopLeft, Radio, type LucideIcon } from "lucide-react";
import type { PlaylistViewMode } from "@/types/playlist/lattice";

export const PLAYLIST_VIEW_MODES: readonly {
  mode: PlaylistViewMode;
  icon: LucideIcon;
  labelKey: "playlist.view.lattice" | "playlist.view.grid" | "playlist.view.radio";
}[] = [
  { mode: "lattice", icon: PanelsTopLeft, labelKey: "playlist.view.lattice" },
  { mode: "grid", icon: Grid3x3, labelKey: "playlist.view.grid" },
  { mode: "radio", icon: Radio, labelKey: "playlist.view.radio" },
];

export const LATTICE_PREFERENCES_STORAGE_KEY = "scopify-lattice-preferences";
