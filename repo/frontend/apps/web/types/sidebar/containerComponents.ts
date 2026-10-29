export interface SidebarProps {
  panelAPI?: {
    collapse: () => undefined | undefined;
    expand: () => undefined | undefined;
  };
}

export interface LibItemMenuProps {
  children: React.ReactNode;
  playlistID: number | string;
}
