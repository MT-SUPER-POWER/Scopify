# 组件规则

> 回答一个问题：我写的这个组件该放哪。路由怎么拆见 [项目结构与拆分原理](./architecture.md)，请求和错误边界见 [数据请求与边界](./data-and-boundaries.md)。

## 三层归属

| 层 | 放什么 | 约束 |
| --- | --- | --- |
| `@scopify/ui`（`repo/frontend/packages/ui`） | 全局共享的 UI：shadcn 原生组件，以及有 Scopify 特色、可复用的纯展示组件 | 不依赖 store、路由、API、i18n；文案和回调全部通过 props 传入 |
| `components/<领域>/`（Web 应用内） | 带业务耦合（store、Query、i18n、路由），且被两个及以上路由使用的组件；跨页面的领域（播放器、歌词、侧栏、设置面板） | 按业务领域分目录；`shared/` 只放跨领域的通用业务组件 |
| `<路由>/_components/` | 某个页面或某个 `@slot` 专属的组件 | 现有组件靠 props 和 token 小改动适配不了时，才复制过来改造；不允许被其他路由导入 |

## 选择顺序

写组件前，按这个顺序往下走，第一个满足的就是答案：

1. **已有组件能用 props 和 token 满足吗？**能，就直接用，不复制、不包一层。
2. **是纯展示、有 Scopify 特色、会被多个页面共用吗？**是，放 `@scopify/ui` 的 `scopify/components/`。
3. **带业务耦合，且已经被两个及以上路由使用吗？**是，放 `components/<领域>/`。
4. **其他：**放使用它的路由的 `_components/`。

拿不准时放 `_components/`。需要共用时再升级，不要为了「以后可能复用」预先放进全局。

## 升级规则

`_components/` 里的组件被第二个路由需要时，**不要跨目录导入**，把它移走再导入：

- 纯展示、可以由 props 驱动 → 升级到 `@scopify/ui` 的 `scopify/components/`
- 带 store、Query、i18n、路由的业务组件 → 升级到 `components/<领域>/`

被其他路由导入 `app/` 下的文件是被禁止的。

## `_components/` 规则

- 可以放在路由目录，也可以放在 `@slot` 目录下。Next.js 不会把下划线开头的私有目录当路由。
- 只放该路由专属的东西：区域的展示组件、骨架屏、空状态。
- 在路由里改造现有组件之前，先确认 props 和 token 真的表达不了；能表达就在调用处用 props。
- 类型、hooks、常量仍然全局，通过 `@/types/...`、`@/hooks/...` 导入，不在 `_components/` 里定义。
- 同一个路由里的组件用相对路径导入（`./_components/Xxx`）。

## `components/` 里怎么组织

- 必须先按业务领域建子目录，禁止把组件平铺在 `components/` 根层。
- 新业务出现时，直接新建 `components/<领域>/`，不要往 `shared/` 里堆。`shared/` 只放跨多个领域的通用业务组件。
- `components/ui/` 是 `@scopify/ui` 之前遗留的基础组件目录。新的通用基础组件放 `@scopify/ui`，不往这里加；改动到这里的组件时顺手评估是否迁到 `@scopify/ui`。

## `@scopify/ui` 怎么用

`@scopify/ui` 有两层，依赖方向是单向的：

```text
Web 业务组件  →  @scopify/ui/scopify  →  @scopify/ui/shadcn
                              └──→  共享主题 token
```

| 层 | 内容 | 能不能改 |
| --- | --- | --- |
| `shadcn/` | shadcn CLI 生成的原生组件，用 `@scopify/ui/shadcn/components/xxx` 导入 | **不能手改**。要升级就通过 shadcn CLI 刷新 |
| `scopify/` | 产品扩展：原生 props 与 token 表达不了的结构或行为，以及可复用的纯展示组件，用 `@scopify/ui/scopify/components/xxx` 导入 | 可以，但不能依赖 store、路由、API、i18n |

规则：

- 标准 props、`className`、组合与共享 token 能满足的，直接用原生组件，不要为了改个 prop 名、套个布局类再包一层。
- 只有改了 DOM 结构、交互或无障碍行为，或者样式无法用 token 表达时，才把原生组件复制到 `scopify/components/` 再扩展。扩展起一个体现产品概念的名字（如 `PlaybackButton`），不要覆盖原生名字（`Button`）。
- 一个纯展示的组件只有一个页面在用时，留在那个页面的 `_components/`，第二个页面要用再升级到 `scopify/`。
- 只改颜色、圆角、间距这类 token 能表达的值，改主题 token，不要复制组件。
- 样式沉淀到共享的 `scopify/theme.css` 必须是多个扩展都需要的产品语义；只有一处用的布局样式留在调用处。

细则见 [ui-package-boundaries](../../ui-package-boundaries/SKILL.md)。

## 拆分与写法

- 单个组件文件超过 **150 行**必须拆分；一个文件只定义一个组件。
- JSX 里有可识别的独立区块（header、body、footer）时，各自提取为同目录的独立文件。
- 默认写 Server Component，用到 `useState`、`useEffect`、事件处理、浏览器 API 时才加 `'use client'`，并写在文件第一行。Client 组件尽量下推到叶子节点。
- 组件内的逻辑超过 15 行、被多处复用或含 `useEffect` 加状态管理时，提取成 `hooks/` 里的 hook。
- 在写新组件前，先看 shadcn 有没有现成组件，见 [shadcn 组件清单](../assets/shadcn.md)。

## 速查

| 我要写…… | 放哪 |
| --- | --- |
| 一个按钮、对话框、输入框 | 直接用 `@scopify/ui/shadcn` |
| 带 Scopify 样式、多页面共用、不碰 store/i18n 的卡片或分页器 | `@scopify/ui` 的 `scopify/components/` |
| 要读 store 或请求数据，三个页面都用 | `components/<领域>/` |
| 只有评论页头部用的组件 | `comment/@header/_components/` |
| 现有组件差一点，页面里要改 DOM 结构 | 复制到该页面的 `_components/` 再改造 |
