import { Menu, Tray } from 'electron';
import { __logoIcon } from "../main";

export function initTray() {
  const tray = new Tray(__logoIcon)
  // TODO: 开发合适的上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' },
    { label: 'Item2', type: 'radio' },
    { label: 'Item3', type: 'radio', checked: true },
    { label: 'Item4', type: 'radio' }
  ])
  tray.setToolTip('This is my application.')
  tray.setContextMenu(contextMenu)
}
