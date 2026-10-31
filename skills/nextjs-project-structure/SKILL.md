---
name: nextjs-project-structure
description: 约束 Scopify Web 的代码结构。当用户要求创建或修改页面、路由、组件、hooks、类型定义、数据请求、骨架屏、错误处理，或涉及 layout / template / @slot / _components 时触发。规则的唯一来源是 docs/rules/ 下三篇文档，开工前按任务读对应的一篇。
allowed-tools: Bash(find . -type f -name "*.tsx" -o -name "*.ts" | grep -v node_modules), Bash(wc -l)
---

# Scopify 代码结构

> 规则写在 [docs/rules/](../../docs/rules/)，贡献者入口是 [CONTRIBUTE.md](../../CONTRIBUTE.md)。本 skill 只负责提醒你读哪一篇，不重复规则内容；冲突时以文档为准。

## 按任务读文档

| 你要做的事 | 先读 |
| --- | --- |
| 新建页面、改路由、拆 slot、用 layout / template、不确定类型 hooks 放哪 | [项目结构与拆分原理](../../docs/rules/architecture.md) |
| 新写、搬动、复用组件；判断 `@scopify/ui`、`components/`、`_components/` | [组件规则](../../docs/rules/components.md) |
| 新增数据请求、骨架屏、错误处理、分页、Mutation | [数据请求与边界](../../docs/rules/data-and-boundaries.md) |
| 新增或修改 `@scopify/ui` 里的组件 | [ui-package-boundaries](../ui-package-boundaries/SKILL.md) |

## 一句话原理

**layout 决定放在哪，slot 决定放什么，page 只是随 URL 切换的那一块。** 组件分三层：纯展示的特色组件进 `@scopify/ui`，带业务耦合且多路由共用的进 `components/<领域>/`，页面专属的放路由 `_components/`。Query 管请求状态，React 边界管失败范围。

## 新建文件前

1. **判断归属**：它是路由文件、组件、类型、hook、工具函数还是常量？
2. **组件走选择顺序**：已有组件能用 props 和 token 满足就直接用；否则看是纯展示、多路由共用还是页面专属（见组件规则）。
3. **类型、hooks、常量、状态一律全局**：`types/<领域>/`、`hooks/<领域>/`、`constants/`、`store/module/`，不写在路由文件夹或组件文件里。
4. **路由层**：排版写在 layout；可独立加载、独立失败的区域用 `@slot`；`page.tsx` 不做层层转发。
5. **找大文件**：单个组件文件超过 150 行要拆分。

```bash
# 找出超过 150 行的组件（需要拆分的候选）
find components -name "*.tsx" | xargs wc -l | sort -rn | head -20
```

## 参考

- [shadcn 组件清单](./assets/shadcn.md)：新写组件前先看有没有现成的
