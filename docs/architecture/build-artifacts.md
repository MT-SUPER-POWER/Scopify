# Build artifacts

可交付的构建产物统一位于仓库根目录的 `build/`，应用源码目录不再保留 Desktop renderer 或 Electron runtime 的打包输入。

```
build/
├── desktop/
│   └── app/                 # electron-builder 的 app 输入，不分发
│       ├── out/main/        # Electron main 与 preload bundle
│       ├── renderer/        # 静态 Next renderer 与 manifest
│       └── package.json
└── release/                 # 可分发文件与 win-unpacked 验证目录
```

常用命令：

- `bun run build:desktop`：生成 `build/desktop/app`。
- `bun run build:win`：生成 Windows 安装包至 `build/release`。
- `bun run build:mac`：生成 macOS 制品至 `build/release`。
- `bun run clean:legacy-build-artifacts`：移除迁移前遗留在应用目录中的构建产物；不会删除根目录 `build/`。

Desktop renderer 的 Next 静态导出会短暂生成在 `frontend/apps/web/out`，同步至 `build/desktop/app/renderer` 并写入 manifest 后立即清除。Next.js 不支持将 `distDir` 指向 Web 项目以外的目录，因此 Web 的本地 `.next` 缓存不属于交付物，仍由 Next.js 在应用目录中管理。
