import type { ReactNode } from "react";
import type { SongDetail } from "@/types/api/music";

export interface NowPlayingSectionProps {
  song: SongDetail;
}

export interface NowPlayingCardProps {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}
