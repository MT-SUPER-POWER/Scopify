# types

Web 与 Desktop Renderer 共用的 TypeScript 类型。**先按业务领域找目录，再按文件名找层次。**

## 怎么找

目录名尽量与 `components/` 下的业务目录一致。每个领域目录里：

| 文件 | 放什么 |
| --- | --- |
| `model.ts` | 业务实体、状态、枚举 |
| `api.ts` | 后端请求/响应类型（`lib/api/` 只引用，不定义） |
| `components.ts` | 被多处复用或字段较多的组件 Props |
| `<主题>.ts` / `<主题>Api.ts` / `<主题>Components.ts` | 同一领域下的其他主题，后缀表示层次 |

没有 `index.ts` 聚合出口，直接导入具体文件：`import type { NeteasePlaylist } from "@/types/playlist/api"`。

根目录只保留 `electron.d.ts`（`window.electronAPI` 全局声明，路径被架构检查引用）。翻译函数类型位于 `i18n/model.ts`，i18next 扩展声明位于 `i18n/i18next.d.ts`，`i18n/resources.generated.d.ts` 由官方 CLI 根据简体中文资源自动生成；翻译键从注册资源推导。

## 领域索引

### 内容与实体

| 目录 | 内容 |
| --- | --- |
| `album/` | 专辑 |
| `artist/` | 艺人 |
| `fansGroup/` | 艺人粉丝团 |
| `mv/` | MV |
| `playlist/` | 歌单、歌单排序与标签、歌单封面格栅（`lattice*`） |
| `radio/` | 电台 |
| `voice/` | 播客声音列表 |
| `song/` | 歌曲主数据（`api.ts`）、音质徽章、统计、相似歌曲、右键菜单 |
| `songResources/` | 歌曲百科与乐谱 |
| `search/` | 搜索 |
| `comment/` | 评论 |
| `social/` | 动态、用户状态 |
| `home/` | 首页、轮播图、排行榜 |
| `library/` | 我的音乐库、云盘、播客订阅 |

### 账号与用户

| 目录 | 内容 |
| --- | --- |
| `auth/` | 登录（密码/二维码）、认证状态、音乐会话迁移 |
| `devices/` | 登录设备管理 |
| `user/` | 用户资料、勋章、主页 |
| `vipSign/` | VIP 签到 |
| `messages/` | 私信、收件箱 |
| `notifications/` | 通知 |

### 播放与歌词

| 目录 | 内容 |
| --- | --- |
| `player/` | 播放器、播放条、正在播放、曲目预览 |
| `playback/` | 播放权威、副本投影、媒体端口与传输协议 |
| `audio/` | 均衡器、输出设备、音频特征发布 |
| `personalFm/` | 私人 FM |
| `tracklist/` | 曲目列表列配置、拖拽、可排序列表 |
| `lyrics/` | 歌词数据与歌词页、字幕预览、视频导出；`folia/` 歌词舞台，`rhine/` 背景 |
| `listeningReport/` | 听歌报告与听歌打点 |

### 应用与桌面

| 目录 | 内容 |
| --- | --- |
| `desktop/` | Electron 桌面能力：桌面/任务栏歌词、灵动岛、壁纸、托盘、陪伴窗口、Discord、应用更新 |
| `updates/` | 更新说明（What's New） |
| `settings/` | 设置页、Web 配置 |
| `appearance/` | 外观主题与主题编辑器 |
| `shortcuts/` | 快捷键 |
| `cache/` | 缓存清理 |
| `commandWorkspace/` | 命令面板 |
| `sidebar/` | 侧边栏 |

### 基础设施

| 目录 | 内容 |
| --- | --- |
| `core/` | 应用级基础类型：日志、路由参数、导航滚动恢复、全局 UI/性能/时间 store |
| `network/` | 请求错误分类、后端连通性 |
| `query/` | Query 错误边界 |
| `shared/` | 跨业务的通用 UI Props（品牌、错误页、空状态、滑块） |

## 放哪个目录

- 新类型先看它服务哪个业务；找不到再考虑 `shared/`（纯 UI）或 `core/`（应用级）。
- 依赖 `@scopify/desktop-contract` 不代表属于 `desktop/`：通知、缓存、设置等仍归各自业务，`desktop/` 只放桌面端独有的能力。
- 全局声明（`declare global`）和生成文件之外，不要在 `types/` 根目录新增文件。
