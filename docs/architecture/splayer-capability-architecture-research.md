# SPlayer 能力架构调研：Agent/MCP、插件与自制音频引擎

> Status: Completed research — 2026-09-03。结论来自两个工作区的当前实现；没有运行 SPlayer 或修改产品代码。

> 审阅快照：SPlayer-Next [`ac0bcfa1f70c54cadc046aba6472c8d13294c719`](https://github.com/SPlayer-Dev/SPlayer-Next/commit/ac0bcfa1f70c54cadc046aba6472c8d13294c719)，remote 为 `https://github.com/SPlayer-Dev/SPlayer-Next.git`；Scopify `098066ff1c8b29020267bcb101a5a8ff88791aa7`。SPlayer 引用固定到前一提交的 GitHub permalink，Scopify 引用使用本仓库相对源码路径。

> 范围：两个审阅快照的源码树。本文不把 README 或 `AGENTS.md` 的描述当作架构事实；关键结论均回链到实现源码。SPlayer 的 `AGENTS.md` 已逐项以源码抽查，未被实现证据支持的地方会留在“未确认点”。

## 结论摘要

SPlayer 值得学习的不是把三项能力堆在一起，而是都采用了“**宿主 module + 受控 interface + 可替换 adapter**”的形状：MCP 是 Electron 主进程中的本机协议宿主，插件是受注册表管理的独立运行时，原生音频则把实时数据面藏在 NAPI/Rust 后面。三个入口都经由应用的控制面，而不是让外部调用者直接碰 UI 或音频细节。

其中最应复用到 Scopify 的顺序是：先收敛现有 Browser Audio Pipeline 的生命周期，并把播放控制提炼为可供 Renderer 与 main-process capability 调用的深 module；再增加 MCP；插件只先开放少数、声明式 capability；原生 Audio Engine 最后才进入 spike。Scopify 已经拥有相当好的播放 Authority、Replica 和 Electron Broker 基础，不应为了模仿 SPlayer 把真实音频或队列所有权匆忙迁走。[`PlaybackAuthorityProvider`](../../repo/frontend/apps/web/components/player/PlaybackAuthorityProvider.tsx#L50) 已是主 Renderer 的 Authority，[`PlaybackBroker`](../../repo/frontend/apps/desktop/main/capabilities/playbackBroker/index.ts#L64) 已负责可靠消息、Bootstrap 和命令回执路由。

SPlayer 的 MCP 是“让外部 Agent 接入播放器”的 Server，并非内嵌 LLM Agent：它提供 Streamable HTTP MCP、发现/写入外部 Agent 的配置和音乐工具；其 AI model 设置页也明确仍未实现模型调用。[`server.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/server.ts#L25)；[`injector.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/injector.ts#L20)；[`aiIntegration.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/src/settings/categories/aiIntegration.ts#L12)。这是规划 Scopify 时最需要先校正的概念边界。

## 1. 调研标准与术语

本文使用以下词义。

- **module**：具有 interface 与 implementation 的代码单元；不以目录、进程或语言划分。
- **interface**：调用者必须知道的完整规则，包含参数、顺序、失败、权限与性能语义，绝不只是 TypeScript `interface`。
- **seam**：可以替换行为而不改调用处的位置；**adapter** 是填入这个 seam 的具体实现。
- **depth**：调用者以少量 interface 换取大量行为的 leverage；**locality**：把变更、故障和验证集中在一个 module，而不是散到每个 UI/插件/窗口。

因此，本文不把“增加一层转发”算作架构提升。若删除新 module 后复杂度没有回到多个调用方，它就是浅的；若调用者仍需知道 IPC、session、鉴权、音频设备或脚本生命周期，它也没有形成足够的 depth。

## 2. SPlayer：三项能力的真实拆解

### 2.1 Agent / MCP：本机 MCP Server，而非应用内 Agent

#### 运行形状

```text
Settings UI ── AgentConfigAdapter（探测、展示、经用户操作写外部配置）

Codex / Claude Code / Cursor 等外部 Agent
  └─ 127.0.0.1:<port>/mcp + X-MCP-Key
       └─ McpRuntime（Hono listener、开关、状态、关闭）
            └─ McpEndpointTransport（initialize/session/LRU）
                 └─ Music MCP tool facade
                      ├─ playback / queue control
                      ├─ now-playing query
                      ├─ local library query
                      └─ online search adapter
```

`McpRuntime` 与 `McpEndpointTransport` 是本文用于说明职责的概念 module 名，分别对应 `http.ts` 的启动/停止函数和源码导出的 `McpEndpoint`。`McpRuntime` 只在 `mcp.enabled` 时把 Hono 监听在 `127.0.0.1`，所有 `/mcp` 请求先过 enabled、访问密钥与 Origin 检查，再交给端点 adapter；启动/错误/停止状态回推渲染端。[`http.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/http.ts#L59)；[`http.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/http.ts#L96)；[`http.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/http.ts#L110)。Renderer 只能通过 preload 暴露的状态、重启、探测和注入能力操作它，不能直接接触 Node/MCP 对象。[`mcp.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/ipc/mcp.ts#L7)；[`preload/index.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/preload/index.ts#L670)。

协议细节被压入 `McpEndpoint` seam：其 interface 只有 `handle(Request)` 与 `close()`；implementation 维护每会话的 `McpServer`、SDK transport 和最后访问时间，限定八个会话，超过时 LRU 驱逐，下一次请求时清扫 30 分钟空闲会话。[`endpoint.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/endpoint.ts#L6)；[`endpoint.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/endpoint.ts#L38)；[`endpoint.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/endpoint.ts#L46)；[`endpoint.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/endpoint.ts#L54)。这带来了很好的 depth：替换 Hono、stdio 或 transport 时不必改工具定义；也避免异常 Agent 让 session 无限累积。要准确地说，它是**请求触发的惰性清扫**，不是独立后台定时回收。

工具 facade 创建 `McpServer` 并注册 17 个工具：轻量播放状态/当前曲目、播放控制、seek/音量、队列操作、本地与在线搜索、随机曲目、专辑和艺术家；另有两个只读 resource。输入的范围、枚举和数量上限紧挨工具定义，读工具也显式标为 idempotent/read-only。[`server.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/server.ts#L25)；[`server.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/server.ts#L64)；[`server.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/server.ts#L165)；[`server.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/server.ts#L201)；[`server.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/server.ts#L289)。

一个尤其好的小 seam 是“搜索先交付曲目 ID，写操作优先接收 ID”。搜索结果会进入有界缓存，`play_track` 和 `add_to_queue` 优先以 ID 取回对象，才在必要时接受完整对象。它降低模型 token、避免 Agent 重传不可信的大对象，并把缓存/查询局部化在 MCP implementation 内。[`server.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/server.ts#L114)；[`server.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/server.ts#L165)；[`cache.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/cache.ts#L4)。

控制工具并不直接改 Renderer store。`playerControl` 把播放、暂停、停止、seek、音量收敛到原生 player，把下一首、上一首、队列与模式交回统一的 `player:event` 控制路径；这避免 MCP 形成绕开队列记账的第二个写模型。[`playerControl.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/playerControl.ts#L1)。

#### Agent 配置接入与其边界

`AgentDefinition` 中心表将 Agent id、配置路径、安装探测路径、格式和是否可自动注入收敛起来；实际支持 Codex TOML、Claude Code/Cursor/CodeBuddy JSON、不可自动写入的 Claude Desktop，以及 Antigravity 的格式差异。[`injector.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/injector.ts#L9)；[`injector.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/injector.ts#L20)。探测只读文件/安装目录并报告 `configured` 与 `injectable`；写入则把 URL 和 `X-MCP-Key` 适配到 TOML 或 JSON。这里的 adapter 分层让 UI 不必理解各个 Agent 的配置差异。[`injector.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/injector.ts#L115)；[`injector.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/injector.ts#L161)。

但能力边界到“写外部静态配置”为止：SPlayer 不持有 Agent 会话、不会调用模型，也没有 Agent 回调链。并且此 implementation 是字符串追加 TOML 与 `JSON.parse/stringify`，未见备份、JSONC/TOML AST 合并或恢复机制。[`injector.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/injector.ts#L175)；[`injector.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/injector.ts#L198)。Scopify 应当学习“central registry + adapter”，不应照抄这种写文件方式。

#### 安全与可靠性评价

默认关闭、loopback bind、随机 16-byte hex 密钥、恒定时间比较、Origin allowlist 是很好的本机安全基线。[`http.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/http.ts#L25)；[`http.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/http.ts#L40)；[`http.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/http.ts#L48)。然而所有 Agent 共用一把 key，key 既持久化在普通主进程设置也会明文写入 Agent 配置；工具 annotation 是给客户端的提示，不是 per-client 授权。它不适合作为多用户、LAN 或公网 interface。密钥存放方式可由主进程 store 的 JSON 落盘路径核验。[`http.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/http.ts#L27)；[`injector.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/injector.ts#L186)；[`store/index.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/store/index.ts#L64)。

源码中没有 MCP endpoint/http/injector 的自动化测试覆盖。这意味着成功路径虽有清晰 lifecycle，认证、Origin、session 上限、端口占用和外部配置损坏等失败语义没有受回归测试保护；迁移时应先补这些验证，而不是只复制 UI。

### 2.2 插件：Registry 所有权优先于脚本执行

#### 运行形状

```text
PluginContract（共享类型、manifest、消息协议）
  └─ PluginRegistry（安装、启停、状态、更新、恢复）
       ├─ PluginHost adapter（Electron utilityProcess + heartbeat）
       │    └─ 每 pluginId 一个 node:vm Context
       │         └─ splayer.request/storage/player/register/on
       └─ Host capability adapters（network / KV / playback / UI contribution）
            └─ 业务 module（音源、歌词、封面、菜单）
```

`shared/types/plugin.ts` 是跨 renderer、main 与插件 host 的主要 seam：它定义音源/控制类型、`network/control/ui` grant、高层播放事件、设置和菜单贡献、manifest、动作请求/响应映射，以及沙箱双向消息和 host call 白名单。[`plugin.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/shared/types/plugin.ts#L13)；[`plugin.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/shared/types/plugin.ts#L84)；[`plugin.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/shared/types/plugin.ts#L113)；[`plugin.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/shared/types/plugin.ts#L303)；[`plugin.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/shared/types/plugin.ts#L386)。这是当前设计最有 leverage 的部分：插件作者只学习受控的 `splayer` capability interface，应用维护者则在一个位置审查跨进程契约；并不意味着整份 `PluginContract` 很小。

脚本 loader 把 JSDoc manifest、稳定 ID、压缩格式、grant 推导和 API-level 兼容性集中处理：source 插件自动取得 network；control 插件只获声明且在白名单内的 grant，并拒绝不兼容版本。[`loader.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/loader.ts#L41)；[`loader.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/loader.ts#L149)；[`loader.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/loader.ts#L163)；[`loader.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/loader.ts#L195)。这比让每个业务调用处临时判断脚本类别更深、更有 locality。

`PluginRegistry` 是生命周期 owner。它恢复 manifest/source、保存 enabled 状态、安装/更新/卸载、维护 `unloaded/loading/ready/error/disabled` 状态并向 UI 发出状态；卸载还会移除脚本、manifest、KV 和 enabled 标志。[`registry.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/registry.ts#L142)；[`plugin.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/shared/types/plugin.ts#L157)；[`registry.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/registry.ts#L395)。稳定 ID 让更新保留启用态、设置和插件 KV；但脚本文件自身仍是普通同步写，和 manifest/KV 的原子写并不一致。[`registry.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/registry.ts#L344)；[`storage.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/storage.ts#L40)。

脚本不跑在 Electron main 里。`PluginHost` 懒启动一个 `utilityProcess`，用 generation 丢弃旧进程迟到消息、按插件维度加载/卸载，并以心跳侦测 host 级故障。[`host-process.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host-process.ts#L52)；[`host-process.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host-process.ts#L82)；[`host-process.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host-process.ts#L335)。worker 为每个插件建立独立 `node:vm` context，只注入显式的 `splayer`、受追踪 timer、有限标准对象与兼容 shim；卸载会 abort 在途记录、拒绝 waiters、清理 timer/handler 后移除 context。[`host.worker.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.worker.ts#L95)；[`host.worker.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.worker.ts#L361)；[`host.worker.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.worker.ts#L393)。

这里实现的核心价值是**故障隔离与可恢复性**，不是恶意插件安全隔离。单插件脚本路由异常会 dispose 自己；但所有启用插件共用一个 utilityProcess/event loop，host 崩溃时 Registry 把它们全部降为 loading 后按 2s/8s/30s 回退重载，超过限制才全部报错。[`host.worker.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.worker.ts#L637)；[`registry.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/registry.ts#L562)。项目自己的插件文档也明确将 `node:vm` 定位为稳定性隔离而非对抗恶意代码的安全边界。[`plugins/index.md`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/docs/plugins/index.md#L267)。

特权动作必须经 host capability adapter 回到主进程。worker 中的 `request/storage/player` 只发 `hostCall`；主进程 `dispatchHostCall` 再按 grant 门控网络和播放控制，调用真正的网络、KV 或 `playerControl` adapter。[`host.worker.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.worker.ts#L186)；[`host.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.ts#L21)。网络 adapter 限制 http(s)、超时与 Electron `net.fetch`；插件 KV 则按 pluginId 命名空间、缓存与原子写。[`net.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/net.ts#L64)；[`storage.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/storage.ts#L13)。这正是值得复制的 seam：插件永远不获得 Electron、文件系统或播放器单例。

UI extension interface 也被刻意保持受限：插件能声明受 schema 限制的设置和歌曲菜单，而不是渲染任意 DOM；Registry 会在没有 `ui` grant 时丢弃菜单贡献。[`plugin.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/shared/types/plugin.ts#L52)；[`registry.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/registry.ts#L520)。控制插件的播放桥只在确有 ready 控制插件时订阅，并为新就绪者补最新快照，再按订阅过滤事件，这避免无消费者时持续做高频工作。[`playbackBridge.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/playbackBridge.ts#L92)；[`playbackBridge.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/playbackBridge.ts#L132)；[`registry.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/registry.ts#L651)。

#### 不能照抄的细节

- Loader 记录的 `hash` 是内容指纹；市场模型和下载流程未验证来源签名或预期 hash，不能把它称为供应链信任。[`plugin.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/shared/types/plugin.ts#L133)；[`net.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/net.ts#L20)。
- Router 发送 cancel，但 worker 建的 `AbortController` 没有交给 handler；长网络/计算不一定真被抢占，只是结果可能被取消语义丢弃。[`router.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/router.ts#L49)；[`host.worker.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.worker.ts#L599)。
- 已有的 priority 设计没有进入真实音源/元数据编排，实际顺序跟随 renderer 的插件列表；不要把未接线的 priority 移植为产品承诺。[`registry.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/registry.ts#L210)；[`audioSource.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/src/services/audioSource.ts#L87)。
- `splayer.apiLevel` 被 Registry 按插件 manifest 的 `apiLevel` 发送，并由 worker 原样注入；它不是 host 的 `HOST_API_LEVEL = 3`。插件兼容性检查与运行时报告的语义因而不一致，Scopify 不应照抄这个字段设计。[`registry.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/registry.ts#L451)；[`host.worker.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.worker.ts#L187)；[`plugin-api.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/shared/defaults/plugin-api.ts#L3)。同步脚本执行时限的说明亦应以源码的 10 秒为准，而非文档中的 5 秒。[`host.worker.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.worker.ts#L466)。
- `PluginContract` 同时装着 public plugin interface、host 内部协议和 renderer IPC，规模继续增长时会降低 depth。Scopify 应从第一版就分出公开 `PluginContract` 与内部 `PluginHostProtocol` 两个 module。

### 2.3 自制 Audio Engine：原生数据面，主进程控制面

#### 它实际“自制”了什么

SPlayer 的 `audio-engine` 是 Rust `cdylib`，经 NAPI-RS 暴露给 Electron main；它组合 `ffmpeg_audio` 解码、CPAL 输出、FFT、响度、均衡器、变速/变调、元数据/封面和跨平台设备相关 implementation。它不是从零实现 codec，而是把音频播放链路、并发和产品行为收敛在自己的 module 内。[`lib.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/lib.rs#L1)；[`Cargo.toml`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/Cargo.toml#L10)；[`Cargo.toml`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/Cargo.toml#L20)；[`Cargo.toml`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/Cargo.toml#L35)。项目 `AGENTS.md` 提到 rodio，但当前 Cargo 与实际输出 implementation 指向 CPAL；以下分析以源码为准，不能沿用该过时说明。[`audio_output.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/audio_output.rs#L79)。

对 TypeScript 调用方，自动生成的 `AudioPlayer` 是一个受控的 NAPI interface：load/play/pause/seek/volume/status，事件回调、FFT、设备枚举/切换、响度、十段 EQ、速度/音调和封面。调用方无需理解解码线程、采样率协商或 output sink。[`index.d.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/index.d.ts#L4)；[`index.d.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/index.d.ts#L28)；[`index.d.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/index.d.ts#L70)；[`index.d.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/index.d.ts#L97)。它仍是高 leverage 的深 module，但约 40 个方法使 surface 偏宽；若未来继续演进，`PlaybackControl`、`OutputDevice` 与 `AudioAnalysis` 应成为其内部或后继的独立 seam，而不是再给同一 class 追加方法。

原生状态机只有 `Idle/Playing/Paused/Stopped`；`loading` 是 TypeScript/main 控制面在 load 前主动投影出的 UI 状态，不应错误理解为 Rust 播放状态机的一部分。[`events.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/player/events.rs#L41)；[`player.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/ipc/player.ts#L223)。队列、音源 URL 解析、在线 URL 一次失败重取和下一曲导航也依旧由 TypeScript 编排，原生 engine 不拥有这些产品策略。[`core/player/index.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/src/core/player/index.ts#L280)；[`audioSource.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/src/services/audioSource.ts#L245)。

```text
Renderer action
  └─ player IPC / main control plane
       └─ engine.ts lazy-load singleton AudioPlayer
            └─ NAPI-RS adapter
                 └─ Rust InnerPlayer
                      ├─ FFmpeg decode → shared PCM buffer
                      ├─ EQ / loudness / tempo / FFT
                      └─ CPAL output device / sink
                           └─ ThreadsafeFunction event → main IPC → Renderer / media integration
```

主进程的 `getEngine/getPlayer` 懒加载原生 `.node`、初始化原生日志、创建单例并设置封面 cache；这把二进制装载路径和播放器生命周期放在一个 owner 内。[`engine.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/engine.ts#L14)；[`engine.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/engine.ts#L34)；[`nativeLoader.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/utils/nativeLoader.ts#L13)。主进程 IPC 注册原生事件并负责系统媒体控件、托盘、任务栏、scrobble、Renderer 和 WebSocket 的投影，因而音频 engine 不知道 Electron UI。[`player.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/ipc/player.ts#L104)；[`player.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/ipc/player.ts#L164)。

实时数据面比上图更具体：文件或支持取消的 HTTP range `AudioReader` 经过两路重采样（设备 PCM 与固定 48kHz stereo FFT），进入有界 decode queue（192 block、Condvar 背压）；DSP thread 依次做 EQ、time/pitch、limiter，写入 4 block output queue；CPAL realtime callback 非阻塞取样，短暂欠载时写 20ms 静音。消费样本数用于 position，FFT timer 与 ThreadsafeFunction 把事件回到 TypeScript；FFT 取自 DSP 前的固定采样率分支，**并非最终可听输出**。[`decoder.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/decoder.rs#L26)；[`decoder.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/decoder.rs#L397)；[`shared.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/shared.rs#L57)；[`source.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/source.rs#L5)；[`source.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/source.rs#L56)；[`audio_output.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/audio_output.rs#L372)。

`AudioPlayer` 对 JS 推送状态、位置、结束、频谱和 output 异常；原生接口说明 load/seek 均采用“短锁定拿取状态 → blocking worker IO/解码 → 短锁定提交”的三阶段路径，避免把 IO 放进同步 NAPI 临界区。[`bindings/player.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/bindings/player.rs#L460)；[`index.d.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/index.d.ts#L31)；[`index.d.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/index.d.ts#L47)。`load_token` 用于在 load/seek/stop 相互竞争时丢弃已过期任务，`HttpCancelHandle` 用于终止仍在读取的远程音源。[`transition.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/player/transition.rs#L77)；[`transition.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/player/transition.rs#L214)；[`bindings/player.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/bindings/player.rs#L4)。

当前源码没有 gapless/crossfade；只有暂停/恢复的短淡入淡出。曲目结束由原生后台 tick 事件交给 TypeScript 的下一曲导航，再执行新的 load；next 的预加载只准备 URL、歌词和封面，并不预解码下首或建立第二输出流。因此不能把“迁到 Rust”误写成已获得 gapless/crossfade 的体验承诺。[`background.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/player/background.rs#L120)；[`events.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/src/core/player/events.ts#L30)；[`index.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/src/core/player/index.ts#L743)；[`nextTrackPreloader.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/src/services/nextTrackPreloader.ts#L182)。

其物理输出恢复同样没有泄露到 UI：设备错误或 stall 由 main 串行触发 `reinitOutput`，输出 generation 使旧 CPAL callback 的异常失效；引擎尝试从原位置重新建输出/解码，失败时保持曲目与位置、进入 paused 而不是伪装为正常结束。主进程对高频 position/FFT 也在主窗口隐藏时停止 Renderer 推送。[`bindings/player.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/bindings/player.rs#L176)；[`player/mod.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/player/mod.rs#L112)；[`device.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/device.ts#L45)；[`player.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/ipc/player.ts#L171)。

这就是 Audio Engine 的 depth：一个受控、但偏宽的 NAPI interface 遮住了音源、解码、PCM、DSP、输出设备、异步争用与恢复策略，进而给 Electron/Renderer 带来一致的 status/event interface 和较好的 locality。

## 3. 与 Scopify 当前实现的对照

### 3.1 已有的坚实基础

Scopify 当前 web/desktop 的物理媒体仍是唯一的 `HTMLAudioElement`。`usePlaybackMediaSource` 负责替换 source、load revision 与保留位置；它明确确保 URL/版本仍属于当前会话，过期回调不能播放新曲。[`usePlaybackMediaSource.ts`](../../repo/frontend/apps/web/hooks/player/usePlaybackMediaSource.ts#L18)；[`usePlaybackMediaSource.ts`](../../repo/frontend/apps/web/hooks/player/usePlaybackMediaSource.ts#L96)；[`playbackSource.ts`](../../repo/frontend/apps/web/lib/player/playbackSource.ts#L12)。

这并不意味着 Scopify 的架构浅。`PlaybackAuthorityProvider` 已把会话身份、命令执行、媒体事件接纳和 UI 投影聚在主 Renderer Authority 中，并经 in-process transport 与 Electron transport 同时扇出；本地 Replica 只暴露 `getSnapshot/subscribe/dispatch`。[`PlaybackAuthorityProvider.tsx`](../../repo/frontend/apps/web/components/player/PlaybackAuthorityProvider.tsx#L169)；[`PlaybackAuthorityProvider.tsx`](../../repo/frontend/apps/web/components/player/PlaybackAuthorityProvider.tsx#L213)。桌面主进程的 Broker 会验证 message、缓存/合成 Bootstrap、拒绝乱序消息并把 command receipt 路由回 replica。[`index.ts`](../../repo/frontend/apps/desktop/main/capabilities/playbackBroker/index.ts#L180)；[`index.ts`](../../repo/frontend/apps/desktop/main/capabilities/playbackBroker/index.ts#L251)。

音频效果和可视化目前是浏览器的 Web Audio graph：`MediaElementAudioSourceNode` 连接 ReplayGain、post effect、EQ、`AnalyserNode` 再到 destination；同一个 analyser source 被登记给本地 Folia 和桌面 feature publisher。[`useAudioVisualizer.ts`](../../repo/frontend/apps/web/hooks/player/useAudioVisualizer.ts#L47)；[`useAudioVisualizer.ts`](../../repo/frontend/apps/web/hooks/player/useAudioVisualizer.ts#L70)；[`useAudioVisualizer.ts`](../../repo/frontend/apps/web/hooks/player/useAudioVisualizer.ts#L106)。feature publisher 固定约 30fps，附加 authority/session/stream/sequence 的版本化 envelope，并在写失败时重置 stream；这已经很接近 SPlayer “高频数据面与可靠状态面分离”的思路。[`source.ts`](../../repo/frontend/apps/web/lib/audioFeature/source.ts#L9)；[`source.ts`](../../repo/frontend/apps/web/lib/audioFeature/source.ts#L67)；[`sampler.ts`](../../repo/frontend/apps/web/lib/audioFeature/sampler.ts#L15)。

### 3.2 差距不是“少三个功能”

在 `repo/frontend/apps/web`、`repo/frontend/apps/desktop` 与 `desktop-contract` 的当前源码范围内，未发现产品 MCP Server、Agent 配置 adapter、插件 manifest/registry/host，或原生音频播放 module；`mcp/plugin/agent` 命中的是 ESLint 依赖、BrowserWindow `sandbox` 设置与歌词领域词，而非这些能力。这是一次基于源码树的否定性证据，不能代替对未来分支或外部工具的审计。

| 主题 | SPlayer 的深 module | Scopify 已有资产 | 需要补的 seam，而非重复 owner |
| --- | --- | --- | --- |
| MCP | `McpRuntime` + endpoint adapter + tool facade | `PlaybackBroker`、版本化 playback contract、Authority | `PlaybackCommandGateway` 与 `NowPlayingQuery`，供 MCP 拿到受控命令/投影 |
| Agent 接入 | `AgentDefinition` + config adapters | desktop runtime/preload 结构 | 可预览、可确认、可备份的 `AgentConfigAdapter`，而不是 UI 直接写文件 |
| 插件 | Registry + host + capability adapters | runtime IPC、播放投影、音源/歌词 domain | versioned `PluginContract`、主进程 Registry、明确权限与受控 adapter |
| 音频引擎 | Native `AudioPlayer` data plane | HTML media + Web Audio graph + feature protocol | 先抽 `BrowserAudioPipeline`；保留 `PlaybackMediaPort` 作为未来 native adapter 的物理播放 seam |

## 4. 建议的目标架构

### 4.1 先深化现有播放控制面

在 MCP V1 中，从当前 Broker 提炼一个同时服务 Renderer 控制面与 main-process capability 的 `PlaybackCommandGateway` module。它不应让外部调用者直接注册 Broker port 或知道窗口 ID；它只提供命令与轻量投影。

```ts
interface PlaybackCommandGateway {
  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt>;
  getNowPlaying(): PlaybackProjection;
}
```

生产 adapter 复用现有 Renderer/port 路径与 Broker；测试 adapter 使用 in-memory Authority。MCP 以及未来获授权的插件是这个 interface 的调用者，不是 adapter。现有 Broker 的 public interface 仅有 `registerAuthority/registerReplica`，并且 IPC host 只授权已知 BrowserWindow 的 sender，因此外部 MCP 不能也不该假扮一个 Renderer。[`PlaybackBroker`](../../repo/frontend/apps/desktop/main/capabilities/playbackBroker/index.ts#L64)；[`initializePlaybackBrokerIpc`](../../repo/frontend/apps/desktop/main/capabilities/playbackBroker/ipc.ts#L25)。把当前重复的命令校验/转发/回执逻辑移入这个 gateway implementation，才会形成真正的 seam 与 depth。

Gateway 的 interface 必须保留既有不变量：Authority 不可用返回 `unavailable`，命令 ID 可去重，最终真相来自 Authority 的状态发布而非 MCP/插件乐观修改，且写操作不可直接越过 queue/session 语义。Broker 已有的 command timeout、duplicate 检测、Bootstrap 和 ordering 是这条新 interface 的实现资源，不是可以绕开的细节。[`index.ts`](../../repo/frontend/apps/desktop/main/capabilities/playbackBroker/index.ts#L266)；[`index.ts`](../../repo/frontend/apps/desktop/main/capabilities/playbackBroker/index.ts#L298)。

### 4.2 MCP：把 transport、domain facade、Agent 配置分开

```text
External Agent
  └─ McpHttpAdapter (localhost, client token, rate/audit)
       └─ McpSessionEndpoint (SDK protocol and bounded sessions)
            └─ MusicMcpToolFacade
                 ├─ PlaybackCommandGateway
                 ├─ NowPlayingQuery
                 └─ CatalogQuery

Settings UI ── AgentConfigAdapter ── CodexTomlAdapter / JsonAdapter
```

`AgentGateway` 自身也应是 main-only 的深 module：它拥有 HTTP listener、session、credential、tool catalog、audit 与 shutdown，而设置 UI 只经预加载访问状态/配置。建议把公开 interface 保持为下列四项；credential rotation 只能由显式用户操作触发，且 token 只在创建时显示一次。

```ts
interface AgentGateway {
  configure(policy: AgentGatewayPolicy): Promise<AgentGatewayStatus>;
  getStatus(): AgentGatewayStatus;
  rotateCredential(): Promise<OneTimeCredential>;
  dispose(): Promise<void>;
}
```

建议 `MusicMcpToolFacade` 只接收显式依赖，像 `PlaybackCommandGateway`、`NowPlayingQuery` 与 `CatalogQuery`，不得 import Zustand、BrowserWindow 或 Renderer runtime。这样 fake adapter 可以在 Node 测试中覆盖所有工具，也能在未来把 HTTP 换为 stdio 而不改音乐行为。SPlayer 的 `http.ts ↔ endpoint.ts ↔ server.ts` 三段已经证明这种分割的可维护性。[`http.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/http.ts#L59)；[`endpoint.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/endpoint.ts#L28)；[`server.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/server.ts#L25)。

Scopify 的安全目标应高于 SPlayer 的共享 key：默认关闭、仅 loopback、每 client 可撤销 token、read/cue-control/queue-write capability tier、写工具的用户确认策略与 audit event。MCP tool annotation 可以保留，但不能当授权。Agent 配置必须采用真实 TOML/JSONC parser、原子写+备份、dry-run diff 与显式用户确认；自动注入应仅是 UI 明确动作。

### 4.3 插件：先能力扩展，后市场

第一版 `PluginContract` 应拆成 public 与内部两个 module：

```text
PluginContract (manifest, capability, grant, input/result/event)
        ↑ public seam
PluginHostProtocol (host lifecycle, call ID, cancellation, serialization)
        ↑ private seam
PluginRegistry (install/update/enable/list/status)
        ├─ PluginHost adapter
        └─ Capability adapters: source / lyric-metadata / playback / KV / menu-settings
```

初期仅开放两个低耦合 extension point：`source.resolve`/歌词元数据 provider，以及声明式菜单/设置贡献。所有 UI 均应是 host 渲染的 schema；不要给脚本任意 DOM、路由、React context、Node、Electron、文件系统或 cookie。developer preview 以一插件一 utility process 得到明确的崩溃半径；内部预留 `PluginHost` seam，但等到确实存在第二种运行实现时才抽成公共 interface，不能为了假想可替换性先做大而浅的抽象。

权限要在主进程 adapter 执行，而不是只写入 manifest。网络、受控播放、每插件 KV 与菜单贡献分别最小授权；外部脚本调用只可通过 capability method。SPlayer 的 `hostCall → dispatchHostCall` 是正确参考，Scopify 还应加强为安装期 grant 确认、来源签名/可信发布者、内容 hash 校验、配额与审计。[`host.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.ts#L21)；[`storage.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/storage.ts#L46)。若开放给未知第三方，单一共享 host 只作为性能折中，不得宣传为安全 sandbox；高风险插件应按进程隔离或不支持。

兼容遗留生态应放在 `LegacyPluginAdapter`。SPlayer 的 LX shim 在 worker 建 context 前把旧格式转换为标准 capability，是把兼容性留在一个 adapter、保持业务 module 干净的好例子。[`lx-shim.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/lx-shim.ts#L1)；[`host.worker.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host.worker.ts#L438)。

### 4.4 Audio Engine：先深化 Browser Audio Pipeline，再决定是否替换物理引擎

先不要把 `HTMLAudioElement` 替成 Rust。Scopify 的第一步应把现在分散于 `useAudioVisualizer` 的 Web Audio graph 收敛成 Renderer 内 `BrowserAudioPipeline` module；主 Renderer 的 `PlaybackAuthority` 继续是唯一 source/play/pause/seek 决策者。它只暴露效果更新、特征读取和一次性销毁，不泄露 `AudioContext`、`AnalyserNode` 或 `BiquadFilterNode`。

```ts
interface BrowserAudioPipeline {
  update(settings: AudioEffectSettings): void;
  readFeatures(): AudioFeatureBands | null;
  dispose(): void;
}
```

该 implementation 在构造时绑定唯一 audio element 与可注入的 AudioContext factory，内部拥有 `MediaElementGraphAdapter`、ReplayGain/EQ/effects graph、`FeatureExtractor` 和 `OutputDeviceAdapter` 的 connect/disconnect/context lifecycle。现有 `useAudioVisualizer` 改为薄 React adapter；Folia 与桌面 publisher 从同一个 pipeline `readFeatures()` 取值。这样既保持“一个 Renderer 一个 feature source”的当前 invariant，也会补齐目前 hook cleanup 没有销毁 graph/context 的生命周期漏洞。[`useAudioVisualizer.ts`](../../repo/frontend/apps/web/hooks/player/useAudioVisualizer.ts#L47)；[`useAudioVisualizer.ts`](../../repo/frontend/apps/web/hooks/player/useAudioVisualizer.ts#L161)；[`source.ts`](../../repo/frontend/apps/web/lib/audioFeature/source.ts#L17)。频带换算也应由实际 `sampleRate / fftSize` 导出，不能继续把 `21.5Hz/bin` 写死。[`source.ts`](../../repo/frontend/apps/web/lib/audioFeature/source.ts#L126)。

在这个 module 经过测试后，才以 `PlaybackMediaPort` 作为物理引擎 seam：默认实现仍是 HTML media；未来桌面 `NativePlaybackMediaPort` 通过版本化 IPC 接入原生 engine。主 Renderer 先保持语义 Authority，以复用 Bootstrap、session、Replica 和命令回执；只有明确要把 headless 所有权迁到 main 才重新评估 Authority 的位置。

```text
Playback Authority (main Renderer)
  ├─ PlaybackMediaPort → HtmlMediaAdapter (default)
  └─ BrowserAudioPipeline → effects / analyser / AudioFeatureFrameV1

Future desktop spike:
  PlaybackMediaPort → NativePlaybackMediaPort → versioned IPC → native engine
```

Rust gate 必须同时满足四项：存在正式硬需求（Chromium 无法满足的格式、独占设备、可验证 gapless/crossfade、精确变速等）；telemetry 证明 HTML path 无法修好；`NativePlaybackMediaPort` spike 无双出声、可回退且通过设备恢复/E2E；团队接受 FFmpeg 与多平台原生维护。SPlayer 的 token 抢占、输出恢复、可靠状态和可丢帧频谱分离值得借鉴，但它当前没有 gapless/crossfade，不能把 Rust 当作这些体验的自动答案。[`transition.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/player/transition.rs#L263)；[`source.ts`](../../repo/frontend/apps/web/lib/audioFeature/source.ts#L13)。

## 5. 推荐落地顺序

| 阶段 | 交付物 | 不变量与退出条件 |
| --- | --- | --- |
| 1. Browser Audio Pipeline | `BrowserAudioPipeline`、生命周期/拓扑测试、实际 FFT 频带计算；HTMLAudio 默认实现不变 | 一个 media graph、一个 feature source、Authority 不变；dispose 幂等且 AudioContext/graph 都可回收 |
| 2. MCP V1 | `PlaybackCommandGateway`、main-only `AgentGateway`、loopback endpoint、session/credential/audit module；默认只读，控制必须显式授权 | Gateway 通过现有 command receipt 到 Authority；MCP 不直改 Zustand/DOM/队列，离线只返回 unavailable |
| 3. Extension developer preview | versioned public contract、main Registry、每插件 host、`source.resolve` + schema settings/menu | 无任意 UI/Node/Electron/文件系统；grant matrix、超时、宿主崩溃、卸载 cleanup 和快照补发均有测试；不发布开放市场 |
| 4. 硬化与 native spike | rotation/audit/signing/watchdog、原子 artifact；feature-flag `NativePlaybackMediaPort` spike | 来源/权限升级/回滚可验证；native 只能通过 Rust gate，不能承诺生产迁移 |

## 6. 风险、取舍与验证

### 6.1 主要风险

| 风险 | 影响 | 缓解与验证 |
| --- | --- | --- |
| MCP token/配置泄露 | 任意本机进程可能控制队列或读取播放信息 | per-client token、rotate/revoke、最小 capability、audit；测试无 key、错 key、旧 key、非 loopback Origin |
| Agent 配置破坏 | 覆盖用户 Codex/Claude/Cursor 配置 | 解析 AST/JSONC、dry-run diff、原子备份、用户确认、恢复测试；绝不采用字符串盲追加 |
| 插件供应链与 DoS | 恶意脚本、无限循环、隐私外传、共享 host 连坐 | 可信来源/签名、grant confirm、资源配额、watchdog、必要时一插件一进程；把“稳定性隔离”和“恶意代码安全”分开验收 |
| 插件取消不彻底 | 超时后网络或计算仍持续 | public handler 接收 `AbortSignal`，HostProtocol 保证超时/卸载传播，验证 abort 真停止而非只忽略结果 |
| 原生音频的发布/许可/平台成本 | 打包增大、崩溃面扩大、FFmpeg/DSP 许可与跨平台设备问题 | 在 spike 前完成依赖许可证与分发审计；Windows/macOS/Linux 分开验收，不以单平台成功外推 |
| 双 Authority 或双频谱 | 时间回退、队列错写、重复 FFT/CPU | `NativePlaybackMediaPort` 仅替换物理播放 adapter；保留一个语义 Authority 和一个 analyser/feature source 注册表 |
| Web Audio graph 生命周期/输出设备 | Provider 重建后的悬挂节点、资源泄露或设备语义不一致 | `BrowserAudioPipeline.dispose()` 断开/清理所有 node 并关闭或 suspend context；用 fake context、OfflineAudioContext 和 desktop E2E 覆盖 graph 与 `setSinkId` 组合 |

### 6.2 测试矩阵

MCP 的 unit test 应覆盖 schema 上限、read/write capability、token/Origin、initialize-only、session LRU/DELETE、authority unavailable、receipt timeout 和 command id 去重；integration test 应覆盖启动/停止/端口占用及 Agent 配置 dry-run/回滚。SPlayer 的 session 与工具分层适合用 fake HTTP/clock/player adapter 测，而不需要真实 Electron。[`endpoint.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/endpoint.ts#L54)；[`server.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/services/mcp/server.ts#L86)。

插件应以 fake filesystem/clock/host 写 manifest 兼容、grant matrix、install/update 保持状态、context unload、真实 Abort、heartbeat/backoff、消息序列化和 UI contribution filtering；浏览器 E2E 再测设置/菜单。SPlayer 现有 host/registry 本身有多个这种可测 seam，但未见相应测试覆盖。[`host-process.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/host-process.ts#L123)；[`registry.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/plugins/registry.ts#L441)。

Audio spike 必须用固定 PCM fixture 验证 position、seek、EQ/ReplayGain、FFT envelope 和结束/错误分类；再做网络音源取消、设备热插拔/睡眠恢复、长时播放内存与主窗口隐藏。指标至少包括首次出声时间、seek P50/P95、输出异常恢复率、underrun/stall、CPU/RSS、音频帧丢弃率与 crash-free rate。SPlayer 已有部分 Rust DSP/FFT/source 单测，但 NAPI binding、transition/background、HTTP cancel/race、IPC 与实际设备恢复仍未见对应集成覆盖；这些正是 native spike 不能跳过的验证层。[`decoder.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/decoder.rs#L552)；[`bindings/player.rs`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/src/bindings/player.rs#L114)；[`player.ts`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/electron/main/ipc/player.ts#L187)。

## 7. 未确认点与下一步取证

- 尚未运行 SPlayer，因此未验证实际 Agent 客户端的 Streamable HTTP 互操作、配置写入后是否能被每个版本的 Agent 接受，或 MCP endpoint 的资源/内存曲线。
- `audio-engine` 对 `ffmpeg_audio` 的依赖和原生接口已由源码确认；“静态链接 FFmpeg、零环境依赖”属于项目说明，尚未逐项审计 build script、第三方 binary 许可证和各平台打包物，不能据此作发行结论。[`Cargo.toml`](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/native/audio-engine/Cargo.toml#L10)。
- SPlayer 插件的 `vm` implementation 与权限门控已确认；未对其做逃逸攻击测试，因而本文只认定它为故障隔离，不认定它可执行不可信第三方代码。
- Scopify 的否定性结论限定在当前 web/desktop/contract 源码范围；移动端有独立 `PlaybackAudioGateway` interface，不能把本文的桌面方案直接当作移动端实现。[`playback_audio_gateway.dart`](../../repo/frontend/apps/mobile/lib/services/playback/playback_audio_gateway.dart#L76)。

## 8. 许可与 clean-room 边界

SPlayer-Next 与 Scopify 当前均采用 AGPL-3.0。[SPlayer-Next LICENSE](https://github.com/SPlayer-Dev/SPlayer-Next/blob/ac0bcfa1f70c54cadc046aba6472c8d13294c719/LICENSE#L1)；[Scopify LICENSE](../../LICENSE)。本文建议吸收的是可独立、clean-room 实现的架构思想与问题边界，而不是复制实现。

若直接复用 SPlayer-Next 的代码、测试、文档或其他受版权保护素材，必须保留原作者版权、AGPL-3.0 许可与来源声明；项目维护者还应确认当前授权、依赖边界、分发方式及全部合规义务。两仓同为 AGPL-3.0 并不等于可以无追溯复制，或把复用实现表述为自研。
