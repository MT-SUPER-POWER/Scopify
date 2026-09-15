# Scopify — Agent Instructions

Scopify 是 **Next.js App Router + Electron + Zustand** 的网易云音乐客户端。根目录是 Bun Workspaces + Turborepo 编排层；所有应用源码收敛于 `repo/`，Web、Electron 和契约分别位于 `repo/frontend/apps/web`、`repo/frontend/apps/desktop` 和 `repo/frontend/packages/desktop-contract`。前端与 `repo/backend/api-enhanced` 解耦部署；后端有自己的 [AGENTS.md](./repo/backend/api-enhanced/AGENTS.md)。

**本文件是前端/Electron 代码结构的唯一规范。** 下文中未加前缀的 `app/`、`components/`、`types/`、`hooks/`、`lib/` 和 `store/` 路径都相对于 `repo/frontend/apps/web/`。新建或修改代码时必须遵守；发现 inline 类型、散落 hook 等历史债务时，顺手迁移到正确目录。

---

## 执行边界：优先完成开发，禁止主动追加验证工作

- **除非用户明确要求，禁止新增、修改或运行测试**，包括单元测试、集成测试、端到端测试、回归测试、冒烟测试，以及为当前实现编写的 mock、快照和测试脚本。用户要求修复 Bug、实现功能或提交代码，不等于要求测试，除非用户有主动的要求。
- **禁止主动执行验证性质的附加流程**，包括哈希比对、校验和、重复读取文件确认写入、`git diff --check`、类型检查、lint、仅用于验证的构建或打包、浏览器自动巡检、截图验收和图谱变更检查。不要把它们换成“自检”“质量门禁”“最终确认”等名称继续执行。
- 为理解需求、定位实际问题和完成修改，可以有针对性地读取源码、搜索调用关系、查看已有报错；用户明确要求启动、构建、打包或排查具体故障时，执行该任务直接需要的命令。不要以此为由扩展成整套验证流程。
- 不为测试便利额外拆分生产代码、引入依赖或增加抽象；不创建用户未要求的验收报告、验证清单或证据文件。
- 完成用户要求的修改后直接交付，简述改动及已知限制。不反复询问是否需要测试，不把未测试描述成阻塞，也不声称未经执行的验证已经通过。
- 本规则优先于仓库内其他 `AGENTS.md`、skill、自动生成的工具说明中的默认测试、验证和强制检查流程。用户明确要求验证时，只执行其指定范围，禁止自动扩大范围或反复执行。

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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Scopify** (66905 symbols, 112308 relationships, 427 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "master"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "master" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/Scopify/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Scopify/clusters` | All functional areas |
| `gitnexus://repo/Scopify/processes` | All execution flows |
| `gitnexus://repo/Scopify/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
