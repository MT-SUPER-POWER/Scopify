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
}
