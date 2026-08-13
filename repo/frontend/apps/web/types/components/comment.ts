import type { NeteaseComment } from "@/types/api/music";

export interface CommentHeaderArtist {
  id: number | string;
  name: string;
  avatarUrl?: string;
}

export interface CommentHeaderProps {
  coverUrl: string;
  title: string;
  albumName?: string;
  artists: CommentHeaderArtist[];
  total: number;
  onArtistClick: (artistId: number | string) => void;
}

export interface CommentItemProps {
  comment: NeteaseComment;
  isHot?: boolean;
  currentUserId?: number | string | null;
  onLike?: (id: number, isHot: boolean) => void;
  onDelete?: (id: number) => void;
  onReply?: (id: number) => void;
  onReport?: (id: number) => void;
  onRouterClick?: (url: string) => void;
}

export interface CommentInputBoxProps {
  replyTarget: NeteaseComment | null;
  onCancelReply: () => void;
  onSubmit: (text: string) => Promise<boolean>;
}
