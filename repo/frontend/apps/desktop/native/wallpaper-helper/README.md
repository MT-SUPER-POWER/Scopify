# Scopify native wallpaper

一个 Rust crate，通过同一套 Node-API 接口适配 Windows 与 macOS。桌面窗口仍由 Electron / Web 渲染，Rust 负责操作系统桌面层。

## 链路

```text
Renderer → Preload → 已校验发送方的 Electron IPC
         → 壁纸 capability / platform driver
         → scopify-wallpaper-helper.<platform>-<arch>.node
         → Windows WorkerW / macOS NSWindow
```

- `src/lib.rs`：共用的 `attach / detach / pollEvents / isAttached` ABI、句柄校验和会话互斥。
- `src/desktop_services.rs`：同一模块的桌面图标与静态壁纸服务；耗时操作通过 Node-API 的 libuv worker 执行，退出恢复另有同步入口。
- `src/windows_desktop.rs`：直接调用 Win32 显示/隐藏图标，以及 COM `IDesktopWallpaper` 查询和设置系统壁纸，不启动 PowerShell。
- `src/system_wallpaper.rs`：写入恢复日志后再修改系统，保留旧 Version 1 日志兼容；用户另选壁纸时跳过覆盖，恢复失败保留日志，备份成为当前壁纸时保留该文件。静态兜底继续拒绝多屏、幻灯片和复合配置。
- `src/events.rs`：共用的、有容量限制的事件队列。主进程轮询 JSON 事件并等待挂载/卸载确认。
- Windows：`windows_session.rs` 在 Rust 消息线程中运行已有的 `attach.rs / monitor.rs / message_window.rs`。保留按显示器选择 WorkerW、Explorer 重启后的重挂、心跳、z-order guard。退出先停止并等待重挂线程、释放 WinEvent hooks，再恢复窗口，避免旧会话干扰下一次进入。Electron 已拥有原生窗口和 DPI 上下文，不再由子进程设置进程 DPI。
- macOS：`macos.rs` 在 Electron 的 AppKit 主线程上用 `objc2` 调用 NSWindow。临时切成无边框窗口，层级为 `CGWindowLevelForKey(kCGDesktopIconWindowLevelKey) - 1`，配置跨桌面显示，并按目标显示器全幅铺设。保存并恢复窗口的样式、层级、collection behavior、阴影及鼠标穿透状态。持有 NSWindow 的原生引用，避免窗口销毁后解引用悬空指针。坐标由 Electron 左上角原点转成 AppKit 左下角原点。

NSView 指针只允许同进程使用，因此两端均加载同一 crate 的 `.node`，不再使用 Windows 专属 exe / stdin 协议。WASM 无法直接执行上述原生窗口调用，本链路没有 WASM 中间层。

## 操作与边界

- 壁纸只负责展示，操作通过现有的独立控制面板完成；两端均没有新增全局鼠标转发。macOS 不需要输入监控/辅助功能权限，也不会修改系统 Dock 自动隐藏设置。
- macOS 的 Dock 激活、第二实例激活和通知入口会先退出壁纸，再展示普通主窗口；应用退出等待原生清理。
- macOS 显示器布局变化时退出壁纸并恢复窗口，避免继续覆盖错误屏幕；可从控制面板重新打开。
- Windows 专属的系统静态壁纸兜底、桌面图标控制没有迁移成 macOS 功能。全屏策略字段仍沿用现有契约，本次没有实现新的全屏/锁屏节能策略。

## 构建与验证

在 desktop 包目录运行：

```sh
pnpm run wallpaper:build             # 当前宿主架构
pnpm run wallpaper:build --all-arch  # macOS arm64 + x64
pnpm run wallpaper:verify            # 独立临时 profile 的真实 Electron IPC 验证
```

macOS 双架构构建要求安装 `aarch64-apple-darwin` 和 `x86_64-apple-darwin` Rust target，发布 workflow 已处理。原生模块通过平台专属 `extraResources` 打包，按包架构筛选；主进程首次调用桌面原生能力时才加载，缺失或 ABI 错误返回可重试故障，不阻止应用启动。`SCOPIFY_WALLPAPER_MODULE_PATH` 可覆盖开发诊断时的模块路径。

`wallpaper:verify` 只编译测试入口，不构建 Web / 应用。它通过 Renderer IPC 连续开关三次，并核对原生层级、窗口尺寸恢复及应用退出清理；不会读取或更改用户安装版的配置。

## 代码来源与许可

本 crate 的 Windows 实现从 Folia v0.7.1 的同名 helper 派生，随 Scopify 以 **AGPL-3.0** 发布。Folia Copyright (c) chthollyphile contributors，AGPL-3.0。macOS 的桌面层级方案参考 Folia 的 `electron/wallpaper/macWallpaperController.cjs`，在 Rust 中实现。

Windows 上游来源与对应文件中的版权声明继续保留：

| 模块 | 来源 | 许可证 |
| --- | --- | --- |
| `attach.rs` | Seelen UI `wallpaper_manager/{mod,handlers}.rs` | AGPL-3.0 |
| `attach.rs` | Lively Wallpaper `DesktopUtil.cs` | GPL-3.0 |
| `monitor.rs` | Lively `WinDesktopCore.cs` | GPL-3.0 |
