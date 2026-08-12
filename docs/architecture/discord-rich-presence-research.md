# Discord Rich Presence 技术参考

> 调研日期：2026-08-12。本文只记录 Discord Desktop RPC 与当前依赖 `@xhayper/discord-rpc`（其上游仓库现重定向至 `Khaomi/discord-rpc`）的可核验事实，供 Scopify 桌面端配置和排障使用。

## 1. 创建应用与取得 Application ID

Discord 应用是 Rich Presence 集成的主体；在 [Developer Portal](https://discord.com/developers/applications) 点击 **Create App**、填写名称并创建后，可在应用的 **General Information** 页面复制 **Application ID**。该 ID 是公开标识，不是 Bot Token；Token 属于敏感凭据，不应写入配置或版本库。[Discord 创建应用与取得 ID 指南](https://docs.discord.com/developers/quick-start/getting-started)

对本项目而言，用户在 Scopify 设置中填写的是这个 Application ID。该 ID 对应的 Discord 应用名称会默认成为 Presence 顶部显示的应用名；Rich Presence 不会自动把 Scopify 的包名转换成一个 Discord 应用。[Discord Rich Presence 名称说明](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#setting-the-application-name)

若需要固定应用图标或静态图片，在该应用的 **Rich Presence → Art Assets** 中上传并保存；上传后的 asset key 会自动转为小写。[Discord Art Assets 上传说明](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#uploading-assets)

## 2. Desktop/local RPC 的运行前提

原生应用通过本机 IPC 与 Discord 客户端通信；Discord 将此方式称为 RPC over IPC。[Discord RPC transport 说明](https://docs.discord.com/developers/topics/rpc#rpc-over-ipc) 对不需要完整 OAuth 登录的直接 Rich Presence，前提是 Discord 桌面客户端正在用户机器上运行，且应用已注册并拥有有效的 Application ID；该路径不需要调用登录/认证接口。[Discord 直接 Rich Presence 要求](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#rich-presence-without-authentication)

排障时，先确认 Application ID 与 Discord 桌面客户端这两个直接前提，再检查应用侧开关、IPC 连接以及实际的 `SET_ACTIVITY` 响应。Discord 将 Rich Presence 展示于用户资料、好友列表和服务器成员列表等界面。[Discord Rich Presence 的展示位置](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#understanding-rich-presence)

原生 RPC 不经过 Scopify 的后端。Discord 的本地 RPC server 对 WebSocket 兼容路径使用 `127.0.0.1`，端口会在 `6463`–`6472` 中依次选择；库通常将这些探测细节封装起来。[Discord RPC 本地端口约定](https://docs.discord.com/developers/topics/rpc#rpc-server-ports)

## 3. `SET_ACTIVITY` 与音乐播放的字段映射

`SET_ACTIVITY` 是更新用户 Rich Presence 的 RPC 命令；命令参数有进程 `pid` 和 `activity`。它允许的 activity type 为 Playing (`0`)、Listening (`2`)、Watching (`3`) 与 Competing (`5`)。[Discord `SET_ACTIVITY` 参考](https://docs.discord.com/developers/topics/rpc#setactivity) 音乐播放器应使用 `Listening (2)`，并在暂停或退出时清空活动，避免展示过期曲目。

| 目标 | Activity 字段 | Scopify 建议 |
| --- | --- | --- |
| 顶部应用名 | `name` / 注册应用名 | 注册为 Scopify；常规情况不必每首歌设置。 [字段语义](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#understanding-rich-presence) |
| 主文本 | `details` | 歌曲名。 [字段语义](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#understanding-rich-presence) |
| 次文本 | `state` | 歌手或专辑。 [字段语义](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#understanding-rich-presence) |
| 进度 | `timestamps.start`、`timestamps.end` | 播放时设置已按播放位置回推的开始时间与歌曲结束时间；暂停时应移除时间戳或冻结为静态 Presence。`start` 用于正计时、`end` 用于倒计时。 [Discord 时间戳规则](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#setting-timestamps) |
| 封面与说明 | `assets.large_image`、`assets.large_text` | 用曲目封面与悬浮文字；可附带 `large_url` 作为点击链接。 [Discord `SET_ACTIVITY` 示例](https://docs.discord.com/developers/topics/rpc#setactivity) |
| 操作入口 | `buttons` | 最多两个、每个包含标签和 URL；适合“打开 Scopify”或项目主页，不宜把播放控制伪装为按钮。 [Discord 按钮限制](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#setting-buttons) |

## 4. 上传 asset 与外部封面 URL

上传 asset 是以 key 引用的应用内资源，适合 Scopify logo 等固定图片；每个应用最多可存 300 个，推荐 1024×1024，上传支持 PNG、JPEG、WebP，不支持动画。[Discord 上传资源限制](https://docs.discord.com/developers/rich-presence/using-with-the-embedded-app-sdk#uploading-custom-assets)

外部 URL 可以直接放进 `assets.large_image` 或 `assets.small_image`，适合每首不同的动态专辑封面；Discord 官方示例明确使用完整 HTTPS 图片 URL。与上传 asset 不同，外部 URL 还支持 GIF、动画 WebP 与 AVIF；仍须保证图片尺寸和大小合适。[Discord 外部资产用法与格式差异](https://docs.discord.com/developers/rich-presence/using-with-the-embedded-app-sdk#using-external-custom-assets)

**实践选择：**静态 Scopify 标识用上传 asset key，专辑封面优先用稳定、可公开访问的 HTTPS URL。若封面 URL 有鉴权、短时签名或无法被 Discord 访问，Presence 可能没有图片；这是由“Discord 客户端/服务取用外部 URL”这一机制推得的实现风险，而非 Scopify 可通过 IPC 修复的问题。[Discord 对外部 URL 的定义](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#uploading-assets)

## 5. `@xhayper/discord-rpc` 的实际 API

该包 README 的最小调用顺序是：`new Client({ clientId })` → 监听 `ready` → `client.user?.setActivity(...)` → `client.login()`。[库 README 示例](https://github.com/Khaomi/discord-rpc/blob/main/README.md) `Client` 默认创建 IPC transport，并公开 `connected`、`disconnected` 与 `ready` 事件；`login()` 在未传 OAuth scopes 时只连接本地 RPC 并触发 `ready`，适合直接 Presence。[`Client` 源码：默认 IPC 与事件](https://github.com/Khaomi/discord-rpc/blob/main/src/Client.ts) [`login()` 源码](https://github.com/Khaomi/discord-rpc/blob/main/src/Client.ts#L328-L350)

`client.user.setActivity(activity, pid?)` 会把高层字段转换为 `SET_ACTIVITY`，默认 `pid` 为 Node 进程 PID；`client.user.clearActivity(pid?)` 通过不带 activity 的 `SET_ACTIVITY` 清除 Presence。[`setActivity` / `clearActivity` 源码](https://github.com/Khaomi/discord-rpc/blob/main/src/structures/ClientUser.ts#L216-L313)

库的字段名与 RPC payload 的对应如下：

| 库输入 | RPC activity 字段 |
| --- | --- |
| `details`、`state` | `details`、`state` |
| `startTimestamp`、`endTimestamp` | `timestamps.start`、`timestamps.end` |
| `largeImageKey`、`smallImageKey` | `assets.large_image`、`assets.small_image` |
| `largeImageText`、`smallImageText` | `assets.large_text`、`assets.small_text` |
| `largeImageUrl`、`smallImageUrl` | `assets.large_url`、`assets.small_url` |

以上映射来自该库的 `setActivity` 实现。[`setActivity` 字段映射源码](https://github.com/Khaomi/discord-rpc/blob/main/src/structures/ClientUser.ts#L223-L304)

**不要被字段名误导：**`largeImageUrl` / `smallImageUrl` 映射的是图片的点击跳转 URL（`large_url` / `small_url`），不能作为外部图片来源。外部封面 URL 需要传给 `largeImageKey` / `smallImageKey`，使其进入 `large_image` / `small_image`；这与 Discord 允许在这两个 RPC 字段传入外部图片 URL 的规则一致。[Discord 外部图片字段](https://docs.discord.com/developers/rich-presence/using-with-the-embedded-app-sdk#using-external-custom-assets) [`@xhayper/discord-rpc` 映射源码](https://github.com/Khaomi/discord-rpc/blob/main/src/structures/ClientUser.ts#L253-L268)

### 时间戳注意事项

Discord 当前 Social SDK 文档将 activity 时间戳描述为 Unix **秒**；但该 JavaScript 库对 `Date` 输入调用 `getTime()`，即毫秒，并原样转发数值输入。集成时应以正在使用的库版本与实际 Discord 客户端的行为做一轮验证，且不要混用“秒”和“毫秒”构造值；这是当前官方 SDK 文档与该第三方实现需要显式测试的兼容性点。[Discord 时间戳单位说明](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#setting-timestamps) [`@xhayper/discord-rpc` 的时间戳转换源码](https://github.com/Khaomi/discord-rpc/blob/main/src/structures/ClientUser.ts#L239-L251)

## 6. 最短验收路径

1. 在 Developer Portal 创建/选择一个应用，复制 **General Information → Application ID**，并仅将 ID 填入 Scopify 配置。[Discord 创建应用步骤](https://docs.discord.com/developers/quick-start/getting-started)
2. 启动 Discord **桌面端**并登录，再启动 Scopify 桌面端；浏览器版 Discord 不满足直接本地 RPC 的桌面客户端前提。[Discord 直接 Presence 要求](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence#rich-presence-without-authentication)
3. 在 Scopify 打开 Discord Presence，并播放一首有元数据的歌曲；日志应依次出现连接成功、`ready` 与更新 Activity，而暂停/退出应调用清除或发送无时间戳状态。[库连接流程](https://github.com/Khaomi/discord-rpc/blob/main/src/Client.ts#L283-L363) [`setActivity` 与清除行为](https://github.com/Khaomi/discord-rpc/blob/main/src/structures/ClientUser.ts#L216-L313)
4. 若只缺封面，先以已上传的静态 asset key 验证链路，再检查动态外部 URL 是否可公开访问和是否符合图片约束。[Discord asset / URL 区别](https://docs.discord.com/developers/rich-presence/using-with-the-embedded-app-sdk#using-external-custom-assets)
