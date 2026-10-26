import type { NeteaseComment } from "@/types/api/music";
import type { CommentHeaderArtist } from "@/types/components/comment";

export interface CommentResourceHeaderData {
  albumName?: string;
  artists: CommentHeaderArtist[];
  coverUrl: string;
  title: string;
}

export interface CommentPreviewListProps {
  comments: NeteaseComment[];
  className?: string;
}
