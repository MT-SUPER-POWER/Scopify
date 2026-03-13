import { app, Tray, BrowserWindow, screen } from 'electron';
import { __logoIcon, __preloadScript } from "../constants.js";

const TRAY_WIDTH = 200;
const TRAY_HEIGHT = 380;
const X_OFFSET = 15;
const Y_OFFSET = 4;

// 提升到模块作用域，防止被垃圾回收
export let trayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let lastBlurTime = 0;

function createTrayWindow() {
  // 移除 parent: mainWindow，让托盘菜单独立存在，不依赖主窗口的生死
  trayWindow = new BrowserWindow({
    width: TRAY_WIDTH,
    height: TRAY_HEIGHT,
    show: false,
    frame: false,
    fullscreenable: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: __preloadScript,
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const devPort = process.env.NEXT_PORT ?? "3000";
  const trayUrl = app.isPackaged
    ? "app://-/tray.html"
    : `http://localhost:${devPort}/tray`;

  trayWindow.loadURL(trayUrl);

  trayWindow.on('blur', () => {
    lastBlurTime = Date.now();
    trayWindow?.hide();
  });

  // 核心修复：窗口被销毁时，将外部变量置空释放内存
  trayWindow.on('closed', () => {
    trayWindow = null;
  });
}

function initTray(mainWindow: Electron.BrowserWindow) {
  // 如果已经初始化过，不要重复创建
  if (tray) return;

  tray = new Tray(__logoIcon);
  tray.setToolTip('Scopify');

  createTrayWindow();

  tray.on('right-click', (_event, trayBounds) => {
    // 如果窗口被销毁了（比如主动调用了 close），重新创建一个
    if (!trayWindow) {
      createTrayWindow();
    }

    // 下面都是你原来的逻辑，唯一需要注意的是 trayWindow 此时一定是非 null 的 (加 ! 断言)
    const timeSinceLastBlur = Date.now() - lastBlurTime;

    if (trayWindow!.isVisible() || timeSinceLastBlur < 100) {
      trayWindow!.hide();
      return;
    }

    const windowBounds = trayWindow!.getBounds();
    const currentDisplay = screen.getDisplayNearestPoint(trayBounds);
    const workArea = currentDisplay.workArea;
    const maxRight = workArea.x + workArea.width;

    let x = Math.round(trayBounds.x) + X_OFFSET;
    if (x + windowBounds.width > maxRight) {
      x = Math.round(trayBounds.x + trayBounds.width - windowBounds.width) - X_OFFSET;
    }
    if (x < workArea.x) x = workArea.x + 10;

    let y;
    if (trayBounds.y > currentDisplay.bounds.height / 2) {
      y = trayBounds.y - windowBounds.height - Y_OFFSET;
    } else {
      y = trayBounds.y + trayBounds.height + Y_OFFSET;
    }
    if (y < workArea.y) y = workArea.y + 10;
    if (y + windowBounds.height > workArea.y + workArea.height) {
      y = workArea.y + workArea.height - windowBounds.height - 10;
    }

    trayWindow!.setOpacity(0);
    trayWindow!.setPosition(x, y, false);
    trayWindow!.show();

    setTimeout(() => {
      if (trayWindow && !trayWindow.isDestroyed() && trayWindow.isVisible()) {
        trayWindow.setOpacity(1);
      }
    }, 20);
  });

  tray.on('double-click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });

  // 妥善清理 Tray，避免退出时系统托盘留下残影
  app.on('before-quit', () => {
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });
}

export default initTray;
