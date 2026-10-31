# page.tsx / layout.tsx 职责边界

> Scopify 细则见根目录 [AGENTS.md](../../AGENTS.md)。**路由层表达页面的组成，禁止无意义的单组件转发。**

## 定位

`app/` 的价值是 **Next.js 路由能力**（URL、layout 嵌套、并行路由、loading、metadata），不是为了多包一层 `return <Xxx />`。

## layout、slot、page 的分工

一句话：**layout 决定放在哪，slot 决定放什么，page 只是随 URL 切换的那一块。**

| 角色 | 职责 | 切换路由时 |
| --- | --- | --- |
| `layout.tsx` | 一组路由里不变的东西：外壳、背景、容器宽度、栅格与间距、sticky 等排版；共享 Provider；区域内导航（标签栏）；`metadata`。接收 `@slot` 与 `children` 并摆放 | 保持挂载，状态保留 |
| `@slot/page.tsx` | 页面内一个可独立加载、独立失败的业务区域 | 随 URL 重新匹配 |
| `page.tsx`（`children`） | 随 URL 变化的主内容 | 切换 |

规则：

1. **排版归 layout。** 容器、栅格、间距、背景、渐变这类「摆放」代码写在 layout；page 和 slot 不重复写外层容器与背景。
2. **page 不再往下拆壳。** 页面由若干块组成，且每块有自己的请求与失败范围时，拆成 `@slot`，由 layout 摆放；只有一个请求、一个区域的页面，`page.tsx` 直接渲染该区域，细节放 `_components/`。
3. **共用外壳提到共同的 layout。** 一组兄弟路由有相同的外壳或导航时（如设置各子页的导航），放进它们共同的 layout 或路由组，不在每个 page 里各写一遍。
4. **禁止层层转发。** 不写 `page → XxxPage → XxxContent → XxxSection` 这样每层只传参数的结构；容器与展示成对出现且只有一处使用时，合成一个组件。
5. **layout 拿不到 `searchParams`。** 本项目详情 id 在 query string 里，依赖 `?id=` 的区域放在 page 或 slot；layout 只放与资源无关的排版。确需在 layout 读取时用客户端 `useSearchParams`，并放进 `Suspense`。

## 并行路由（`@slot`）

用 `@slot` 表达一个页面由哪些**可独立加载、独立失败**的业务区域组成，与 [Query 与错误边界](./query-boundaries.md) 中的「独立栏目」一一对应。

### 何时使用

- 首页推荐栏目、歌单的头部/曲目/评论、个人主页的各个货架这类互不依赖的区域：用
- 同一个请求的几张卡片、几乎没有逻辑的小块：不用，直接在 page 里组装
- 弹层、详情抽屉：不属于本规则，需要时再评估拦截路由

### 目录与文件

```
app/(dashboard)/(home)/          # 专属路由组，只匹配 /
├── layout.tsx                   # 摆放各 slot；排版与共享状态的 Provider 都在这里
├── page.tsx                     # children 占位，返回 null
├── @greeting/
│   ├── page.tsx                 # 区域入口：QueryBoundary + 区域内容
│   ├── default.tsx              # return null
│   ├── loading.tsx              # 区域骨架屏（见下文适用条件）
│   └── _components/             # 区域专属组件
└── @playlists/ ...
```

- **slot 只放进匹配单一路由的专属路由组。** slot 所属 layout 下的所有子路由都要有对应匹配或 `default.tsx`，放在 `(dashboard)/` 下会让每个路由都要补一堆 `default.tsx`
- **每个 slot 都要有 `default.tsx`**，本项目是静态导出，硬导航时未匹配的 slot 也需要它
- **slot 的颗粒度跟随 Query 边界**：先按业务区域合并，不要一个请求一个 slot
- **slot 之间不通过 props 传值。** 多个区域共用的状态（登录账号、播放操作等）由 `layout.tsx` 内的 Provider 或 `store/` 提供，不要让 slot 互相导入

### 与 Query 边界和 loading 的关系

- slot 的 `page.tsx` 内部使用 `QueryBoundary`，传入 `resetKey`。**不要用 slot 的 `error.tsx` 代替它**：`error.tsx` 无法在账号、资源身份变化时重置
- **单一请求、无条件的区域**：用 `useSuspenseQuery`，骨架屏写在该 slot 的 `loading.tsx`，失败进 `QueryBoundary`
- **依赖登录的区域**：登录判断放在 Suspense 之外的门控组件，未登录直接返回 `null`，门控内部再用 Suspense Query
- **有备用来源（`selectFallbackSource`）或需要「离线等待」展示的区域**：保留 `useQuery`，按「首次无数据且请求中」在区域内渲染骨架屏，不写 `loading.tsx`
- 静态导出的预渲染阶段不得触发真实请求。首个迁移到 Suspense Query 的 slot 先验证构建结果，再推广
- slot 与普通路由一样，必须遵守「首次失败进边界、有缓存的后台刷新失败保留内容」

## 允许写的内容

| 允许                           | 示例                                 |
| ------------------------------ | ------------------------------------ |
| import 多个区域组件并拼装      | `<Hero /><List /><Sidebar />`        |
| 读取 `params` / `searchParams` | `const id = params.id`               |
| 调用封装好的数据获取           | `const data = await getAlbum(id)`    |
| Next.js 特有导出               | `metadata`、`generateStaticParams`   |
| 路由级 loading / error 分支    | `if (isLoading) return <Skeleton />` |

## 禁止写的内容

| 禁止                       | 应该放在哪                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `type` / `interface` 定义  | `/types/<领域>/`                                                                   |
| 大段静态数据数组           | `/constants/`                                                                      |
| 可复用的业务函数、API 封装 | `/lib/`、`/hooks/`                                                                 |
| 可复用的 UI 子组件定义     | 按 [components.md](./components.md) 的三层归属放置，不内联在 page 里               |
| 外层容器、栅格、背景       | 所在路由的 `layout.tsx`                                                            |
| 无路由职责的单组件转发     | 内容直接写进 page，或下沉/上浮到合适层级                                           |

## 行数

- **不设「必须 < 80 行」硬限制**
- 单文件 **> 150 行** 再评估：是否有块可提取到 `_components/`、`hooks/`，或是否该拆成 slot
- 不为拆而拆；简单页面留在 page 里完全合理

## 合规示例

```tsx
// app/(dashboard)/(home)/layout.tsx ✅ — layout 负责摆放，slot 负责内容
export default function HomeLayout({
  children,
  greeting,
  playlists,
  newSongs,
}: {
  children: React.ReactNode;
  greeting: React.ReactNode;
  playlists: React.ReactNode;
  newSongs: React.ReactNode;
}) {
  return (
    <HomeProvider>
      <div className="mx-auto w-full max-w-400 space-y-7 px-4 py-6 sm:px-6">
        {greeting}
        {playlists}
        {newSongs}
        {children}
      </div>
    </HomeProvider>
  );
}
```

```tsx
// app/(dashboard)/layout.tsx ✅ — layout 承担公共壳
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <PlayerCommandHandler />
      {children}
    </MainLayout>
  );
}
```

```tsx
// ⚠️ 仅在有 metadata 等路由职责时可接受，勿作为默认模板
import UserProfilePage from "@/components/profile/UserProfilePage";
export default function Page() {
  return <UserProfilePage />;
}
```
