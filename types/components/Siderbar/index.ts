
export type FilterAction = { type: "ALL" | "CREATED" | "SUBSCRIBED" };
// 0: ALL, 1: CREATED, 2: SUBSCRIBED
export type FilterState = 0 | 1 | 2;

export interface SidebarProps {
  panelAPI?: {
    collapse: () => void | undefined;
    expand: () => void | undefined;
  };
}

export interface LibItemMenuProps {
  children: React.ReactNode;
  playlistID: number | string;
}
