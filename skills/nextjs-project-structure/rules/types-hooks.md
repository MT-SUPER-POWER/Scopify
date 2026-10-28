# 类型、Hooks、常量的归属判断

> Scopify 细则见根目录 [AGENTS.md](../../AGENTS.md)。API 类型放 `types/<领域>/api.ts`，`lib/api/` 禁止定义 interface。

## `/types` — 类型定义

### 规则

- 所有 `interface` 和 `type` 定义**必须**放在 `/types/<领域>/` 目录下
- **禁止**在 page.tsx、**lib/api/**、hook 文件内定义类型（简单 props 类型除外）
- 先按业务领域建目录，再按层次拆文件：领域主文件用固定名 `model.ts`（业务实体）、`api.ts`（请求/响应）、`components.ts`（复用 Props）；同一领域有更多主题时用 `<主题>.ts`、`<主题>Api.ts`、`<主题>Components.ts`
- 领域目录名尽量与 `components/` 下的业务目录一致，不要在 `types/` 根目录直接放业务文件
- 不设 `types/index.ts` 或领域聚合出口，直接 `import { DocPageProps } from "@/types/doc/components"`，避免命名冲突和循环依赖
- 生成文件 `i18n.generated.d.ts` 是 `types/` 根目录仅有的文件；全局声明也放进对应领域（如 `desktop/electron.d.ts`）

### 文件划分示例

```
types/
├── doc/
│   ├── model.ts          # DocItem, DocSection...
│   ├── api.ts            # 文档接口的请求/响应
│   └── components.ts     # DocPageProps...
├── user/
│   ├── api.ts
│   └── profile.ts
└── nav/
    └── model.ts          # NavItem, NavGroup, BreadcrumbItem...
```

> [!note]
> 某个领域的文件仍然过大时，继续按主题拆成 `<领域>/<主题>.ts`，保持单一职责和清晰的归属。

### Props 类型的例外处理

组件自身的 props 类型可以写在组件文件内（因为强耦合），但满足以下条件时必须提取到 `/types`：

- 该类型被 **2 个以上**文件引用
- 该类型包含超过 **5 个字段**
- 该类型是业务实体（如 `User`、`DocItem`），不是单纯的 UI props

```ts
// ✅ 可以留在组件文件内的 props 类型（简单、仅本组件用）
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

// ✅ 必须移到 /types/doc/model.ts 的业务类型
export interface DocItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  publishedAt: Date;
  author: User;
}
```

---

## `/hooks` — Custom Hooks

### 规则

- 所有 custom hook（函数名以 `use` 开头）**必须**放在 `/hooks/`
- **禁止**在组件文件内部定义 hook（除非是单行的 `useState` 初始化）
- 一个 hook 一个文件，文件名与 hook 名一致

### 判断是否需要提取为 hook

| 情况                        | 处理            |
| --------------------------- | --------------- |
| 逻辑超过 15 行              | 提取为 hook     |
| 逻辑在多个组件复用          | 必须提取为 hook |
| 包含 `useEffect` + 状态管理 | 提取为 hook     |
| 只是一行 `useState`         | 可以留在组件内  |

```ts
// ✅ /hooks/useDocSearch.ts
"use client";

import { useState, useCallback } from "react";
import type { DocItem } from "@/types/doc";

export function useDocSearch(items: DocItem[]) {
  const [query, setQuery] = useState("");

  const results = items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));

  const clear = useCallback(() => setQuery(""), []);

  return { query, setQuery, results, clear };
}
```

---

## `/constants` — 静态数据与配置

### 规则

- 静态数据数组超过 **10 条** → 移入 `/constants/`
- 全局配置值（站点名、API base URL 等）→ `/constants/config.ts`
- 导航结构数据 → `/constants/nav.ts`
- 枚举值 / 映射表 → `/constants/<领域>.ts`

```ts
// ✅ /constants/nav.ts
import type { NavItem } from "@/types/nav";

export const DOC_NAV: NavItem[] = [
  {
    id: "getting-started",
    title: "快速开始",
    href: "/doc/getting-started",
    children: [
      { id: "intro", title: "介绍", href: "/doc/intro" },
      { id: "install", title: "安装", href: "/doc/install" },
    ],
  },
  // ...更多条目
];
```

---

## `/lib` — 工具函数与第三方封装

### 规则

- 纯函数工具（格式化、计算、转换）→ `/lib/utils.ts`
- 数据获取封装 → `/lib/fetcher.ts` 或 `/lib/<领域>.ts`
- 第三方库的初始化/封装 → `/lib/<库名>.ts`

```ts
// ✅ /lib/doc.ts — 数据获取封装，page.tsx 调用此函数
import type { DocItem } from "@/types/doc";

export async function getDocBySlug(slug: string): Promise<DocItem> {
  // ...
}

export function getAllDocSlugs(): string[] {
  // ...
}
```

---

## `/stores` — 状态管理

- 每个 store 单独文件，按业务领域命名
- store 文件内可以 import `/types` 中的类型，但不能反向依赖组件
- 示例：`/stores/userStore.ts`、`/stores/docStore.ts`
