# Scopify Desktop

Electron host for Scopify. The application owns the main process, preload,
native resources, updater, and packaging configuration.

The `build/desktop/app/renderer/` directory is a generated artifact slot. Desktop code must not
import implementation files from `apps/web`; local and CI builds copy a verified
static Web build into this directory before packaging.

## 构建目录与配置

| 文件或目录 | 职责 |
| --- | --- |
| `electron.vite.config.ts` | Main / Preload 的入口、别名与输出格式 |
| `electron-builder.config.ts` | 安装包、平台资源与发布配置 |
| `lib/runtimePaths.ts` | 构建产物目录的公共定义 |
| `scripts/` | 原生构建、Renderer 同步和打包准备 |
| `out/main/` | 开发时的 `main.js` 与 `preload.js` |
| `build/desktop/app/` | 待打包应用根目录 |
| `build/desktop/app/out/main/` | 生产 Main / Preload 产物 |
| `build/desktop/app/renderer/` | 从 Web 静态构建同步的页面产物 |
| `build/release/` | 安装包输出 |

Next.js 在 Web 应用中构建页面，Electron Vite 构建桌面宿主。同步与准备脚本将两者放入
`build/desktop/app/`，Electron Builder 再从该目录生成安装包。打包应用内部的页面路径是
`renderer/`，它不是 Desktop 应用根目录下的源码目录。

工作区入口继续由根 `package.json` 和 `turbo.json` 编排；打包和发布命令在 Desktop 内
显式使用 `electron-builder.config.ts`。

Main-process architecture, lifecycle, and contribution rules are documented in
[`electron/main/README.md`](./electron/main/README.md).

Playback-related maintenance notes:

- [`docs/architecture.md`](./docs/architecture.md) — Master architecture specification and UML topologies
- [`docs/playback.md`](./docs/playback.md) — Queue / Resolver / Session / Adapter boundaries
- [`docs/mcp.md`](./docs/mcp.md) — local MCP configuration, tools, and security model
- [`docs/native.md`](./docs/native.md) — Windows native audio build and Host boundary
