import type { AlbumInfo } from "@/types/album/model";

export interface AlbumDescriptionDialogProps {
  info: AlbumInfo;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export interface AlbumHeaderProps {
  info: AlbumInfo;
  onArtistClick: () => void;
}
