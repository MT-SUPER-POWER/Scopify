import type { SongDetail } from "@/types/api/music";
import type { MusicSheet } from "@/types/api/songResources";

export interface SongResourceSectionProps {
  songId: number;
  compact?: boolean;
}
export interface MusicSheetRowProps {
  sheet: MusicSheet;
  onSelect: (sheet: MusicSheet) => void;
}
export interface SheetPreviewDialogProps {
  sheet: MusicSheet | null;
  onClose: () => void;
}
export interface SheetPreviewContentProps {
  sheet: MusicSheet;
}
export type SongResourceTab = "wiki" | "sheets";

export interface SongResourcesDialogProps {
  song: SongDetail;
  initialTab?: SongResourceTab;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export interface SheetPageImageProps {
  url: string;
  label: string;
}
