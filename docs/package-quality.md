# 共享包质量检查

`repo/frontend/packages/*` 是独立工作区包，质量检查由各包的脚本声明，根脚本和 CI 统一编排。

| 包 | ESLint | TypeScript | 已有单元测试 |
| --- | --- | --- | --- |
| `desktop-contract` | 是 | 是 | 暂无 |
| `notification-core` | 是 | 是 | 暂无 |
| `playback-core` | 是 | 是 | 已接入 CI |
| `ui` | 自有源码和测试 | 含 shadcn 生成层 | 已接入 CI |

- `pnpm run lint:packages` 校验每个包都有 `lint`、`typecheck` 和 `tsconfig.json`；存在测试文件时必须声明 `test`。新增包不能因漏写脚本而被 Turbo 静默跳过。
- `pnpm run lint` 通过 Turbo 统一编排架构检查、入口校验、主题检查和各包的 ESLint；检查依赖关系集中在 `turbo.json`。共享包使用 `repo/frontend/packages/eslint.config.mjs` 中的 TypeScript 推荐规则；UI 另检查 Hooks 调用与依赖。
- `pnpm run typecheck` 供开发者按需执行，并在 CI 检查各包类型；不挂载到 pre-push。
- `pnpm run test` 执行根目录 `scripts/` 的治理测试；`pnpm run test:packages` 执行共享包已有的单元测试。
- Prettier 继续通过 CI 的 `pnpm run format:check` 覆盖，遵循根忽略规则。

UI 的 `shadcn/` 是 CLI 生成层，不通过 ESLint 推动手工改写；它仍参与类型检查。自有 `scopify/`、`folia/` 和测试代码不享受此例外。

CI 的应用单元测试接入和 Desktop ESLint 不在本次共享包补齐范围内。本地只验证检查入口和配置；全量检查交给 CI，接入前的历史问题也应由门禁如实暴露。
