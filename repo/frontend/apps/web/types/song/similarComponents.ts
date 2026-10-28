import type { SongDetail } from "@/types/song/api";

export interface SimilarSongsDialogProps {
  song: SongDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SimilarSongRowProps {
  song: SongDetail;
  songs: SongDetail[];
}
