# Scopify — Agent Instructions

Scopify 是 **Next.js App Router + Electron + Zustand** 的网易云音乐客户端。根目录是 Bun Workspaces + Turborepo 编排层；Web、Electron 和契约分别位于 `frontend/apps/web`、`frontend/apps/desktop` 和 `frontend/packages/desktop-contract`。前端与 `backend/api-enhanced` 解耦部署；后端有自己的 [AGENTS.md](./backend/api-enhanced/AGENTS.md)。

**本文件是前端/Electron 代码结构的唯一规范。** 下文中未加前缀的 `app/`、`components/`、`types/`、`hooks/`、`lib/` 和 `store/` 路径都相对于 `frontend/apps/web/`。新建或修改代码时必须遵守；发现 inline 类型、散落 hook 等历史债务时，顺手迁移到正确目录。

---

## Quick Start

| 项       | 值                  |
| -------- | ------------------- |
| 包管理器 | **bun**（>= 1.3.7） |
| Node     | >= 20               |

```bash
bun install
bun run dev               # Web + Electron
bun run dev:web           # 仅 Web
bun run dev:desktop       # 仅 Electron
bun run dev:full          # Web + Electron + 后端联调
bun run i18n:types        # 生成 i18n 类型
```

---

## 目录结构（实际约定）

```
Scopify/
├── frontend/
│   ├── apps/
│   │   ├── web/                 # Next.js Web + Desktop Renderer 源码
│   │   │   ├── app/             # URL 路由与页面组装
│   │   │   ├── components/      # 按业务领域组织的 UI
│   │   │   ├── types/           # 业务、API 与 Props 类型
│   │   │   ├── hooks/           # 业务 hooks
│   │   │   ├── lib/             # API 客户端与基础设施
│   │   │   ├── store/           # Zustand 全局状态
│   │   │   ├── constants/       # 静态配置与枚举
│   │   │   ├── tests/           # Web 测试
│   │   │   └── scripts/         # Web 构建/开发脚本
│   │   ├── desktop/             # Electron host，不反向 import Web 源码
│   │   │   ├── main/            # 主进程与 preload
│   │   │   ├── renderer/        # 构建生成的静态制品插槽（不提交）
│   │   │   ├── config/          # 桌面配置
│   │   │   ├── resources/       # 打包资源
│   │   │   └── tests/           # Electron 测试
│   │   └── mobile/              # Flutter 预留入口
│   └── packages/
│       └── desktop-contract/    # Web/Desktop 之间的版本化纯 TS 契约
├── backend/
│   └── api-enhanced/            # 独立后端 submodule
├── package.json                 # workspace 脚本入口
└── turbo.json                   # 任务编排与缓存
```

### Web Path Aliases（`frontend/apps/web/tsconfig.json`）

| Alias           | 路径             |
| --------------- | ---------------- |
| `@/*`           | `frontend/apps/web/*` |
| `@components/*` | `./components/*` |
| `@store/*`      | `./store/*`      |
| `@app-types/*`  | `./types/*`      |

优先使用 `@/types/...`、`@/lib/...`、`@/components/...`。

---

## 代码规范与架构约定

前端/Electron 的代码结构规范、`app/` 路由组装原则、类型定义放哪、组件拆分及 API 三层架构，统一托管于 Skill：
👉 **[.agents/skills/nextjs-project-structure/](.agents/skills/nextjs-project-structure/SKILL.md)**

---

<!-- START: Backend Rules-->

### Backend

NetEase API 服务位于 `backend/api-enhanced/`（git submodule）。前端通过 `frontend/apps/web/lib/web/request.ts` 配置的 base URL 访问，开发时可用 `bun run dev:backend` 启动。后端规范见 [backend/api-enhanced/AGENTS.md](./backend/api-enhanced/AGENTS.md)。

<!-- END: Backend Rules-->
