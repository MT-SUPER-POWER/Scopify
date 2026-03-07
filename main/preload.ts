const { contextBridge, ipcRenderer } = require("electron");

// 写好了接口，记得在 types/electron.d.ts 中声明类型
// 不然 ts 文件不知道函数类型会报错
try {
  contextBridge.exposeInMainWorld("electronAPI", {
    on: (channel, callback) => { ipcRenderer.on(channel, callback); },
    send: (channel, args) => { ipcRenderer.send(channel, args); },
    enterFullScreen: () => ipcRenderer.send("window-enter-full-screen"),
    exitFullScreen: () => ipcRenderer.send("window-exit-full-screen"),
    onFullScreenChanged: (callback) => {
      // NOTE: 渲染线程通过 ipcRenderer 来和主线程交互
      ipcRenderer.on("window-full-screen-changed", (event, data) => { callback(data.isFullScreen); });
    },
    openLoginWindow: () => ipcRenderer.send("open-login-window"),
  });
} catch (error) {
  console.error("[Preload] Error:", error);
}
