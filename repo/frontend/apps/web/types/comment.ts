import type { CommentHeaderArtist } from "@/types/components/comment";

export interface CommentResourceHeaderData {
  albumName?: string;
  artists: CommentHeaderArtist[];
  coverUrl: string;
  title: string;
}
