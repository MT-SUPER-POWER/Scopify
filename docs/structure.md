# 项目代码结构规范

> **AI Agent 请读根目录 [AGENTS.md](../AGENTS.md)** — 跨工具通用，不依赖 Cursor 配置。

Scopify 前端采用 **全局目录 + 按领域分子目录** 的组织方式。目标是：类型、逻辑、UI 各归其位，避免在 `page.tsx` 或 API 文件里散落定义。

---

## 目录一览

```
app/              路由（page.tsx 只做组装，< 80 行）
components/       UI 组件，按 artist、album、Playlist… 分子目录
types/            所有 type / interface
  api/            配合 lib/api/ 的请求与响应类型
  components/     复杂或多文件复用的组件 Props
hooks/            业务域 hooks（artist、player、search…）
lib/
  api/            后端 API 函数（禁止写 interface）
  hooks/          基础设施 hooks（登录态、路由、Electron…）
  web/            request、env、网络错误
store/module/     Zustand 全局状态
main/             Electron 主进程
constants/        静态配置与枚举（待建，>10 条数组放这里）
```

Path alias：`@/` → 根目录，`@/types/…`、`@/lib/…`、`@/components/…`。

---

## 类型放哪里

| 类型 | 路径 | 示例 |
|------|------|------|
| API 响应/请求 | `types/api/<领域>.ts` | `FollowedArtistsResponse` |
| 业务实体 | `types/<领域>.ts` | `ArtistInfo`、`FollowedArtist` |
| 组件 Props（复杂/复用） | `types/components/<领域>.ts` | `ArtistInlineLinksProps` |

**禁止**在以下位置定义类型：

- `lib/api/*.ts`
- `app/**`
- `store/module/*`

**允许**简单 Props 留在组件同文件：仅本组件用、字段 ≤ 5、纯 UI 结构。

---

## Hooks 放哪里

| 场景 | 目录 |
|------|------|
| 页面数据与交互 | `hooks/<领域>/` |
| 登录态、路由、Electron 等 | `lib/hooks/` |

不要在 `components/` 下新建 `hook/` 目录（历史遗留除外，改动时迁出）。

---

## 开发命令

```bash
bun install
bun run dev:full       # Web + 后端
bun run check          # Biome 检查并自动修复
bun run i18n:types     # 更新 i18n 类型
```

提交前运行 `bun run check`，不得遗留 Biome error。

---

## 迁移进度

已完成：

- [x] `lib/api/artist.ts`、`music.ts`、`comment.ts` 类型迁至 `types/api/`
- [x] `types/artist.ts` 工具函数迁至 `lib/utils.ts`
- [x] `hooks/artist/useArtistData.ts` 缓存类型迁至 `types/artist.ts`

待逐步迁移（改到相关文件时顺手做）：

- [ ] `components/**` 内约 40+ 处 inline interface → `types/components/`
- [ ] `components/Playlist/hook/`、`components/SearchContents/hooks/` → `hooks/`

---

## 相关文档

- [AGENTS.md](../AGENTS.md) — Agent 与贡献者共同遵循的结构规范
- [backend/api-enhanced/AGENTS.md](../backend/api-enhanced/AGENTS.md) — 后端 API 规范
- `.agents/skills/nextjs-project-structure/` — 更细的 page / components / biome 分规则
