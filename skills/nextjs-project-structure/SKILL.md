---
name: nextjs-project-structure
description: 约束 Next.js App Router 项目的代码结构规范。当用户要求创建页面、组件、hooks、类型定义、工具函数、状态管理、常量配置时触发。类型/hooks/工具/常量/状态归全局目录；组件分三层：纯展示的特色组件进 @scopify/ui/scopify，带业务耦合且多路由共用的进全局 components，页面专属的放路由 _components；layout 负责排版与摆放，页面内可独立加载的区域用并行路由 @slot，禁止无意义空壳转发。适用于任何涉及新建或修改 .tsx/.ts 文件的任务。
allowed-tools: Bash(find . -type f -name "*.tsx" -o -name "*.ts" | grep -v node_modules), Bash(wc -l)
---

# Next.js 项目结构规范

> **Scopify 项目以仓库根目录 [AGENTS.md](../../AGENTS.md) 为唯一规范来源。** 本 skill 提供通用细则；与 AGENTS.md 冲突时以 AGENTS.md 为准（如 `store/` 非 `stores/`，`types/<领域>/` 分层等）。规范写在 markdown 中，**不使用 `.cursor/rules/`**。

## 核心原则

1. **类型、hooks、工具、常量、状态全局**：一律放全局目录，不允许散落在路由文件夹内
2. **组件分三层**：纯展示的特色组件进 `@scopify/ui/scopify/components`；带业务耦合且被两个及以上路由使用的进 `components/<领域>/`；页面或 slot 专属的放该路由的 `_components/`，第二个路由要用时再升级
3. **layout 管排版，page 管切换**：容器、栅格、背景、共享 Provider 写在 layout；页面内可独立加载、独立失败的区域用并行路由 `@slot` 拆开，由 layout 摆放；禁止 `page → XxxPage → XxxContent` 式的层层转发
4. **按领域分类**：全局目录内部再按业务领域建子目录，不允许所有文件平铺在一层

---

## 标准项目目录案例

```
project-root/
├── app/                          # 路由文件 + 路由专属组件（_components/）
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

### page / layout → [rules/page.md](./rules/page.md)

- 允许：import 组件拼装、读 params、SSR 数据预取、Next.js 导出、用 `@slot` 组织页面内的独立区域
- 禁止：定义 type/interface、API/hook 封装、无路由职责的单组件转发
- 行数：**> 150 行** 再考虑拆分，不设 80 行硬限制
- layout / slot / page 的分工、并行路由的使用条件、`default.tsx`、共享状态与 Query 边界的关系见该文件

### 组件归类 → [rules/components.md](./rules/components.md)

- 三层归属与选择顺序：纯展示的特色组件进 `@scopify/ui/scopify/components`；带业务耦合且被两个及以上路由使用的进 `/components/<领域>/`；页面或 slot 专属的放该路由的 `_components/`
- 现有组件靠 props 和 token 能满足就不复制；`_components/` 只放小改动适配不了、需要改造的组件，且不允许被其他路由导入
- `/components` 内部必须按业务领域建子目录，禁止所有组件平铺在根层
- 单个组件文件超过 **150 行** 必须拆分

### 类型与 hooks → [rules/types-hooks.md](./rules/types-hooks.md)

- 所有 `type` / `interface` 定义进 `/types/<领域>/`（`model.ts` / `api.ts` / `components.ts`），不允许写在 page.tsx 或组件文件内
- 所有 custom hook 进 `/hooks/`，不允许写在组件文件内部
- 静态数据超过 **10 条** 进 `/constants/`

### API、类型与数据获取层 → [rules/api-layer.md](./rules/api-layer.md)

- **三层架构**：`lib/api/` (请求封装) → `types/<领域>/api.ts` (类型定义) → `hooks/` (TanStack Query)
- `lib/api/` 只负责发请求，不包含业务逻辑
- `types/<领域>/api.ts` 定义所有请求/响应类型
- `hooks/` 使用 TanStack Query 管理缓存、状态、副作用

### Query 与错误边界 → [rules/query-boundaries.md](./rules/query-boundaries.md)

涉及请求、加载/错误 UI、缓存刷新、分页、Mutation 或媒体错误时必须阅读此规范。按独立恢复的业务区域组合 Query 与 React 错误边界，不在聚合 hook 中重建请求状态机。

---

## 代码模式示例

```tsx
// ✅ 正确的 page.tsx
import { DocSidebar } from "@/components/doc/DocSidebar";
import { DocContent } from "@/components/doc/DocContent";
import { getDocData } from "@/lib/doc";
import type { DocPageProps } from "@/types/doc";

export default async function DocPage({ params }: DocPageProps) {
  const data = await getDocData(params.slug);
  return (
    <div className="flex">
      <DocSidebar />
      <DocContent data={data} />
    </div>
  );
}
```

```tsx
// ⚠️ 无路由职责的空壳转发——不要作为默认模板
import DocPage from "@/components/doc/DocPage";
export default function Page() {
  return <DocPage />;
}
```

```tsx
// ❌ 禁止——类型、数据、多组件定义全部塞进 page.tsx
type NavItem = { id: string; title: string }
const NAV_ITEMS: NavItem[] = [...]

function Sidebar() { ... }
function Content() { ... }

export default function DocPage() { ... }
```

```ts
// ✅ 类型放 /types/doc/model.ts
export interface DocPageProps {
  params: { slug: string };
}
export interface DocItem {
  id: string;
  title: string;
  content: string;
}
```

```ts
// ✅ 静态数据放 /constants/nav.ts
export const DOC_NAV = [
  { id: "intro", title: "介绍", href: "/doc/intro" },
  // ...
] as const;
```

---

## 新建文件工作流

1. **判断归属**：这个文件是组件？类型？hook？工具函数？常量？
2. **找到正确目录**：对照上方目录结构确认放在哪个全局目录的哪个子目录
3. **检查子目录是否存在**：没有就先建目录
4. **写代码**
5. **路由层组装**：在 page/layout 拼 JSX；类型与逻辑仍归 `types/`、`hooks/`、`lib/`

## 快速参考

```bash
# 查看当前项目全局目录结构（2 层）
find . -maxdepth 2 -type d | grep -v node_modules | grep -v .git | sort

# 找出超过 150 行的组件（需要拆分的候选）
find components -name "*.tsx" | xargs wc -l | sort -rn | head -20
```

## 详细参考

- [rules/page.md](./rules/page.md) — page.tsx 职责边界与禁止事项
- [rules/components.md](./rules/components.md) — 组件分类与拆分规则
- [rules/types-hooks.md](./rules/types-hooks.md) — 类型、hooks、常量的归属判断
