# Scopify — Agent Instructions

Scopify 是 **Next.js App Router + Electron** 的网易云音乐客户端。根目录是 pnpm Workspaces + Turborepo 编排层；所有应用源码收敛于 `repo/`，Web、Electron 和契约分别位于 `repo/frontend/apps/web`、`repo/frontend/apps/desktop` 和 `repo/frontend/packages/desktop-contract`。前端与 `repo/backend/api-enhanced` 解耦部署；后端有自己的 [AGENTS.md](./repo/backend/api-enhanced/AGENTS.md)。

**本文件是前端/Electron 代码结构的唯一规范。** 下文中未加前缀的 `app/`、`components/`、`types/`、`hooks/`、`lib/` 和 `store/` 路径都相对于 `repo/frontend/apps/web/`。新建或修改代码时必须遵守；发现 inline 类型、散落 hook 等历史债务时，顺手迁移到正确目录。

---

## 检查约定

本地分两道 Git hooks：提交时只查暂存文件，推送前跑一遍与 CI 相同的全仓 typecheck 和 lint。不要把“提交前检查”理解为 Agent 必须额外执行一轮检查。

- **正常提交即可**：只暂存本次任务文件，通过 `git commit` 触发 `.husky/pre-commit`。其中 `lint-staged` 按 `lint-staged.config.mjs` 对暂存文件执行 Prettier，按文件所在工作区（Web、Docs 与各共享包）用该工作区自己的配置执行 ESLint，暂存了 Web 文件时再跑主题硬编码检查（`lint:theme`）；钩子已有的架构检查照常运行，无需手动重复执行。
- **正常推送即可**：`git push` 触发 `.husky/pre-push`，执行与 CI 相同的 `pnpm run typecheck` 和 `pnpm run lint`（turbo 有缓存，没改过的包直接跳过）。类型检查放在推送前而不是每次提交，是因为提交按小项拆分、全量 tsc 不适合每次跑；必须跑全量而不是只跑改动的包，是因为 Docs 通过路径别名引用 Web 源码，turbo 看不到这层依赖。推送前不需要自己再跑一遍。
- **钩子失败时再处理**：读取实际错误，修复本次改动引起的问题后重新提交或推送。不得跳过或禁用钩子（包括 `--no-verify`），也不得为了通过而擅自修改无关文件或放宽规则；推送前钩子报出的是别人留下的问题时，说明情况并交给用户决定。
- **禁止主动追加重复检查**：无论阶段完成还是准备提交，都不要自行运行全仓或包级的 lint、TypeScript/typecheck、Prettier 检查、build，也不要手动重复两道钩子已覆盖的检查。用户明确要求某项检查时，才按指定范围执行。
- **明确覆盖边界**：钩子通过只表示其覆盖的检查通过。提交钩子不执行 TypeScript 检查，只有推送成功才说明全仓 typecheck 和 lint 在本地通过；格式检查、测试与提交信息检查仍由 `.github/workflows/ci.yml` 兜底。只提交未推送时，不要把它报告成类型检查已通过。
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
pnpm run bump              # 统一升级版本（4 个 package.json）
pnpm run changelog:preview # 预览下个版本的更新说明
```

i18n 类型生成与文案审计由 Web 工作区维护，命令见 [Web README](repo/frontend/apps/web/README.md#internationalization)。

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

### `types/` 目录约定

`types/` 先按业务领域建目录（尽量与 `components/` 业务目录同名，如 `types/playlist/`、`types/user/`），目录内再分层：`model.ts`（业务实体）、`api.ts`（请求/响应）、`components.ts`（复用 Props）；同一领域有更多主题时用 `<主题>.ts`、`<主题>Api.ts`、`<主题>Components.ts`。不建 `index.ts` 聚合出口，导入时直接指向具体文件，例如 `@/types/playlist/api`。根目录只保留 `i18n.generated.d.ts`（生成文件）与 `electron.d.ts`（`window.electronAPI` 全局声明，路径被架构检查引用）。新增类型先查 [types/README.md](repo/frontend/apps/web/types/README.md) 的领域索引。

### Query 状态与错误边界

任何新增或修改数据请求、页面加载/错误状态、分页、Mutation、媒体播放错误处理时，必须阅读并遵循 [Query 与错误边界规范](skills/nextjs-project-structure/rules/query-boundaries.md)。

- Query 管理请求状态；React 边界决定失败影响范围。按可独立恢复的业务区域划分边界，禁止把独立请求的错误聚合成整页错误。
- 调用 Query 的组件必须位于对应边界内部；首次无数据失败进入边界，有缓存的后台刷新失败保留内容。`undefined`、成功空数组、暂停请求、取消请求必须区分。
- 分页、用户操作、媒体错误在各自区域处理，不抹去页面或已加载内容。请求失败不得用 `[]`/`null` 伪装成功；收藏等状态不可在失败时伪造默认值。
- 复用统一的 Query 错误边界、错误分类与重试协议；`QueryCache.onError` / `MutationCache.onError` 负责记录，不负责决定页面 UI。
- 迁移按业务区域提交，删除被替代的手工聚合状态和无效封装；遵守本文件的检查约定，不因重构扩大本地检查范围。

### Electron 主进程服务目录

主进程服务统一放在 `repo/frontend/apps/desktop/electron/main/service/`，按功能分目录，不再使用并列的 `capabilities/` 与 `services/`：

- `audio/`：原生音频与音频特征传输。
- `playback/`：播放 Broker 与 Gateway。
- `desktop/`：桌面图标、壁纸与共享桌面原生模块。
- `mcp/`：MCP 服务与播放工具。
- `backend/`、`renderer/`、`cache/`、`updates/`：后端托管、渲染宿主、页面缓存与更新。
- `externalLinks/`、`notifications/`、`discordPresence/`：外链、通知与 Discord 状态。
- `nativeModules/`：通用原生模块加载。

生命周期组装放在 `core/serviceHost.ts`；服务相关类型放在桌面端全局 `types/`，不通过旧目录建立兼容转发。

### Desktop external links

桌面端外部网页统一由 Electron 主进程 `service/externalLinks/index.ts` 交给系统默认浏览器打开；不要为外链新建 BrowserWindow，不要在单个窗口中覆盖全局的新窗口处理规则。

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
