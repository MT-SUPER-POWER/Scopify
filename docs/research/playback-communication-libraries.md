# 播放通讯第三方库选型调研

> 调研日期：2026-08-10
>
> 项目基线：Scopify、Electron `42.7.1`、React `19.2.3`、Zustand `5.0.14`、Zod `3.25.76`
>
> 对应设计：[播放通讯与跨窗口时间同步架构](../architecture/playback-communication-architecture.md)
>
> 文档性质：实施前技术选型；不修改播放实现。

## 结论摘要

1. **有第三方方案，但没有一个库能直接解决 Scopify 当前的跨窗口播放一致性问题。** `electron-trpc`、Comlink 与 `broadcast-channel` 主要解决消息如何送达或如何获得类型提示；它们不定义歌曲 Session、Authority 生命周期、消息顺序、源采样时间、Timeline Discontinuity、原子 Bootstrap 和“普通校准不得倒退”等播放语义。
2. **最合适的传输底座反而是 Electron 自带的 `MessageChannelMain` / `MessagePortMain`。** Electron 官方支持在 Main 创建通道、向 Renderer 转移端口、建立 Renderer 到 Renderer 的直连流，并提供消息排队和 `close` 生命周期事件。[Electron MessagePorts 教程](https://www.electronjs.org/docs/latest/tutorial/message-ports) [MessagePortMain API](https://www.electronjs.org/docs/latest/api/message-port-main)
3. **第一阶段不需要新增运行时依赖。** 使用 Electron MessagePort 作为跨 Renderer Transport、已有 `@scopify/desktop-contract` 定义协议、已有 Zod 做边界校验、已有 `zustand/vanilla` 保存每个 Renderer 的 Playback Replica，React 通过 Zustand `useStore` 或 `useSyncExternalStore` 订阅。
4. **如果一定要选一个最接近的第三方库，`electron-trpc` 最接近，但只适合低频命令/查询，不适合作为可靠播放复制协议的核心。** 它提供 Main ↔ Renderer 的类型安全 query、mutation 和 subscription；其公开用法仍以 Main 中的 router/IPC handler 为中心，而且 npm 当前版本 `0.7.1` 已约两年未发布。[electron-trpc 官方文档](https://electron-trpc.dev/) [electron-trpc npm](https://www.npmjs.com/package/electron-trpc)
5. **XState、RxJS 可以以后按复杂度增量采用，但现在引入只会增加第二套抽象。** XState 能表达 Authority 播放阶段与串行事件；RxJS 能表达高频流的采样和 latest-wins。二者都不负责 Electron Transport，也都不会自动提供播放时钟协议。

## 问题为什么不是“找一个更快的 IPC 库”

已确认的 `34s → 32s` 回退路径是：真实 `HTMLAudioElement.currentTime` 已到 34 秒，但持久化的 `useTimeStore.currentTime` 仍停在 32 秒；一次强制发布把这个旧值当作当前时间发出；消费者又用“误差超过 500ms 就是 seek”的规则接受了回退。

这条故障即使换成零延迟传输仍会发生，因为错误来自消息含义，而不是带宽。完整方案必须回答：

- 谁是唯一 Playback Authority；
- 这条消息属于哪次 Authority 生命周期与歌曲 Session；
- 消息在源端何时采样、顺序是什么；
- 时间变化是普通 Clock Anchor，还是允许硬跳的 Timeline Discontinuity；
- 新窗口如何原子拿到当前完整状态；
- 延迟、重复、乱序、重连消息如何处理；
- 哪些数据可靠传输，哪些数据采用 latest-wins。

以下候选库都只覆盖其中一部分，因此协议仍然是产品代码，而不是可替换掉的“手写 IPC”。

## 候选方案对比

| 方案 | 它真正提供什么 | 对 Scopify 有价值的部分 | 仍然缺少什么 | 结论 |
| --- | --- | --- | --- | --- |
| Electron `MessageChannelMain` / `MessagePortMain` | Electron 原生双向消息端口；端口可转移；可让两个 Renderer 直连；消息可在 `start()` 前排队；有 `close` 事件 | 长连接、低开销的可靠状态流与命令流；窗口连接和断开生命周期；无需新依赖 | 协议版本、Authority/Session、sequence、Bootstrap、时钟投影、运行时校验 | **采用，作为 Electron Transport** |
| `electron-trpc` | Main ↔ Renderer 的类型安全 query、mutation、subscription | 命令/请求写法清晰；适合设置页或普通桌面 API | 播放时钟语义、事件 revision、原子恢复、Replica、latest-wins；现有 contract/bridge 还要整体迁移 | **不作为播放主干**；以后可单独评估普通 RPC |
| Comlink | 在 `postMessage` 风格 endpoint 上用 Proxy 包装异步 RPC | Worker 或独立 Playback Host 暴露方法时更方便 | 它是远程调用抽象，不是状态复制协议；访问天然异步；没有 Bootstrap、重放、顺序和时钟规则 | **不采用** |
| `broadcast-channel` | 跨 Tab、Worker、Node 进程的广播与 leader election | Web-only 多 Tab 场景兼容性较好 | 没有权威 Broker、原子 Bootstrap、连接生命周期和播放时钟语义；官方也说明它不是消息队列，Node/Deno 超过 50 msg/s 应使用专门 IPC | **淘汰现有播放用途** |
| XState | 状态机、Actor、串行 mailbox、snapshot 订阅 | Authority 的 loading/playing/buffering/error 复杂度显著增长时可形式化 | 不提供 Electron Transport、跨窗口快照恢复、媒体时钟投影 | **暂不引入**；达到触发条件再评估 |
| RxJS | Observable 与流组合操作 | 高频频谱出现多个生产者、复杂节流/背压策略时有用 | 不提供 Authority、协议、持久快照或跨进程传输 | **暂不引入**；频谱先用小型 latest-wins channel |
| Yjs / CRDT | 多写入者并发编辑与最终合并 | 对协作文档、离线多端编辑有价值 | 播放是单 Authority 时间线，不应合并多个窗口的并发真相 | **模型不匹配** |

## 推荐组合

```text
Playback Authority (main Renderer / HTMLAudioElement)
  │
  ├─ reliable protocol
  │    @scopify/desktop-contract + runtime validation
  │    sessionId + sequence + sampledAtMs + timelineRevision
  │
  ├─ in-process adapter
  │    same Renderer consumers
  │
  └─ Electron adapter
       MessageChannelMain / MessagePortMain
       │
       ├─ controller Renderer → Playback Replica
       ├─ desktop lyrics Renderer → Playback Replica
       └─ wallpaper Renderer → Playback Replica

Each Renderer
  Playback Replica (zustand/vanilla)
      └─ React hook / selector → PlayBar, Folia, controller, lyrics, wallpaper
```

### 1. Transport：Electron 原生 MessagePort

Electron 官方文档明确给出了 Main 创建 `MessageChannelMain`、分别把两个端口发送给两个 Renderer 的方式；连接建立后消息可直接在两个 Renderer 间流动，不需要每条都由 Main 中转。官方也给出了流式响应示例，并说明消息会在监听器注册或 `start()` 前排队。[Electron MessagePorts：Renderer 直连与流](https://www.electronjs.org/docs/latest/tutorial/message-ports)

在 Scopify 中，Main 仍应担任 **Connection Broker**：

- 注册/移除窗口连接；
- 把端口交给 Authority 与新 Replica；
- 缓存能够构造原子 Bootstrap 的最近可靠状态；
- 在窗口重载、销毁和 Authority 重启时关闭或重建连接；
- 不解释歌词、播放进度或 seek 语义。

这正好把 Electron 生命周期留在 Desktop host，把播放语义留在纯 TypeScript 模块。

### 2. Contract：现有 desktop-contract + Zod 边界校验

TypeScript 类型只在编译时存在，跨 Renderer 收到的数据仍应在 Adapter 边界进行运行时校验。Zod 官方定位就是带静态类型推导的 TypeScript-first schema validation；Scopify 的 Web 与 Desktop 包已经安装同一条 `3.25.76` 版本线，因此无需再引入另一套 schema 库。[Zod 官方文档](https://zod.dev/)

实施时有两个合规落位选择：

- 让 `@scopify/desktop-contract` 显式依赖 Zod并导出 schema 与推导类型；或
- Contract 保持纯 TS 数据定义，在 Web/Desktop Adapter 中使用共享的轻量 validator。

两者都不能只做 `as PlaybackMessage` 类型断言。最终落位在 Phase 1 以 bundle 与包边界测试决定，但不影响通讯架构。

### 3. Replica：现有 Zustand vanilla store

Zustand 的 `createStore` 可以建立不依赖 React 的 vanilla store，并公开 `setState`、`getState`、`getInitialState` 与 `subscribe`；这正适合把顺序检查、Clock Anchor 和 Projection 藏在一个纯 TS Replica 后面。[Zustand `createStore`](https://zustand.docs.pmnd.rs/reference/apis/create-store)

React UI 可以用 Zustand `useStore` 读取，也可以直接用 React 的 `useSyncExternalStore` 接入。React 官方定义的接口正是 `subscribe + getSnapshot`，用于订阅 React 外部、会随时间变化的 store。[React `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)

重要的是：Zustand 只是 Replica 的容器，不承担跨窗口同步；MessagePort 也不直接写 UI store。所有传入消息先经过同一个 Replica reducer 和时钟规则。

### 4. 高频频谱：独立 latest-wins 通道

频谱帧和播放状态的可靠性要求相反：旧状态不能丢，旧频谱则没有价值。第一阶段继续使用有界节流的现有 IPC 即可；测量证明 IPC/序列化成为瓶颈后，再把频谱 Adapter 换成 MessagePort，并在生产端只保留一个待发送/最新帧槽位。

RxJS 可以用采样、切换和流组合描述这一点，但当前只有单一生产者和单一策略，几十行显式 latest-wins 逻辑比引入完整 Observable 心智模型更容易测试。RxJS 当前稳定 npm 包为 `7.8.2`，其定位是组合异步与事件程序的 Observable 库，而不是 IPC 或复制协议。[RxJS npm](https://www.npmjs.com/package/rxjs)

## 为什么不选最像“一站式”的 electron-trpc

`electron-trpc` 的优势是真实的：官方列出 Main ↔ Renderer、类型推导、query、mutation 和 subscription，并通过 Main 中的 `createIPCHandler` 与 preload 暴露客户端。[electron-trpc README](https://github.com/jsonnull/electron-trpc)

但对本次重构，它会产生三个问题：

1. **它优化调用接口，不定义播放复制语义。** subscription 收到旧的 32 秒依然是旧的 32 秒；没有 revision 和单调投影，回跳照旧发生。
2. **它会与已有 `@scopify/desktop-contract` 和 runtime bridge 形成一次横向迁移。** 迁移成本覆盖全部桌面 API，但本次真正需要改变的是播放协议和消费者边界。
3. **维护风险没有换来核心能力。** npm 当前显示 `0.7.1`、约两年未发布；这不等于不可用，但不值得把关键播放链路绑定到它，尤其 Scopify 当前 Electron 已有原生 MessagePort 能力。[electron-trpc npm 元数据](https://www.npmjs.com/package/electron-trpc)

因此，如果未来要统一大量低频 Desktop API，可以另开 ADR 评估 electron-trpc；不能把那次潜在迁移塞进播放一致性重构。

## 为什么不选 Comlink、BroadcastChannel 或 CRDT

### Comlink

Comlink 官方把自己定义为建立在 `postMessage` 和 ES6 Proxy 上的 RPC，并说明远端属性访问和调用天然异步。它适合“调用另一个线程里的对象”，不适合表达“Authority 发布有版本、有回放起点的播放时间线”。[Comlink 官方 README](https://github.com/GoogleChromeLabs/comlink)

如果 Phase 6 把真实播放迁入独立 Playback Host，Comlink 可以作为 Host 内部方法调用的候选，但仍不能取代 Playback Contract 和 Replica。

### broadcast-channel

`broadcast-channel` 支持浏览器 Tab、Worker、Node 进程与 leader election；这些能力解决的是多环境发现和广播。Scopify 已经知道唯一 Authority 在哪里，不需要多个播放窗口竞选 leader。其官方 README 还明确说明该包不是消息队列，并建议 Node/Deno 超过每秒 50 条消息时使用专门 IPC。[broadcast-channel 官方 README](https://github.com/pubkey/broadcast-channel)

现有 BroadcastChannel 路径应在迁移完成后删除，而不是换成同名第三方实现继续保留双数据源。

### Yjs / CRDT

CRDT 的价值是多副本都能离线写入并合并。播放时间线恰好相反：只能有一个 Authority 决定真实媒体位置，其余窗口发命令、读 Projection。允许多个窗口合并 `currentTime` 或 `isPlaying` 会把当前问题制度化，因此不采用 CRDT。

## 可选库的触发条件

默认不安装新依赖；只有出现以下证据才重新评估：

| 候选 | 重新评估触发条件 |
| --- | --- |
| XState | Authority 的合法状态迁移、并发副作用与错误恢复已经无法用一个小型 reducer 清晰表达，且状态图测试能明显减少非法组合 |
| RxJS | 频谱或遥测出现多个源、多个消费者和多级背压策略，手写 latest-wins channel 已难以验证 |
| electron-trpc | 项目决定整体统一大量低频 Desktop RPC，并愿意单独迁移 contract/bridge，而不是只为播放链路引入 |
| Comlink | 独立 Playback Host 或 Worker 暴露大量异步方法，RPC proxy 能显著缩小 Host API |

## 最终技术选择

本次播放通讯重构采用：

- **跨 Renderer Transport：** Electron `MessageChannelMain` / `MessagePortMain`；
- **进程内 Transport：** 同一接口的 in-memory adapter；
- **协议：** `@scopify/desktop-contract` 中的版本化 discriminated union；
- **运行时边界：** 已有 Zod 或等价共享 validator；
- **Replica：** 已有 `zustand/vanilla`；
- **React 订阅：** Zustand `useStore`，底层语义与 `useSyncExternalStore` 对齐；
- **时钟：** 自有可注入 Clock Adapter + Clock Anchor/Timeline Revision 规则；
- **频谱：** 独立、有界、latest-wins 通道；
- **新增依赖：** **零**。

第三方库可以降低样板代码，但这次可靠性的关键来自协议语义与模块边界。先把正确性封装在 Playback Authority、Transport、Replica 三个深模块里，再在有测量证据时替换某个 Adapter，风险最低。
