import { app, BrowserWindow, ipcMain } from "electron";
import serve from "electron-serve";
import { join } from "path";
import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const appServe = app.isPackaged ? serve({
    directory: join(__dirname, "../out")
}) : null;

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,  // 隐藏原生标题栏
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

    // IPC 事件监听 - 窗口控制
    ipcMain.on("window-minimize", () => {
        if (mainWindow) {
            mainWindow.minimize();
        }
    });

    ipcMain.on("window-maximize", () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.on("window-close", () => {
        if (mainWindow) {
            // 直接销毁窗口以获得最快的响应速度
            mainWindow.destroy();
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
