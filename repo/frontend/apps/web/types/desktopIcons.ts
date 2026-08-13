import type { DesktopIconVisibilityState } from "@mt-super-power/desktop-contract";

export interface DesktopIconVisibilityControllerState {
  isPending: boolean;
  refresh(): Promise<DesktopIconVisibilityState>;
  setVisible(visible: boolean): Promise<DesktopIconVisibilityState>;
  state: DesktopIconVisibilityState | null;
}
