import type { SongDetail } from "@/types/song/api";

export interface TrackPreviewButtonProps {
  /** 歌单或专辑的全部曲目；其中带 MV 的歌曲进入预览。 */
  tracks: SongDetail[];
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
  tracks: SongDetail[];
  /** 全部曲目，「播放这首」时作为播放队列。 */
  allTracks: SongDetail[];
  playlistId: number | string | null;
}

export interface TrackPreviewVideoProps {
  mvId: number;
  muted: boolean;
  onProgress: (progress: number) => void;
  onEnded: () => void;
}

export interface TrackPreviewActionsProps {
  song: SongDetail;
  songs: SongDetail[];
  playlistId: number | string | null;
  onClose: () => void;
}

export interface TrackPreviewDetailsProps {
  song: SongDetail;
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
