import { app, Tray, BrowserWindow, screen } from 'electron';
import { __logoIcon } from "../main";

const TRAY_WIDTH = 200;
const TRAY_HEIGHT = 380;

// 提取偏移常量，方便后续微调 UI
const X_OFFSET = 15; // 水平偏移：离开一点 > 0
const Y_OFFSET = 4;  // 垂直偏移：靠近一些 > 0

let trayWindow: BrowserWindow | null = null;
let lastBlurTime = 0; // 核心：记录最后一次失去焦点的时间

function createTrayWindow(mainWindow: Electron.BrowserWindow) {

  trayWindow = new BrowserWindow({
    width: TRAY_WIDTH,
    height: TRAY_HEIGHT,
    parent: mainWindow,
    show: false,
    frame: false,
    fullscreenable: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
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
    lastBlurTime = Date.now(); // 记录隐藏瞬间的时间
    trayWindow?.hide();
  });
}

export function initTray(mainWindow: Electron.BrowserWindow) {
  const tray = new Tray(__logoIcon);
  tray.setToolTip('Scopify');

  createTrayWindow(mainWindow);

  tray.on('right-click', (_event, trayBounds) => {
    if (!trayWindow) return;

    const timeSinceLastBlur = Date.now() - lastBlurTime;

    // FIX: 修复闪烁和连点问题
    // 如果窗口是可见的，或者距离上一次因为 blur 隐藏的时间小于 100ms
    // 说明这是用来“关闭”菜单的点击，直接忽略展开逻辑
    if (trayWindow.isVisible() || timeSinceLastBlur < 100) {
      trayWindow.hide();
      return;
    }

    const windowBounds = trayWindow.getBounds();
    const currentDisplay = screen.getDisplayNearestPoint(trayBounds);
    const workArea = currentDisplay.workArea;
    const maxRight = workArea.x + workArea.width;

    // 水平坐标计算 (加入 X_OFFSET 向两边散开)
    let x = Math.round(trayBounds.x) + X_OFFSET;

    // 碰撞检测：如果向右展开会撞到屏幕右侧边缘
    if (x + windowBounds.width > maxRight) {
      // 改变策略（靠左）：向左展开，并加上负向的偏移量使其远离
      x = Math.round(trayBounds.x + trayBounds.width - windowBounds.width) - X_OFFSET;
    }

    // 终极兜底：防止向左展开后撞到左侧边界
    if (x < workArea.x) {
      x = workArea.x + 10;
    }

    // 垂直坐标计算 (加入 Y_OFFSET 使其更贴近任务栏)
    let y;
    if (trayBounds.y > currentDisplay.bounds.height / 2) {
      // 任务栏在底部
      y = trayBounds.y - windowBounds.height - Y_OFFSET;
    } else {
      // 任务栏在顶部
      y = trayBounds.y + trayBounds.height + Y_OFFSET;
    }

    // 垂直兜底
    if (y < workArea.y) y = workArea.y + 10;
    if (y + windowBounds.height > workArea.y + workArea.height) {
      y = workArea.y + workArea.height - windowBounds.height - 10;
    }

    // --- 防闪烁核心逻辑 ---
    // 先把窗口变为完全透明
    trayWindow.setOpacity(0);

    // 设定位置并显示 (show 内部自带 focus 能力)
    trayWindow.setPosition(x, y, false);
    trayWindow.show();

    // 延迟一帧，给渲染多一点时间
    setTimeout(() => {
      if (trayWindow && trayWindow.isVisible()) {
        trayWindow.setOpacity(1);
      }
    }, 20);
  });

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}
