export type LoginRequiredReason =
  | "album-subscribe"
  | "playlist-edit"
  | "profile-edit"
  | "comment"
  | "add-to-playlist"
  | "library"
  | "followed-artists";

export interface LoginRequiredPromptProps {
  reason: LoginRequiredReason;
  onLogin?: () => void;
  compact?: boolean;
}
