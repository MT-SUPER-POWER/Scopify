const { contextBridge, ipcRenderer } = require("electron");

try {
    contextBridge.exposeInMainWorld("electronAPI", {
        on: (channel, callback) => {
            ipcRenderer.on(channel, callback);
        },
        send: (channel, args) => {
            ipcRenderer.send(channel, args);
        },
        /*         minimize: () => ipcRenderer.send("window-minimize"),
                maximize: () => ipcRenderer.send("window-maximize"),
                close: () => ipcRenderer.send("window-close"), */
    });
} catch (error) {
    console.error("[Preload] Error:", error);
}
