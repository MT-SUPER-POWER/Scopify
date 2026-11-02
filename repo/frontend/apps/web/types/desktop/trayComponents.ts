import type { LucideIcon } from "lucide-react";

export interface TrayPlaybackControlsProps {
  isPlaying: boolean;
  liked: boolean;
  onPrevious: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onToggleLike: () => void;
}

export interface TrayMenuButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}
