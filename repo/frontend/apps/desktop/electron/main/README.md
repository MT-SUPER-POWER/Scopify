# Scopify Electron Main

本目录是 Scopify 的桌面能力宿主。Web Renderer 负责界面与跨端业务，Main 进程负责只有
桌面环境才能安全完成的能力：窗口、文件系统、本地进程、系统托盘、更新和原生集成。

## 进程关系

```text
Web Renderer
    │  调用 window.electron（DesktopBridge）
    ▼
preload.ts
    │  只暴露经过约束的 IPC
    ▼
ipc/
    │  验证发送者和参数，并调用对应模块
    ▼
window/ | services/ | capabilities/ | store/ | utils/
    │
    ▼
Electron、操作系统、本地后端和原生程序
```

Renderer 不直接 import Main 源码，Main 也不反向 import `apps/web`。两端共享的类型和协议
统一位于 `@scopify/desktop-contract`。

## 目录职责

```text
electron/
├─ main/
│  ├─ index.ts        极薄的 Electron 入口，只调用 initializeApplication
│  ├─ core/            应用生命周期与窗口能力的 composition root
│  ├─ ipc/             按业务能力拆分的 IPC adapter
│  ├─ window/          BrowserWindow、Tray 的创建和生命周期
│  ├─ services/        本地后端、缓存、Discord、更新等外部能力实现
│  ├─ capabilities/    具有独立 Interface 和状态的深模块
│  ├─ store/           Main 进程配置的读取、规范化和持久化
│  ├─ utils/           无业务状态的底层工具与 Electron adapter
│  └─ constants.ts     资源句柄与进程级常量
└─ preload/
   └─ index.ts         DesktopBridge 的安全实现
```

### `core/`

`core/index.ts` 是进程级 composition root，只记录固定启动顺序。窗口策略由
`window/mainWindow.ts` 和 `window/splash.ts` 管理，Renderer 制品由
`services/rendererHost.ts` 管理，依赖主窗口的能力集中在 `core/capabilityHost.ts` 组装。

```text
Chromium 参数与单实例锁
→ Electron ready
→ Renderer 制品验证与代理
→ Splash 和主窗口
→ 窗口相关能力与 IPC
→ 启动更新检查
→ before-quit 反向释放资源
```

业务实现不要写入 `core/`。它只负责创建模块、注入依赖、连接生命周期。

### `ipc/`

每个文件对应一种 Renderer 可见能力，例如 `cache.ts`、`configuration.ts` 和
`videoExport.ts`。IPC adapter 只做四件事：注册频道、验证消息发送者、验证跨进程输入，
以及调用对应模块并返回结果。

涉及配置、文件和主窗口状态的处理器必须使用 `sender.ts` 验证主 Renderer。业务状态、
重试策略和资源生命周期不应放在 IPC 文件中。

### `window/`

窗口模块拥有具体窗口的创建、显示、隐藏和销毁。窗口只承载 Renderer，不实现跨窗口业务。
新增窗口时应明确：窗口是否允许重复创建、谁持有强引用、何时释放、哪些 Renderer 可以
发送 IPC，以及外部导航和开发者工具策略。

### `services/`

这里放与外部系统交互、但不直接构成 Renderer Interface 的实现，例如本地后端子进程、
Discord Rich Presence、页面缓存和自动更新。调用者通过这些模块公开的少量方法使用能力，
不应了解内部的进程、文件或第三方库细节。

### `capabilities/`

这里保存具有自己 Interface、状态和测试面的深模块：

- `playbackBroker/`：在 Authority 与 Replica 窗口间路由可靠播放消息；
- `playbackGateway/`：供 Main 与 MCP 使用的可信播放入口，等待 Authority 真实回执；
- `mcp/`：本机 MCP HTTP、安全凭据、协议 Session 和播放 Tool Facade；
- `nativeAudio/`：可选 Windows NAPI 音频模块的 Host 与安全状态投影；
- `audioFeatureBroker/`：传输有背压约束的高频音频特征；
- `desktopIcons/`：隐藏和恢复 Windows 桌面图标；
- `desktopPlaybackWallpaper/`：桌面播放壁纸状态机、Electron driver 与原生 host。

不要为了目录对称拆散这些模块。其内部 adapter 可以继续与状态机放在同一业务目录中。

## 一次桌面能力调用

以读取缓存为例：

```text
WebRuntime.cache.get
→ DesktopBridge.getCache
→ preload ipcRenderer.invoke("cache:get-scoped")
→ ipc/cache.ts
→ services/pageCache.ts
→ 文件系统
```

维护时从 IPC 频道开始，先找到 `ipc/` 下对应 adapter，再进入实际能力模块；不要在
`preload.ts` 中加入业务分支。

## 音乐登录会话

Browser 与 Desktop 都以 Chromium CookieJar 作为 Backend Session 的最终来源。二维码登录
响应的 `Set-Cookie` 会由浏览器自动保存；Desktop 也可以通过 `set-music-cookie` 把聚合
Cookie 按路径、过期时间和安全属性导入 `session.defaultSession.cookies`。普通 API 不读取
Cookie，也不允许在 query/body 中手工附加凭据。

旧版 localStorage/safeStorage 凭据只用于一次性迁移：Web 通过 `/login/refresh` POST 换取
`Set-Cookie`，Desktop 在创建 Renderer 前恢复到 CookieJar。`get-music-cookie` 是旧 Renderer
兼容通道，不得在新代码中使用。

## TypeScript 与依赖规则

- Main 源码统一使用 TypeScript、ES module 和命名导出；避免 CommonJS 与默认导出。
- 源码 import 的 `.js` 后缀是 Node ESM 对编译产物的解析约定，源码仍然是 `.ts`。
- 跨进程输入一律视为 `unknown`，通过类型守卫或 schema 验证后使用。
- 只在 composition root 创建有状态模块，并在 `before-quit` 对称释放。
- `window/` 不依赖具体 Web 实现；跨进程类型只依赖 `desktop-contract`。
- 平台差异应收敛在 adapter 内，调用者不应散落 `process.platform` 分支。

## 新增桌面能力

1. 在 `desktop-contract` 定义 Renderer 需要知道的 Interface、命令和事件；
2. 在 `services/` 或 `capabilities/` 实现能力；
3. 在 `ipc/<capability>.ts` 添加薄 adapter 和输入验证；
4. 在 `ipc/index.ts` 组装注册；
5. 在 `preload.ts` 实现桥接；
6. 在 `core/index.ts` 注入依赖并补齐退出清理；
7. 为模块 Interface、授权规则和关键生命周期添加测试。

未来原生音乐引擎应作为 Desktop Main 的 capability 存在；Web 与 Desktop 共享播放契约和
状态机，但分别使用 Browser Audio 与 Native Audio adapter，不能让 Web 构建依赖原生模块。
