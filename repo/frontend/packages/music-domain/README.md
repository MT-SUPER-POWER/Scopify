# @scopify/music-domain

多平台类型拆分的最小试点，当前只覆盖曲目展示与账号资源身份。

| 层 | 位置 | 包含内容 |
| --- | --- | --- |
| 平台 API 类型 | `apps/web/types/providers/<平台>/trackApi.ts` | 当前端点实际使用的原生字段 |
| 平台适配器 | `apps/web/lib/music/providers/` | 原生数据转换为领域实体 |
| 软件领域类型 | 本包 `src/` | 资源引用、账号引用、歌曲、账号收藏状态 |
| 界面类型 | `apps/docs/types/provider-demo.ts` | 卡片 Props、演示队列与身份展示 |

直接从 `@scopify/music-domain/identity`、`/track`、`/library` 导入，不建立根聚合出口。本包不依赖 React、应用路径别名、平台后端、网络请求或桌面 IPC。

## 约束

- 资源身份包含平台、资源种类和字符串原生 ID。QQ 曲目使用 MID，数字 ID 保留在原生 DTO。
- 账号身份和资源身份独立；相同账号 ID 在不同平台不视为同一个账号。
- 歌曲实体不携带 `liked`、当前账号、凭证、音频 URL 等状态。
- 个人收藏状态包含明确的账号和资源引用；不同账号不能共用收藏缓存键。
- 名称相同不代表同一录音版本，本试点不做跨平台去重或匹配。

`MusicTrack` 只表示最小可展示元数据，不代表资源可播放或可收藏。本试点不定义完整权限矩阵、登录会话、媒体取链、服务端接口验证或持久化迁移。已有 Web `SongDetail`、播放器核心和 Desktop IPC 契约保持原有职责，暂不全量迁移。

## 交互样本

运行 `pnpm run dev:docs`，打开 `/provider-demo`。页面使用虚构 API 样本，演示身份资产隔离、跨来源队列，以及 API → 领域 → UI 三层类型。所有交互仅修改页面内存，刷新重置，不访问平台账号或播放真实音频。
