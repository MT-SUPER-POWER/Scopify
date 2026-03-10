import { nativeImage, BrowserWindow } from "electron";
import path from "path";

const next = nativeImage.createFromPath(path.join(__dirname, "../../resources/pic/tray/next.png"));
const pause = nativeImage.createFromPath(path.join(__dirname, "../../resources/pic/tray/pause.png"));
const prev = nativeImage.createFromPath(path.join(__dirname, "../../resources/pic/tray/prev.png"));
const play = nativeImage.createFromPath(path.join(__dirname, "../../resources/pic/tray/play.png"));

// 抽离更新逻辑，接收状态作为参数
export function updateThumbarButtons(mainWindow: BrowserWindow, isPlaying: boolean) {
  // 必须每次传入完整的数组
  mainWindow.setThumbarButtons([
    {
      tooltip: '上一首',
      icon: prev,
      click() {
        console.log('Previous clicked');
        // mainWindow.webContents.send('control-audio', 'prev');
      }
    },
    // TODO: 和渲染线程同步，确定是播放还是暂停状态
    {
      tooltip: isPlaying ? '暂停' : '播放', // 动态切换提示
      icon: isPlaying ? pause : play,       // 动态切换图标
      click() {
        const nextState = !isPlaying;
        // 1. 立即更新 Windows 任务栏 UI
        updateThumbarButtons(mainWindow, nextState);

        // 2. 通知渲染进程（你的 React/NextJS 前端）执行实际的暂停/播放
        // mainWindow.webContents.send('control-audio', nextState ? 'play' : 'pause');
      }
    },
    {
      tooltip: '下一首',
      icon: next,
      click() {
        console.log('Next clicked');
        // mainWindow.webContents.send('control-audio', 'next');
      }
    },
  ]);
}

// 初始化调用
export function initThumbarButtons(mainWindow: BrowserWindow) {
  updateThumbarButtons(mainWindow, false);
}
