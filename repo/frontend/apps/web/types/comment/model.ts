import type { NeteaseComment } from "@/types/song/api";
import type { CommentHeaderArtist } from "@/types/comment/components";

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
