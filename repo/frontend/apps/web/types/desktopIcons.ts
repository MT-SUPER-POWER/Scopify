import type { DesktopIconVisibilityState } from "@scopifymusicplayer/desktop-contract";

export interface DesktopIconVisibilityControllerState {
  isPending: boolean;
  refresh(): Promise<DesktopIconVisibilityState>;
  setVisible(visible: boolean): Promise<DesktopIconVisibilityState>;
  state: DesktopIconVisibilityState | null;
}
