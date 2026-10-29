# @scopify/desktop-contract：为什么独立成包？

> 这份文档解释 **Scopify 当前 Monorepo 的依赖边界**，而不是声称 Electron 必须有一个名叫 `desktop-contract` 的包。Web / Electron 的完整分流和 IPC 调用流程见 [WebRuntime 架构说明](../../../../docs/architecture/runtime-browser-electron-ipc.md)。

## 一、先回答“直接放在 Preload 下不行吗？”

**完全可以。**

技术上可以把 `DesktopBridge` 定义在 `apps/desktop/electron/preload/types.ts`，Preload 引用它检查实现，Web 的 `electron.d.ts` 再跨目录引用这个类型。Electron 和 TypeScript 都没有要求必须建立一个独立的契约包。

但 Scopify 当前同时有：

- `apps/web`：独立的 Next.js Web 应用，也充当 Electron 复用的 Renderer；
- `apps/desktop`：Electron 的 Main、Preload 和桌面宿主；
- `packages/desktop-contract`：没有 Electron 运行时依赖、两边都可以引用的公共接口与协议。

如果把类型只放到 Desktop 内部，Web 为了得到类型就需要引用另一个**应用内部**的源码：

```text
apps/web -> apps/desktop/electron/preload/types.ts
```

这并不是编译器无法处理，而是意味着 Web 了解 Desktop 的具体目录和内部模块划分。Preload 搬目录、重构时，Web 的类型导入也可能需要跟着变化，并且可能引入跨应用源码编译边界上的额外维护。

目前的依赖方向更清晰：

```text
                   packages/desktop-contract
                         ^           ^
                         |           |
                     apps/web    apps/desktop
                     Renderer    Preload / Main
```

**这就是独立成包的主要价值：避免 Web 为了共享类型而反向依赖 Desktop 应用源码，保持单向、公共的依赖边界。**

它是 Scopify 的工程选择，不是所有 Electron 项目都必须采用的架构；小项目把类型放在 Preload 旁边也完全合理。

## 二、这个包到底导出了什么？

[`src/index.ts`](src/index.ts) 汇总导出 `bridge`、`playback`、`audioFeature`、`cache`、`config`、`desktopLyrics`、`notifications` 等模块。

| 分类 | 示例 | 实际作用 |
| --- | --- | --- |
| Preload 的 API 接口 | [`DesktopBridge`](src/bridge.ts) | 统一 Renderer 可见的 API 名称、参数与返回值 |
| 跨进程的数据类型与协议常量 | [`playback.ts`](src/playback.ts)、[`audioFeature.ts`](src/audioFeature.ts) | 让多个模块使用一致的消息格式、版本和语义 |
| 运行时协议校验 | `playback.ts` 的消息校验函数 | 实际检查接收到的消息，不是纯类型提示 |

因此，**不能说整个包只是把 Preload 的所有活拆出去了**。纯 TypeScript 的 `interface` 在编译后消失；但这里某些协议常量与校验函数会作为实际 JavaScript 被使用方执行。

这个包**不负责**实例化 `electronAPI`、调用 `contextBridge`、发送全部 IPC、注册 Main 处理器或实现本地文件系统服务。

## 三、具体怎么让 Preload 和 Renderer“共用一份类型”？

以最小化窗口为例。

### 1. 包里只定义接口

[`src/bridge.ts`](src/bridge.ts) 的 `DesktopBridge` 中包含方法：

```ts
// 为解释而简化；完整接口还有很多方法。
export interface DesktopBridge<TLyrics = unknown> {
  minimizeApp(): void;
  // ...
}
```

### 2. Preload 引用同一接口约束它自己的实现

[`apps/desktop/electron/preload/index.ts`](../../apps/desktop/electron/preload/index.ts)：

```ts
import { contextBridge, ipcRenderer } from "electron";
import type { DesktopBridge } from "@scopify/desktop-contract";

// 仅展示对象中的一个成员，不能替换完整的真实 electronAPI。
const electronAPI: DesktopBridge = {
  minimizeApp: () => ipcRenderer.send("minimize-to-tray"),
  // ...其他必需方法
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
```

`const electronAPI: DesktopBridge` 让 TypeScript 在编译期检查 Preload 是否提供了应有的方法及签名。

**运行时真正存在的是 `electronAPI` 对象。** `DesktopBridge` 接口本身不会发 IPC。

### 3. Web 的 electron.d.ts 也引用同一个接口

[`apps/web/types/electron.d.ts`](../../apps/web/types/electron.d.ts)：

```ts
import type { DesktopBridge } from "@scopify/desktop-contract";
import type { LyricData } from "@/types/lyrics/model";

declare global {
  interface Window {
    electronAPI?: DesktopBridge<LyricData>;
  }
}
```

这里 **没有另外写一份 `minimizeApp`、`getPageCache` 等成员清单**。`electron.d.ts` 只声明：如果 `window.electronAPI` 存在，它应该符合 `DesktopBridge<LyricData>` 的形状。

于是：

- Preload 使用同一份接口来**检查实现**；
- Renderer 使用同一份接口来**检查调用**；
- 接口修改后，双方都能在类型检查时发现不匹配，而不用人工同步两套方法列表。

### 4. Runtime 接到的是对象，不是接口类型

[`apps/web/lib/runtime/index.ts`](../../apps/web/lib/runtime/index.ts) 的关键逻辑：

```ts
if (rendererWindow?.electronAPI) {
  return createElectronRuntime(rendererWindow.electronAPI);
}
return createBrowserRuntime();
```

[`adapters/electron.ts`](../../apps/web/lib/runtime/adapters/electron.ts) 再包装业务动作：

```ts
window: {
  minimize: () => bridge.minimizeApp(),
}
```

所以要严格区分两条关系：

```text
编译时的类型关系：

                   desktop-contract
                   DesktopBridge
                     /        \
                    v          v
                 Preload     Renderer
              检查 API 实现  检查 API 调用

运行时的调用关系：

runtime.window.minimize()
   -> ElectronRuntime 的方法映射
   -> window.electronAPI.minimizeApp()
   -> Preload 里的 ipcRenderer.send("minimize-to-tray")
   -> Main 的 ipcMain.on("minimize-to-tray")
   -> mainWindow.hide()
```

**`DesktopBridge` 不在运行时调用链中转发请求。**

另外，类型约束并不会自动验证 `"minimize-to-tray"` 频道字符串是否与 Main 注册一致；Main 仍须校验 IPC 的发送者和输入。

## 四、为什么不直接 import Preload 的 index.ts？

Preload 的 `index.ts` 导入 Electron 的 `ipcRenderer` / `contextBridge`、注册事件监听器、暴露真实 API，属于带运行时副作用的 Electron 入口。

Web 的 TypeScript 需要共享**接口声明**，但不应该为了获得类型，把 Electron 特有的可执行代码导入 Next.js 页面。

理论上 Web 可以通过 `import type` 引用 Preload 旁边一个专用的 `types.ts`。这仍是合法替代方案；共享包让两应用都不必跨应用路径引用内部文件，也不会误把 Preload 实现当成普通浏览器依赖。

## 五、在 Monorepo 里如何使用？

本包的 [`package.json`](package.json) 将根入口直接指向源码：

```json
{
  "name": "@scopify/desktop-contract",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

使用方按当前构建体系消费 TypeScript 源文件。本包的 `typecheck` 执行 `tsc --noEmit`，并不负责给 Web 自动生成 `electron.d.ts` 或注入 `window.electronAPI`。

这三件事应分别理解：

1. **类型导入**：Web 与 Preload 使用相同接口和消息类型。
2. **对象注入**：Electron 加载 Preload，调用 `contextBridge.exposeInMainWorld` 创建 Renderer 可访问的能力入口。
3. **IPC 调用**：Preload 用 `ipcRenderer` 和 Main 注册的频道通信；需要时共享包中的协议验证函数可以参与实际数据校验。

## 六、什么内容属于这个包？

适合：需要在两个应用或多个进程之间共享、并且不依赖特定宿主运行时的接口，消息格式、协议常量和纯粹的校验逻辑。

不适合：`BrowserWindow` 生命周期、`ipcMain`/`ipcRenderer` 具体处理、磁盘读写实现、Main 服务、React 组件，或者只会在 Desktop 内部用到且无需跨边界共享的私有类型。

新增桌面能力的一般边界：

1. 在 `desktop-contract` 定义 Preload 公开 API 与必要的共享消息类型。
2. 在 Desktop Preload 实现 API、映射 IPC。
3. 在 Main 的 `ipc/` 注册处理器并校验输入，交给主进程服务。
4. 只有业务层需要统一调用时，才在 WebRuntime 和两个平台适配器中补对应能力；浏览器不支持时明确约定降级行为。

**最终结论：共享的协议和接口有实际价值；专门建立 `desktop-contract` 包，是为了让 `apps/web` 与 `apps/desktop` 在 Monorepo 中保持清晰的依赖边界，而不是 Electron 强制的技术要求。**

## 相关入口

- [WebRuntime 双端分流与 IPC 完整调用链](../../../../docs/architecture/runtime-browser-electron-ipc.md)
- [Electron Main 职责](../../apps/desktop/electron/main/README.md)
- [Desktop 架构全景](../../apps/desktop/docs/architecture.md)
