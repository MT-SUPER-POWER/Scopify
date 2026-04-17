---
name: nextjs-project-structure
description: 约束 Next.js App Router 项目的全局代码结构规范。当用户要求创建页面、组件、hooks、类型定义、工具函数、状态管理、常量配置时触发。强制所有代码归入正确的全局目录（/components、/types、/hooks、/lib、/constants、/stores），禁止在 page.tsx 中内联逻辑、禁止使用 _components 局部目录、禁止类型散落在各路由文件内。适用于任何涉及新建或修改 .tsx/.ts 文件的任务。
allowed-tools: Bash(npx biome check .), Bash(npx biome check --write .), Bash(find . -type f -name "*.tsx" -o -name "*.ts" | grep -v node_modules), Bash(wc -l)
---

# Next.js 项目结构规范

## 核心原则

1. **全局优先**：类型、hooks、组件、工具函数一律放全局目录，不允许散落在路由文件夹内
2. **page.tsx 只做组装**：只负责调用组件拼装布局，不写类型、不写逻辑、不写数据
3. **按领域分类**：全局目录内部再按业务领域建子目录，不允许所有文件平铺在一层
4. **Biome 收尾**：每次新增代码后运行检查，交付前无报错

---

## 标准项目目录案例

```
project-root/
├── app/                          # 仅放路由文件
│   ├── (marketing)/
│   │   └── page.tsx              # 只做组装
│   ├── doc/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   └── layout.tsx
│
├── components/                   # 所有组件，按领域分子目录
│   ├── ui/                       # ShadCN 通用组件（Button, Badge, Input...）
│   ├── layout/                   # 布局组件（Header, Footer, Sidebar...）
│   ├── doc/                      # 文档页专用组件
│   ├── marketing/                # 营销页专用组件
│   └── shared/                   # 跨领域共享组件
│
├── types/                        # 所有类型定义，按领域分文件
│   ├── doc.ts
│   ├── user.ts
│   └── api.ts
│
├── hooks/                        # 所有 custom hooks
│   ├── useAuth.ts
│   ├── useDoc.ts
│   └── useSearch.ts
│
├── lib/                          # 工具函数、第三方封装
│   ├── utils.ts
│   ├── fetcher.ts
│   └── mdx.ts
│
├── constants/                    # 静态配置、枚举值、导航数据等
│   ├── nav.ts
│   └── config.ts
│
└── stores/                       # 状态管理（zustand / jotai 等）
    ├── userStore.ts
    └── docStore.ts
```

---

## 关键规则

### page.tsx → [rules/page.md](./rules/page.md)
- 只允许：import 组件、调用数据获取、JSX 骨架拼装、Next.js 特有导出
- **禁止**：定义 type/interface、写业务函数、内联数据数组、定义超过 1 个组件
- 行数硬限制：**< 80 行**

### 组件归类 → [rules/components.md](./rules/components.md)
- **禁止使用** `_components/` 局部目录，所有组件进 `/components/<领域>/`
- `/components` 内部必须按业务领域建子目录，禁止所有组件平铺在根层
- 单个组件文件超过 **150 行** 必须拆分

### 类型与 hooks → [rules/types-hooks.md](./rules/types-hooks.md)
- 所有 `type` / `interface` 定义进 `/types/<领域>.ts`，不允许写在 page.tsx 或组件文件内
- 所有 custom hook 进 `/hooks/`，不允许写在组件文件内部
- 静态数据超过 **10 条** 进 `/constants/`

### Biome 检查 → [rules/biome.md](./rules/biome.md)
- 新建或修改文件后必须运行 `npx biome check`
- 不允许遗留 `severity: error` 的条目交付

---

## 代码模式示例

```tsx
// ✅ 正确的 page.tsx
import { DocSidebar } from '@/components/doc/DocSidebar'
import { DocContent } from '@/components/doc/DocContent'
import { getDocData } from '@/lib/doc'
import type { DocPageProps } from '@/types/doc'

export default async function DocPage({ params }: DocPageProps) {
  const data = await getDocData(params.slug)
  return (
    <div className="flex">
      <DocSidebar />
      <DocContent data={data} />
    </div>
  )
}
```

```tsx
// ❌ 禁止——类型、数据、多组件全部塞进 page.tsx
type NavItem = { id: string; title: string }
const NAV_ITEMS: NavItem[] = [...]

function Sidebar() { ... }
function Content() { ... }

export default function DocPage() { ... }
```

```ts
// ✅ 类型放 /types/doc.ts
export interface DocPageProps {
  params: { slug: string }
}
export interface DocItem {
  id: string
  title: string
  content: string
}
```

```ts
// ✅ 静态数据放 /constants/nav.ts
export const DOC_NAV = [
  { id: 'intro', title: '介绍', href: '/doc/intro' },
  // ...
] as const
```

---

## 新建文件工作流

1. **判断归属**：这个文件是组件？类型？hook？工具函数？常量？
2. **找到正确目录**：对照上方目录结构确认放在哪个全局目录的哪个子目录
3. **检查子目录是否存在**：没有就先建目录
4. **写代码**
5. **运行 Biome**：`npx biome check --write .` 自动修复格式，再 `npx biome check .` 确认无 error
6. **更新 page.tsx**：只 import，不写逻辑

## 快速参考

```bash
# 查看当前项目全局目录结构（2 层）
find . -maxdepth 2 -type d | grep -v node_modules | grep -v .git | sort

# 找出超过 150 行的组件（需要拆分的候选）
find components -name "*.tsx" | xargs wc -l | sort -rn | head -20

# Biome 检查 + 自动修复
npx biome check --write .
npx biome check .
```

## 详细参考

- [rules/page.md](./rules/page.md) — page.tsx 职责边界与禁止事项
- [rules/components.md](./rules/components.md) — 组件分类与拆分规则
- [rules/types-hooks.md](./rules/types-hooks.md) — 类型、hooks、常量的归属判断
- [rules/biome.md](./rules/biome.md) — Biome 检查流程与常见报错修复
