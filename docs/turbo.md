# Turbo 任务与缓存

Turbo 负责跨包编排；只有能完整恢复产物的任务才缓存。

| 任务 | 缓存内容 / 策略 |
| --- | --- |
| Web `build` | `.next/` 生产产物，排除 `cache/` 和 `dev/` |
| Web `build:desktop` | `out/` 静态 Renderer，排除 `cache/` 和 `dev/` |
| Docs `build` | `.next/` 生产产物和 Fumadocs `.source/`，排除 `.next/cache/` 和 `.next/dev/` |
| `lint`、`typecheck`、`test` | 缓存成功结果和日志；源码或依赖变化后重新执行 |
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
