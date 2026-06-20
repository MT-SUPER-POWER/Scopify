# Scopify — Agent Instructions

Scopify 是 **Next.js App Router + Electron + Zustand** 的网易云音乐客户端。前端与 `backend/api-enhanced` 解耦部署；后端有自己的 [AGENTS.md](./backend/api-enhanced/AGENTS.md)。

**本文件是前端/Electron 代码结构的唯一规范。** 新建或修改代码时必须遵守；发现 inline 类型、散落 hook 等历史债务时，顺手迁移到正确目录。

---

## Quick Start

| 项 | 值 |
|---|---|
| 包管理器 | **bun**（>= 1.3.7） |
| Node | >= 20 |
| Lint / Format | **Biome**（不是 ESLint） |

```bash
bun install
bun run dev:full          # Web + 后端联调
bun run dev:web           # 仅 Web
bun run dev               # Electron 桌面端
bun run check             # biome check --write .
bun run lint
bun run i18n:types        # 生成 i18n 类型
```

---

## 目录结构（实际约定）

```
Scopify/
├── app/                    # 路由层：只做页面组装，不写业务逻辑
│   ├── (auth)/             # 登录相关路由
│   ├── (dashboard)/        # 主应用路由
│   └── tray/               # Electron 托盘页
│
├── components/             # UI 组件，按业务领域分子目录
│   ├── ui/                 # shadcn 通用组件（勿改结构）
│   ├── artist/             # 歌手页
│   ├── album/              # 专辑页
│   ├── Playlist/           # 歌单（历史命名，保持 PascalCase）
│   ├── profile/            # 用户资料
│   ├── settings/           # 设置
│   ├── shared/             # 跨领域复用组件
│   └── …
│
├── types/                  # ★ 所有类型定义的归宿
│   ├── api/                # API 请求/响应类型（配合 lib/api/）
│   ├── components/         # 组件 Props（被 2+ 文件引用或字段 > 5）
│   ├── artist.ts           # 领域实体（Artist、Track、Album…）
│   ├── playlist.ts
│   └── …
│
├── hooks/                  # 业务域 custom hooks
│   ├── artist/
│   ├── player/
│   ├── search/
│   ├── settings/
│   └── profile/
│
├── lib/                    # 工具、API 客户端、基础设施
│   ├── api/                # 后端 API 调用函数（★ 禁止在此定义 interface）
│   ├── hooks/              # 跨域/基础设施 hooks（路由、登录态、Electron 检测…）
│   ├── web/                # request、env、网络错误处理
│   ├── player/
│   ├── cache/
│   └── utils.ts
│
├── store/                  # Zustand 全局状态（不是 stores/）
│   ├── index.ts
│   └── module/             # player、user、i18n、ui、search…
│
├── main/                   # Electron 主进程
├── constants/              # 静态配置、枚举、导航数据（>10 条数组放这里）
├── tests/                  # 单元测试
└── script/                 # 构建/开发脚本
```

### Path Aliases（tsconfig）

| Alias | 路径 |
|---|---|
| `@/*` | 项目根 |
| `@components/*` | `./components/*` |
| `@store/*` | `./store/*` |
| `@app-types/*` | `./types/*` |

优先使用 `@/types/...`、`@/lib/...`、`@/components/...`。

---

## 核心规则

### 1. `app/**/page.tsx` — 只做组装

```tsx
// ✅ 正确
import ArtistPage from "@/components/artist/ArtistPage";

export default function Page() {
  return <ArtistPage />;
}
```

**禁止：** 定义 `interface`/`type`、写超过 15 行业务逻辑、内联子组件、静态数据数组。目标 **< 80 行**。

---

### 2. 类型定义 — 最重要的规范

#### 放哪里

| 类型性质 | 目标路径 | 示例 |
|---|---|---|
| 后端 API 响应/请求体 | `types/api/<领域>.ts` | `AlbumSubscribeResponse`、`FollowedArtistsResponse` |
| 业务实体（跨组件/API 复用） | `types/<领域>.ts` | `ArtistInfo`、`FollowedArtist`、`Track` |
| 组件 Props（复杂或多文件复用） | `types/components/<领域>.ts` | `ArtistInlineLinksProps` |
| 全局/网络/认证等横切类型 | `types/<name>.ts` | `types/auth.ts`、`types/network.ts` |

#### 禁止 inline 的位置

- **`lib/api/*.ts`** — 只 export 函数，类型一律 import 自 `@/types/api/*` 或 `@/types/*`
- **`app/**`** — 路由文件不写类型
- **`store/module/*`** — 状态类型放 `types/`，store 只 import

#### 允许留在组件文件内的例外

同时满足以下**全部**条件时，Props 可写在组件同文件：

1. 仅本组件使用（无第二处 import）
2. 字段 **≤ 5** 个
3. 纯 UI 结构（非业务实体）

```tsx
// ✅ 可 inline：简单、私有 Props
interface ActionCardProps {
  title: string;
  subtitle: string;
  buttonText: string;
  onClick: () => void;
}
```

满足以下**任一**条件则**必须**提取到 `types/components/`：

- 被 2 个以上文件引用
- 字段 > 5 个
- 属于业务实体（User、Track、Playlist…）

```ts
// ✅ lib/api/artist.ts — 只保留函数
import type { FollowedArtistsResponse } from "@/types/api/artist";

export function getFollowedArtists(limit = 20, offset = 0) {
  return request.get<FollowedArtistsResponse>("/artist/sublist", {
    params: { limit, offset },
  });
}
```

#### 已知债务（修改时优先迁移）

- `components/**` 内约 40+ 处 inline interface → 按上表逐步迁入 `types/components/`
- `components/Playlist/hook/`、`components/SearchContents/hooks/` → 迁到 `hooks/`

#### 已完成迁移

- `lib/api/*.ts` 类型 → `types/api/`（artist、music、comment）
- `types/artist.ts` 内 `formatNumber`/`formatDuration` → `lib/utils.ts`
- `hooks/artist/useArtistData.ts` 缓存类型 → `types/artist.ts`

---

## 文档入口

| 文件 | 读者 | 说明 |
|---|---|---|
| [AGENTS.md](./AGENTS.md) | AI Agent + 贡献者 | **结构规范唯一来源**（跨 Cursor / Claude / Codex 等） |
| [docs/structure.md](./docs/structure.md) | 人类贡献者 | 精简版说明与迁移 checklist |
| [backend/api-enhanced/AGENTS.md](./backend/api-enhanced/AGENTS.md) | 后端 | NetEase API 服务 |

**不使用 `.cursor/rules/`** — 规范写在仓库内 markdown，避免绑定单一 IDE。

---

### 3. Hooks 归属

| 场景 | 目录 |
|---|---|
| 业务页数据/交互（歌手、搜索、播放器…） | `hooks/<领域>/use*.ts` |
| 基础设施（登录态、路由、Electron、音量） | `lib/hooks/use*.ts` |

**禁止** 在 `components/` 下新建 `hook/` 或 `hooks/` 目录（历史遗留如 `components/Playlist/hook/` 存在，新代码不要效仿；改动时迁到 `hooks/`）。

提取条件：逻辑 > 15 行、含 `useEffect` + 状态、或多组件复用。

---

### 4. 组件

- 全部放在 `components/<领域>/`，**禁止** `app/` 下的 `_components/`
- `components/ui/` 为 shadcn 生成物，按 upstream 结构维护
- 单文件 **> 150 行** 考虑拆分子组件或提取 hook
- 组件内不写 API 调用逻辑 → 放 `lib/api/` 或 `hooks/`

---

### 5. 其他目录

| 目录 | 用途 |
|---|---|
| `lib/api/` | Axios 封装，纯函数，无类型定义 |
| `lib/web/` | `request.ts`、环境变量、网络重试 |
| `store/module/` | Zustand slice，类型从 `@/types` import |
| `constants/` | 静态列表、枚举、配置常量 |
| `main/` | Electron 主进程；IPC 见 `main/README.md` |
| `tests/` | 单元测试；有意义的行为才写测试 |

---

## Agent 工作流（每次改代码）

1. **判断归属** — 这是组件 / 类型 / hook / API / store / 常量？
2. **查表落位** — 对照上文目录，不默认写进当前打开的文件
3. **类型先行** — 需要新类型时，先在 `types/` 建文件再写实现
4. **改旧顺手迁** — 触及的文件若有 inline 类型/API 类型，一并迁到 `types/`
5. **Biome 收尾** — `bun run check`，不得遗留 error
6. **i18n** — 新增 UI 文案走 i18n 系统，改完后可跑 `bun run i18n:types`

---

## 代码示例

```ts
// types/api/artist.ts
export interface FollowedArtistsResponse {
  code: number;
  data?: import("@/types/artist").FollowedArtist[];
}
```

```ts
// types/components/artist.ts
export interface PopularTracksProps {
  artistId: string;
  tracks: import("@/types/artist").Track[];
  onPlay: (id: string) => void;
}
```

```tsx
// components/artist/PopularTracks.tsx
import type { PopularTracksProps } from "@/types/components/artist";

export function PopularTracks({ artistId, tracks, onPlay }: PopularTracksProps) {
  // …
}
```

---

## 后端

NetEase API 服务位于 `backend/api-enhanced/`（git submodule）。前端通过 `lib/web/request.ts` 配置的 base URL 访问，开发时可用 `bun run dev:backend` 启动。后端规范见 [backend/api-enhanced/AGENTS.md](./backend/api-enhanced/AGENTS.md)。

---

## 详细参考

更细的规则与示例见 `.agents/skills/nextjs-project-structure/`（page、components、types-hooks、biome 分文件）。**发生冲突时以本 AGENTS.md 的 Scopify 实际目录为准。**
