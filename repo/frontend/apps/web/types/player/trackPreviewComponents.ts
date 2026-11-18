import type { MusicResourceRef } from "@scopify/music-domain/identity";
import type { PlayerTrack } from "@/types/player/model";

export interface TrackPreviewButtonProps {
  /** 歌单或专辑的全部曲目；其中带 MV 的歌曲进入预览。 */
  tracks: PlayerTrack[];
  title: string;
  tags?: string[];
  /** 从预览里播放时作为播放来源。 */
  playlistId?: number | string | null;
  className?: string;
}

export interface TrackPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  tags: string[];
  /** 带 MV、可预览的歌曲。 */
  tracks: PlayerTrack[];
  /** 全部曲目，「播放这首」时作为播放队列。 */
  allTracks: PlayerTrack[];
  playlistId: number | string | null;
}

export interface TrackPreviewVideoProps {
  mv: MusicResourceRef<"mv">;
  muted: boolean;
  onProgress: (progress: number) => void;
  onEnded: () => void;
}

export interface TrackPreviewActionsProps {
  song: PlayerTrack;
  songs: PlayerTrack[];
  playlistId: number | string | null;
  onClose: () => void;
}

export interface TrackPreviewDetailsProps {
  song: PlayerTrack;
  title: string;
  tags: string[];
  direction: 1 | -1;
  progress: number;
  onClose: () => void;
}

export interface TrackPreviewControlsProps extends TrackPreviewActionsProps {
  muted: boolean;
  onToggleMute: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}
