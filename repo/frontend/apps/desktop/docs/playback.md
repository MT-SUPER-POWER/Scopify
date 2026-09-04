# 播放平台维护说明

Scopify 正在把“播放业务语义”和“实际音频输出”分开。目标是让 Web 与 Desktop 使用同一套
Queue、Resolver、Session 和 Gateway 契约；HTML Audio 与 Windows Native Audio 只作为可替换
的执行 Adapter。当前兼容边界见下文。

目标结构：

```text
      UI / Media Session / Tray / MCP
                    │
             PlaybackGateway
                    │
             PlaybackSession
      ┌─────────────┼────────────┐
 PlaybackQueue   Resolver    AudioEngineAdapter
                                 ├─ HtmlAudioEngineAdapter
                                 └─ NativeAudioAdapter → Main Host → Rust
```

## 各层职责

- `packages/playback-core`：纯 TypeScript 领域包。Queue 计算不可变 Transition；Resolver 把稳定
  Locator 解析为短期音源；Session 处理 revision、Abort、ended 去重和失败恢复。
- `apps/web/lib/player/adapters`：Web 端实际 Adapter。网易云 Adapter 管理播放 URL 与 ReplayGain
  缓存，HTML Adapter 是唯一可以直接操作 `HTMLAudioElement` 的普通播放路径。
- `apps/desktop/electron/main/capabilities/playbackBroker`：跨窗口 Authority/Replica 协议。
- `apps/desktop/electron/main/capabilities/playbackGateway`：Main/MCP 使用的可信入口，等待真实回执。
- `apps/desktop/electron/main/capabilities/nativeAudio`：可选 NAPI Host；缺少模块或不可用时必须安全
  返回 `unavailable`，不能影响应用启动。

## 当前兼容边界

第一轮已经接入 HTML Adapter 与 Resolver，但为了不同时迁移持久化队列，Zustand 暂时仍是 Web
运行时唯一的 Queue/Session owner。不要再创建一套影子 Session。后续迁移顺序是：把稳定
`queueItemId` 写入持久化模型 → 用共享 Queue 替换旧 Transition → 由 PlaybackSession 统一驱动
Resolver/Engine → Zustand 只投影 Snapshot。

网易云签名 URL 不进入 Queue 或公开 Snapshot。登录 Session/Cookie 改变时仍要沿现有刷新路径清理
播放 URL 缓存；待 Web Session revision 接入 Resolver 后，再由 Resolver 自动隔离不同登录会话。

## 维护约束

- Queue 不请求网络，Resolver 不修改队列，Engine 不理解上一首/下一首。
- 公开时间统一为毫秒；公开音量为 `0..100`。
- 每次 load 都带 revision/token，过期异步结果和旧事件必须丢弃。
- 同一运行时只有一个 Authority 和一个真实音频输出。
- 新 Provider 只新增 Resolver Adapter；新输出引擎只新增 Audio Adapter，不修改 MCP Tool。
- 私人 FM 的补量/减少推荐是独立 Queue Policy，不能退化成普通数组删除。

完整迁移步骤与验收矩阵见 [`playback-platform.md`](./playback-platform.md)。
