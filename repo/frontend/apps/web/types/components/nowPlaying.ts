import type { ReactNode } from "react";
import type { useArtistFollow } from "@/hooks/artist/useArtistFollow";
import type { SongDetail } from "@/types/api/music";
import type { NowPlayingPanelTab } from "@/types/ui";

/** 面板当前展示的视图：两个常规视图之外，队列打开时临时覆盖。 */
export type NowPlayingPanelView = NowPlayingPanelTab | "queue";

export interface NowPlayingSectionProps {
  song: SongDetail;
}

export interface NowPlayingCardProps {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface NowPlayingDynamicCoverProps {
  songId: number;
  isPlaying: boolean;
}

export interface NowPlayingFollowButtonProps {
  follow: ReturnType<typeof useArtistFollow>;
  className?: string;
}

export interface NowPlayingCreditRowProps {
  artist: SongDetail["ar"][number];
  role: string;
}

export interface NowPlayingSimilarRowProps {
  song: SongDetail;
  /** 同一张卡片里的全部相似歌曲，点击后作为新的播放队列。 */
  songs: SongDetail[];
}

export interface NowPlayingMvPlayerProps {
  mvId: number;
  /** resume 为 false 时只收起 MV，不恢复歌曲播放。 */
  onClose: (resume?: boolean) => void;
}

export interface NowPlayingPanelTabsProps {
  view: NowPlayingPanelView;
  /** 浮在封面上时使用深色半透明样式。 */
  overlay?: boolean;
}

export interface NowPlayingOverviewProps extends NowPlayingSectionProps {
  /** 封面是否仍在浮动顶栏下方可见。 */
  onCoverVisibleChange: (visible: boolean) => void;
}
