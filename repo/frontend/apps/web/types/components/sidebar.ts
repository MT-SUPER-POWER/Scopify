export interface SidebarConfirmDialogProps {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface SidebarPlaylistLibraryProps {
  isCollapsed: boolean;
}

export interface SidebarLibraryItemProps {
  coverImg: string;
  hasContextMenu?: boolean;
  href?: string;
  id: string | number;
  isCollapsed?: boolean;
  subtitle: string;
  title: string;
}

export interface SidebarSortablePlaylistsProps {
  playlists: NeteasePlaylist[];
  isCollapsed: boolean;
}

export interface SortableLibraryItemProps extends SidebarLibraryItemProps {
  id: number;
  locked: boolean;
  playlist: NeteasePlaylist;
}
import type { NeteasePlaylist } from "@/types/api/playlist";
