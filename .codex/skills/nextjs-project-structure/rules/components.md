# 组件分类与拆分规则

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

| 目录 | 放什么 | 判断问题 |
|------|--------|---------|
| `ui/` | Button, Badge, Input, Modal, Tooltip... | 是否完全无业务逻辑，只接受通用 props？ |
| `layout/` | Header, Footer, Sidebar, Container, PageWrapper | 是否负责页面整体骨架？ |
| `doc/` | DocContent, DocSidebar, DocToc, CodeBlock, Callout | 是否只在文档类页面使用？ |
| `marketing/` | Hero, PricingCard, FeatureGrid, CTA | 是否只在营销/落地页使用？ |
| `shared/` | SearchBar, UserAvatar, LoadingSpinner | 是否跨多个业务领域使用？ |

### 新领域的处理

当出现以上目录都不合适的新业务（如 `/app/blog`），直接新建 `components/blog/` 子目录，**不要往 `shared/` 里堆**。

---

## 禁止事项

```
# ❌ 禁止：_components 局部目录
app/doc/_components/Sidebar.tsx

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
4. 运行 Biome 确认无报错

```tsx
// 拆分前：components/doc/DocPage.tsx（220 行，过长）
export function DocPage() {
  return (
    <div>
      <header>...</header>       // ← 可提取
      <aside>...</aside>         // ← 可提取
      <article>...</article>     // ← 可提取
    </div>
  )
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
