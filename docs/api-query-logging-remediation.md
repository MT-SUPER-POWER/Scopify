# API、Query 与日志债务报告

更新时间：2026-07-24

## 本轮完成

- ESLint 已启用 `@typescript-eslint/no-explicit-any: error`。
- `lib/api/` 与 `types/api/` 已没有显式 `any`。Artist、Album、用户、登录、歌单、歌曲 URL、首页推荐与搜索端点均使用实际响应契约。
- 已用本地后端采集并建模以下公开端点：`/artist/detail`、`/artist/follow/count`、`/v1/artist/songs`、`/artist/album`、`/album`、`/song/url/v1`、`/user/detail`、`/user/playlist`、`/login/qr/key`、`/login/qr/create`、`/personalized`、`/top/artists` 和四类搜索端点。
- Artist、首页和搜索的读取状态已从手写 `useEffect`/`Promise.all`/页面缓存迁移为 TanStack Query。每日推荐的“不喜欢”操作使用 `useMutation`。
- Renderer logger 会在 Electron 中经 IPC 写入 Main 的 `electron-log`；Axios 只在最终失败时记录结构化错误；未捕获异常和未处理 Promise rejection 已接入 logger。

## 已确认接口契约

### `GET /user/account`

已根据已登录状态的实测 `code: 200` 响应建模为 `UserAccountSuccessResponse`。通用
`UserAccountResponse` 保留 `account` 与 `profile` 为可选字段，因为会话失效时后端可能以
HTTP 200 返回业务错误码；调用方只有确认 `code === 200` 后，才能将其视作完整成功响应。

`account` 记录账户级状态：

- 身份与展示：`id`、`userName`、`type`、`status`、`createTime`。
- 权限与付费：`whitelistAuthority`、`tokenVersion`、`ban`、`baoyueVersion`、`donateVersion`、`vipType`、`paidFee`。
- 会话属性：`anonimousUser`。字段拼写与上游 API 保持一致。

`profile` 记录可供页面、设置与账户态使用的完整资料：

- 基本资料：`userId`、`userType`、`nickname`、`userName`、`shortUserName`、`signature`、`description`、`detailDescription`、`birthday`、`gender`、`province`、`city`。
- 头像与背景：`avatarImgId`、`avatarUrl`、`backgroundImgId`、`backgroundUrl`、`avatarDetail`、`defaultAvatar`。
- 账号与认证：`accountType`、`authority`、`accountStatus`、`authStatus`、`authenticated`、`authenticationTypes`、`anchor`、`locationStatus`。
- 社交与内容：`followed`、`mutual`、`experts`、`expertTags`、`djStatus`。
- 会员与登录：`vipType`、`viptypeVersion`、`createTime`、`lastLoginTime`、`lastLoginIP`、`remarkName`。

该记录仅保存字段与语义，不保存昵称、IP、cookie 或其他实测用户值。契约源码位于
`types/api/user.ts`；未来增加账户 UI 或 Query 数据时，应复用 `UserAccount`、
`UserAccountProfile` 与 `UserAccountSuccessResponse`，不得重新声明局部字段集。

## 当前基线

以下命令通过：

```powershell
bunx tsc --noEmit
bunx eslint types/api lib/api hooks/artist hooks/home hooks/search hooks/playlist
```

`bun run lint` 在约 163 秒后完成，当前仍报告 `122 errors / 217 warnings`，不能作为全仓通过的结论。
错误主要位于尚未迁移的 Folia 可视化域、个人资料、歌单与跨进程工具层；API 契约和上述 Query domains 已清零。

## 剩余显式 any

优先处理业务和基础设施代码：

- `hooks/vipSign/useVipSign.ts`、`hooks/profile/useUserData.ts`、`components/Playlist/hook/usePlaylistData.ts`：仍是手写请求状态，应先补 `types/api`，再迁移 Query。
- `components/auth/LoginPage.tsx`、`components/QueuePopover.tsx`、`components/PlayerCommandHandler.tsx`、`components/Siderbar/FilterMenu.tsx`、`components/LyricModal/QueuePanel.tsx`：组件边界仍有未建模数据。
- `lib/utils.ts`、`lib/web/waitForBackend.ts`、`lib/hooks/useStoreHydration.ts`、`types/lyrics.ts`：第三方或跨进程数据需要窄类型守卫，不能以 `unknown` 或断言掩盖。

单独处理歌词可视化子项目：`components/lyrics/folia/src/**` 占剩余文件的大多数。它是第三方/独立可视化域，应先定义与宿主的输入适配层，再在其内部逐步收紧类型，避免扩大业务 API 变更面。

`types/i18n.generated.d.ts` 为生成文件；应调整生成模板，而不是手改产物。

## 日志边界

日志现在使用统一的 renderer 追踪事件，而不是让每个组件决定 `console.error` 或 toast。事件包含
`source`、`event`、`timestamp`、`id` 和可选 `traceId`，并在跨进程或跨 HTTP 边界前完成递归脱敏。

已覆盖的来源：

```text
Next error boundary / window error / unhandled rejection / console.warn|error
Axios final failure / TanStack Query query|mutation failure / tracked user action
  -> redacted RendererLogEvent
  -> Electron: preload IPC -> Main electron-log file
  -> Web development: local relay -> dev terminal + logs/web/YYYY-MM-DD.log
```

Axios 为每个请求生成 `traceId`；重试、最终 transport 失败、Query 失败和显式业务操作可用这个 ID
串联。不同来源会保留各自事件，便于区分“接口失败”“Query 状态失败”与“用户操作失败”，而不是将它们
折叠成没有上下文的一条 console 输出。

Logger 会脱敏 `cookie`、`csrf`、`MUSIC_*`、`token`、`authorization`、`password` 和 `secret` 字段，
并限制嵌套深度、数组长度和字符串长度。transport 层不拥有 toast，也没有可关闭结构化错误记录的请求配置。

`next.config.ts` 使用静态导出，不能以 Next API Route 作为日志接收端。因此 `bun run dev:web` 会一并
启动 `script/dev-log-relay.ts`，监听 Web 开发端口加一（可用 `APP_CFG_DEBUG_LOG_RELAY_PORT` 覆盖）。
relay 默认只监听 `127.0.0.1`（可用 `APP_CFG_DEBUG_LOG_RELAY_HOST` 覆盖），只处理结构化 POST
事件，输出到启动终端并写入 `logs/web/`；生产静态 Web 不会尝试写本地文件。

### 接入规则

- 网络 API：使用 `requestData(requestConfig(...))`；若端点会将业务失败包装成 HTTP 200，必须声明
  `expectedBusinessCodes`，不得由 UI 根据模糊字段猜测成功与否。
- TanStack Query：为 mutation 指定 `mutationKey` 和 `meta.operation`；`QueryProvider` 的全局 cache
  会负责记录 query/mutation 的失败。
- 有意捕获的非 Query 业务错误：调用 `reportActionFailure("domain.action", error, context)`，再显示
  本地化 toast。`context` 只传资源 ID、操作名等安全诊断数据，绝不传 cookie、token、密码或完整请求体。
- 禁止新增 `console.error` 作为业务错误终点。保留的遗留 console 调用会被开发态捕获，但应在触及时
  迁移到上述两种明确入口。

## 重试职责

Axios 只负责一次请求、会话过期通知、错误归一化和结构化记录；它不重试，也不显示 toast。`retry`、
`retryDelay` 和用户可见错误状态属于 TanStack Query 或具体操作 UI 的职责：

- 全局 Query 默认 `retry: false`，写操作默认不重放。
- 某个只读 Query 只有在调用方能说明其幂等性、可接受的等待时间和失败后的 UI 时，才可在该 Query
  自己声明 `retry` 与 `retryDelay`。
- 读取页应暴露 `refetch` 给 `NetworkRetryState`；专辑、首页、歌手和搜索页已经提供用户点击的重试入口。
- Mutation 在自己的 `onError` 显示一次操作结果；transport 层绝不再追加第二个 toast。

此前配置中的 `network.max_retries` 与 `network.retry_delay` 已从默认配置和设置页移除。旧配置值在加载时
会被忽略，保存一次设置后会被清理。

## 后续顺序

1. 为 Electron preload 与 Main IPC 建立请求/响应类型，消除跨进程 `any`。
2. 迁移 `vipSign`、个人资料和歌单详情的读取 hooks 到 TanStack Query；写操作使用 mutation 并精确失效 query key。
3. 将歌单喜欢、创建/编辑歌单、评论和登录操作迁移为带 `mutationKey`/`meta.operation` 的 mutation；
   消除业务组件中遗留的 `console.error` 与裸 `catch`。
4. 单独规划 Folia 可视化域的类型收紧，避免与业务 API 债务混合。
