---
name: nextjs-project-structure
description: 约束 Scopify Web 的代码结构。当用户要求创建或修改页面、路由、组件、hooks、类型定义、数据请求、骨架屏、错误处理，或涉及 layout / template / @slot / _components 时触发。规则的唯一来源是本 skill 的 rules/ 下三篇文档，开工前按任务读对应的一篇。
allowed-tools: Bash(find . -type f -name "*.tsx" -o -name "*.ts" | grep -v node_modules), Bash(wc -l)
---

# Scopify 代码结构

> 规则写在本 skill 的 [rules/](./rules/) 下，是唯一来源；贡献者入口是 [CONTRIBUTE.md](../../CONTRIBUTE.md)，`docs/rules/` 是给人浏览的索引。本 skill 只负责提醒你读哪一篇。

## 按任务读文档

| 你要做的事 | 先读 |
| --- | --- |
| 新建页面、改路由、拆 slot、用 layout / template、不确定类型 hooks 放哪 | [项目结构与拆分原理](./rules/architecture.md) |
| 新写、搬动、复用组件；判断 `@scopify/ui`、`components/`、`_components/` | [组件规则](./rules/components.md) |
| 新增数据请求、骨架屏、错误处理、分页、Mutation | [数据请求与边界](./rules/data-and-boundaries.md) |
| 新增或修改 `@scopify/ui` 里的组件 | [ui-package-boundaries](../ui-package-boundaries/SKILL.md) |

## 一句话原理

**layout 决定放在哪，slot 决定放什么，page 只是随 URL 切换的那一块。** 组件分三层：可抽象为最小复用案例的原子 Base 进 `@scopify/ui`；Base 满足不了要求时、基于 Base 改造的多路由业务组件进 `components/<领域>/`；页面特有、基于 Base 改造且不多路复用的小组件进 `_components/`。Query 管请求状态，React 边界管失败范围。

## 新建文件前

1. **判断归属**：它是路由文件、组件、类型、hook、工具函数还是常量？
2. **组件走选择顺序**：已有 Base 能用 props 和 token 满足就直接用；Base 满足不了时，看是抽象为多路由公用最小 Base、基于 Base 改造的领域多路复用组件，还是页面特有特殊需求组件（见组件规则）。
3. **类型、hooks、常量、状态一律全局**：`types/<领域>/`、`hooks/<领域>/`、`constants/`、`store/module/`，不写在路由文件夹或组件文件里。
4. **路由层**：排版写在 layout；可独立加载、独立失败的区域用 `@slot`；`page.tsx` 不做层层转发。
5. **拆分标准**：单文件内容变多、且某一块集中表达一个独立功能时才拆分；拆分是为了职责清晰与功能聚焦，几行写完或割裂功能完整性的不单独建文件（见组件规则「拆分的标准」）。

## 参考

- [shadcn 组件清单](./assets/shadcn.md)：新写组件前先看有没有现成的
