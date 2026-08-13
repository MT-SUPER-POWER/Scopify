# 项目代码结构规范

> **AI Agent 请读根目录 [AGENTS.md](../AGENTS.md)**

Scopify 使用 Bun Workspaces + Turborepo 管理多端。所有应用源码位于 `repo/`；本文中的 `app/`、`components/`、`types/`、`hooks/`、`lib/` 和 `store/` 都相对于 `repo/frontend/apps/web/`；Electron 位于 `repo/frontend/apps/desktop/`。目标是：类型、逻辑、UI 各归其位；**路由层可以组装页面，但不要做无意义的单组件转发**。

---

## 路由层（page / layout）

- **可以**在 `page.tsx` 或 `layout.tsx` 里 import 多个 `@/components/*` 拼页面
- **可以**用 `layout.tsx` 承担公共壳（侧栏、PlayBar 等），子路由只写内容区
- **不要**机械写成 `return <XxxPage />` 当默认模板——除非该组件确实承担完整页面模块且 page 还有 metadata / SSR 等路由职责
- **不要**在 `app/**` 定义 `interface`、写 API/hook 封装；那些放 `types/`、`hooks/`、`lib/`

---

## 目录一览

```text
repo/
  frontend/
    apps/
      web/
        app/              路由入口：page / layout 适度组装，非空壳转发
        components/       UI 组件，按 artist、album、Playlist… 分子目录
        types/            所有 Web type / interface
          api/            配合 lib/api/ 的请求与响应类型
          components/     复杂或多文件复用的组件 Props
        hooks/            业务域 hooks（artist、player、search…）
        lib/
          api/            后端 API 函数（禁止写 interface）
          hooks/          基础设施 hooks（登录态、路由、Electron…）
          web/            request、env、网络错误
        store/module/     Zustand 全局状态
        constants/        静态配置与枚举（>10 条数组放这里）
      desktop/
        main/             Electron 主进程与 preload
        renderer/         Web 静态构建生成的制品插槽，不提交
      mobile/             Flutter 预留入口
    packages/
      desktop-contract/   Web/Desktop 共享的版本化 IPC 契约
```

Web Path alias：`@/` → `repo/frontend/apps/web/`，例如 `@/types/…`、`@/lib/…`、`@/components/…`。Desktop 不得反向 import Web 源码，只能消费 `@mt-super-power/desktop-contract` 和生成的 `renderer/` 制品。

---

## 类型放哪里

| 类型                    | 路径                         | 示例                           |
| ----------------------- | ---------------------------- | ------------------------------ |
| API 响应/请求           | `types/api/<领域>.ts`        | `FollowedArtistsResponse`      |
| 业务实体                | `types/<领域>.ts`            | `ArtistInfo`、`FollowedArtist` |
| 组件 Props（复杂/复用） | `types/components/<领域>.ts` | `ArtistInlineLinksProps`       |

**禁止**在以下位置定义类型：

- `lib/api/*.ts`
- `app/**`
- `store/module/*`

**允许**简单 Props 留在组件同文件：仅本组件用、字段 ≤ 5、纯 UI 结构。

---

## Hooks 放哪里

| 场景                      | 目录            |
| ------------------------- | --------------- |
| 页面数据与交互            | `hooks/<领域>/` |
| 登录态、路由、Electron 等 | `lib/hooks/`    |

不要在 `components/` 下新建 `hook/` 目录（历史遗留除外，改动时迁出）。

---

## 开发命令

```bash
bun install
bun run dev            # Web + Electron
bun run dev:web        # 仅 Web
bun run dev:desktop    # 仅 Electron（需要 Web dev server）
bun run dev:full       # Web + Electron + 后端
bun run build:web      # 普通 Next.js Web 构建
bun run build:desktop  # 静态 Renderer + Electron 构建
bun run i18n:types     # 更新 i18n 类型
```

## 相关文档

- [AGENTS.md](../AGENTS.md) — Agent 与贡献者共同遵循的结构规范
- [repo/backend/api-enhanced/AGENTS.md](../repo/backend/api-enhanced/AGENTS.md) — 后端 API 规范
- `.agents/skills/nextjs-project-structure/` — 更细的 page / components / types-hooks 分规则
