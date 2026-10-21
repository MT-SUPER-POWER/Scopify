# scopify-wallpaper-helper

Windows 桌面壁纸模式的原生辅助进程。由 Scopify Electron 主进程管理，负责把主窗口挂入桌面图标层之下的 WorkerW 层，并在 explorer 重启 / WorkerW 重建时自行重挂。

协议（详见 `src/cli.rs` 与 `src/events.rs`）：

- 命令行：`attach --hwnd <n> [--zguard]`（常驻）、`move --hwnd <n>`、 `detach --hwnd <n>`（一次性）。未知选项直接报错退出，避免主进程拼错参数被静默忽略。
- **选屏**（同步自 Folia `7452afd2`）：helper 不接受选屏参数。主进程先按 `wallpaperTargetDisplay.ts` 选出目标显示器（会话已覆盖的屏 → 主窗口所在屏 → 主屏），必要时把隐藏的主窗口移到该屏；helper 在 `SetParent` **之前**取窗口所在显示器，优先挑选**覆盖该显示器的WorkerW**（24H2+ raised 桌面每块屏一个 WorkerW），并按该屏 `rcMonitor` 摆好窗口。`SetParent` 保留子窗口的父客户区坐标，选错宿主会把壁纸铺到宿主那块屏上。找不到匹配宿主（classic 桌面只有一个跨虚拟屏的 WorkerW）时回退原有的 classic → raised 探测。
- DPI：进程启动即切到 per-monitor v2，显示器与 WorkerW 的矩形都按物理像素比较；Scopify 不经 helper 转发鼠标，因此不再需要 96-DPI 虚拟化坐标。
- stdin：`detach`（常驻进程退出前先还原窗口）。stdin EOF 同样触发还原。
- stdout：JSONL 事件 `{"event": "attached"|"heartbeat"|"workerw-destroyed"|"explorer-restarted"|"reasserted"|"moved"|"detached"|"error", ...}`。

构建：Windows 上由 `bun scripts/build-wallpaper-helper.ts` 调用 `cargo build --release`；纯逻辑单测（CLI 解析、JSONL 事件）可在任意平台 `cargo test`，Windows 相关模块被 `#[cfg(windows)]` 门控。

## 代码来源与许可

本 crate 从 Folia v0.7.1 的同名 helper 派生，并随 Scopify 以 **AGPL-3.0** 发布。原始实现：

- Folia v0.7.1，Copyright (c) chthollyphile contributors，AGPL-3.0。

Folia 保留的上游实现：

| 模块 | 来源 | 许可证 |
| --- | --- | --- |
| `attach.rs` | Seelen UI `wallpaper_manager/{mod,handlers}.rs` | AGPL-3.0 |
| `attach.rs` | Lively Wallpaper `DesktopUtil.cs` | GPL-3.0 |
| `monitor.rs` | TaskbarCreated + PID 比对逻辑译自 Lively `WinDesktopCore.cs` | GPL-3.0 |

上游版权声明已保留在对应文件头中。
