# page.tsx / layout.tsx 职责边界

> Scopify 细则见根目录 [AGENTS.md](../../AGENTS.md)。**路由层适度组装，禁止无意义的单组件转发。**

## 定位

`app/` 的价值是 **Next.js 路由能力**（URL、layout 嵌套、loading、metadata、Server Component 数据预取），不是为了多包一层 `return <Xxx />`。

- **layout.tsx**：多路由共享外壳（侧栏、PlayBar、Provider）
- **page.tsx**：该 URL 独有的页面结构与数据入口
- 两者都可以 import `@/components/*` 做 JSX 组装

## 并行路由（`@slot`）

用 `@slot` 表达一个页面由哪些**可独立加载、独立失败**的业务区域组成，与 [Query 与错误边界](./query-boundaries.md) 中的「独立栏目」一一对应。区域专属的组件、骨架屏放在 slot 目录里。

### 何时使用

- 首页推荐栏目、歌单的头部/曲目/评论、个人主页的各个货架这类互不依赖的区域：用
- 同一个请求的几张卡片、几乎没有逻辑的小块：不用，直接在 page 里组装
- 弹层、详情抽屉：不属于本规则，需要时再评估拦截路由

### 目录与文件

```
app/(dashboard)/(home)/          # 专属路由组，只匹配 /
├── layout.tsx                   # 接收 slot 并组装；共享状态的 Provider 放这里
├── page.tsx                     # children 占位，返回 null
├── @greeting/
│   ├── page.tsx                 # 区域入口：QueryBoundary + 数据容器
│   ├── default.tsx              # return null
│   ├── GreetingSection.tsx      # 区域专属展示组件，就近放置
│   └── GreetingSkeleton.tsx     # 区域专属骨架屏
└── @playlists/ ...
```

- **slot 只放进匹配单一路由的专属路由组**。slot 所属 layout 下的所有子路由都要有对应匹配或 `default.tsx`，放在 `(dashboard)/` 下会让每个路由都要补一堆 `default.tsx`
- **每个 slot 都要有 `default.tsx`**，本项目是静态导出，硬导航时未匹配的 slot 也需要它
- **slot 的颗粒度跟随 Query 边界**：先按业务区域合并，不要一个请求一个 slot
- **slot 之间不通过 props 传值**。多个区域共用的状态（登录账号、播放操作等）由 `layout.tsx` 内的 Provider 或 `store/` 提供，不要让 slot 互相导入

### 与 Query 边界和 loading 的关系

- slot 的 `page.tsx` 内部使用 `QueryBoundary`，传入 `resetKey`。**不要用 slot 的 `error.tsx` 代替它**：`error.tsx` 无法在账号、资源身份变化时重置
- 骨架屏仍由数据容器按「首次无数据且请求中」渲染，与 slot 同目录放置
- 本项目请求不使用 Suspense，所以 slot 的 `loading.tsx` **不会**因 Query pending 触发；只在 slot 内确有懒加载或 `use()` 挂起时才写，不要为凑结构而加
- slot 与普通路由一样，必须遵守「首次失败进边界、有缓存的后台刷新失败保留内容」

## 允许写的内容

| 允许                           | 示例                                 |
| ------------------------------ | ------------------------------------ |
| import 多个 section 组件并拼装 | `<Hero /><List /><Sidebar />`        |
| 读取 `params` / `searchParams` | `const id = params.id`               |
| 调用封装好的数据获取           | `const data = await getAlbum(id)`    |
| Next.js 特有导出               | `metadata`、`generateStaticParams`   |
| 路由级 loading / error 分支    | `if (isLoading) return <Skeleton />` |

## 禁止写的内容

| 禁止                       | 应该放在哪                               |
| -------------------------- | ---------------------------------------- |
| `type` / `interface` 定义  | `/types/<领域>.ts`                       |
| 大段静态数据数组           | `/constants/`                            |
| 可复用的业务函数、API 封装 | `/lib/`、`/hooks/`                       |
| 可复用的 UI 子组件定义     | 被多个路由使用的进 `/components/<领域>/`；只属于本路由的写成同级文件，不内联在 page 里 |
| 无路由职责的单组件转发     | 内容直接写进 page，或下沉/上浮到合适层级 |

## 行数

- **不设「必须 < 80 行」硬限制**
- 单文件 **> 150 行** 再评估：是否有块可提取到 `components/` 或 `hooks/`
- 不为拆而拆；简单页面留在 page 里完全合理

## 合规示例

```tsx
// app/(dashboard)/profile/page.tsx ✅ — page 承担组装
import { ProfileHero } from "@/components/profile/UserHero";
import { PublicPlaylistGrid } from "@/components/profile/PublicPlaylistGrid";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <ProfileHero />
      <PublicPlaylistGrid />
    </div>
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
// ⚠️ 仅在有 metadata/SSR 等路由职责时可接受，勿作为默认模板
import UserProfilePage from "@/components/profile/UserProfilePage";
export default function Page() {
  return <UserProfilePage />;
}
```
