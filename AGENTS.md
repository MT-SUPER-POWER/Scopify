# Scopify — Agent Instructions

Scopify 是 **Next.js App Router + Electron** 的网易云音乐客户端。根目录是 pnpm Workspaces + Turborepo 编排层；所有应用源码收敛于 `repo/`，Web、Electron 和契约分别位于 `repo/frontend/apps/web`、`repo/frontend/apps/desktop` 和 `repo/frontend/packages/desktop-contract`。前端与 `repo/backend/api-enhanced` 解耦部署；后端有自己的 [AGENTS.md](./repo/backend/api-enhanced/AGENTS.md)。

**本文件是前端/Electron 代码结构的唯一规范。** 下文中未加前缀的 `app/`、`components/`、`types/`、`hooks/`、`lib/` 和 `store/` 路径都相对于 `repo/frontend/apps/web/`。新建或修改代码时必须遵守；发现 inline 类型、散落 hook 等历史债务时，顺手迁移到正确目录。

---

## 检查约定

本地提交依赖现有 Git hooks，远端 CI 负责全仓检查。不要把“提交前检查”理解为 Agent 必须额外执行一轮检查。

- **正常提交即可**：只暂存本次任务文件，通过 `git commit` 触发 `.husky/pre-commit`。其中 `lint-staged` 按 `lint-staged.config.mjs` 对暂存文件执行 Prettier，对暂存的 Web JS/TS 文件执行 ESLint；钩子已有的架构检查照常运行，无需手动重复执行。
- **钩子失败时再处理**：读取实际错误，修复本次改动引起的问题后重新提交。不得跳过或禁用钩子，也不得为了提交通过而擅自修改无关文件或放宽规则。
- **禁止主动追加重复检查**：无论阶段完成还是准备提交，都不要自行运行全仓或包级的 lint、TypeScript/typecheck、Prettier 检查、build，也不要在提交前手动重复 lint-staged 已覆盖的检查。用户明确要求某项检查时，才按指定范围执行。
- **明确覆盖边界**：钩子通过只表示其覆盖的检查通过。目前 lint-staged 不执行 TypeScript 检查，也不覆盖所有应用的 ESLint；全仓 typecheck 和 lint 由 `.github/workflows/ci.yml` 执行。不要因此自行补跑，也不要将钩子通过报告成全仓检查通过。
- **测试按业务需要决定**：仅在本次业务逻辑确有必要时编写或运行小范围、针对性的单元测试；不要例行添加测试、运行全量测试或扩大验证范围。用户指定测试范围时遵循用户要求。
- **适用于所有 Agent 和 Skill**：其他 Skill 中通用的“检查清单”“提交前验证”不构成额外运行上述检查的授权；在本仓库以本节为准。报告实际执行结果和未覆盖范围即可，不为补齐报告而追加检查。

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
pnpm run bump              # 统一升级版本（4 个 package.json）
pnpm run changelog:preview # 预览下个版本的更新说明
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

## 更新说明：从 commit 自动生成

不手写 changelog。`docs/CHANGELOG.md`、应用内 What's New 和 GitHub Release 都由 [git-cliff](https://git-cliff.org)（`cliff.toml`）从 commit 生成：

| commit 类型 | 展示分组 |
| --- | --- |
| `feat` | 新增 |
| `fix` | 修复 |
| `perf` | 优化 |
| 其他类型，或 scope 为 `ci` / `deps` / `release` | 不展示 |

- `feat` / `fix` / `perf` 的 subject 会原样给用户看，建议用中文写用户能感知的结果，工程细节放 body。
- commitlint（husky `commit-msg` hook 与 PR CI）只检查 `type(scope): subject` 格式。
- 开发时 What's New 会显示「即将发布」，即上个 tag 之后的提交，用来检查措辞。
- 发版只需推一个 tag：`git tag v2.0.4 && git push origin v2.0.4`。CI 以 tag 为版本号打包、生成 Release Notes，再把 CHANGELOG 和 4 个 `package.json` 的版本号回写到 master（发版后 `git pull` 即可）。
- v2.0.3 及更早的手写记录冻结在 `docs/archive/CHANGELOG-legacy.md`，不再维护。

---

## 代码规范与架构约定

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
