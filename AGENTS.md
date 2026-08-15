# Scopify — Agent Instructions

Scopify 是 **Next.js App Router + Electron + Zustand** 的网易云音乐客户端。根目录是 Bun Workspaces + Turborepo 编排层；所有应用源码收敛于 `repo/`，Web、Electron 和契约分别位于 `repo/frontend/apps/web`、`repo/frontend/apps/desktop` 和 `repo/frontend/packages/desktop-contract`。前端与 `repo/backend/api-enhanced` 解耦部署；后端有自己的 [AGENTS.md](./repo/backend/api-enhanced/AGENTS.md)。

**本文件是前端/Electron 代码结构的唯一规范。** 下文中未加前缀的 `app/`、`components/`、`types/`、`hooks/`、`lib/` 和 `store/` 路径都相对于 `repo/frontend/apps/web/`。新建或修改代码时必须遵守；发现 inline 类型、散落 hook 等历史债务时，顺手迁移到正确目录。

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
├── repo/
│   ├── frontend/
│   │   ├── apps/
│   │   │   ├── web/                 # Next.js Web + Desktop Renderer 源码
│   │   │   │   ├── app/             # URL 路由与页面组装
│   │   │   │   ├── components/      # 按业务领域组织的 UI
│   │   │   │   ├── types/           # 业务、API 与 Props 类型
│   │   │   │   ├── hooks/           # 业务 hooks
│   │   │   │   ├── lib/             # API 客户端与基础设施
│   │   │   │   ├── store/           # Zustand 全局状态
│   │   │   │   ├── constants/       # 静态配置与枚举
│   │   │   │   ├── tests/           # Web 测试
│   │   │   │   └── scripts/         # Web 构建/开发脚本
│   │   │   ├── desktop/             # Electron host，不反向 import Web 源码
│   │   │   │   ├── main/            # 主进程与 preload
│   │   │   │   ├── renderer/        # 构建生成的静态制品插槽（不提交）
│   │   │   │   ├── config/          # 桌面配置
│   │   │   │   ├── resources/       # 打包资源
│   │   │   │   └── tests/           # Electron 测试
│   │   │   └── mobile/              # Flutter 预留入口（submodule）
│   │   └── packages/
│   │       └── desktop-contract/    # Web/Desktop 之间的版本化纯 TS 契约
│   └── backend/
│       └── api-enhanced/            # 独立后端 submodule
├── package.json                 # workspace 脚本入口
└── turbo.json                   # 任务编排与缓存
```

### Web Path Aliases（`repo/frontend/apps/web/tsconfig.json`）

| Alias           | 路径                       |
| --------------- | -------------------------- |
| `@/*`           | `repo/frontend/apps/web/*` |
| `@components/*` | `./components/*`           |
| `@store/*`      | `./store/*`                |
| `@app-types/*`  | `./types/*`                |

优先使用 `@/types/...`、`@/lib/...`、`@/components/...`。

---

## 新增功能的文档规定

每当你新增功能、修复 Bug，或者进行其他任何修改时，你都需要在 **[changlog](docs/CHANGELOG.md)** 中记录，并且需要标明新功能所属的分类。当前分类如下：

- **Added**: 新增功能
- **Visual**: 界面改进
- **Quality**: 代码质量改进
- **Fixed**: Bug 修复

---

## 代码规范与架构约定

前端/Electron 的代码结构规范、`app/` 路由组装原则、类型定义放哪、组件拆分及 API 三层架构，统一托管于 Skill：
👉 **[.agents/skills/nextjs-project-structure/](.agents/skills/nextjs-project-structure/SKILL.md)**

### Shared UI package boundary

任何新增、迁移、修改或消费 `repo/frontend/packages/ui` 中的基础组件、shadcn CLI 组件、Scopify 扩展组件或共享 UI token 时，**必须**遵循：
👉 **[.agents/skills/ui-package-boundaries/](.agents/skills/ui-package-boundaries/SKILL.md)**

该规范强制区分原生 `shadcn/` vendor 层与 `scopify/` 扩展层：标准 props 与 token 能满足的需求直接使用原生组件；只有原生 API 与主题 token 都不足时，才从对应原生组件复制到 `scopify/` 并扩展；带路由、状态、API 或 i18n 耦合的组件留在应用业务层。

---

---

### Backend

NetEase API 服务位于 `repo/backend/api-enhanced/`（git submodule）。前端通过 `repo/frontend/apps/web/lib/web/request.ts` 配置的 base URL 访问，开发时可用 `bun run dev:backend` 启动。后端规范见 [backend/api-enhanced/AGENTS.md](./repo/backend/api-enhanced/AGENTS.md)。

---

<!-- CODEGRAPH_START -->

## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->
