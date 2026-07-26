# 页面导航与滚动恢复研究

> 调研日期：2026-07-26
> 项目基线：Next.js `16.1.6`、React `19.2.3`、`@tanstack/react-virtual` `3.14.8`、Radix UI `ScrollArea`（通过 `radix-ui` `1.6.5`）
> 文档性质：架构决策的证据输入，不是最终 ADR，也不约束具体实现。

## 结论摘要

1. **更换 shadcn/Radix `ScrollArea` 不能解决页面间滚动协调。** Radix 明确说明其滚动是浏览器原生滚动，`Viewport` 就是真实滚动元素，没有用 CSS transform 模拟滚动。因此问题的核心是路由语义、历史条目、容器所有权和内容就绪时机，而不是滚动条组件。[Radix Scroll Area](https://www.radix-ui.com/primitives/docs/components/scroll-area)
2. **Next.js 的默认滚动行为不是“所有新页面都回顶部”。** `<Link>` 默认尽量维持当前位置；仅当新 `Page` 不在视口内时，才寻找首个可见、可滚动的顶层元素并滚动。`scroll={false}` 或 `router.push(..., { scroll: false })` 只是让 Next 不尝试滚动，不会提供自定义容器恢复协议。[Next.js Link: `scroll`](https://nextjs.org/docs/app/api-reference/components/link#scroll)
3. **浏览器历史本身是逐条目保存滚动状态的模型。** HTML 标准把 scroll restoration mode、scroll position data 和 History API state 都定义在 session history entry 上；可恢复区域包括 viewport 和文档内所有可滚动区域。`auto` 由浏览器尝试恢复，`manual` 则由应用负责。[HTML Standard: session history entries](https://html.spec.whatwg.org/multipage/browsing-the-web.html#session-history-entries) [HTML Standard: persisted user state restoration](https://html.spec.whatwg.org/multipage/browsing-the-web.html#persisted-user-state-restoration)
4. **App Router 没有公开的全局 `routeChangeStart/Complete` 事件。** 官方迁移文档要求用 `usePathname()` 与 `useSearchParams()` 组合观察导航；`useRouter()` 公开 `push`、`replace`、`back`、`forward` 等命令，但没有 Pages Router 的事件总线。[Next.js `useRouter`](https://nextjs.org/docs/app/api-reference/functions/use-router) 因此，若需要在所有入口上保存“离开前”状态，不能只包装 `router.push()`，还必须覆盖 `<Link>`、原生 history、浏览器前进/后退及 Electron 快捷键等入口，或改为持续采样容器状态。
5. **TanStack Virtual 已提供恢复所需的底层能力，但没有“一次调用即可判断页面已准备好”的路由协议。** 它支持自定义 `getScrollElement`、`initialOffset`、`initialMeasurementsCache`、`scrollToOffset`、`scrollToIndex`、`measure()`，当前版本还提供 `takeSnapshot()`。官方建议用 measurement snapshot 加 offset 恢复精确位置；虚拟列表仍需由页面适配器声明数据、滚动元素和测量何时可用。[TanStack Virtual: Virtualizer API](https://tanstack.com/virtual/latest/docs/api/virtualizer)
6. **现成方案没有一个可以无代价替换 Scopify 所需的协调层。** `next-scroll-restorer` 当前已发布的 `0.11.0` 声明支持 Next 15/16 和 React 19，但源码只监听/写入 `window`；`@moxy/next-router-scroll` 依赖 Pages Router 的 `_app.js` 和 router events；`react-activation` 官方兼容表止于 React 18，且对 `createRoot` 有明确警告。TanStack Router 的滚动恢复最完整，包含嵌套容器和虚拟列表示例，但采用它意味着路由架构迁移，而不是给 Next App Router 增加一个小插件。

## 1. Next.js 16 App Router

### 1.1 导航命令与历史语义

官方 `useRouter` API 的语义如下：[Next.js `useRouter`](https://nextjs.org/docs/app/api-reference/functions/use-router)

| 操作 | 历史行为 | 可控制 Next 滚动 |
| --- | --- | --- |
| `router.push(href, { scroll })` | 新增 history entry | 是 |
| `router.replace(href, { scroll })` | 替换当前 history entry | 是 |
| `router.back()` | 浏览器历史后退 | 无单次 `scroll` 参数 |
| `router.forward()` | 浏览器历史前进 | 无单次 `scroll` 参数 |
| `<Link replace>` | 替换或新增 entry | `scroll` prop |

Next 也允许直接调用 `window.history.pushState()` / `replaceState()`；官方说明这些调用会和 App Router 集成，并同步 `usePathname` / `useSearchParams`。[Next.js: Native History API](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api)

设计含义：

- 恢复键应默认对应**具体 history entry**，不能只用 pathname。`/playlist?id=1` 连续访问两次可能应恢复到两个不同位置。
- `replace` 不产生新条目，应更新当前 entry 的元数据；`push` 应生成新 entry 元数据；`back/forward` 应读取目标 entry。
- 如果把应用数据写入 `history.state`，必须保留并合并现有 state，不能整体覆盖。Next 16 的 App Router 会在 history state 中保存自己的路由树；其 restore reducer 在 `popstate` 时从该 state 恢复路由。[Next.js 16.1.6 `restore-reducer.ts`](https://github.com/vercel/next.js/blob/v16.1.6/packages/next/src/client/components/router-reducer/reducers/restore-reducer.ts)

### 1.2 默认滚动行为的边界

`<Link>` 的 `scroll` 默认值为 `true`。官方描述的算法是：

- 若新页面仍在视口中，维持当前位置；
- 否则遍历顶层节点，跳过 fixed/sticky、不可见、不可滚动和没有渲染 HTML 的节点；
- 找到首个合适节点后滚动；
- `scroll={false}` 时不执行这套管理。[Next.js Link: `scroll`](https://nextjs.org/docs/app/api-reference/components/link#scroll)

Next 文档说明该过程会使用原生 `scrollIntoView()`；该 API 默认会滚动目标的所有可滚动祖先，因此即使主 viewport 是嵌套的 Radix `ScrollArea`，也可能被 Next 的默认定位间接写入。[Next.js Link: scroll offset with sticky headers](https://nextjs.org/docs/app/api-reference/components/link#scroll-offset-with-sticky-headers) [MDN: `Element.scrollIntoView()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)

这套 API 没有公开以下能力：

- 注册一个长期共享的主 `ScrollArea.Viewport`；
- 给多个滚动区域分别指定恢复键；
- 等虚拟列表测量完成后再恢复；
- 以业务实体 ID 加行内偏移作为语义锚点。

因此，`scroll={false}` 适合用于**关闭 Next 的写入权**，但它本身不是滚动恢复实现。

### 1.3 返回导航与页面生命周期

Next 的客户端导航会保留 shared layouts 并替换页面内容；官方把它描述为保留共享 UI、用新 page 或 loading state 替换内容。[Next.js: Client-side transitions](https://nextjs.org/docs/app/getting-started/linking-and-navigating#client-side-transitions) 这不等于任意 page 都是 keep-alive：页面 DOM 是否仍存在取决于路由树和缓存，不应把“组件碰巧未卸载”作为滚动正确性的前提。

Next 16.1.6 的 App Router restore reducer 在历史遍历时恢复路由树和 cache，并沿用已有的 `focusAndScrollRef`；它没有公开应用级滚动快照接口。[Next.js 16.1.6 `restore-reducer.ts`](https://github.com/vercel/next.js/blob/v16.1.6/packages/next/src/client/components/router-reducer/reducers/restore-reducer.ts)

## 2. 浏览器 History API

### 2.1 每条历史记录拥有自己的状态

HTML 标准规定：

- `pushState(data, ..., url)` 新增 session history entry，并将 `data` 结构化序列化到该 entry；
- `replaceState(data, ..., url)` 更新当前 entry；
- `history.state` 返回当前 active entry 的反序列化 state。[HTML Standard: History interface](https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-history-interface)

这使 history entry 成为表达“用户回到哪一次访问”的准确身份。pathname/session map 可以作为产品策略，但不是浏览器的默认身份模型。

History state 必须可结构化克隆，浏览器还可能限制序列化后的大小。适合只放有命名空间的 entry ID 或小型元数据；Virtual measurements 等较大快照更适合内存或 `sessionStorage`。[MDN: `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)

### 2.2 `scrollRestoration` 也是逐条目属性

标准将 `history.scrollRestoration` 定义为 active session history entry 的 scroll restoration mode：

- `auto`：浏览器负责尝试恢复；
- `manual`：页面负责恢复，浏览器不自动尝试。[HTML Standard: scroll restoration mode](https://html.spec.whatwg.org/multipage/browsing-the-web.html#scroll-restoration-mode)

标准还提醒：多数应用若希望所有条目使用同一模式，应尽早设置，因为该值属于条目并会影响后续 entry。[HTML Standard: `History.scrollRestoration`](https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-history-scroll-restoration)

### 2.3 原生恢复覆盖嵌套滚动区域，但仍不是完整应用协议

标准中的 restorable scrollable regions 包含文档 viewport 和文档内所有可滚动区域（排除 navigable containers）；浏览器可以周期性重试恢复，直到内容可用或用户已经滚动。[HTML Standard: restorable scrollable regions](https://html.spec.whatwg.org/multipage/browsing-the-web.html#restorable-scrollable-regions)

但标准同时明确：即使浏览器不恢复，也不代表位置会保持在某个确定值；应用不能假设结果，若要求确定性就应主动设置目标位置。[HTML Standard: persisted user state restoration](https://html.spec.whatwg.org/multipage/browsing-the-web.html#persisted-user-state-restoration)

对 Scopify 的含义：

- Radix `Viewport` 是原生滚动元素，理论上属于浏览器可恢复区域；不需要因为“自定义滚动条”就换组件。
- App Router 的局部 DOM 替换、异步数据、虚拟列表高度变化以及应用自己的滚动写入，会让纯原生恢复缺少可验证的确定性。
- 必须在全局选择一种所有权：让浏览器 `auto` 管，或设为 `manual` 后由协调器管。两者再叠加 Next 的默认写入和页面 hook，会产生竞态。

## 3. TanStack Virtual

### 3.1 可用的恢复原语

Scopify 当前版本公开以下能力：[TanStack Virtual: Virtualizer API](https://tanstack.com/virtual/latest/docs/api/virtualizer)

| API | 用途 | 限制/注意 |
| --- | --- | --- |
| `getScrollElement()` | 指向共享的 `ScrollArea.Viewport` | 初始 render 可返回 `null` |
| `initialOffset` | 首次测量前设置像素 offset | 只适合初始化，不是每次重放命令 |
| `initialMeasurementsCache` | 用历史测量结果预热尺寸 | 需要与稳定 item key、数据版本配套 |
| `takeSnapshot()` | 导出已测量 item 的快照 | 未测量项仍回退到估算尺寸 |
| `scrollToOffset()` | 恢复像素位置 | 动态行高变化后可能需要校正 |
| `scrollToIndex()` | 定位到 item index | 业务 ID 需先映射到当前 index |
| `measure()` / `measureElement()` | 重新测量 | 调用本身不代表数据已稳定 |

官方文档明确建议将 `takeSnapshot()` 与当前 `scrollOffset` 一起保存，并在重新挂载时传给 `initialMeasurementsCache` 和 `initialOffset`，用于导航后的精确恢复。[TanStack Virtual: `takeSnapshot`](https://tanstack.com/virtual/latest/docs/api/virtualizer#takesnapshot)

`getItemKey` 应使用持久业务 ID，而非数组 index；这既让测量缓存有身份，也使增删/重排后仍可解析语义锚点。[TanStack Virtual: `getItemKey`](https://tanstack.com/virtual/latest/docs/api/virtualizer#getitemkey)

### 3.2 “就绪”需要页面协议

TanStack Virtual 会在滚动元素出现后观察其 rect 和 offset；`scrollElement`、`scrollRect`、virtual items 和测量缓存是可观测状态，但 API 没有返回一个涵盖“路由已提交 + 数据已加载 + 容器可见 + 行已测量”的统一 Promise。[TanStack Virtual: `scrollElement`](https://tanstack.com/virtual/latest/docs/api/virtualizer#scrollelement)

因此虚拟页面适配器至少需要表达：

1. 数据身份与版本已知；
2. scroll element 已挂载且尺寸非零；
3. virtualizer 已获得足以到达目标的估算或测量；
4. 恢复命令已执行，并允许一次测量后的校正；
5. 用户已开始滚动时，过期恢复不得覆盖用户输入。

普通非虚拟页面无需知道这些细节，只需由协调器对真实容器读写 `scrollTop`。

### 3.3 像素恢复与语义锚点

两者解决的问题不同：

- **像素 offset** 对同一 DOM/数据快照最精确，适合普通页面及数据未变化的返回。
- **业务 ID + 行内偏移** 能在列表头部增删后保持用户看到的实体，但必须重新把 ID 映射到 index，再用 `scrollToIndex` 和偏移校正。
- **混合快照** 可同时保存业务锚点、像素 offset 和 measurements；锚点不存在时回退到 offset。

TanStack Virtual 提供实现这些策略的原语，但不会替应用选择数据变化语义。

## 4. 第三方与替代路线

### 4.1 适配矩阵

| 方案 | 官方/仓库当前声明 | 自定义嵌套容器 | 虚拟列表 | 对 Scopify 的判断 |
| --- | --- | --- | --- | --- |
| [`next-scroll-restorer`](https://github.com/RevoTale/next-scroll-restorer) `0.11.0` | peer deps: Next `^15 || ^16`、React `^19`；只支持 `app` directory | 否；当前源码读写 `window.scrollX/Y` 并监听 window `scroll` | 否 | 可作为 window 页面参考，不满足共享 `ScrollArea.Viewport` 核心需求 |
| [`@moxy/next-router-scroll`](https://github.com/moxystudio/next-router-scroll) | README 使用 `pages/_app.js`、Next router events，并 monkey-patch `<Link>` | 支持 `registerElement` | 无专门协议 | Pages Router 时代方案，不应直接用于 App Router |
| [TanStack Router scroll restoration](https://tanstack.com/router/latest/docs/framework/react/guide/scroll-restoration) | 内建 history-entry key、嵌套容器监听、恢复前 DOM paint、虚拟列表手动恢复示例 | 是 | 是，官方示例把恢复值传给 Virtual 的 `initialOffset` | 能力最完整，但属于替换路由/框架的迁移评估，不是 Next 插件 |
| [React Router `ScrollRestoration`](https://reactrouter.com/api/components/ScrollRestoration) | 模拟浏览器恢复；默认 location key；位置保存在 sessionStorage | 官方组件 API 未提供元素注册 | 无专门协议 | 只有迁移到 React Router data/framework mode 后才成立，不能嵌入 Next App Router 充当第二套路由 |
| [`react-activation`](https://github.com/CJY0208/react-activation) | README 兼容到 React 18；警告 React 18+ 不要用 `createRoot`，或关闭 `autoFreeze` | 会尝试保存子树滚动位置 | 没有 Virtual 专门协议 | 与项目 React 19/现代 root 基线不符，不应采用 |

`next-scroll-restorer` 的 App Router/peer dependency 结论来自其当前 [README](https://github.com/RevoTale/next-scroll-restorer/blob/main/README.md) 和 [package.json](https://github.com/RevoTale/next-scroll-restorer/blob/main/package.json)；仅支持 window 的结论来自其 [`useScrollRestorer.ts`](https://github.com/RevoTale/next-scroll-restorer/blob/main/src/useScrollRestorer.ts)。

### 4.2 TanStack Router 值得借鉴的接口

即使不迁移路由，其官方设计仍提供了可借鉴的验证过的概念：[TanStack Router scroll restoration](https://tanstack.com/router/latest/docs/framework/react/guide/scroll-restoration)

- 默认以每条 history entry 的唯一 key 缓存；也允许用 `getScrollRestorationKey` 改成 pathname 等产品语义。
- 同时监控 window/body 和带 ID 的嵌套滚动区域。
- 在成功导航后、DOM paint 前恢复。
- 导航命令允许 `resetScroll: false`。
- 对虚拟列表暴露 `useElementScrollRestoration`，再把保存的 scrollY 传给 Virtual `initialOffset`。

这些是“协调器 + 页面适配器”方案应达到的能力基准，而不是采用该库的理由本身。

### 4.3 Keep-alive 不应作为默认滚动策略

保活整个页面可以让 DOM 的 `scrollTop` 自然保留，但会同时保留查询订阅、组件状态、测量缓存和 DOM 内存，改变的不只是滚动行为。React 官方 `<Activity>` 能在 hidden/visible 模式间保留 UI state，同时销毁并重建 Effects，但它不是 Next 路由缓存 API，也没有滚动恢复协议。[React `<Activity>`](https://react.dev/reference/react/Activity)

因此 keep-alive 适合被当成个别高成本页面的独立性能实验，而不是全局滚动正确性的基础。

## 5. 对架构文档的证据约束

后续正式架构至少应明确以下问题；如果没有明确答案，页面间“准确定位”仍会依赖时序巧合：

1. **唯一写入者**：浏览器、Next、全局协调器、页面 hook、virtualizer 各在什么阶段有权写 `scrollTop`？
2. **导航类型**：PUSH、REPLACE、TRAVERSE、同 URL 查询变化、hash 导航分别是回顶部、保持还是恢复？
3. **恢复身份**：默认按 history entry、pathname、完整 URL，还是业务实体 key？
4. **容器身份**：主内容区与 Sidebar、Queue、Dialog 等独立区域如何注册，是否都纳入第一期？
5. **页面能力**：普通 DOM 页面、异步页面、虚拟列表分别提供什么 ready/capture/restore 接口？
6. **过期保护**：用户滚动、数据版本变化、目标实体删除、容器尺寸变化时如何取消或降级？
7. **持久化范围**：仅当前 Electron renderer 生命周期、sessionStorage，还是应用重启后也恢复？

## 6. 建议验证的最小原型

以下结论无法只靠文档保证，应在 Scopify 的真实 `MainLayout` 中验证：

- `history.scrollRestoration = "auto"` 时，Chromium/Electron 对共享 Radix viewport 的 back/forward 实际恢复行为；
- Next 默认滚动逻辑是否通过 `scrollIntoView()` 间接改变共享 viewport；
- Virtual snapshot + `initialOffset` 在固定行高、动态行高、图片迟加载三种情况下的首帧偏差；
- 连续快速 back/forward、导航期间用户滚轮输入、目标页面数据变更时的取消规则；
- Electron 静态导出模式和纯 Web 模式是否表现一致。

在这些原型通过前，不应把某个浏览器时序或第三方库 README 中的理想行为写成架构保证。

## 参考资料

- [Next.js Link](https://nextjs.org/docs/app/api-reference/components/link)
- [Next.js `useRouter`](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [Next.js Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [Next.js 16.1.6 App Router restore reducer](https://github.com/vercel/next.js/blob/v16.1.6/packages/next/src/client/components/router-reducer/reducers/restore-reducer.ts)
- [WHATWG HTML: navigation and session history APIs](https://html.spec.whatwg.org/multipage/nav-history-apis.html)
- [WHATWG HTML: session history and scroll restoration](https://html.spec.whatwg.org/multipage/browsing-the-web.html#session-history-entries)
- [TanStack Virtual: Virtualizer API](https://tanstack.com/virtual/latest/docs/api/virtualizer)
- [TanStack Router: Scroll Restoration](https://tanstack.com/router/latest/docs/framework/react/guide/scroll-restoration)
- [Radix Primitives: Scroll Area](https://www.radix-ui.com/primitives/docs/components/scroll-area)
- [`next-scroll-restorer`](https://github.com/RevoTale/next-scroll-restorer)
- [`@moxy/next-router-scroll`](https://github.com/moxystudio/next-router-scroll)
- [React Router: `ScrollRestoration`](https://reactrouter.com/api/components/ScrollRestoration)
- [`react-activation`](https://github.com/CJY0208/react-activation)
- [React: `<Activity>`](https://react.dev/reference/react/Activity)
