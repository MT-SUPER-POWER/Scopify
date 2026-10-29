# Turbo 任务与缓存

Turbo 负责跨包编排；只有能完整恢复产物的任务才缓存。

| 任务 | 缓存内容 / 策略 |
| --- | --- |
| Web `build` | `.next/` 生产产物，排除 `cache/` 和 `dev/` |
| Web `build:desktop` | `out/` 静态 Renderer，排除 `cache/` 和 `dev/` |
| Docs `build` | `.next/` 生产产物和 Fumadocs `.source/`，排除 `.next/cache/` 和 `.next/dev/` |
| `lint`、`test` | 缓存成功结果和日志；源码或依赖变化后重新执行 |
| `typecheck` | 缓存成功结果、日志和各工作区 `.cache/typecheck.tsbuildinfo` |
| Desktop `build`、`build:host` | 不缓存：包含原生模块构建、资源复制和运行时检查，不能只恢复 JS 输出 |
| `sync:renderer` | 不缓存：每次同步 Renderer 并写入当前提交信息；上游 Web 构建可命中缓存 |
| `dev`、`package:win`、`package:mac` | 不缓存 |

## 缓存键

- 默认保留 Turbo 的源码、包依赖和锁文件追踪，不缩减为容易遗漏输入的扩展名白名单。
- CHANGELOG 只影响 Web 的两种生产构建；提交 SHA 仅透传，供每次执行的 Renderer 同步任务写入 manifest。
- `APP_CFG_*`、`BACKEND_*`、`FRONTEND_*` 和构建目标等配置参与 Web 构建缓存键，不再使所有任务失效。Next.js 的公共环境变量仍由 Turbo 自动识别。
- Web 和 Docs 构建显式追踪 `.env*`，包括被 Git 忽略的本地配置文件。
- Web 沿用 Next 默认的 `.next/`：开发输出位于 `.next/dev/`，生产构建使用其余目录。Desktop 静态 Renderer 固定输出到 `out/`，供同步脚本消费；不再提供 `NEXT_DIST_DIR` 自定义目录入口。

## 磁盘预算

根目录 `turbo.json` 设置本地缓存预算为 **2 GB / 7 天**。Turbo 在后续任务开始时后台淘汰旧条目；这不是运行中始终不超过 2 GB 的硬配额，单次写入后可以暂时超限。

不要把 `.next/dev/`、Next 编译缓存、原生编译中间目录或安装包加入 Turbo 的构建归档。它们有各自的生命周期；缓存目录增长时，应先查归档 manifest 的路径和大小，而不是扩大缓存预算。

修改缓存配置会使相关任务首次重新执行；连续输入不变时才应命中。需要排查时可用 `pnpm exec turbo run <task> --filter=<package> --dry=json` 查看任务图、输入、缓存键和输出规则，不执行实际任务。

配置说明：[Turbo 缓存](https://turborepo.dev/docs/crafting-your-repository/caching)、[缓存容量与过期](https://turborepo.dev/docs/reference/configuration#cachemaxsize)。

## 类型检查增量与并行

开发者按需执行、CI 固定执行全仓 `pnpm run typecheck`，不使用 `--affected`。Turbo 决定哪些任务可复用成功结果；缓存未命中时，TypeScript 复用自己的增量信息。

- 七个前端工作区的 `typecheck` 脚本显式使用 `--incremental --tsBuildInfoFile .cache/typecheck.tsbuildinfo`。该文件仅供类型检查使用，与 Next 开发、生产构建默认的增量文件隔离；已有 `*.tsbuildinfo` 忽略规则覆盖它。
- `typecheck:transit` 是无对应 package script 的虚拟任务，通过 `^typecheck:transit` 传播 workspace 依赖变化。实际 `typecheck` 只依赖该虚拟任务，不等待依赖包的类型检查，因此可以并行执行。当前共享包直接导出源码；如果未来改为消费生成的声明文件，需要重新声明生成任务的先后关系。
- Docs 类型检查额外依赖 `@scopify/web#typecheck:transit`。这会追踪 Web 默认输入及其传递 workspace 依赖，补齐路径别名带来的跨应用依赖；无需把 Web 的实际类型检查加入等待链。这是保守失效策略，Web 中未被 Docs 使用的变更也可能使 Docs 重新检查。
- CI 的 Typecheck job 单独缓存增量文件，以系统、锁文件和 tsconfig 哈希隔离状态，并按提交写入新缓存。恢复同配置的最近状态后，即使源码变化使 Turbo 缓存未命中，tsc 仍有增量状态可用。增量文件不代表检查成功，失败不会被 Turbo 当作成功缓存。

### 验证方式

1. 在安装完依赖的独立 Worktree 中运行 `pnpm run typecheck`，记录总耗时与各任务耗时，确认七个工作区生成自己的增量文件。
2. 输入不变时再运行同一命令，预期七个实际类型检查任务命中 Turbo 缓存。不要把这一结果当作 TypeScript 增量提速的测量。
3. 用 `pnpm exec turbo run typecheck --dry=json` 保存任务哈希和依赖；临时修改 Web 源码后再次 dry-run，Web 和 Docs 的哈希都应变化。修改 Web 依赖的共享包后，Docs 哈希也应变化。恢复修改后，哈希应恢复。
4. 检查 dry-run 中实际类型检查的依赖，预期只有 transit 节点，不出现依赖包的实际 `#typecheck`。并行度仍受 Turbo concurrency 和机器资源限制。
5. 如需测量 TypeScript 增量本身，使用同一代码与同一依赖，分别保留、移走类型检查专用增量文件，运行相同的工作区类型检查脚本并比较耗时；直接运行工作区脚本以避开 Turbo 成功结果缓存。先做冷运行，再做无变化和小改动的热运行，多次测量，不承诺固定提速比例。
6. CI 连续两次运行时，检查增量状态恢复日志、Turbo 命中情况和实际检查耗时。新 Worktree 的本地结果不能证明 GitHub Actions 缓存已经验证成功。

## Lint 统一编排

- `pnpm run lint` 是全仓前端 lint 的统一入口，只调用 `turbo run lint --filter="@scopify/*"`。架构、共享包脚本覆盖检查、各工作区 ESLint 和 Web 主题检查的关系都在 `turbo.json` 声明，不在根脚本或 Web 脚本中串联多套检查。
- 工作区 lint 依赖 `^lint`，并依赖根任务 `//#lint:architecture` 与 `//#lint:packages`。这两个轻量扫描不缓存，每次按当前仓库结构检查，避免新增文件或包被历史结果掩盖。
- Web lint 额外依赖 `lint:theme`，其自身脚本只运行 ESLint。主题任务使用 Web 默认输入参与缓存。
- Desktop 尚未接入 ESLint，保留虚拟 lint 节点，显式依赖 desktop-contract、notification-core 和根检查；不沿独立部署的后端依赖执行后端 lint。未来接入 Desktop ESLint 时沿用这个边界。
- pre-commit 通过 `pnpm exec turbo run lint:staged` 运行根任务：先做轻量架构检查，再执行 lint-staged。暂存文件按工作区自身的 lint 声明识别，Web 主题检查也调用同一个 Turbo 任务。该路径不运行全仓 ESLint。
- 不设置 pre-push 检查。类型检查保留增量和并行优化，供手动命令及 CI 使用。
