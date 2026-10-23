# Scopify — Agent Instructions

Scopify 是 **Next.js App Router + Electron** 的网易云音乐客户端。根目录是 pnpm Workspaces + Turborepo 编排层；所有应用源码收敛于 `repo/`，Web、Electron 和契约分别位于 `repo/frontend/apps/web`、`repo/frontend/apps/desktop` 和 `repo/frontend/packages/desktop-contract`。前端与 `repo/backend/api-enhanced` 解耦部署；后端有自己的 [AGENTS.md](./repo/backend/api-enhanced/AGENTS.md)。

**本文件是前端/Electron 代码结构的唯一规范。** 下文中未加前缀的 `app/`、`components/`、`types/`、`hooks/`、`lib/` 和 `store/` 路径都相对于 `repo/frontend/apps/web/`。新建或修改代码时必须遵守；发现 inline 类型、散落 hook 等历史债务时，顺手迁移到正确目录。

---

## 检查约定

当完成了一个阶段的任务，在需要做 git commit 之前，请你务必检查下面是否符合要求：

- typecheck
- lint
- prettier
- test: 这个不做要求，因为之前做了很多没必要的测试，现在内容尾大不掉，不用全量测试，写针对自己业务的时候的测试就行，当然没必要的情况，不要写比较大的测试

---

## Quick Start

| 项 | 值 |
| --- | --- |
| 包管理器 | **pnpm**（12.x，见 `packageManager`） |
| 脚本 / 测试运行时 | **bun**（>= 1.3.11，运行 `*.ts` 脚本与 `bun test`） |
| Node | >= 20 |

```bash
pnpm install
pnpm run dev               # Web + Electron
pnpm run dev:web           # 仅 Web
pnpm run dev:desktop       # 仅 Electron
pnpm run dev:full          # Web + Electron + 后端联调
pnpm run i18n:types        # 生成 i18n 类型
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
│   │   │   ├── docs/                # Fumadocs UI 组件文档与交互预览
│   │   │   ├── desktop/             # Electron host，不反向 import Web 源码
│   │   │   │   ├── electron/        # Electron 宿主源码（main/ 与 preload/）
│   │   │   │   ├── electron.vite.config.ts     # Main / Preload 构建配置
│   │   │   │   ├── electron-builder.config.ts  # 平台打包与发布配置
│   │   │   │   ├── lib/runtimePaths.ts         # 构建产物目录定义
│   │   │   │   ├── out/main/        # 开发宿主产物（不提交）
│   │   │   │   ├── build/desktop/app/          # 待打包应用（不提交）
│   │   │   │   │   ├── out/main/    # 生产宿主产物
│   │   │   │   │   └── renderer/    # Web 静态制品插槽
│   │   │   │   ├── build/release/   # 安装包输出（不提交）
│   │   │   │   ├── config/          # 桌面配置
│   │   │   │   ├── public/          # 静态资源管理（图标、Splash、系统脚本等，对齐 SPlayer 结构）
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

| Alias | 路径 |
| --- | --- |
| `@/*` | `repo/frontend/apps/web/*` |
| `@components/*` | `./components/*` |
| `@store/*` | `./store/*` |
| `@app-types/*` | `./types/*` |

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

### 用户更新说明与提交提示词

- 每个提交必须使用 Conventional Commits（如 `feat(updates): …`、`fix(player): …`），并新增一个 `docs/updates/entries/<唯一标识>.json` 条目；同一提交的相关修改可合成一条，独立用户变化应拆开记录。
- 写条目前先回答：“用户此前遇到了什么？现在能做什么？在哪里使用？”标题描述用户结果；正文用 1–2 句话写清变化，必要时给出入口。禁止用模块名、文件名、重构过程、内部 API 或实现清单代替用户变化。
- JSON 的 `category` 必须与 `docs/CHANGELOG.md` 中的 Added / Visual / Quality / Fixed 分类一致，`type` 记录 Conventional Commit 类型，两者不可混为一谈；`audience: user` 用于用户可感知的功能与修复，纯 CI、依赖、重构、开发文档使用 `audience: internal`，不进入应用弹窗。保持简体、繁体和英文语义一致。
- 不要填写新提交的 hash。构建脚本从引入条目的真实 Git 提交解析 Conventional Commit 关键词与完整 hash；不得伪造或用 `HEAD` 代替。已合并条目保持不变，后续修正新增条目。
- 发版前按用户体验人工合并重复说明、删除过时的中间方案，将要发布的条目 ID 加入 `docs/updates/releases.json` 的对应版本，并填写真实发布日期；未归入版本的条目不会展示。严禁在已发布版本下追加新功能来绕过版本升级。
- `docs/CHANGELOG.md` 继续记录开发修改及 Added / Visual / Quality / Fixed 分类。应用弹窗与 GitHub Release 共用独立的用户更新说明。完整格式、迁移和 squash 规则见 [docs/updates/README.md](docs/updates/README.md)。

编写更新条目时使用这段提示词：

> 请根据本次最终修改写一条面向普通听歌用户的更新说明。先判断用户能否感知变化；不能感知则 audience=internal。能感知则说明新增能力、修复的问题或体验变化，使用用户认识的功能名称，最多两句话，必要时指出操作入口。删除代码路径、模块拆分、内部类型、调试过程和已经被替代的中间方案。不夸大效果，不写未经确认的兼容性或测试结论。输出三种语言的 title、description、与 CHANGELOG 章节一致的 category，以及 Conventional Commit 类型 type；category 和 type 独立填写，不要从提交关键词推断展示分类。不要生成 hash，由 Git 自动解析。

前端/Electron 的代码结构规范、`app/` 路由组装原则、类型定义放哪、组件拆分及 API 三层架构，统一托管于 Skill：👉 **[skills/nextjs-project-structure/](skills/nextjs-project-structure/SKILL.md)**

### Desktop external links

桌面端外部网页统一由 Electron 主进程 `services/externalLinks.ts` 交给系统默认浏览器打开；不要为外链新建 BrowserWindow，不要在单个窗口中覆盖全局的新窗口处理规则。

### Shared UI package boundary

任何新增、迁移、修改或消费 `repo/frontend/packages/ui` 中的基础组件、shadcn CLI 组件、Scopify 扩展组件或共享 UI token 时，**必须**遵循：👉 **[skills/ui-package-boundaries/](skills/ui-package-boundaries/SKILL.md)**

该规范强制区分原生 `shadcn/` vendor 层与 `scopify/` 扩展层：标准 props 与 token 能满足的需求直接使用原生组件；只有原生 API 与主题 token 都不足时，才从对应原生组件复制到 `scopify/` 并扩展；带路由、状态、API 或 i18n 耦合的组件留在应用业务层。

---

---

### Backend

NetEase API 服务位于 `repo/backend/api-enhanced/`（git submodule）。前端通过 `repo/frontend/apps/web/lib/web/request.ts` 配置的 base URL 访问，开发时可用 `pnpm run dev:backend` 启动。后端规范见 [backend/api-enhanced/AGENTS.md](./repo/backend/api-enhanced/AGENTS.md)。

<!-- CODEGRAPH_START -->

## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->
