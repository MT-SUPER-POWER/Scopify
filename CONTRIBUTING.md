# 贡献指南

Scopify 是 Next.js App Router 加 Electron 的网易云音乐客户端。根目录是 pnpm Workspaces 加 Turborepo；应用源码都在 `repo/` 下，Web、Electron 和契约分别位于 `repo/frontend/apps/web`、`repo/frontend/apps/desktop` 和 `repo/frontend/packages/desktop-contract`，后端是独立部署的 `repo/backend/api-enhanced`。

## 先读这三篇

写代码前按需读下面的文档，加起来就够开发用了：

| 文档 | 回答什么 | 什么时候读 |
| --- | --- | --- |
| [项目结构与拆分原理](./skills/nextjs-project-structure/rules/architecture.md) | 代码为什么这样分；layout / slot / page / template 各管什么；页面怎么拆 | 新建页面、改路由、不确定东西放哪时，**先读这篇** |
| [组件规则](./skills/nextjs-project-structure/rules/components.md) | 组件放 `@scopify/ui`、`components/` 还是 `_components/`；什么时候升级 | 新写或搬动组件时 |
| [数据请求与边界](./skills/nextjs-project-structure/rules/data-and-boundaries.md) | 请求怎么封装；加载与失败怎么控制影响范围；Suspense 与 slot 怎么配合 | 新增数据请求、骨架屏、错误处理时 |

三篇规则都很短，规则本身不复杂：**layout 决定放在哪，slot 决定放什么，page 只是随 URL 切换的那一块；组件分三层（最小可复用 Base、基于 Base 改造的多路由业务组件、页面特有的非复用组件）；Query 管请求状态，React 边界管失败范围；内容膨胀且集中表达独立功能时才拆分。**

## 开发环境

| 项 | 要求 |
| --- | --- |
| 包管理器 | pnpm（版本见根 `package.json` 的 `packageManager`） |
| 脚本与测试运行时 | bun（>= 1.3.11，运行 `*.ts` 脚本与 `bun test`） |
| Node | >= 20 |

```bash
pnpm install
pnpm run dev            # Web + Electron
pnpm run dev:web        # 仅 Web
pnpm run dev:desktop    # 仅 Electron（需要 Web dev server）
pnpm run dev:full       # Web + Electron + 后端联调
```

- **同时只开一个 Web dev server。** 第二个会共用 `.next` 并破坏路由（Electron 里表现为莫名其妙的 404）。
- 后端是独立部署的，首次克隆后运行 `git submodule update --init --recursive`，再用 `pnpm run dev:backend` 启动。

## 提交

- **提交信息**用 [Conventional Commits](https://www.conventionalcommits.org/)：`type(scope): subject`，由 commitlint 在 `commit-msg` 钩子和 PR CI 里检查。
- **更新说明从提交生成**，不手写 changelog：
  - `feat`（新增）、`fix`（修复）、`perf`（优化）的 subject 会原样展示给用户，用中文写用户能感知的结果，如 `fix(player): 切歌后音量不再被重置`。
  - 其他类型，或 scope 为 `ci` / `deps` / `release` 的提交不展示。工程细节写在 body 里。
- **一个提交只做一件事**，批量改动拆成可以单独审阅的小提交。
- **正常 `git commit`、`git push`**：提交时钩子会对暂存文件跑 Prettier、ESLint 和轻量架构检查；push 不跑检查。全仓 lint、类型检查、测试由 CI 兜底，需要时自己运行 `pnpm run lint` 或 `pnpm run typecheck`。
- **不要跳过钩子**（不要用 `--no-verify`）。钩子失败时读报错、修本次改动引起的问题再提交。
- 发版只需推一个 tag：`git tag v2.0.4 && git push origin v2.0.4`，其余由 CI 完成。

## 其他规范

| 内容 | 位置 |
| --- | --- |
| 共享 UI 包（`@scopify/ui`）的 shadcn / Scopify 扩展边界 | [skills/ui-package-boundaries](./skills/ui-package-boundaries/SKILL.md) |
| Desktop 与 Web 的契约、IPC、构建产物 | [docs/architecture](./docs/architecture/) |
| 导航与滚动恢复的设计 | [navigation-scroll-architecture](./docs/architecture/navigation-scroll-architecture.md) |
| 后端 API 规范 | [repo/backend/api-enhanced/AGENTS.md](./repo/backend/api-enhanced/AGENTS.md) |
| i18n 类型生成与文案审计 | [Web README](./repo/frontend/apps/web/README.md#internationalization) |
| AI Agent 的工作约定 | [AGENTS.md](./AGENTS.md) |
