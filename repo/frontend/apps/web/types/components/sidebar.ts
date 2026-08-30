export interface SidebarConfirmDialogProps {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
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
