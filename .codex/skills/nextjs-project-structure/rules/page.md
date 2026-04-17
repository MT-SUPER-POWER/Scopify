# page.tsx 职责边界

## 允许写的内容

| 允许 | 示例 |
|------|------|
| import 组件 | `import { DocSidebar } from '@/components/doc/DocSidebar'` |
| import 类型（仅用于 props） | `import type { DocPageProps } from '@/types/doc'` |
| 调用数据获取函数 | `const data = await getDocData(params.slug)` |
| JSX 骨架拼装 | `<div><Sidebar /><Content data={data} /></div>` |
| Next.js 特有导出 | `export const metadata`, `export async function generateStaticParams` |

## 禁止写的内容

| 禁止 | 原因 | 应该放在哪 |
|------|------|----------|
| `type` / `interface` 定义 | 类型应集中管理 | `/types/<领域>.ts` |
| 数组字面量（> 3 项） | 静态数据应集中管理 | `/constants/<名称>.ts` |
| 业务逻辑函数 | 应可复用和测试 | `/lib/` 或 `/hooks/` |
| 第 2 个及以上组件定义 | 组件应单独文件 | `/components/<领域>/` |
| `useState` / `useEffect` | page.tsx 应为 Server Component | 提取为 Client 组件 |
| 直接 `fetch()` 调用 | 数据获取应封装 | `/lib/` 中封装后调用 |

## 行数限制

- **硬限制：< 80 行**
- 超过 80 行必须检查：是否有可以提取到组件的 JSX 片段，或可以移到 lib 的逻辑

## 合规示例

```tsx
// app/doc/[slug]/page.tsx ✅
import { DocLayout } from '@/components/doc/DocLayout'
import { DocContent } from '@/components/doc/DocContent'
import { DocToc } from '@/components/doc/DocToc'
import { getDocBySlug, getAllDocSlugs } from '@/lib/doc'
import type { DocPageProps } from '@/types/doc'

export async function generateStaticParams() {
  return getAllDocSlugs().map(slug => ({ slug }))
}

export default async function DocPage({ params }: DocPageProps) {
  const doc = await getDocBySlug(params.slug)

  return (
    <DocLayout>
      <DocToc headings={doc.headings} />
      <DocContent doc={doc} />
    </DocLayout>
  )
}
```
