export type {
  DesktopLyricCommand,
  DesktopLyricInteractiveRect,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
} from "@scopify/desktop-contract";

export interface DesktopLyricHeaderProps {
  /** 系统光标位于桌面歌词窗口内。 */
  hovered: boolean;
  locked: boolean;
}
