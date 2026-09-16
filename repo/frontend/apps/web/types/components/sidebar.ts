import type { ReactNode } from "react";
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

export interface CollapsibleLibraryGroupProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export type SidebarLikedPlaylistItemProps = Pick<
  SortableLibraryItemProps,
  "playlist" | "isCollapsed"
>;

export interface SidebarPlaylistManagementProps {
  children: (actions: ReactNode) => ReactNode;
  playlistId: number | string;
}

export interface SidebarPlaylistConfirmDialogProps extends SidebarConfirmDialogProps {
  busy?: boolean;
}
