import type { ReactNode } from "react";

import type { SongDetail } from "@/types/api/music";

export interface SongContextMenuProps {
  children: ReactNode;
  isActive: boolean;
  isDailyRecommend?: boolean;
  isPlaying: boolean;
  onDislikeDailyRecommend?: () => void;
  /** Present only for tracks in the Personal FM virtual playlist. */
  onDislikePersonalFm?: () => void;
  onPlay: () => void;
  onRemoveFromPlaylist?: () => void;
  onRemoveFromQueue?: () => void;
  onRequestDelete?: () => void;
  onViewTranscript?: () => void;
  playlistID?: number | string | null;
  readonly?: boolean;
  song: SongDetail;
  selectedSongs?: SongDetail[];
  onOpenContextMenu?: () => void;
}

export interface SongContextMenuActionsProps extends Omit<
  SongContextMenuProps,
  "children" | "onOpenContextMenu"
> {
  isContextMenuOpen: boolean;
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;
}

export interface CreatePlaylistFromTracksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracks: SongDetail[];
}
