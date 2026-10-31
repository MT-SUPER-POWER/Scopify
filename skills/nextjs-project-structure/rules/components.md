# 组件分类与拆分规则

## 先判断组件放哪

| 层 | 放什么 | 约束 |
| --- | --- | --- |
| `@scopify/ui/scopify/components` | 有 Scopify 特色、可复用的纯展示组件 | 不依赖 store、路由、API、i18n；文案、回调全部通过 props 传入 |
| `apps/web/components/<领域>/` | 带业务耦合（store、Query、i18n、路由）且被两个及以上路由使用的组件；跨页面的领域（播放器、歌词、侧栏） | 按业务领域分目录，`shared/` 只放跨领域的通用业务组件 |
| `<路由>/_components/` | 页面或 slot 专属的组件 | 现有组件靠 props 和 token 做小改动适配不了时，才复制过来改造；不允许被其他路由导入 |

通用基础组件来自 `@scopify/ui/shadcn`，见 [ui-package-boundaries](../../ui-package-boundaries/SKILL.md)。

### 选择顺序

1. 有现成组件（`shadcn`、`scopify`、`components/`）能用 props 和 token 满足，就直接用，不复制
2. 要新写的组件是纯展示、有 Scopify 特色且可复用，放 `ui/scopify/components`
3. 带业务耦合、且被两个及以上路由使用，放 `components/<领域>/`
4. 其余页面专属的写进该路由的 `_components/`

### 升级规则

- `_components/` 里的组件被第二个路由需要时，不要跨目录导入：纯展示的升级到 `ui/scopify/components`，带业务耦合的升级到 `components/<领域>/`
- 拿不准归属时先放 `_components/`，需要共用时再升级；不要为了「以后可能复用」预先放进全局
- `_components/` 可放在路由目录或 `@slot` 目录下，Next.js 不会把私有目录当路由
- 类型、hooks、常量仍然全局，各层组件都通过 `@/types/...`、`@/hooks/...` 导入

---

## `/components` 内部结构

```
components/
├── ui/           # 原子级、无业务逻辑的通用组件
├── layout/       # 全局布局相关 （如有）
├── doc/          # 文档页面专用（如有）
├── marketing/    # 营销/落地页专用（如有）
├── dashboard/    # 后台/管理页专用（如有）
└── shared/       # 跨多个领域复用、但不属于 ui/ 的组件
```

### 优先考虑是否有现成组件

在创建新组件前，先检查 [shadcn/ui 组件库](../assets/shadcn.md) 是否已有现成组件可用，避免重复造轮子。

### 各子目录判断标准

| 目录         | 放什么                                             | 判断问题                               |
| ------------ | -------------------------------------------------- | -------------------------------------- |
| `ui/`        | Button, Badge, Input, Modal, Tooltip...            | 是否完全无业务逻辑，只接受通用 props？ |
| `layout/`    | Header, Footer, Sidebar, Container, PageWrapper    | 是否负责页面整体骨架？                 |
| `doc/`       | DocContent, DocSidebar, DocToc, CodeBlock, Callout | 是否只在文档类页面使用？               |
| `marketing/` | Hero, PricingCard, FeatureGrid, CTA                | 是否只在营销/落地页使用？              |
| `shared/`    | SearchBar, UserAvatar, LoadingSpinner              | 是否跨多个业务领域使用？               |

### 新领域的处理

当出现以上目录都不合适的新业务（如 `/app/blog`），直接新建 `components/blog/` 子目录，**不要往 `shared/` 里堆**。

---

## 禁止事项

```
# ❌ 禁止：就近组件被其他路由跨目录导入
import { Foo } from "@/app/(dashboard)/album/Foo";   # 应升级到 components/<领域>/

# ❌ 禁止：组件平铺在 components/ 根层
components/DocSidebar.tsx
components/DocContent.tsx
components/Button.tsx

# ❌ 禁止：禁止为了实现业务逻辑修改 /components/ui 里面的内容，这是基础，可以拷贝二次开发都不可以修改内容
components/ui/**.tsx


# ✅ 正确：按领域分子目录
components/doc/DocSidebar.tsx
components/doc/DocContent.tsx
components/ui/Button.tsx
```

---

## 组件文件拆分

### 触发条件

- 单文件超过 **150 行** → 必须拆分
- 一个文件内有多个组件定义 → 每个组件独立文件
- JSX 中有可识别的独立区块（header、body、footer）→ 各自提取

### 拆分步骤

1. 识别文件中可以独立的 JSX 区块
2. 每块提取为同目录下的独立文件
3. 在父组件中 import 使用

```tsx
// 拆分前：components/doc/DocPage.tsx（220 行，过长）
export function DocPage() {
  return (
    <div>
      <header>...</header> // ← 可提取
      <aside>...</aside> // ← 可提取
      <article>...</article> // ← 可提取
    </div>
  );
}

// 拆分后：
// components/doc/DocHeader.tsx
// components/doc/DocSidebar.tsx
// components/doc/DocArticle.tsx
// components/doc/DocPage.tsx（< 30 行，只做组装）
```

---

## Server vs Client 组件

- 默认写 **Server Component**（无 `'use client'`）
- 只有用到 `useState`、`useEffect`、事件处理、浏览器 API 时才加 `'use client'`
- Client 组件尽量下推到叶子节点，减少客户端 bundle 体积
- `'use client'` 必须写在文件第一行
