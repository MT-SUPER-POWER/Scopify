# page.tsx / layout.tsx 职责边界

> Scopify 细则见根目录 [AGENTS.md](../../AGENTS.md)。**路由层适度组装，禁止无意义的单组件转发。**

## 定位

`app/` 的价值是 **Next.js 路由能力**（URL、layout 嵌套、loading、metadata、Server Component 数据预取），不是为了多包一层 `return <Xxx />`。

- **layout.tsx**：多路由共享外壳（侧栏、PlayBar、Provider）
- **page.tsx**：该 URL 独有的页面结构与数据入口
- 两者都可以 import `@/components/*` 做 JSX 组装

## 允许写的内容

| 允许 | 示例 |
|------|------|
| import 多个 section 组件并拼装 | `<Hero /><List /><Sidebar />` |
| 读取 `params` / `searchParams` | `const id = params.id` |
| 调用封装好的数据获取 | `const data = await getAlbum(id)` |
| Next.js 特有导出 | `metadata`、`generateStaticParams` |
| 路由级 loading / error 分支 | `if (isLoading) return <Skeleton />` |

## 禁止写的内容

| 禁止 | 应该放在哪 |
|------|----------|
| `type` / `interface` 定义 | `/types/<领域>.ts` |
| 大段静态数据数组 | `/constants/` |
| 可复用的业务函数、API 封装 | `/lib/`、`/hooks/` |
| 可复用的 UI 子组件定义 | `/components/<领域>/` |
| 无路由职责的单组件转发 | 内容直接写进 page，或下沉/上浮到合适层级 |

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
