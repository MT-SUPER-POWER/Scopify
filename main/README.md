

Electron 大概有这两个部分构成，一个 main.ts 另一个 preload.ts

他们之间的通讯只要是通过 IPC 来实现


1. preload 往 main.ts 发送消息的逻辑:
    - main.ts 通过 `ipcMain` 的 `.on()` 方法去监听事件
    - preload 通过 `ipcRenderer` 的 `.send()` 方法去发送事件
    -
