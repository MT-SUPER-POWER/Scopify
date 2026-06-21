export type FilterAction = { type: "ALL" | "CREATED" | "SUBSCRIBED" | "ARTISTS" };
// 0: ALL, 1: CREATED, 2: SUBSCRIBED, 3: ARTISTS
export type FilterState = 0 | 1 | 2 | 3;

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
