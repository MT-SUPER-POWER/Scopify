# Scopify Desktop 架构全景与子系统设计规范

> 本文档是 Scopify 桌面端（Electron Host）及跨端播放平台的**核心架构全景指南**。
> 摒弃冗余叙述，直接以 **UML 类图、组件拓扑图、时序图与状态机** 为主线，深度拆解系统分层、核心接口契约、跨进程通信以及数据流转机制。

---

## 1. 全局分层与进程边界拓扑

Scopify 采用单向契约依赖模型：**Web 渲染进程**负责界面与播放领域编排，**Electron 主进程**承载原生能力、系统集成与安全存储，双方通过无依赖纯 TypeScript 契约包 `@scopify/desktop-contract` 进行强类型对齐。

```mermaid
graph TB
    subgraph WebProcess["Web 渲染进程 (Renderer / Next.js)"]
        UI["UI 业务组件 (React / Zustand)"]
        WebRuntime["WebRuntime 抽象层<br/>(Browser / Desktop 双端抹平)"]
        PlaybackSession["PlaybackSession (领域核心)<br/>• 队列编排 • 音源解析 • 状态投影"]
        HtmlAudio["HtmlAudioEngineAdapter<br/>(DOM 音频发声 & revision 锁)"]
        Authority["Playback Authority (主控端口)"]
    end

    subgraph ContractPkg["跨端契约包 (@scopify/desktop-contract)"]
        Contract["• DesktopBridge 接口<br/>• Playback 消息与命令定义<br/>• MCP 配置与安全状态<br/>• 配置与宿主环境模型"]
    end

    subgraph PreloadLayer["Preload 隔离层 (ContextBridge)"]
        Bridge["window.electronAPI<br/>(收敛仅暴露受信 IPC 调用)"]
    end

    subgraph MainProcess["Electron 主进程 (Electron Main)"]
        subgraph IPCLayer["IPC 路由与发送者鉴权"]
            IPC["IPC 模块 (按能力拆分)<br/>• 校验 isMainRenderer<br/>• 参数反序列化与安全校验"]
        end

        subgraph CorePlatform["播放与可信网关中枢"]
            Broker["PlaybackBroker<br/>(跨窗口状态机 / 消息去重广播)"]
            Gateway["PlaybackGateway<br/>(可信控制门面 / UUID 回执等待)"]
            NativeHost["NativeAudioHost (可选)<br/>(NAPI 绑定 / Rust 解码)"]
        end

        subgraph McpSubsystem["本地 AI 控制子系统 (MCP)"]
            McpHttp["McpHttpServer<br/>(127.0.0.1 / 防 DNS-Rebinding)"]
            McpEnd["McpEndpoint<br/>(Streamable HTTP / 8会话上限 / 30min回收)"]
            McpSrv["McpServer & PlaybackFacade<br/>(9 项读写工具 / 极简脱敏投影)"]
            McpVault["McpCredentialStore<br/>(OS safeStorage DPAPI 加密)"]
        end

        subgraph Capabilities["操作系统硬件与桌面集成能力"]
            Wallpaper["DesktopPlaybackWallpaper<br/>(WorkerW 句柄穿透 / 原生降级)"]
            Icons["DesktopIcons (桌面图标显隐)"]
            Discord["DiscordPresence (RPC 状态广播)"]
            MemMonitor["ProcessMemory (各进程内存基线)"]
        end

        subgraph Lifecycle["生命周期编排与优雅停机"]
            AppShutdown["ApplicationShutdown<br/>(单次幂等协调 / 异步安全释放)"]
        end
    end

    UI --> WebRuntime
    UI --> PlaybackSession
    PlaybackSession --> HtmlAudio
    PlaybackSession --> Authority

    WebRuntime -.-> Contract
    Authority -.-> Contract

    WebRuntime --> Bridge
    Bridge --> IPC
    Authority <-->|"MessagePort 双向通信"| Broker

    IPC --> Gateway
    IPC --> McpSrv
    Gateway --> Broker
    McpSrv --> Gateway
    McpHttp --> McpEnd --> McpSrv
    McpHttp -.-> McpVault

    IPC --> Wallpaper
    IPC --> Icons
    IPC --> Discord

    AppShutdown -->|"有序释放"| CorePlatform
    AppShutdown -->|"有序释放"| McpSubsystem
```

---

## 2. 平台宿主抹平：`WebRuntime` 适配器设计

为了让 Web 页面与组件在浏览器端和 Electron 桌面端无需编写侵入性 `if (isElectron)` 分支，设计了统一的宿主缝隙（Seam）：

```mermaid
classDiagram
    class WebRuntime {
        <<interface>>
        +isDesktop: boolean
        +kind: "browser" | "desktop"
        +app: RuntimeAppLifecycle
        +auth: RuntimeAuthentication
        +cache: RuntimeCache
        +config: RuntimeConfiguration
        +desktopIcons: RuntimeDesktopIcons
        +desktopLyrics: RuntimeDesktopLyrics
        +desktopPlaybackWallpaper: RuntimeDesktopPlaybackWallpaper
        +discord: RuntimeDiscord
        +logging: RuntimeLogging
        +mcp: RuntimeMcp
        +media: RuntimeMediaControls
        +navigation: RuntimeNavigation
        +playback: RuntimePlaybackTransport
        +updates: RuntimeUpdates
        +window: RuntimeWindow
    }

    class BrowserRuntime {
        -cacheStorage: BrowserCacheStorage
        +cache: 基于 IndexedDB
        +window: 基于 HTML5 Fullscreen
        +mcp: 安全返回 null
        +desktopIcons: 返回 unsupported
        +desktopPlaybackWallpaper: 返回 false
        +updates: 返回 unsupportedUpdateState
    }

    class ElectronRuntime {
        -bridge: DesktopBridge
        +cache: 委派 Bridge IPC
        +window: 委派 Bridge IPC
        +mcp: 委派 Bridge IPC
        +desktopIcons: 委派 Bridge IPC
        +desktopPlaybackWallpaper: 委派 Bridge IPC
        +updates: 委派 Bridge IPC
    }

    WebRuntime <|.. BrowserRuntime : 浏览器环境实现 (优雅降级)
    WebRuntime <|.. ElectronRuntime : 桌面环境实现 (IPC 桥接)
```

---

## 3. 播放平台全景：`@scopify/playback-core` 与双引擎体系

播放子系统将**业务逻辑（队列与切歌规则）**、**音源获取（网易云协议与缓存）**与**发声硬件（HTML Audio / 原生 Rust）**彻底解耦。

### 3.1 核心类与接口 UML 契约

```mermaid
classDiagram
    class PlaybackSession {
        -queue: PlaybackQueue
        -sourceResolver: PlayableSourceResolver
        -audioEngine: AudioEngineAdapter
        -loadId: string
        -revision: number
        +play() Promise~void~
        +pause() Promise~void~
        +toggle() Promise~void~
        +next(source: PlaybackNextSource) Promise~void~
        +previous() Promise~void~
        +seek(positionMs: number) Promise~void~
        +setVolume(volume: number) Promise~void~
        +subscribe(listener) Unsubscribe
    }

    class PlaybackQueue {
        -items: PlaybackQueueItem[]
        -cursor: number
        -repeatMode: PlaybackQueueRepeatMode
        -shuffleHistory: number[]
        +next(source) QueueTransition
        +previous() QueueTransition
        +setItems(items, initialCursor) PlaybackQueue
        +setRepeatMode(mode) PlaybackQueue
    }

    class PlayableSourceResolver {
        -adapter: PlayableSourceAdapter
        -cache: BoundedMemoryCache
        +resolve(locator, request) Promise~SourceResolution~
        +invalidate(locator, quality) Promise~void~
    }

    class PlayableSourceAdapter {
        <<interface>>
        +resolve(locator: TrackLocator, request: SourceResolveRequest) Promise~SourceResolution~
    }

    class NeteasePlayableSourceAdapter {
        -dependencies: NeteaseDependencies
        +resolve(locator, request)
        +invalidate(locator, quality)
    }

    class AudioEngineAdapter {
        <<interface>>
        +load(source: PlayableSource, options: AudioEngineLoadOptions) Promise~AudioEngineLoadResult~
        +play() Promise~void~
        +pause() Promise~void~
        +seek(positionMs: number) Promise~void~
        +setVolume(volume: number) Promise~void~
        +subscribe(listener: AudioEngineEventListener) Unsubscribe
    }

    class HtmlAudioEngineAdapter {
        -audio: HTMLAudioElement
        -currentRevision: number
        +load(source, options)
        +handleMediaEvent(event)
    }

    class NativeAudioHost {
        -loader: NativeModuleLoader
        -currentLoadId: string
        -requestRevision: number
        +load(source, options)
        +play()
        +pause()
    }

    PlaybackSession *-- PlaybackQueue : 组合
    PlaybackSession *-- PlayableSourceResolver : 组合
    PlaybackSession o-- AudioEngineAdapter : 聚合
    PlayableSourceResolver o-- PlayableSourceAdapter : 聚合
    PlayableSourceAdapter <|.. NeteasePlayableSourceAdapter : 实现
    AudioEngineAdapter <|.. HtmlAudioEngineAdapter : 实现 (DOM 发声)
    AudioEngineAdapter <|.. NativeAudioHost : 实现 (Rust 原生发声)
```

### 3.2 切歌与真实发声端到端时序（含 Revision 纪元淘汰机制）

在快速切歌时，异步网络请求容易发生后发先至。系统通过递增的 `revision` 纪元号保证状态绝对一致：

```mermaid
sequenceDiagram
    autonumber
    actor UI as 用户 / 上层命令
    participant Session as PlaybackSession (纯逻辑)
    participant Queue as PlaybackQueue
    participant Resolver as PlayableSourceResolver
    participant Adapter as NeteasePlayableSourceAdapter
    participant Engine as HtmlAudioEngineAdapter
    participant DOM as HTMLAudioElement

    UI->>Session: next("manual")
    Session->>Queue: next("manual")
    Queue-->>Session: Transition { currentItem, revision: 42 }
    Session->>Resolver: resolve(currentItem.locator, { signal })
    Resolver->>Adapter: resolve(locator)
    Note over Adapter: 1. 命中持久化签名缓存 / 调网易云 API<br/>2. 计算音轨 ReplayGain
    Adapter-->>Resolver: PlayableSource { url, replayGain }
    Resolver-->>Session: SourceResolution ("resolved")

    Session->>Engine: load(source, { revision: 42 })
    Engine->>Engine: currentRevision = 42
    Engine->>DOM: audio.src = source.url, audio.load()

    Note over DOM: 若旧歌曲的事件晚于此处到达：<br/>event.revision (41) !== currentRevision (42)<br/>Engine 直接将其静默丢弃！

    DOM-->>Engine: 原生事件 "canplay"
    Engine->>Engine: 校验 revision === 42 (通过)
    Engine-->>Session: 抛出事件 { type: "loaded", revision: 42 }

    Session->>Engine: play()
    Engine->>DOM: audio.play()
    DOM-->>Engine: 原生事件 "playing"
    Engine-->>Session: 抛出事件 { type: "playing", revision: 42 }
    Session-->>UI: 发布最新状态快照 (Playing)
```

---

## 4. 跨窗口状态同步与主进程可信控制：Broker 与 Gateway

Electron 桌面中存在多个窗口（主窗口、歌词悬浮窗、壁纸控制窗、托盘菜单），必须保证**同一时刻只有一个主控发声源（Authority）**，其余窗口均为**只读副本（Replica）**。

```mermaid
classDiagram
    class PlaybackBroker {
        -authority: PortConnection
        -replicas: Map~string, PortConnection~
        -bootstrap: PlaybackBootstrap
        -rememberedCommandIds: Set~string~
        +registerAuthority(authorityId, port) Unsubscribe
        +registerReplica(replicaId, port) Unsubscribe
        +getBootstrap() PlaybackBootstrap
        +subscribe(listener) Unsubscribe
        +dispose() void
    }

    class PlaybackBrokerPort {
        <<interface>>
        +close(): void
        +onClose(listener): Unsubscribe
        +onMessage(listener): Unsubscribe
        +postMessage(message): void
    }

    class InMemoryPlaybackBrokerPort {
        -brokerMessageListeners: Set
        -outboundListeners: Set
        +receive(message)
        +postMessage(message)
    }

    class PlaybackGateway {
        -broker: PlaybackBroker
        -replica: MainPlaybackReplica
        -pendingReceipts: Map~commandId, ResolveFn~
        +play() Promise~PlaybackCommandReceipt~
        +pause() Promise~PlaybackCommandReceipt~
        +next() Promise~PlaybackCommandReceipt~
        +seek(positionMs) Promise~PlaybackCommandReceipt~
        +setVolume(volume) Promise~PlaybackCommandReceipt~
        +getSnapshot() PlaybackProjection
        +subscribe(listener) Unsubscribe
    }

    PlaybackBrokerPort <|.. InMemoryPlaybackBrokerPort : 实现 (零 IPC 开销)
    PlaybackGateway *-- PlaybackBroker : 监听与依赖
    PlaybackGateway *-- InMemoryPlaybackBrokerPort : 内部通信
```

### 4.1 Gateway 异步真回执等待时序

外部（如 MCP 或托盘）通过 `PlaybackGateway` 发送命令时，绝不提前虚假返回成功，必须拿到渲染端执行回执：

```mermaid
sequenceDiagram
    autonumber
    actor Caller as 外部调用方 (MCP / Tray)
    participant Gateway as PlaybackGateway
    participant Port as InMemoryPort (MainReplica)
    participant Broker as PlaybackBroker
    participant IPC as MessagePortMain IPC
    participant Auth as Renderer PlaybackAuthority

    Caller->>Gateway: next()
    Gateway->>Gateway: 生成唯一 commandId (UUID)<br/>pendingReceipts.set(commandId, resolve)
    Gateway->>Port: postMessage({ type: "next", commandId })
    Port->>Broker: 投递至仲裁状态机
    Broker->>Broker: 历史命令去重防抖检查
    Broker->>IPC: 转发命令给 Authority
    IPC->>Auth: 收到切歌命令并执行切歌
    Auth-->>IPC: 返回真实回执 { commandId, status: "accepted" }
    IPC-->>Broker: 回执流转
    Broker-->>Port: 广播回执
    Port-->>Gateway: onReceipt(receipt)
    Gateway->>Gateway: pendingReceipts 匹配 commandId 并 resolve(receipt)
    Gateway-->>Caller: 返回真实回执 (成功确认)
```

---

## 5. 本地安全 MCP 架构与防护模型

桌面端通过标准 Streamable HTTP 协议提供本地 MCP 控制能力，使外部 AI 客户端（Claude Desktop、Cursor 等）可以受控管理播放。

### 5.1 MCP 内部构件与安全防线

```mermaid
graph LR
    subgraph Client["AI 客户端"]
        AI["Claude / Cursor / CLI"]
    end

    subgraph SecurityShield["第一道防线：网络与来源安全 (HttpServer)"]
        HostCheck["Host 校验<br/>(仅限 localhost / 127.0.0.1)"]
        OriginCheck["Origin 校验<br/>(防浏览器跨域探测)"]
        AuthCheck["Bearer 校验<br/>(timingSafeEqual 常数时间)"]
    end

    subgraph SessionPool["第二道防线：会话与资源有界性 (Endpoint)"]
        CapLock["并发容量锁 (最大 8 个会话)"]
        LRUEvict["最久未用 LRU 淘汰"]
        IdleSweep["30 分钟无活动自动清理"]
    end

    subgraph ToolFacade["第三道防线：权限与隐私投影 (Facade)"]
        PolicyCheck["McpAuthorization 动态校验<br/>(playback.read / playback.control)"]
        Sanitize["隐私脱敏投影 (projectTrack)<br/>• 剔除所有 Cookie<br/>• 剔除音频真实 URL<br/>• 剔除本地文件物理路径<br/>• 剔除大段歌词文本"]
    end

    subgraph HardwareVault["第四道防线：硬件凭据金库 (safeStorage)"]
        DPAPI["Windows DPAPI / Keychain<br/>加解密存储至 mcp-credential.bin"]
        OneTime["仅在设置页主动轮换时一次性返回"]
    end

    AI -->|"HTTP POST /mcp"| HostCheck
    HostCheck --> OriginCheck --> AuthCheck
    AuthCheck -.->|"读取校验"| DPAPI
    AuthCheck --> CapLock --> LRUEvict --> IdleSweep
    IdleSweep --> PolicyCheck --> Sanitize
    Sanitize -->|"派发至 Gateway"| GW["PlaybackGateway"]
```

### 5.2 MCP 9 项工具与权限矩阵

| 工具名 | 权限门禁 | 幂等性 | 说明 |
| :--- | :--- | :--- | :--- |
| `get_playback_status` | `playback.read` | 是 (只读) | 获取当前播放阶段（playing/paused）、进度毫秒、总时长、音量 |
| `get_now_playing` | `playback.read` | 是 (只读) | 获取当前曲目精简快照（仅保留 id、title、artistNames 与安全封面） |
| `play` | `playback.control` | 否 (写操作) | 恢复播放，穿透至前端并等待音频就绪回执 |
| `pause` | `playback.control` | 否 (写操作) | 暂停播放，穿透至前端并等待确认挂起回执 |
| `toggle_playback` | `playback.control` | 否 (写操作) | 播放/暂停状态翻转 |
| `next_track` | `playback.control` | 否 (写操作) | 切至下一首，等待真实切歌与首帧加载回执 |
| `previous_track` | `playback.control` | 否 (写操作) | 切至上一首 |
| `seek` | `playback.control` | 是 (入参幂等) | 跳转到指定毫秒进度（`positionMs: number`） |
| `set_volume` | `playback.control` | 是 (入参幂等) | 调整播放音量（`volume: 0..100`） |

---

## 6. 生命周期、优雅停机与内存治理

### 6.1 优雅停机时序状态机 (`core/shutdown.ts`)

应用退出时，各个子模块之间存在严格的依赖拓扑：**必须先关闭对外暴露的外部入口（MCP HTTP），再释放中枢 Gateway 与 Broker，最后注销窗口与后端进程**，杜绝退出时出现崩溃或内存访问冲突。

```mermaid
stateDiagram-v2
    [*] --> Running : 应用正常运行
    Running --> BeforeQuitReceived : 用户关闭窗口 / Cmd+Q / app.quit()
    
    state BeforeQuitReceived {
        [*] --> GuardDoubleCall : event.preventDefault() 拦截单次退出
        GuardDoubleCall --> Step1_StopExternal : 1. 停止 MCP HttpServer 与 Endpoint (拒绝外部新请求)
        Step1_StopExternal --> Step2_ReleaseGateway : 2. 释放 PlaybackGateway 与 MainReplica (结清在途 Promise)
        Step2_ReleaseGateway --> Step3_ReleaseBroker : 3. 释放 PlaybackBroker 与 AudioFeature 总线
        Step3_ReleaseBroker --> Step4_StopServices : 4. 销毁 Discord RPC、停止内存采样器、清理托盘与浮窗
        Step4_StopServices --> Step5_DisposeBackend : 5. 关闭托管的本地后端子进程 (api-enhanced)
    }
    
    BeforeQuitReceived --> SafeToExit : 全部异步资源释放完成 (Promise.allSettled)
    SafeToExit --> [*] : 调用最终底层 app.quit()
```

### 6.2 内存防劣化治理机制 (`processMemory.ts`)

为了严格遵守 SPlayer-Next 倡导的内存纪律（Memory Discipline），桌面端引入常态化进程工作集监控：
- **启动与就绪基线**：主窗口渲染完成时立即触发首个采样快照。
- **低频定期采样**：通过 `app.getAppMetrics()` 提取每个子进程（Main、Renderer、GPU、Utility、各浮窗）的物理工作集（Working Set Size MB）。
- **进程名关联**：根据 OS ProcessId 将子进程与业务窗体（`desktop-lyric`、`desktop-playback-controller` 等）精确关联，记录到 Core 日志中，为长期防内存泄漏对比提供科学数据支撑。
