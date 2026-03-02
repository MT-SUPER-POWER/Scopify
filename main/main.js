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

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        autoHideMenuBar: true,             // 自动隐藏菜单栏
        icon: __logoIcon,                  // 设置应用图标
        title: "Momo Music Player",        // 设置窗口标题
        titleBarOverlay: {
            color: 'rgba(0,0,0,0)',        // 完全透明
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
