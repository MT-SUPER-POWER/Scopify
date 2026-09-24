import type { SongDetail } from "@/types/api/music";

export interface SimilarSongsDialogProps {
  song: SongDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SimilarSongRowProps {
  song: SongDetail;
  songs: SongDetail[];
}
