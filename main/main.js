import { app, BrowserWindow, ipcMain } from "electron";
import serve from "electron-serve";
import { join } from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

// const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const __logoIcon = join(__dirname, "../assets/icon.ico");

if (fs.access(__logoIcon).catch(() => true)) {
  console.warn("Warning: Icon file not found at", __logoIcon);
}

const appServe = app.isPackaged ? serve({
  directory: join(__dirname, "../out")
}) : null;

let mainWindow;

// NOTE: Electron 子窗口的创建
const createLoginWindow = () => {
  const loginWindow = new BrowserWindow({
    width: 450,
    height: 600,
    icon: __logoIcon,                  // 设置应用图标
    resizable: false,
    autoHideMenuBar: true,
    parent: mainWindow, // 设置父窗口
    modal: true, // 可选：如果你希望它是模态的
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  if (app.isPackaged) {
    loginWindow.loadURL("app://-/login");
  } else {
    loginWindow.loadURL("http://localhost:3000/login");
  }
};

ipcMain.on("open-login-window", () => {
  createLoginWindow();
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 840,
    minHeight: 720,
    autoHideMenuBar: true,             // 自动隐藏菜单栏
    icon: __logoIcon,                  // 设置应用图标
    title: "scopify",        // 设置窗口标题
    titleBarOverlay: {
      color: 'rgba(0,0,0,0)',          // 完全透明
      height: 35,
      symbolColor: 'white'
    },
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  if (app.isPackaged) {
    appServe(mainWindow).then(() => {
      mainWindow.loadURL("app://-");
    });
  } else {
    mainWindow.loadURL("http://localhost:3000");
    // 注释掉 DevTools 以提升性能，需要时按 Ctrl+Shift+I 打开
    // mainWindow.webContents.openDevTools();
    mainWindow.webContents.on("did-fail-load", (e, code, desc) => {
      console.log("Did fail load:", code, desc);
      mainWindow.webContents.reloadIgnoringCache();
    });
  }

  // 页面加载完成后的日志
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Page loaded successfully");
  });

  // 禁用缩放快捷键（防止误触）
  mainWindow.webContents.on("before-input-event", (event, input) => {
    // 禁止 Ctrl/Cmd + 数字 0 (重置缩放)
    if ((input.control || input.meta) && input.key === "0") {
      event.preventDefault();
    }
    // 禁止 Ctrl/Cmd + = 和 Ctrl/Cmd + + (放大)
    if ((input.control || input.meta) && (input.key === "=" || input.key === "+")) {
      event.preventDefault();
    }
    // 禁止 Ctrl/Cmd + - (缩小)
    if ((input.control || input.meta) && input.key === "-") {
      event.preventDefault();
    }
  });


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ IPC Module ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // IPC 事件监听 - 更新标题栏颜色
  ipcMain.on("update-titlebar-color", (event, color) => {
    if (mainWindow) {
      mainWindow.setTitleBarOverlay({
        color: 'rgba(0,0,0,0)',
        height: 35,
        symbolColor: color          // * 这里的颜色随着主题切换而切换，避免三控件标志看不见
      });
    }
  });

  // IPC 事件监听 - 全屏化
  ipcMain.on("window-enter-full-screen", (event) => {
    if (mainWindow) {
      mainWindow.setFullScreen(true);
    }
  });

  // IPC 事件监听 - 退出全屏
  ipcMain.on("window-exit-full-screen", (event) => {
    if (mainWindow) {
      mainWindow.setFullScreen(false);
    }
  });

  // 监听窗口进入全屏事件（包括 F11）
  mainWindow.on("enter-full-screen", () => {
    if (mainWindow && mainWindow.webContents) {
      // NOTE: 主线程通过 webContents 来通知 preload
      mainWindow.webContents.send("window-full-screen-changed", { isFullScreen: true });
    }
  });

  // 监听窗口退出全屏事件（包括 F11）
  mainWindow.on("leave-full-screen", () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("window-full-screen-changed", { isFullScreen: false });
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.on("ready", () => {
  console.log("App ready, creating window...");
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
