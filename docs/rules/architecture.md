# 项目结构与拆分原理

> 先读这篇。它回答：Scopify 的代码为什么这样分，一个新页面该怎么拆。组件放哪见 [组件规则](./components.md)，请求和错误边界见 [数据请求与边界](./data-and-boundaries.md)。

本文里未加前缀的 `app/`、`components/`、`types/`、`hooks/`、`lib/`、`store/`、`constants/` 都相对于 `repo/frontend/apps/web/`。

## 一句话原理

**`app/` 的文件结构就是页面的组成图：layout 决定放在哪，slot 决定放什么，page 只是随 URL 切换的那一块。**

读一个路由目录，应该一眼看出这个页面由哪些区域组成、各区域在哪、失败和加载各自怎么处理，而不是在一个巨大的 `page.tsx` 或层层转发的组件里找。

## 仓库全貌

```text
repo/
  frontend/
    apps/
      web/               Next.js Web，同时是 Desktop 的渲染层（静态导出）
      desktop/           Electron 宿主：main / preload，不反向 import Web 源码
      docs/              Fumadocs 组件文档
      mobile/            Flutter 预留入口（submodule）
    packages/
      ui/                @scopify/ui：共享 UI（shadcn 原生层 + Scopify 扩展层）
      desktop-contract/  Web 与 Desktop 之间的版本化 IPC 契约
  backend/
    api-enhanced/        独立部署的后端（submodule），有自己的 AGENTS.md
```

- Web 同时是 Desktop 的渲染层。桌面构建（`SCOPIFY_BUILD_TARGET=desktop`）是静态导出（`output: "export"`），没有服务端运行时，所以**所有页面都必须能在静态导出下运行**：详情页的 id 放在 query string（`/album?id=`），不是动态路由段，数据都在客户端请求。
- Desktop 只消费 `@scopify/desktop-contract` 和 Web 的静态构建产物，不 import Web 源码。
- Web 路径别名：`@/*` 指向 `repo/frontend/apps/web/`，优先 `@/types/...`、`@/lib/...`、`@/components/...`。

## `app/` 里每种文件管什么

| 文件 | 管什么 | 切换路由时 |
| --- | --- | --- |
| `layout.tsx` | 一组路由里不变的东西：外壳、背景、容器与栅格、共享 Provider、区域内导航、`metadata`；接收 slot 和 `children` 并摆放 | 保持挂载，状态保留 |
| `template.tsx` | 每次导航都要重新创建的那一层包装，见下文「template 规则」 | 每次都重新挂载 |
| `page.tsx` | 随 URL 变化的主内容 | 切换 |
| `@slot/page.tsx` | 页面内一个可独立加载、独立失败的业务区域 | 随 URL 重新匹配 |
| `@slot/default.tsx` | slot 在当前 URL 没有内容时渲染什么，通常 `return null` | — |
| `@slot/loading.tsx` | 该区域首次加载时的骨架屏（区域内用 Suspense Query 时） | — |
| `_components/` | 该路由或 slot 专属的组件，路由器不会把它当成路由 | — |
| `(group)/` | 路由组，只用来分组与共享 layout，不出现在 URL 里 | — |

## 一个页面怎么拆

按顺序问自己：

1. **这是不随页面变化的外壳或排版吗？**（背景、容器宽度、栅格、间距、标签栏、共享 Provider）→ 写在 `layout.tsx`
2. **页面里有几块内容，各有自己的请求、自己的失败范围吗？**→ 每块一个 `@slot`，由 layout 摆放
3. **只有一个请求、一个区域？**→ 不拆 slot，`page.tsx` 直接渲染这个区域，细节放 `_components/`
4. **这是随 URL 切换的主内容吗？**→ `page.tsx`

判断 slot 的标尺是 [数据请求与边界](./data-and-boundaries.md) 里的「独立栏目」：能单独失败、单独重试的业务区域才拆。同一个请求的几张卡片、几乎没有逻辑的小块不拆。

### 例子：评论页

`app/(dashboard)/comment/` 是按这套规则改造的完整例子，从上往下读：

```text
comment/
├── layout.tsx            外壳与摆放：{header} 在上，{children} 在评论栏里
├── page.tsx              评论区：QueryBoundary + CommentSection
├── _components/          页面专属：CommentEmpty（没有资源时的空状态）
└── @header/              头部区域
    ├── page.tsx          从 URL 读资源 → QueryBoundary → 头部
    ├── default.tsx       return null
    ├── loading.tsx       头部骨架屏
    └── _components/      头部专属：CommentPageHeader、CommentHeader、CommentHeaderSkeleton
```

## layout 与 page 的分工规则

1. **排版归 layout。** 容器宽度、栅格、间距、背景、渐变、sticky 写在 layout；page 和 slot 不重复写外层容器与背景。
2. **page 不再往下拆壳。** 禁止 `page → XxxPage → XxxContent → XxxSection` 这样每层只传参数的转发；容器与展示成对出现且只有一处使用时，合成一个组件。
3. **共用外壳提到共同的 layout。** 一组兄弟路由有相同外壳或导航时，放进它们共同的 layout 或路由组，不在每个 page 里各写一遍。
4. **layout 拿不到 `searchParams`。** 依赖 `?id=` 的区域放在 page 或 slot；layout 只放与资源无关的排版。确需在 layout 读取时用客户端 `useSearchParams`，并放进 `Suspense`。
5. **page / layout 里不定义 `type` / `interface`、不写 API 封装与 hook。** 这些分别放 `types/`、`lib/`、`hooks/`。
6. 单文件超过 **150 行** 再评估：是否有块可提取到 `_components/`、`hooks/`，或是否该拆成 slot。不为拆而拆，简单页面留在 page 里完全合理。

## 并行路由（`@slot`）规则

- **slot 只放进匹配单一路由的专属路由组**（如首页的 `(home)/`）。slot 所属 layout 下的每个子路由都要有对应匹配或 `default.tsx`，放在 `(dashboard)/` 这样的大组下会让每个路由都补一堆 `default.tsx`。
- **每个 slot 都要有 `default.tsx`。** 桌面构建是静态导出，直接打开某个地址（硬导航）时未匹配的 slot 也需要它，缺了会 404。
- **slot 的颗粒度跟随 Query 边界：** 先按业务区域合并，不要一个请求一个 slot。
- **slot 之间不通过 props 传值。** slot 从 URL 或 store 取自己要的东西；多个区域共用的状态（登录账号、播放操作、剧场模式等）放在 layout 内的 Provider 或 `store/`，不要让 slot 互相导入。
- **slot 的 `page.tsx` 内部使用 `QueryBoundary`。** 不用 slot 的 `error.tsx` 代替它，因为 `error.tsx` 无法在账号、资源身份变化时重置。加载与骨架屏的做法见 [数据请求与边界](./data-and-boundaries.md#slot-与-suspense)。
- 弹层、详情抽屉不属于 slot 规则，需要时再单独评估拦截路由。

## template 规则

`template.tsx` 和 `layout.tsx` 一样包裹子路由，层级是 **layout → template → page**。区别只有一个：**layout 在切换页面时保持挂载，template 每次导航都会重新创建，状态、DOM 和 effect 全部重来。**

**默认用 layout。** 只有「必须每次导航都重建」才用 template：

| 适合放进 template | 例子 |
| --- | --- |
| 每个页面需要独立的滚动容器或视口 | `(dashboard)/template.tsx` 包 `RouteScrollSurface`：每次切换路由重建滚动视口，保证历史滚动恢复不会让两个页面共用同一个 DOM |
| 每次进入页面都要重放的进入动画 | 页面淡入 |
| 按页面重置的状态或 effect | 页面级的曝光埋点、一次性提示 |

**不要放进 template：**

- Provider、共享状态、store 订阅：template 重建会丢，跨页面的状态应该放 layout
- 数据请求、Query：每次导航都会重新挂载，导致重复请求或闪烁
- `metadata`、外壳排版：放 layout

约定：

- template 只做一层很薄的包装，逻辑放组件里（如 `RouteScrollSurface`），写法见 `(dashboard)/template.tsx`
- 不在 `@slot` 目录里建 template
- 本项目目前只有 `(dashboard)/template.tsx` 一个。新增 template 要在改动说明里写清为什么 layout 不够用
- 滚动恢复的完整设计见 [navigation-scroll-architecture](../architecture/navigation-scroll-architecture.md)

## 非路由代码放哪

类型、hooks、工具、常量、状态一律放全局目录，不散落在路由文件夹里。组件按使用范围分层，见 [组件规则](./components.md)。

| 目录 | 放什么 | 要点 |
| --- | --- | --- |
| `types/<领域>/` | 所有 `interface` / `type` | 先按业务领域建目录（尽量与 `components/` 同名），再分层：`model.ts`（业务实体）、`api.ts`（请求/响应）、`components.ts`（复用的 Props）；更多主题用 `<主题>.ts`、`<主题>Api.ts`。不建 `index.ts` 聚合出口，直接从具体文件导入。根目录只保留 `i18n.generated.d.ts` 与 `electron.d.ts`。新增类型先查 [types/README.md](../../repo/frontend/apps/web/types/README.md) |
| `hooks/<领域>/` | 所有 custom hook | 一个 hook 一个文件，文件名与 hook 同名。逻辑超过 15 行、被多处复用、含 `useEffect` 加状态管理时提取 |
| `lib/` | 工具函数、API 封装、第三方封装 | `lib/api/` 只发请求；`lib/web/` 是 request、环境与错误基础设施 |
| `constants/` | 静态配置与枚举 | 静态数组超过 10 条放这里 |
| `store/module/` | Zustand 全局状态 | 高频本地状态（播放、音量）用 Zustand，不要用 Query |

Props 类型可以留在组件文件里，除非：被 2 个以上文件引用、字段超过 5 个、或是业务实体。

## 修改前的自检

- 新增页面：我有没有把外壳排版写进了 page？有没有只转发的空壳？
- 新增区域：它是否真的能独立失败、独立重试？是，就拆 slot；不是，就留在 page
- 想新建 template：layout 真的不行吗？
- 在路由里放了类型、hook 或 API 封装：移到 `types/`、`hooks/`、`lib/`
