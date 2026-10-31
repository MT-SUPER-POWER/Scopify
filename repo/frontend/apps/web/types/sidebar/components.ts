import type { MouseEventHandler, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { QueryFailureProps } from "@/types/query/boundaryComponents";

export interface SidebarLibraryStateCardProps {
  actionLabel?: string;
  onAction?(): void;
  subtitle: string;
  title: string;
  icon: LucideIcon;
  isCollapsed: boolean;
  busy?: boolean;
}

export interface SidebarPlaylistLibraryContentProps extends SidebarPlaylistLibraryProps {
  onLogin(): void;
  onCreate(): void;
}

export interface SidebarPlaylistFailureProps extends QueryFailureProps {
  isCollapsed: boolean;
}
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

export interface LibraryNavigationProps extends SidebarPlaylistLibraryProps {
  /** 渲染在首个分组标题右侧的操作，例如侧边栏菜单。 */
  headerAction?: ReactNode;
}

export interface SidebarMenuProps {
  isCollapsed?: boolean;
}

export interface SidebarPendingPlaylist {
  id: number | string;
  name: string;
}

export interface SidebarLibraryItemProps {
  coverImg: string;
  hasContextMenu?: boolean;
  href?: string;
  id: string | number;
  isCollapsed?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
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
import type { NeteasePlaylist } from "@/types/playlist/api";

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
