# Build artifacts

桌面端可交付的构建产物统一位于桌面端包内部的 `repo/frontend/apps/desktop/build/`，应用源码目录不再散落任何多余的临时产物。

```
repo/frontend/apps/desktop/build/
├── desktop/
│   └── app/                 # electron-builder 的 app 输入，不直接分发
│       ├── out/main/        # Electron main 与 preload bundle
│       ├── renderer/        # 静态 Next renderer 与 manifest
│       └── package.json     # 纯净的打包运行时 package.json (0 外部依赖，无 node_modules)
└── release/                 # 可分发文件与 win-unpacked 验证目录
```

常用命令（由 Turborepo Task DAG 自动处理前后依赖）：

- `bun run sync:renderer`：自动先执行 Web 桌面静态导出，并将产物同步至 `repo/frontend/apps/desktop/build/desktop/app/renderer`。
- `bun run build:desktop`：同步 Renderer 并编译 Desktop 主进程至 `build/desktop/app/out/main`。
- `bun run build:win`：全链路生成 Windows 安装包至 `repo/frontend/apps/desktop/build/release`。
- `bun run build:mac`：全链路生成 macOS 制品至 `repo/frontend/apps/desktop/build/release`。

Desktop renderer 的 Next 静态导出会短暂生成在 `repo/frontend/apps/web/out`，同步至 `repo/frontend/apps/desktop/build/desktop/app/renderer` 并写入 manifest 后立即清除。主进程所有纯 JS 运行时依赖均通过 Rollup/Vite Tree-Shaking 内联编译，打包态无外部 `node_modules` 依赖。
