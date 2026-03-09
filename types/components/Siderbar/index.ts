/*
 * ----------------------------------
 *  左侧侧边栏 Filter 部分专门使用类型
 * ----------------------------------
 * ----------------------------------
 */

export type FilterAction = { type: "ALL" | "CREATED" | "SUBSCRIBED" };
// 0: ALL, 1: CREATED, 2: SUBSCRIBED
export type FilterState = 0 | 1 | 2;

export interface SidebarProps {
  panelAPI?: {
    collapse: () => void | undefined;
    expand: () => void | undefined;
  };
}
