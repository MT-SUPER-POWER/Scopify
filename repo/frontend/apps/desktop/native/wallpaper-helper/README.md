# scopify-wallpaper-helper

Windows 桌面壁纸模式的原生辅助进程。由 Scopify Electron 主进程管理，负责把主窗口挂入
桌面图标层之下的 WorkerW 层，并在 explorer
重启 / WorkerW 重建时自行重挂。

协议（详见 `src/cli.rs` 与 `src/events.rs`）：

- 命令行：`attach --hwnd <n> [--zguard]`（常驻）、`move --hwnd <n>`、
  `detach --hwnd <n>`（一次性）。
- stdin：`detach`（常驻进程退出前先还原窗口）。stdin EOF 同样触发还原。
- stdout：JSONL 事件
  `{"event": "attached"|"heartbeat"|"workerw-destroyed"|"explorer-restarted"|"reasserted"|"moved"|"detached"|"error", ...}`。

构建：Windows 上由 `bun scripts/build-wallpaper-helper.ts` 调用 `cargo build --release`；
纯逻辑单测（CLI 解析、JSONL 事件）可在任意平台 `cargo test`，Windows 相关模块
被 `#[cfg(windows)]` 门控。

## 代码来源与许可

本 crate 从 Folia v0.7.1 的同名 helper 派生，并随 Scopify 以 **AGPL-3.0** 发布。原始实现：

- Folia v0.7.1，Copyright (c) chthollyphile contributors，AGPL-3.0。

Folia 保留的上游实现：

| 模块 | 来源 | 许可证 |
| --- | --- | --- |
| `attach.rs` | Seelen UI `wallpaper_manager/{mod,handlers}.rs` | AGPL-3.0 |
| `attach.rs` | Lively Wallpaper `DesktopUtil.cs` | GPL-3.0 |
| `monitor.rs` | TaskbarCreated + PID 比对逻辑译自 Lively `WinDesktopCore.cs`| GPL-3.0 |

上游版权声明已保留在对应文件头中。
