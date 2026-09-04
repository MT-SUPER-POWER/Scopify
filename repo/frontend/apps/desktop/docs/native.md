# Windows Native Audio Host

Scopify 的原生音频能力位于 Electron Main 下方：Rust/NAPI 负责解码与声卡输出，TypeScript Host
负责模块加载、输入校验、状态投影和旧事件淘汰。Renderer、MCP 与 Queue 都不能直接加载 `.node`。

```text
未来 NativeAudioAdapter
  → Electron Main NativeAudioHost
  → nativeModuleLoader
  → scopify-audio-engine.node
  → Rodio Decoder / CPAL (Windows WASAPI)
```

## 当前能力

- 本地绝对路径与 HTTPS 音源；
- `load`、`play`、`pause`、`stop`、`seek`、`setVolume`；
- loaded、position、ended、source/output error 与安全 Snapshot；
- Session `loadId` + Rust `token` + Host request revision 三层过期结果过滤；
- 默认 Windows 输出设备，输出异常转为结构化事件；
- 可重复 `dispose`，缺少/损坏原生模块时返回 `unavailable`，不阻止 Desktop 启动。

HTTPS 与本地文件在 V1 都先缓冲进可 Seek 的内存 Cursor，最大 512 MiB。这样两类来源具有相同
Seek 语义，但不适合超大文件或边下边播；流式 Range Source、输出设备选择、FFT、ReplayGain 和
无缝切歌属于后续 Adapter/Engine 迭代。

目前 Desktop 的正式播放 Authority 仍使用 HTML Audio。Native Host 已经可以构建和加载，但在
新增 Renderer↔Main `NativeAudioAdapter`、选择策略及单输出切换事务之前，不应默认启用，避免双出声。

## 代码结构

```text
electron/main/
├─ capabilities/nativeAudio/   # Host Interface、运行时校验、事件过滤
└─ services/nativeModuleLoader.ts
native/audio-engine/
├─ src/bindings.rs             # NAPI ABI 与监控事件
├─ src/player.rs               # 播放状态、Sink 与 token
├─ src/source.rs               # file/HTTPS 边界
├─ src/decoder.rs              # 有界缓冲与 Rodio 解码
└─ src/error.rs                # 不泄露 URL/路径的错误分类
```

`NativeAudioSnapshot` 永远不包含 URL、绝对路径或 Cookie。跨 NAPI 数据必须先在 Host 中解析，不能把
`unknown` 直接传给 Renderer。

## 构建与验证

需要 Rust stable、Windows MSVC 工具链和仓库已安装的 `@napi-rs/cli`：

```bash
cd repo/frontend/apps/desktop
bun run audio:build
```

Windows 的 `package:win`、`build:win`、`release:win` 会先构建该模块，再把 `.node` 和 NAPI 自动生成
的 `index.d.ts` 复制到 `resources/native/audio-engine/`。构建脚本还会实际加载 release `.node` 并
验证 ready/player/snapshot/dispose ABI；生成物按平台构建且不提交，不要手改声明。

```bash
cd native/audio-engine
cargo test --offline --target-dir .cargo-target-test
cargo fmt --check

cd ../..
bun test tests/nativeAudioHost.test.ts --isolate
bun run typecheck
```

测试使用固定 WAV 验证真实 decoder，不会自动播放声卡。修改输出层后仍需在 Windows x64/arm64
机器上做实际播放、暂停、Seek、拔出设备和连续切歌 smoke test。
