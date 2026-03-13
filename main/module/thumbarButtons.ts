import { BrowserWindow } from "electron";
import { prev, pause, next, play } from "../constants";

// 抽离更新逻辑，接收状态作为参数
export function updateThumbarButtons(mainWindow: BrowserWindow, isPlaying: boolean) {
  // 必须每次传入完整的数组
  mainWindow.setThumbarButtons([
    {
      tooltip: 'Play Previous',
      icon: prev,
      click() {
        console.log('Previous clicked');
        mainWindow.webContents.send('control-audio', 'prev');
      }
    },
    {
      tooltip: isPlaying ? 'Pause' : 'Play', // 语义化提示
      icon: isPlaying ? pause : play,       // 动态切换图标
      click() {
        // 通知渲染进程（你的 React/NextJS 前端）执行实际的暂停/播放
        mainWindow.webContents.send('control-audio', isPlaying ? 'pause' : 'play');
      }
    },
    {
      tooltip: 'Play Next',
      icon: next,
      click() {
        console.log('Next clicked');
        mainWindow.webContents.send('control-audio', 'next');
      }
    },
  ]);
}

// 初始化调用
export function initThumbarButtons(mainWindow: BrowserWindow) {
  updateThumbarButtons(mainWindow, false);
}
