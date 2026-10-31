# 代码结构规则

前端代码结构的规则只有三篇。**规则文件放在 [skills/nextjs-project-structure/rules/](../../skills/nextjs-project-structure/rules/)，是唯一来源**；这里只是方便浏览的索引，请直接点进去读，不要在这里复制一份内容。

| 文档 | 回答什么 |
| --- | --- |
| [项目结构与拆分原理](../../skills/nextjs-project-structure/rules/architecture.md) | 代码为什么这样分；layout / slot / page / template 各管什么；页面怎么拆；类型与 hooks 放哪 |
| [组件规则](../../skills/nextjs-project-structure/rules/components.md) | 组件放 `@scopify/ui`、`components/` 还是 `_components/`；什么时候升级 |
| [数据请求与边界](../../skills/nextjs-project-structure/rules/data-and-boundaries.md) | 请求怎么封装；加载与失败怎么控制影响范围；Suspense 与 slot 怎么配合 |

一句话原理：**layout 决定放在哪，slot 决定放什么，page 只是随 URL 切换的那一块；组件按使用范围分三层；Query 管请求状态，React 边界管失败范围。**

贡献者入口见 [CONTRIBUTE.md](../../CONTRIBUTE.md)。
