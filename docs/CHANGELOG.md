# Changelog

## v1.5.1

### Added

- **内置后端手动重启**：桌面设置新增“重启内置后端”操作，通过 Main Backend Controller 停止并重新拉起 Scopify 管理的后端进程；外部后端与未启用状态不会被强制接管。
- **规范 MCP 客户端配置为标准 mcpServers 结构**：将设置页中生成的 MCP 客户端配置与复制标准调整为标准的 `mcpServers.scopify` 格式（包含 `type: "http"`、`url` 与 `headers.Authorization`），使导出的配置与复制内容可直接无缝粘贴至 Cursor、Claude Desktop 等客户端的 `mcp.json` 中使用。
- **系统托盘音乐桌面伴随控制独立开关与双向状态同步**：系统托盘菜单（Tray）收敛至“音乐桌面”体系的两大核心能力——“桌面动态壁纸”与“悬浮控制器”，移除非音乐桌面体系的桌面歌词冗余入口；每一项均配备专属的 Switch 开关并支持整行或开关点击双向切换，托盘呼出时精确查询主进程壁纸运行与遥控器窗口存活状态，实现即时双向状态同步。
- **用户菜单补充“音乐足迹”入口**：在用户头像下拉菜单（ProfileMenu）中补充“音乐足迹”导航项，使用 Footprints 图标，点击后平滑跳转至最近收听报告页面（/recent/report），支持已登录用户直接查看其周度/月度听歌足迹与收听统计。
- **MCP 细粒度受控能力配置**：在 `@scopify/desktop-contract`、桌面配置校验与主进程 `McpAuthorization` 中引入细粒度权限模型；将原本粗粒度的读取/控制两项开关解耦为统一归属于 `playback` 工具的 9 项细粒度能力（2 项状态读取与 7 项控制操作），保持对历史配置的双向兼容。
- **本地 MCP 播放控制与设置**：桌面端新增仅监听 loopback 的 Streamable HTTP MCP 服务，通过 Main Playback Gateway 等待 Renderer 真实回执；设置页可执行真实协议连接测试、重新查看最近一次有效客户端 JSON，并在生成新凭据后立即废止旧 Token，连接地址统一收进可复制的悬浮配置面板。
- **Windows Native Audio Host**：新增 Rust/NAPI 原生音频 Host，基于 Rodio/CPAL 支持本地与 HTTPS 音源的加载、播放、暂停、停止、Seek、音量、状态和错误事件；补齐双 token/请求 revision 淘汰、NAPI 构建与 Windows 打包资源路径，正式切换 Adapter 前继续安全使用 HTML Audio。
- **私人 FM 右键减少推荐**：私人 FM 虚拟歌单中的歌曲右键菜单现可执行“不喜欢 / 减少推荐”；操作通过歌单组件契约透传至既有的私人 FM 负反馈流程，不影响普通歌单与日推菜单。

### Fixed

- **解除内置后端 CORS 跨域限制以适配本地开发**：移除主进程后端启动时对 `CORS_ALLOW_ORIGIN` 仅允许 `scopify://-` 的硬编码设置，交由后端 `server.js` 自适应反射客户端请求 Origin（包括开发模式下的 `http://127.0.0.1:3000` 与生产模式下的 `scopify://-`），彻底解决开发模式下后端接口正常响应却被 Chromium 拦截报 Network Error 的跨域问题。
- **收敛未登录状态下的功能与占位昵称渲染**：修复未登录或本地持久化残留无效账号（如 `userId: 0` 或占位符 `"未知用户"`）时误判登录态的问题。`useLoginStatus` 严格依据合法 `userId > 0` 与非占位符真实昵称校验登录状态；首页时间问候语在未登录或昵称为未知用户时统一纯净展示“晚上好/傍晚好”，不再拼接“，未知用户”；侧边栏未登录时彻底隐藏“私人 FM”导航项；顶部个人资料菜单（ProfileMenu）未登录时隐藏“网易乐签”、“音乐足迹”及“退出登录”，并收敛顶部为清晰的“点击登录”引导卡片，头像组件未登录时使用纯净用户占位图标。
- **恢复音乐会话凭据本地持久化与请求拦截器自动注入**：解决打包后 Electron 生产环境（`app://` 协议）与跨域 Web 环境下，因 Chromium 第三方跨站 Cookie 隔离导致扫码登录后 Cookie 无法持久化、请求缺少凭据返回 301 并被误判登出的缺陷。在 QrLogin 登录成功后即时保存 `music_cookie` 至 localStorage，并在请求拦截器中自动为非 noLogin 请求附加 cookie 参数，与网易云后端参数解析契约保持对齐。
- **修复系统托盘单击唤出与伴随窗口控制权限**：解决 Windows 系统托盘图标仅监听右键导致左键单击无法唤出托盘窗口的问题，现支持单击与右键双向呼出；补齐托盘对桌面歌词的 IPC 调用授权与最小化还原逻辑，双击托盘图标在还原主视窗时自动同步销毁托盘临时窗口。
- **修复桌面音乐控制器最小化后无法主动唤出问题**：在 `controllerWindow.show()` 中增加窗口最小化检测与 `window.restore()` 还原，重新应用 `setAlwaysOnTop(true, "floating")`、`show()` 与 `focus()`，并对加载失败的悬挂实例进行即时销毁清理，确保从托盘或界面中能可靠地唤出悬浮遥控器小窗口。
- **统一当前歌曲喜欢 Mutation 链路**：PlayBar、命令工作区、快捷键、桌面歌词与 Folia 的 `toggle-like` 命令不再绕过 TanStack Mutation 直接调用喜欢接口；喜欢和取消喜欢都会先清理页面缓存，再精确刷新当前用户的 liked-playlist 与 playlists Query，使侧边栏 LibItem 的封面和歌曲数重新获取，声音收藏继续走独立的 Voice Mutation。
- **歌单曲目删除权限收敛**：歌单行右键的“从歌单移除”现在只会在已登录用户查看自己创建的真实歌单时出现并创建删除回调；匿名访问、他人歌单、日推/历史日推及其他虚拟歌单均会安全地隐藏该操作。
- **歌曲喜欢/取消喜欢 Mutation 与多端缓存失效**：新增统一的 `useSongLikeMutation`，彻底替代各处散落的 `likeSong` 直接调用；在触发喜欢或取消喜欢后，自动乐观更新本地状态并在成功后自动触发红心歌单元数据（`liked-playlist`）、侧边栏歌单列表（`playlists`，触发 `LibItem` 重新请求并刷新红心歌单封面图与歌曲数）以及当前打开歌单详情与歌曲列表（`playlist.content`）的缓存失效，解决喜欢/取消喜欢后侧边栏封面与歌单内容未及时更新的问题。

### Visual

- **统一 MCP 客户端凭据单按钮入口与内嵌重新生成**：重构设置页客户端凭据控制项（`McpCredentialControls`），外部收敛为统一对齐的单一“查看配置”按钮并恢复标准水平行排版，彻底消除多按钮并列造成的视觉突兀；将“重新生成凭据”操作收进配置预览浮动卡片（`McpClientConfigurationPreview`）内部，与“复制客户端配置”并排协作，支持在面板内直接轮换刷新。
- **托盘音乐桌面核心伴随功能规范化**：系统托盘菜单对齐音乐桌面定义，聚焦于“桌面动态壁纸”与“悬浮控制器”两大核心功能，移除与音乐桌面无关的桌面歌词条目；采用统一图标 + 标题 + Switch 开关布局，优化窗口高度比例，统一悬浮高亮与响应体验。
- **MCP 受控权限二级弹窗重构**：参考 `Ctrl + /` 快捷键帮助界面的沉浸式深色遮罩与排版风格重写受控能力二级模态框（`McpCapabilitiesModal`），使用 React Portal 直接挂载至 `document.body` 确保遮罩层完整覆盖全局 Header 与主视窗；内容统合为单一的 `音频播放工具 (playback)` 受控操作列表，提供流畅的进出场动效、全部开启/关闭快捷按钮与 ESC 快速退出交互。
- **首页对齐搜索页固定宽度布局**：为首页（`HomePage`）正常内容、骨架屏（`HomePageSkeleton`）及网络异常重试容器添加 `mx-auto w-full max-w-400` 居中限制，外层背景与昼夜渐变层保持全宽满屏铺满，彻底解决超宽屏下首页各板块组件被过度拉伸的问题。

### Quality

- **主进程内嵌后端与动态可用端口自适应**：重构桌面端后端控制器（`backend.ts`），直接在 Electron 主进程内调用 `@neteasecloudmusicapienhanced/api` 的 `serveNcmApi` 启动内置服务，彻底废除多进程 `spawn` 与外部 node 执行链路；引入动态可用端口自适应探测（`getFreePort`）与冲突重试机制，消除静态端口（4040/3838）占用的启动失败；Web 渲染端（`request.ts`）与主进程会话存储自动监听并对齐动态后端 origin，确保开发与生产环境下零残留退出与平滑网络请求。
- **纳入后端工作区并清理历史测试用例**：将 `repo/backend/api-enhanced` 纳入根目录 Bun Workspaces 体系（`repo/backend/*`），桌面端改以标准 `workspace:*` 引入依赖；删除原有的碎片搬运构建脚本 `prepare-backend-resource.ts` 与打包额外资源配置，全范围清理 `desktop/tests` 与 `web/tests` 下依赖源码字符匹配的历史虚假测试，保留工程架构守卫 `check-architecture.test.ts`。
- **健壮用户状态存储与持久化水合防御**：在 `useUserStore` 的 `setUser` 中过滤无效或 `userId <= 0` 的占位对象，并在持久化重水合（`onRehydrateStorage`）中自动清除历史上受损的未知用户残留；在 `QrLogin` 中补充账号基础资料与用户详情的兜底级联逻辑，防止接口异常时将空属性覆盖为无效对象。
- **收敛 Electron 全链路日志**：Main 的托盘/登录窗口不再直接调用 `console.*`，Renderer 控制台日志在保留 DevTools 输出的同时转发至 `electron-log`，preload Bridge 暴露失败增加最早期 IPC 兜底，并保留事件、来源、追踪 ID 等结构化字段；同时延后原生资源校验到日志初始化之后，避免启动早期日志落入错误目录。
- **完成 Electron Main Scoped Logger 迁移**：将残留在 Core、IPC、Window、Renderer、Updater、桌面壁纸、桌面图标与代理模块中的默认 `logger.*` 调用全部替换为职责明确的 scoped logger，并移除兼容旧代码的无 scope 别名，防止新增日志继续退回默认通道。
- **记录 Electron 各进程内存工作集**：主窗口 Renderer 就绪后立即采样，并按一分钟周期将 Main、Renderer、GPU、Utility 与各命名窗口的工作集写入 Core 日志；应用退出时同步释放采样定时器，为版本间内存表现量化和防劣化对比提供稳定基线。
- **引入主进程可信 PlaybackGateway 与 Broker 观测扩展**：在 PlaybackBroker 中增加状态快照获取与订阅机制，新增主进程专属的 PlaybackGateway 与内存 MessagePort 副本（MainPlaybackReplica），实现统一命令排队、防碰撞与全链路异步真实回执确认。
- **规范 WebRuntime 宿主适配器与 MCP 安全契约**：在 `@scopify/desktop-contract` 中定义非敏感的 MCP 状态与桥接契约，WebRuntime 扩充统一的 `mcp` 宿主接口，Browser 适配器默认安全返回 null，Electron 适配器通过 DesktopBridge 委派，双端均通过单向契约实现隔离与测试覆盖。
- **建立可演进的跨端播放平台边界**：新增运行时无关的 `@scopify/playback-core`，收敛 Queue、Resolver、PlaybackSession 与 AudioEngineAdapter 契约；Web 将 HTMLAudioElement 和网易云播放 URL/ReplayGain 解析分别收进 Adapter，Main 将 Playback Broker、可信 Gateway 与 MCP 分层，公开快照不再携带 Cookie、播放 URL或本地路径。
- **隔离纯 Node 日志文本处理**：把 ANSI/回车清洗从依赖 Electron `app` 的日志生命周期模块提炼为纯工具，避免 Backend 输出单元测试加载 Electron 宿主环境。
- **移除已退役的桌面壁纸 Main 原型**：删除未被入口、测试或打包引用的 `electron/main/prototypes` TypeScript spike；正式桌面挂载继续由 Rust `native/wallpaper-helper` 与 `desktopPlaybackWallpaper` capability 负责，保留仍被系统壁纸 fallback 使用的顶层 PowerShell 资源。
- **重构桌面端日志体系并对齐 SPlayer 优秀架构**：参考 SPlayer-Next 实践将原本分裂的 `utils/logging.ts` 与 `constants.ts` 中的日志逻辑整合为单一模块 `electron/main/utils/logger.ts`；在保留会话异常退出标记检测、按时间戳会话归档隔离、子进程终端 ANSI 正则清洗及 IPC 打开日志等优良特性的同时，引入 Scoped Loggers（`coreLog`、`trayLog`、`ipcLog`、`backendLog` 等）、彩色终端样式（`useStyles: true`）与全局异常捕获；在配置契约中补齐 `logging.dir`，实现生产环境默认 C 盘 AppData、开发模式本地 `logs/` 与支持自定义目录的配置驱动架构，并在启动入口 `core/index.ts` 显式调用零参数 `initLogger()` 彻底解耦。
- **收敛 Electron Core 为生命周期编排入口**：将 539 行 Core 中的 Renderer 加载、Splash 时序、主窗口策略和桌面能力组装分别迁入 `services/rendererHost`、`window/splash`、`window/mainWindow` 与 `core/capabilityHost`，`core/index.ts` 仅保留单实例、启动顺序、顶层资源创建和退出清理，降低维护 Main 进程时的上下文负担。
- **重构 Electron 宿主目录为 electron/main 与 electron/preload 并引入 @ 别名**：参考 SPlayer-Next 架构方案，将原本混放的 `apps/desktop/main` 迁移并拆分为 `electron/main`（主进程业务逻辑与入口 `index.ts`）与 `electron/preload`（Preload 桥接脚本 `index.ts`）；配置 `@main/*` 与 `@preload/*` 路径别名并保留全局 `@/*`，全面消除主进程内部与测试中深层相对引用（`../../constants.js`、`../../../types/...` 等），简化宿主代码结构与引用复杂度。
- **精简 Electron Vite 单入口配置**：移除单一 Preload 不需要的 `isolatedEntries`、对应的非交互终端 stdout monkey-patch，以及未被 Preload 使用的路径 alias；保留开发/打包输出隔离、自包含沙箱 Preload、固定入口文件名和可选原生依赖 external 等实际构建契约。
- **统一 Web/Desktop 网易云 CookieJar 会话**：Electron 现可解析聚合 `Set-Cookie`，按路径和过期时间将完整登录字段写入 Chromium 持久化 Session，并在启动时从旧 safeStorage 恢复；Web 通过 Backend 原生 `Set-Cookie` 建立会话，旧 localStorage 凭据仅经 `/login/refresh` POST 一次完成迁移。统一请求层不再向普通接口附加 `params.cookie`，歌曲、评论、推荐、歌单、搜索、乐签和登录状态调用均改为自动携带 CookieJar，同时新增可选实时测试验证 VIP 音源不是 30 秒试听。
- **重整 Electron Main 进程业务结构**：参考 SPlayer-Next 的职责划分，将原本扁平的 `main/module` 按 `core`、`ipc`、`window`、`services`、`capabilities`、`store` 与 `utils` 重新归类；把 565 行集中式 IPC 拆为按能力注册的 TypeScript adapter，将入口收敛为显式 `initializeApplication`，并补充 Main 进程架构、启动顺序、IPC 授权、模块归属及未来原生音频引擎依赖原则的维护文档。
- **补充 SPlayer 能力架构调研**：基于固定源码快照拆解 SPlayer-Next 的 MCP 接入、插件运行时与原生 Audio Engine，并对照 Scopify 现有 `WebRuntime`、`desktop-contract`、`PlaybackAuthority` 和 Web Audio 链路，记录可复用的 module/interface/seam、已核实的实现债务、目标架构与分阶段落地门槛。
- **重构喜欢链路与补全 Mutation 单元测试**：重构 `TrackRow`、`SongItem`、`PopularTrackItem`、`SongContextMenu`、`toggleCurrentSongLike` 及 `PlaybackAuthorityProvider` 统一收敛至标准 Mutation 管道，并新增 `songLikeMutation.test.tsx` 验证乐观更新、错误回滚与多 Query 缓存失效机制。

## v1.5.0

### Added

- **听歌足迹周报历史日历周期切换**：在周报（Week）视图中新增专属周报选择器（`ListeningReportWeekPicker`），支持通过 `<` `>` 翻页及下拉菜单浏览过去 16 周的周报；严格按照网易云接口规范传入每周周六 0 点时间戳（`endTime`），精准拉取历史各周的真实打卡与排行榜单。
- **最近播放听歌足迹二级页**：`/recent` 新增“听歌足迹”入口与 `/recent/report` 二级页；登录用户可切换查看周、月、年报告，使用网易云 `/listen/data/report` 获取当前周期数据，并呈现服务端报告的时长、歌曲数、活跃天数、高频歌曲、钟爱歌手与偏爱风格。
- **个人听歌报告与最近播放虚拟歌单**：个人主页新增累计听歌时长；最近播放歌曲改为最近歌单区域内可进入的虚拟歌单，详情页展示累计、本周和本月听歌时长。补齐听歌足迹 API 层（总时长、实时/周期/年度报告、今日收听和播放排行），并兼容最近歌单的曲目统计字段，避免错误显示为 `0 首歌曲`。
- **TanStack Query 官方调试面板**：开发环境现提供可折叠的 React Query Devtools，用于查看 Query 与 Mutation 的缓存、状态和请求细节；生产构建自动排除该面板。
- **桌面歌词实用功能与设置面板重构**：将桌面歌词设置从调试期测试按钮重构为 4 项实用功能控制面板：
  1. **开启桌面歌词**（主开关实时呼出与销毁桌面悬浮歌词）；
  2. **副歌词是否打开**（实时控制桌面歌词中翻译/音标歌词的显隐）；
  3. **隐藏 Windows 桌面图标**（一键清爽桌面，通过 Explorer 脚本隐藏/恢复全屏桌面图标）；
  4. **桌面歌词播放音乐时防止休眠**（Electron 端通过 `powerSaveBlocker` 在开启歌词且播放音乐时阻止系统与显示器休眠）。
- **私人电台虚拟歌单**：私人电台现可作为动态歌单进入复用的歌单详情页；播放、暂停与切歌仍沿用原有的私人电台推荐流，场景与模式选择收纳为仅在 FM 播放时显示的 PlayBar 控制面板，不依赖 LyricStage。控制面板可从 PlayBar 或歌单动作区以中性图标打开；横向选项支持直接拖拽浏览且不显示系统滚动条。歌单页只呈现“私人 FM”与当前风格，并使用普通歌单的曲目计数。
- **歌手热门歌曲二级页**：热门歌曲请求现在一次最多获取 200 首；歌手主页保留前 10 首预览，“查看全部”进入复用歌单详情结构的完整歌曲列表，并使用对应歌手封面。
- **接入系统媒体控制 (SMTC / MediaSession)**：通过 Web Media Session API 与 Electron 主进程 `AppUserModelId` 绑定，完整支持 Windows 11/10 操作中心快捷面板、锁屏及音量浮窗媒体卡片；实时同步歌曲名、歌手、专辑及封面图，支持播放/暂停、上一首、下一首、进度拖拽与步进跳转。
- **新增主窗口命令工作区**：统一原本重复的搜索与命令弹层；普通搜索保留完整结果页，受控 `@song`、`@artist`、`@album`、`@playlist`、`@podcast`、`@episode` 直达既有分类 Tab，`> 搜索` 可在弹层内播放、加入或插入队列，并新增正在播放、播放队列与设置命令页。
- **命令工作区播放队列拖拽排序与富媒体信息**：移除上下移冗余按钮，支持原生拖拽手柄与直接拖放重排队列；每一项补充歌曲封面缩略图、正在播放状态高亮、歌手与专辑独立跳转链接，并在悬浮时提供“下一首播放”与“从队列移除”快捷操作。
- **新增音频设置与桌面音乐控制器快捷键**：补充“打开/关闭音频设置”（默认 `Ctrl+Alt+A`）与“打开/关闭桌面音乐控制器”（默认 `Ctrl+Alt+D`）快捷键命令；同时将播放队列、音频设置及快捷键设置接入桌面音乐控制器聚焦快捷键列表。
- **桌面音乐壁纸快捷键**：新增独立的“开启/关闭桌面音乐壁纸”命令（默认 `Ctrl+Alt+P`），直接复用现有壁纸开关；原有 `Ctrl+Alt+D` 的普通桌面控制器开关保持不变。

### Quality

- **对齐 `nextjs-project-structure` 架构规范全面模块化拆分**：
  1. 将超过 150 行的大组件进行领域子组件提取：`ListeningReportActivityChart.tsx` 拆分为 `ListeningReportIsometricHeatmap.tsx` 与 `ListeningReportTimeOfDayRadar.tsx`；`ListeningReportStoryHero.tsx` 拆分为 `ListeningReportHeroPosterMural.tsx`；
  2. 消除组件内部 inline 类型与散落常量，将所有 Props 接口收拢至 `@/types/components/listeningReport.ts`，将所有网格投影常数、色彩映射与时段元数据收归 `@/constants/listeningReport.ts`；
  3. 通过严格的 TypeScript 类型检查与 ESLint 校验。

### Visual

- **听歌足迹荣誉纹章升级**：首屏的单一全勤胶囊替换为置于左上留白的橄榄叶独立纹章；移除卡片边框、底色和重复的“荣誉”标签，让衬线奖项名、奖杯和出勤天数由完整的香槟金桂冠环抱。
- **2.5D 热力图引入 Streaks 连续在场指标小卡片与动态连续立柱高度**：
  1. **起伏错落的立体天际线**：改用基于当月最高时长的连续幂律动态插值高度（`5px ~ 48px`），彻底消除原本因固定档位上限导致的「100分钟与200+分钟一样高」的平板现象，使 100m、200m、600m+ 呈现高低分明、错落起伏的立体地貌；
  2. **Streaks 连续卡片**：参考经典 Contribution 设计，在卡片底部嵌入紧凑的连续收听指标小卡片（展示「最长连续天数」与「累计出勤天数」），信息紧凑内敛。
- **细化雷达图端点与描边线条（Radar Dot & Stroke Refinement）**：将雷达图顶点圆点半径由粗重的 `4px` 缩减为精致的 `2px`，描边宽度收窄至 `1.5px`，仅在鼠标悬停时提供聚焦放大微动效，大幅提升极坐标图形的精致度与轻盈感。
- **听歌报告「音乐在你的生活里怎样出现」去除 AI 式冗余说教标题与多余图标**：彻底移除卡片内部多余的 `(2.5D)` / `(Radar)` 标识、多余日历/时钟图标以及顶部浮动角标，回归纯粹的视觉功能本位；左侧专注于起伏的 2.5D Isometric 绿色立体地块与极简出勤图例，右侧专注于清晰舒展的六边形雷达极坐标图与 6 时段分布胶囊，排版高度对称、纯净通透。
- **听歌报告「音乐在你的生活里怎样出现」重构为 2.5D Isometric 活跃地块与 shadcn 时段雷达图**：
  1. **左侧 2.5D Isometric 轴测热力图**：采用经典 `isometric-contributions` 轴测投影算法与纯 SVG 矢量绘制，每日收听时长转化为 Z 轴立体立柱（受光面、次受光面与背光阴影三面着色），支持立柱悬浮高亮、出勤天数统计与实时分钟数 Tooltip 气泡；
  2. **右侧 shadcn 极坐标雷达图**：基于 `@scopify/ui` 官方规范与 `recharts` 雷达组件构建 6 时段音乐偏好分布，极坐标多边形网格配合绿色主题色半透明渐变域，直观呈现全天作息律动与主时段高光。
- **听歌报告底部总结升级为大块沉浸式收官横幅（Grand Finale Banner）**：将底部原本单行小胶囊条重构为大尺寸横幅卡片，左侧内嵌大画幅封面并向右平滑消融，右侧以大字号呈现诗意总结文案与 Scopify 唱片品牌徽章，呈现更具重量感与仪式感的收官视觉。
- **听歌报告「陪伴艺人」左侧肖像向右淡色渐变重构**：统一 Top 1/2/3 艺人卡片规格，左侧展示歌手艺术肖像封面并辅以向右自然过渡的柔和渐变消融（`bg-linear-to-r from-transparent to-surface-raised`），右侧优雅排布大字号艺人名称与收听频次，完美对齐设计图视觉质感。
- **听歌报告「封面底片」双行上下错位水平跑马灯升级**：移除生成海报按钮与模态弹窗；将底片封面墙升级为双行上下错位、左右双向平滑流动的水平跑马灯画廊（一行向左、一行向右交错循环），两侧辅以暗调柔和渐变消融，大幅提升动态流动美感。
- **听歌报告「你反复回到的声音」全局 Section 对齐与横向展台排版**：严格对齐全局 Section 边界（`max-w-360 px-5 sm:px-8 lg:px-12`）与标题规格（`text-3xl sm:text-4xl font-black`）；左侧 No.1 单曲重构为横向展台（左侧黑胶封面 + 右侧歌名/歌手/频次文案），与右侧榜单在 1:1 栅格下高度自然均衡，消除空洞与间距撕裂。
- **听歌报告 Hero 动态跑马灯海报墙与满屏首屏升级**：首屏 Hero 容器设为占据完整视口高度（`min-h-screen`），右侧 3D 倾斜海报列阵采用零间隙无缝贴合（`gap-0`）与 GPU 硬件加速的垂直双向流动跑马灯动画（从上往下与交错流动循环），呈现生动充盈的音乐唱片流动内页；向下滑动继续浏览排行、热力图、陪伴艺人等完整数据板块，并全面去除了机械式分段编号。
- **听歌报告页面 Header 工具栏精简**：移除冗余的返回按钮，仅保留单行年月/周选择器、周期 Tabs 与刷新操作（`ListeningReportHeader`）。
- **按设计图收敛 `/recent/report` 页面视觉**：报告路由保持现有应用壳层与真实业务数据链路，只在页面内容区域对齐沉浸式唱片内页的英雄区、排行、节奏、艺人、审美与底片归档布局。
- **听歌报告 `/recent/report` 视觉重构与 GitHub 热力图融合**：针对最新设计稿对听歌足迹页面进行 1:1 像素级视觉重构，包括：
  1. **Hero 概览**：优化年月切换胶囊 `< 2026年7月 >`、大字号绿色时长与全勤勋章徽章、右侧错落黑胶封面墙与 `播放本月高频` / `生成海报` 行动按钮；
  2. **02 · 声音**：重塑为左侧 No.1 专辑展台（大图、绿色频次与共鸣语录）与右侧 1/2/3 极简行榜单；
  3. **03 · 节奏**：融合设计 **GitHub 风格收听热力图**（5 级绿色阶矩阵、Tooltip 悬浮日期/时长/高峰提示与图例），并在下方无缝衔接 6 时段分布卡片（主时段整块高亮为绿色实心卡片）；
  4. **04 · 陪伴**：重塑为 Top 1 宽幅艺人写真 Banner 与 Top 2/3 暗调水平卡片布局；
  5. **05 · 审美**：曲风倾向、语言习惯、年代跨度统一为三列整齐横向进度条；
  6. **06 · 留存**：重构多比例错落相册底片封面网格并搭配显眼绿色海报归档按钮；
  7. **07 · 底部总结 Bar**：在页面底部常驻融合主时段、主曲风与天数的诗意收尾横幅（`这就是你的七月：清晨、电子乐，和从未缺席的 31 天。`）。
- **将听歌足迹重构为个人音乐肖像**：`/recent/report` 不再以同权重 KPI 卡片和图表堆叠数据，改为由真实接口封面构成的沉浸式唱片内页；首屏用暗绿唱片纸张底纹承接有倾角、有前后层级且贴住画面边缘的封面拼贴，以个性化叙事、核心收听时长与代表曲建立“这段时间的我是谁”，随后按高频声音、生活节奏、月度日历、陪伴歌手、审美轮廓与封面底片连续展开，同时保留周/月/年切换、历史月份、代表曲播放和海报入口。
- **桌面壁纸保持纯 Stage**：主窗口进入 WorkerW 形态后只挂载 Folia 视觉 Stage，不渲染应用 Header、Sidebar、底部 PlayerBar、Stage 浮动播放控制与视觉设置按钮；恢复普通主窗口后这些 chrome 才重新出现。
- **重构命令工作区「正在播放」视图**：移除粗糙的默认 HTML 原生表单滑块与纯文本布局，重构为具备磨砂氛围背景、高清圆角专辑封面（带快捷播放悬浮遮罩）、歌手/专辑跳转链接、状态点亮徽章、集成 `SmoothSlider` 的细腻进度与音量调节、完整播放控制栏（随机播放、循环模式切换、红心喜欢）以及沉浸式歌词快捷入口的现代卡片式播放器。
- **统一导航栏搜索与命令工作区悬浮胶囊选框**：顶部导航栏搜索下拉面板（`HeaderSearch`）、命令工作区一级命令、二级设置、播放队列、专辑曲目与搜索建议统一采用四周留有呼吸感（`px-2.5 py-2`）的悬浮圆角（`rounded-lg`）高亮选框，内部配合紧凑轻盈的内边距（`px-2.5 py-2` / `px-3.5 py-2.5`），彻底消除直角通栏贴边与厚重臃肿感。
- **优化精选活动 Banner 焦点层级与主体尺寸**：重构精选活动轮播为大画幅焦点展示布局，中心卡片占据过半宽度（`52%` Hero 比例、`aspect-[2.4/1]`、加大圆角与浮动阴影），两侧卡片保持画幅向外露出（`24%` 边缘预览、弱化缩放与暗化透叠）；点击两侧卡片可直接平滑滑至中心，大幅增强宣传 Banner 的画幅冲击力与横向轮播深度感。
- **统一快捷键设置页的分栏节奏**：快捷键分组现复用设置页的双栏布局与章节标题；搜索和恢复默认操作收束到同一工具区，命令行不再以全宽分隔线切割页面。
- **精简输出设备页签**：播放栏音频设置的输出设备页签去除重复的内部标题与说明，设备选择器和刷新操作合并为单行工具条。
- **改善均衡器预设控制的阅读性**：预设标签不再因狭窄空间被拆成竖排，改为常规字号与不换行布局；控件空间不足时保持整组换行，避免文字与选择框相互挤压。
- **收纳音频输出设备选择**：播放栏音频设置不再将每一台系统输出设备平铺成列表，改为单个全宽下拉选择器；保留默认设备、长名称、设备刷新、加载与错误反馈，并确保其菜单在音频设置浮层之上展开。移除冗余的弹层标题栏，标签与关闭操作收纳为同一行。
- **收敛个人菜单视觉层级**：对齐移动端 Drawer 的账号行与乐签状态组织；移除资料区与乐签区的多重描边和重阴影，乐签改为紧凑状态条和内联操作；菜单与用户资料页的会员标识统一改用 Scopify 紧凑描边 Badge，资料页标识移动到昵称旁，并收紧 Hero、操作栏与首个内容区之间的纵向节奏，整体与 Header 的暗色工具栏语言一致。

- **补齐 PlayBar、设置与桌面音乐控制器 Hovertips**：PlayBar 音频设置按钮、播放队列浮层触发按钮以及桌面音乐控制器启动按钮接入统一的 `ShortcutHint` 提示条；桌面音乐控制器的壁纸快捷开关与编辑 Folia 设置按钮补齐规范的 Tooltip 浮层与按键提示。

- **优化设置项与音频输入输出设备排版**：修复 `SettingRow` 在两栏网格下因右侧控件挤压导致左侧标题与副标题异常折行（单字排版）的问题；修复 `SettingSelect` 内置 `<select>` 未继承容器全宽导致下拉箭头脱离边框的问题；将音频输出与输入设备下拉选择改为上下堆叠（`isColumn`）全宽布局，完整展示长设备名称并提供舒适的副标题阅读体验，统一检测与刷新操作的按钮微交互。
- **替换命令工作区原生滚动条**：命令、搜索、队列和曲目列表采用覆盖式 `ScrollArea`，将可视高度直接交给 viewport，滚动条不再挤压列表内容。
- **补齐命令工作区快捷键与搜索范围**：快捷操作使用完整组合键胶囊，搜索入口明确支持歌曲、歌手、专辑、歌单、播客和声音结果。
- **调整命令工作区的快捷操作与视觉层级**：`Ctrl+Shift+P` 现在可再次按下关闭工作区；命令图标按实际播放、音量、歌词、侧栏、全屏、评论等功能区分，并将工作区由绿色强调收敛回原搜索弹层的中性黑白层级。
- **重做快捷键帮助视图**：改为参考面板的单列深色全高布局，补齐常用命令分组、动作图标、独立按键胶囊与细滚动条，同时保留现有快捷键注册与本地化数据。
- **收束快捷键帮助弹窗尺寸**：保留内部滚动与参考页的信息层级，但改为带遮罩、圆角和上下留白的居中固定尺寸窗口，避免占用整个屏幕。
- **补充设置页快捷键辨识度**：保留既有设置页的标题与分组布局；图标与命令名称对齐且不再添加底框，组合键仅保留右对齐的独立胶囊，并以编辑按钮进入录制状态。
- **收束搜索历史悬停状态**：普通搜索与命令工作区的分类 token 默认贴齐右侧；悬停时由同位置的删除按钮替换，不再预留空白槽位，并在鼠标离开普通搜索行时清除残留高亮。
- **按使用频率排列命令工作区操作**：搜索、正在播放、播放队列、设置等一级入口和快捷操作统一按持久化的使用次数降序排列；直接按下窗口快捷键与在工作区点选都会累计次数，同频时沿用原有注册顺序。
- **补齐命令工作区 Folia 与桌面设置入口**：设置页现分别直达 Folia 视觉设置和主题库，并复用既有快捷键打开对应界面；桌面播放设置仅在 Electron 桌面运行时显示，Web 端不再出现不可用入口。
- **协调命令工作区设置列表层级**：设置页保留工作区的排版与紧凑节奏，同时使用轻微内缩的圆角选择框作为悬停反馈，避免全宽高亮在低密度二级页中过于突兀。

### Quality

- **原生 TanStack Query 调试球四角吸附**：开发期 Query 调试器保留官方球体与官方表格面板；球体拖动后只会吸附到四个角落并记住位置，点击后面板会依据上/下边缘向视口内部展开，避免不同角落下的内容溢出屏幕，并为官方收起控制补足明确标签与更大的点击区域。
- **开发期 Next 缓存隔离与按需视觉模块加载**：开发启动脚本现在与 Next 配置一致地在 `.next-dev` 中检查和清理陈旧锁文件，避免误判 `.next` 中的生产构建锁并降低开发服务重复启动的风险；桌面壁纸专用的 Folia 渲染器改为仅在壁纸窗口激活时动态加载，避免普通 Dashboard 路由在开发期编译完整视觉引擎依赖图。
- **桌面壁纸原生宿主与单 Renderer 架构**：新增 AGPL-3.0 原生 `scopify-wallpaper-helper.exe`，负责 WorkerW attach/detach、心跳、Z-order 守卫与 Explorer 重挂；Electron 仅编排 helper 生命周期，生产壁纸路径不再运行 PowerShell attach 脚本，并移除 `/desktop-wallpaper`、桌面 command workspace 及相关跨窗口播放投影。
- **记录主窗口命令工作区改造方案**：明确普通搜索保留完整结果页、受控 `@` token 直达分类 Tab、`> 搜索` 在工作区内完成播放与队列操作，并将桌面宿主接入延后至主窗口能力验证之后。

### Fixed

- **避免年度报告混入月度歌曲排行**：年度听歌足迹不再为补齐列表而请求并展示仅支持周/月维度的歌曲排行，缺少年度排行时改用年度报告自身的代表歌曲数据，避免把当月偏好误标为全年结论。
- **修复听歌足迹 API 凭据缺失与个人主页时长、最近歌单信息展示问题**：为 `listeningReport` 的 6 个 API 以及 `getRecentPlaylists`、`getRecentAlbums` 补充 `requiresMusicSession: true` 请求配置，确保携带用户登录 Cookie；将个人主页累计听歌时长请求并入基础信息主 Promise 并发加载且直接按小时展示；深度挖掘网易云最近播放歌单数据（`lastSong`、`playTime` 等），在卡片右上角展示相对播放时间胶囊 Badge，并优先展示上次收听单曲与歌手名（`🎵 歌曲名 · 歌手名`）；移除最近播放歌单详情页中生硬插入的听歌报告横幅面板，保持原生歌单的纯粹优雅。
- **修复 Next.js Turbopack 在 Bun Monorepo 下的工作区根路径推断错误**：在 `next.config.ts` 中显式指定 `turbopack.root` 为仓库根目录，并在 `tsconfig.json` 中配置 `@scopify/desktop-contract` 与 `@scopify/ui` 源码路径映射，解决 Next.js 16 将工作区错误推断为 `app/` 目录导致开发服务（`bun run dev:web`）启动失败的问题。
- **WorkerW 壁纸完整覆盖显示器**：主窗口挂入 WorkerW 时会移除普通窗口遗留的 caption、thick frame、系统菜单及边缘扩展样式，并通过 `SWP_FRAMECHANGED` 立即重算非客户区；Electron 同时校验实际 content bounds 必须与显示器 bounds 完全一致，修复桌面顶部约 31px、左右约 7px 的未填充边缘。
- **播放队列控制与排序**：播放栏队列现支持拖拽调整；当前曲目改走真实播放切换，不再以本地状态覆写实际媒体；移除歌曲和拖拽排序统一委托播放队列状态机。命令工作区的选曲、暂停、移除和重排则改为经由播放 Authority 执行，桌面副窗口不再只修改自身的临时状态。
- **未登录隐藏私人电台入口与保护详情页**：未登录状态下侧边栏歌单区不再显示私人电台项；直接访问 `/personal-fm` 路由时展示统一的登录提示引导，避免未登录时呈现空歌单与报错状态。
- **Folia 浅色主题的均衡器可读性**：音频均衡器的文字、弱化说明和滑轨不再继承应用全局深色 token，改为从当前 Folia 主题派生前景色；浅色主题下的频段与音色效果信息现可清晰辨识。
- **Folia 设置关闭的画面连续性**：打开视觉设置时不再卸载 Lyric Stage 主画面，仅暂停实时采样；关闭设置会直接恢复原有画面，避免画布重新初始化造成突兀的退出感。
- **Folia 设置与主题库快捷键的关闭行为**：`Ctrl+Shift+,`（macOS 为 `Cmd+Shift+,`）和 `Ctrl+Shift+.`（macOS 为 `Cmd+Shift+.`）现会在对应面板已打开时仅关闭该弹窗并留在 Lyric Stage，不再误触舞台开关快捷键的退出行为。
- **消除桌面端频繁读取配置文件与日志刷屏**：在 Web 渲染进程的 Electron 运行时适配器（`createElectronRuntime`）中为宿主配置增加内存缓存，避免每次写入页面缓存与播放缓存（写入歌曲、歌词、播放链接等）时频繁触发 `config:get-host` IPC 调用；同时移除主进程配置 Getter 的全量 JSON 日志输出。
- **保持直接搜索的 `@` 筛选状态**：命令工作区在输入搜索词时不再把草稿同步回全局搜索状态，避免父级重置已选择的筛选 token；仅在确认搜索后再提交关键词并跳转到对应分类结果页。
- **保留最近搜索的 `@` 分类**：搜索历史现在记录关键词及其结果分类；命令工作区与顶部搜索下拉会在带筛选的记录右侧展示原始 `@` token，点击后恢复对应搜索 Tab，旧的纯文本记录安全兼容为“全部”结果。

## v1.4.9

### Added

- **接入私人电台沉浸播放**：侧边栏新增单行“私人电台”入口，登录后直接生成动态推荐队列并打开 Folia 沉浸播放；播放接近队尾时自动补充歌曲，Folia 浮层在私人电台期间保留歌词队列并新增独立电台 tab，以无滚动条的 segmented control 滑动轨道提供默认、熟悉、探索、拼图及情绪、场景、曲风、语种模式选择，其中长曲风采用双排横向轨道，支持触屏/鼠标手拖和滚轮横向滚动，并以浅色浮层胶囊和阴影联动选中状态；第一个控制 tab 在私人电台期间用“不再推荐”替换随机播放，提交反馈成功后自动切到下一首。
- **歌单操作区支持收藏他人歌单**：在歌单详情页 Action Station 中为非当前用户创建的第三方歌单提供收藏 / 取消收藏切换按钮（官方日推等特殊歌单自动排除），收藏状态实时联动侧边栏与缓存。
- **播客单集页与播客资料库全量多维排序**：在电台/播客节目表格（`RadioTracklistTable`）中支持标题、发布时间、播放量、节目时长、收听进度的全量多列排序与 `#` 一键重置默认顺序；并在播客资料库（`SubscribedPodcastTable`）中支持播客标题、总播放量、节目期数、更新时间的点击排序。
- **评论区支持多维排序模式**：评论区顶部新增排序控制器，支持“默认排序 / 最新发布 / 最早发布（远古神评） / 点赞最多”模式无缝切换。

### Visual

- **协调侧边栏导航与私人电台视觉表现**：统一资料库各页面项使用中性灰色路由激活高亮（`bg-content/10 text-content`），解耦路由导航与音频播放源状态；私人电台在播放期间通过绿色文本与跳动音频声波（`PlayingAnimation`）标识活跃状态，折叠与展开态均保持语义清晰且互不冲突。
- **优化评论底部操作栏与展示 IP 属地**：解析并展示评论中的地理属地信息，置于评论卡片底部左侧与常驻的“回复”按钮同行展示，移除原先仅悬停才显示的回复按钮。
- **评论区支持“精彩评论”与“最新评论”Tabs 分页切换**：将长列表纵向堆叠的精彩评论与最新评论重构为现代化 Tabs 选项卡，附带各自评论数量指示，并支持平滑切换与针对最新评论的独立无限滚动加载。

### Fixed

- **补齐 Folia v0.7 P0 正确性修复**：Monet 改用与 DOM 一致的原子 token 换行测量，远程字体加载后主动清理测量缓存并按实际容器宽度响应式布局，同时修复长词、活跃多行歌词、下沉字形扫光和失效 Blob 封面的裁剪/刷新问题；Sonnet 透明模式不再绘制主场景底色，隐藏 Pixi 场景在离开可见集时释放 GPU 资源；桌面视频导出按当前显示器 DPI 调整窗口，以原生捕获流经 Canvas 居中裁剪到目标分辨率，消除黑边并完整恢复原窗口位置、最大化和全屏状态。
- **修复歌单与播客表格表头 `#` 与序号列未居中对齐问题**：在 `TrackTable` 与 `RadioTracklistTable` 中为表头 `#` 元素补充统一的 `size-4` 居中容器，使表头 `#` 符号与数据行序号/播放控件中心轴线精确对齐。
- **修复 Folia 沉浸设置面板运行期引用异常**：补全 `FoliaStageSettings` 中 `isChromeHidden` 属性解构与抽屉顶部封面预览所需的当前歌曲选择器，修复在私人电台或任意模式下点击 Visual Settings 面板时报 `ReferenceError` 的问题。
- **修复播客节目表格排序字段属性读取**：纠正 `RadioTracklistTable` 播放量排序比对逻辑中使用的属性，统一对齐 `RadioProgram` 标准字段 `listenerCount`。

## v1.4.8

### Added

- **同步 Folia v0.7.0 视觉与播放能力**：新增完整的 Tempera / 凝彩动态歌词视觉系统及 121 种构图、最多 16 张自定义画布图片、后处理与质量控制；新增 Still 静态歌词模式、播放面板与设置页中的音频输入输出设备管理，以及支持逐字时序、翻译和罗马音轨道的 AWLRC 导入。
- **补全专辑评论能力**：专辑页操作区新增评论入口与评论数徽标，评论页支持加载专辑信息、浏览、发布、回复、点赞和删除专辑评论。

### Fixed

- **修复 Folia 主题库收纳与拖拽交互**：收纳状态完整展示全部主题唱片并移除当前主题角标，统一左右分栏的拖拽手柄样式；拖动主题库向右展开时不再被折叠状态强制收回，避免侧栏反复滚动与项目裁切。
- **修复伴随窗口后端 Toast 与启动期查询停滞**：Tray、桌面歌词、播放控制器、壁纸、登录窗和关闭窗不再承载主窗口的后端故障 Toast；self 后端从启动或错误状态恢复为 running 时会自动重拉当前活跃且失败的 Query，避免 Sidebar 歌单因首次请求早于后端监听而永久停在“重试”。
- **恢复 Windows 系统托盘 Logo**：Desktop Host 构建同步复制运行时资源，并让通知区域使用独立的 32×32 Scopify PNG，避免直接运行静态 Host 时因资源缺失或单层大尺寸 ICO 缩放失败而显示空白图标。
- **释放未使用的 Electron 伴随页面内存**：桌面歌词关闭后销毁 renderer，桌面播放控制器与托盘弹层改为首次使用时动态创建，托盘弹层失焦后立即释放，避免隐藏或从未启用的页面长期占用独立渲染进程。
- **恢复 Hovertips 填充色**：将共享 UI 组件目录显式加入 Web 的 Tailwind 扫描范围，避免 Tooltip 等工作区组件的背景与填充工具类在最终 CSS 中被裁掉。
- **同步桌面歌词时间轴**：桌面歌词窗口与正在播放的 Folia 歌词统一应用全局歌词偏移，避免桌面歌词比主歌词提前。
- **修复关闭行为无法记住**：关闭确认窗改为通过受限 IPC 让主进程持久化最小化或退出选择，避免独立弹窗因无权写入完整主机配置而静默丢失设置。
- **后端启动不再阻塞主界面**：桌面端会在后台启动内置后端，不再等待固定超时或显示启动失败弹框；失败状态改为应用内非阻塞提醒，并可直接打开设置调整或重新启动后端。

## v1.4.7

### Added

- **新增 Shadcn 主题工作台验证原型**：新增顶层 `/theme-editor` 全屏页面，按 tweakcn 的编辑器结构提供左右分栏、Token 实时编辑、组件画布、内存主题保存与标准 CSS 导出；该页面不经过 Docs 内容映射或 Fumadocs 布局，主题选择模态仅出现在 Shadcn 与 Scopify UI Library 页面，并通过局部作用域只改变组件示例，不影响 Docs 外壳、其他文档栏目与 Scopify Web。
- **新增 UI Library 主题实验台**：Shadcn 文档可实时编辑标准 Token 并导出单份主题 CSS；Scopify 文档将 Shadcn 基础与 `--scopify-*` 扩展分开编辑和导出，两套实验台都支持浅色、深色、隔离组件预览、重置、复制与 CSS 下载。
- **补全 shadcn CLI 原生组件目录**：从当前官方 registry 拉取全部 61 个 UI 组件及 Sidebar 所需 hook，统一落位到 `@scopify/ui/shadcn` 并使用公开包子路径互相引用；文档同步按基础、表单、数据展示、反馈、导航、浮层与对话交互七类补齐独立组件页与可交互的真实组件预览，并参照官方层级补充安装、完整导入、用法、组件结构、常见模式、使用建议和 API 参考。
- **补充 UI Library 主题架构文档**：重写 `/docs/ui-library` About 页面，用一条实际链路讲清 Shadcn Token Contract、`:root` 与 `data-theme` 的关系、`@theme inline` 生成的颜色工具类、透明度和状态变体，以及 Scopify Token 的适配方式与后续编辑器入口。
- **新增 shadcn 默认主题基线**：按当前官方 neutral CSS variables 配置新增独立的 light/dark Token Profile，并通过 `@scopify/ui/theme.css` 统一导出，为文档主题对照与后续交互式 Token 预览提供稳定基线。
- **简化 UI 主题注册与扩展契约**：Shadcn 和 Scopify 共用的类名由 `scopify/theme.css` 直接映射到 Shadcn Token，独有能力只读取主题文件中的 `--scopify-*`；移除中间 Adapter 和扩展兜底层，只有同时提供完整 Shadcn 与 Scopify Profile 的主题才能驱动完整组件库，About 文档同步补充文件关系和新增步骤。
- **集成 Mermaid 图表与交互式全屏查看器**：支持在 MDX 中以独立 .mmd / .mermaid 文件形式编写并导入图表，提供全屏模态预览、鼠标滚轮缩放（40%~400%）、鼠标平移拖拽与复制源码能力，并在「产品能力」页面补充了功能图谱。
- **接入 LLMs 与 Markdown 导出能力**：支持 `/llms.txt` 结构化大纲索引、`/llms-full.txt` 全量纯文本文档与 `/docs/*.md` 单页 Markdown 获取，所有处理端点收敛于 `/api/llms`。
- **支持文档页面操作与 AI 快捷打开**：在文档页面顶部提供一键复制 Markdown 与跳转打开至 GitHub、ChatGPT、Claude、Cursor 等 AI 工具的交互操作栏，并补全中文本地化词条。
- **整理 Desktop IPC 文档导航**：在 OpenAPI 下新增与 Netease API 平级的 Desktop IPC 分组，并预留 About、架构、契约、能力版本、通道参考、运行时适配、扩展流程与安全边界页面。
- **补充 Desktop IPC 文档正文**：记录当前 Renderer、Preload、Main 与 Runtime 的通信架构、共享契约、能力协商、通道分类、扩展流程和安全边界。
- **拆分 Framework 路线图与发布文档**：路线图只保留产品方向与长期提案，新增独立的发布与 CI/CD 页面，记录 Tag 触发、Renderer artifact、平台矩阵、校验、证明和 GitHub Release 流程。
- **补全 Netease API 路由命名说明**：记录目录前缀、括号路由组、文件名下划线转换、版本目录、`index.js` 行为与模块 identifier 唯一性。
- **补充 Netease API 后端模块指南**：在 Netease API 文档分组下新增模块路由映射、统一请求选项、参数处理、测试验证与 Scopify 同步流程。
- **补充新增接口指南**：将后端模块路由映射、`createOption`、Web 三层 API 架构、认证与错误边界、Apifox 同步和提交前验证清单落到 OpenAPI 文档。
- **简化 Netease API 文档入口**：移除本地生成的接口镜像与请求调试页面，OpenAPI 文档域统一跳转到 Apifox 维护的网易云音乐接口文档。
- **扩充 Framework 文档**：根据仓库 README 重组产品能力、技术栈、开发启动、系统架构、部署运行、路线图与发布规范，并复用现有产品截图形成可浏览的项目知识入口。
- **新增 Scopify Docs 文档工作台**：新增独立 `@scopify/docs` Fumadocs 应用并接入现有 Scopify 产品 Logo；侧栏以 GitHub Repository 为首项，并按 Document、UI Library、API Reference 三个文档域组织内容，将 Shadcn / Scopify 降级为 UI Library 内的资产分类；为当前 5 个 Shadcn 组件补齐可搜索文档、导入示例与交互预览，保留 Scopify 组件体系规划入口，并新增快速开始、架构与 API 规划页面以及 `dev:docs` / `build:docs` 工作区命令。

### Visual

- **重做 Folia 主题编辑工作台**：主题库改为可调宽并可折叠的缩略图轨道，Preview 获得主要画面空间并显示亮暗模式、编辑状态、渲染模式、主题主色组、暂停与重播；保存并应用固定在顶部，切换或关闭时会保护未保存草稿。
- **让首屏 slogan 自身成为一次性 Folia 云阶**：移除重复的静态大标题和循环歌词背景，以“让声音，显形。”作为 Partita 的唯一内容；逐字动画只在首次出现时播放一次，完成后常驻终态，返回顶部时直接恢复显示而不重播。
- **将落地页片尾改为产品索引**：收小单一巨型标语，补充网易云音乐、Folia 与桌面体验三条具体能力，并将文档和源码入口提升为清晰的片尾行动区。
- **用真实 Folia 云阶丰富落地页开幕**：首屏在隐现流体上加载 Partita 的阶梯排版、引导线与逐字高光，进入下一幕时退出并卸载，再由 Sonnet 接管后续演出。
- **将真实界面幕改为逐屏放映**：移除截断画面的超大标题和三图拼贴，将主界面、桌面 Folia 与动态歌词拆成三幕连续的全屏画面，让真实截图按原生滚动逐张进入。
- **将 Folia 落地页扩展为五幕视觉作品**：在自主播放的 Sonnet 演出后加入实时歌词切片装置、由三张真实软件截图组成的无重叠产品影像墙与独立尾声，让页面在保持原生滚动和克制文案的前提下拥有完整的视觉叙事。
- **将公开落地页重做为单一 Sonnet 数字作品**：删除临时 Header、时间码、章节刻度、多模式切换与超长 Sticky，改为三屏原生滚动；Folia 全程自主播放，结尾自然显露真实软件界面与项目入口。
- **将公开落地页收敛为 Folia 电影分镜**：滚动时间轴直接驱动真实的商籁、镜台与云阶渲染器，让歌词、镜头与桌面界面按同一段无声节奏推进。
- **新增 Scopify 公开落地页**：将文档站根路由改为沉浸式产品入口，复用 Folia「隐现」背景的 MeshGradient 与 Dithering 双层动态 shader，并以真实的 Scopify 主界面、动态歌词舞台和桌面音乐壁纸截图串联产品叙事；文档作为主要行动入口，GitHub 作为次要入口。
- **按 tweakcn 源码重做 Shadcn Theme Lab**：重新对齐独立编辑器的顶部导航、主题预设栏、操作栏、可调整左右分栏、颜色分组、Hex 单行编辑器和 Cards 预览画布；Shadcn Default Profile 同步转换为等价的 sRGB Hex，主题读取、保存与导出保持 Hex，并在 Shadcn、Scopify 概览页补充实验室跳转入口。
- **重编产品能力主文档**：按内容发现、搜索与导航、播放与队列、歌词与 Folia、音频体验、账户与音乐库、个性化与效率、桌面端集成八类能力重组产品说明；每类能力再按具体功能划分二级标题，产品截图统一改为单列展示，窄幅 Discord 状态图单独居中，并同步更新 README 功能总览与功能图谱。
- **扁平化 Desktop IPC 侧栏**：保留 Desktop IPC 分组标题，将 IPC 页面直接列在其下，暂不引入二级导航。
- **补充文档侧栏底部操作栏**：在 Scopify Docs 侧栏底部加入 GitHub 图标入口，并与主题切换控件分列两端，形成固定的仓库与外观快捷操作区。
- **重组文档信息架构**：将 Scopify Docs 拆分为 `Framework`、`UI Library`、`OpenAPI` 三个可切换的文档域，每个域维护独立侧边栏，并共享顶部 GitHub 仓库入口。

### Quality

- **收紧主窗口 Folia 运行时生命周期**：主歌词舞台、各歌词模式与背景实现改为按需加载，未打开歌词时不再解析完整可视化代码；本地音频特征仅在歌词消费者存在时采样，视觉设置预览接管画面时释放被遮挡的主舞台，窗口隐藏后暂停视觉表面，并为 Diorama 生成几何缓存增加容量上限与退出清理。
- **规范 Tailwind CSS 类名顺序与收紧 CI / Husky Lint 拦截规则**：为 Prettier 与 ESLint 补充 `tailwindStylesheet` 和 `tailwindFunctions` 配置，统一修复全仓类名顺序和无意义任意值警告；将 ESLint 警告阈值设为 `--max-warnings 0`，并在 `lint-staged` 与 CI/CD 中开启严格拦截，确保代码提交和持续集成中存在任何 Warning 或 Error 时自动中断。
- **撤回未成熟的 Scopify 公共组件抽取**：恢复播放、徽标、收藏、重试与标题等组件在 Web 应用内的原有归属，移除 `@scopify/ui/scopify/components/*` 的不稳定公开入口与预览；保留 Shadcn 原生组件、共享主题层和文档站，待组件边界重新设计后再逐项评审。
- **统一文档服务端口**：将 Scopify Docs 的开发与生产服务默认端口调整为 `9191`，确保 `dev:docs` 与构建后启动使用同一地址。

### Fixed

- **修复桌面构建与打包 Turborepo 任务并发导致的协议校验失败**：修复 `turbo.json` 中 `build:win` / `build:mac` / `release:win` / `release:mac` 与 `build`、`sync:renderer` 并发执行导致提前读取旧协议版本 manifest 的问题；建立严格的 `build:win -> build -> sync:renderer` 依赖 DAG，同时由 Corepack 固定并预热内置后端所需的 pnpm 9.15.4，避免开发机全局 pnpm 版本影响打包。
- **修复桌面内置后端启动被 npm 版本检查阻塞**：安装包中的本地 API 不再等待 npm registry 版本查询；开发环境仍保留检查，避免网络波动导致后端未监听端口即超时失败。
- **修复自动启动本地后端覆盖自定义 API 地址**：本地后端的自动启动与端口只管理桌面进程生命周期，保存网络设置时会保留用户配置的协议、主机与端口。
- **修复 Sidebar 文档生产构建缺少 Image 映射**：为官方 MDX 内容注册 Next Image 组件，避免包含图片示例的 Shadcn Sidebar 页面在静态预渲染阶段中断构建。
- **修复 Docs 代码示例缩进丢失与字体回退**：MDX 内嵌的 TS/TSX 示例在进入动态高亮前统一恢复标准格式，避免 JSX 属性模板编译后子节点全部顶格；文档代码块改用独立加载的 Geist Mono，并统一为更清晰的 14px 字号与行高，不影响 Scopify Web 或 UI 主题 Token；测试入口同步收紧到 Docs 自身测试目录，避免误执行参考源码中的上游测试。
- **修复主题选择器遗漏 Scopify 默认主题**：将 `shadcn-default` 与 `scopify-default` 统一注册为内置主题；Scopify 默认主题会同时读取 Shadcn 基础 Token 和 Scopify 扩展 Token，确保 UI Library 的局部主题切换展示完整主题能力。
- **修复落地页 Sonnet 拖动与内容重叠**：商籁改用独立的无声播放时钟持续循环，滚动只负责切换章节；章节标题在 Folia 接管画面前自动退场，桌面截图显影时不再与大字争夺视觉焦点。
- **修复 Folia 隐现流体切歌后停帧**：增加可见状态检测与自动重挂载，解决跨歌单右键切歌时 WebGL 流体停滞的问题。
- **修复 Electron 内置后端未就绪时主页面提前加载**：桌面端启用本地后端自动启动时，启动页会等待后端健康检查确认运行后再创建主窗口；启动失败时提供重试或退出，不再让首屏请求直接落入错误页；使用自定义后端时不增加启动门槛。
- **修复桌面打包与 CI 的子模块与主题硬编码问题**：将 `ci.yml` 与 `release.yml` 的 `checkout` 明确禁用子模块递归，确保打包流程只初始化后端子模块；同时将 `AudioEqualizerPanel` 的危险色按钮从硬编码 `red` 类名改为语义化 `destructive` 主题 token，通过 `lint:theme` 检查。
- **修复播放器状态 Store 单测在 CI 中偶发缺失 Action 的问题**：`playerExpiredUrl.test.ts`、`playerRepeat.test.ts` 与 `playbackQueueStoreAdapter.test.ts` 改为固定基线 actions 并复用 `setState` 基线快照，避免直接依赖 `usePlayerStore.getState()` 带来的并发污染，确保 `togglePlaying`、`setIsPlaying` 与 `playNext` 在测试运行中始终可调用。
- **修复播放器状态 Store 单测在 CI 中 `getInitialState` 兼容性问题**：将三处测试改回 `usePlayerStore.getState()` 并通过 action 存在校验与回滚保护，避免 GitHub Actions 环境下 `getInitialState` 不存在导致 CI 直接报错。

## v1.4.6

### Added

- **新增设置页快捷键入口**：将快捷键体系中的默认 `open-shortcut-settings` 绑定改为 `Cmd/Ctrl + ,`，在渲染端按键监听中直接跳转 `/setting`，无需主进程全局注册与重启。
- **推荐播客声音支持独立刷新与文案对齐**：主页「推荐播客声音」板块标题旁新增刷新按钮，点击可重新向 `/v1/pc/voicelist/rcmd/list` 获取最新随机推荐；接口预取数量调整为 24 条，按 6 个一组展示并支持分页直达；将原「推荐声音歌单」文案统一对齐为「推荐播客声音」。
- **首页全板块展开支持分页直达**：主页问候快捷横条（`HomeGreetingSection`）、专属推荐歌单（`PersonalizedPlaylists`）、推荐歌手（`SuggestedArtists`）和推荐播客声音（`RecommendedVoiceLists`）在展开状态下均支持带有 `[1] [2] [3]...` 数字页码直达和左右箭头的分页导航栏，并调高了各接口的单次预取上限。
- **新增 Electron 内置后端生命周期管理**：桌面端可选自动启动随安装包提供的本地 API，并支持自定义端口、检测端口占用、识别外部已运行后端及通过 IPC 将状态同步到设置页。
- **默认启用 Electron 内置后端**：新安装的桌面端默认启动本地 API，仍可在桌面端设置中关闭并切换到独立后端。
- **调整本地后端启动控制位置**：将自动启动开关、端口与运行状态提示归入桌面端设置，网络设置专注于后端连接地址和 Ping 检测。
- **重构桌面端日志生命周期**：当前运行日志固定写入 `main.log`，启动时将上一轮日志按本地时间归档到 `archive/YYYY-MM-DD/`；分片超过单文件上限后保留历史文件，不再覆盖为 `.old.log`，并自动标记异常中断会话。

### Visual

- **整理 Folia 侧栏音频与视觉快捷设置**：音质、均衡器和音频增益合并为单行控制；歌词动画与背景行移除独立设置齿轮，在 Folia 模式选择弹层底部增加“更多设置”入口并跳转到对应全局设置页；动画强度仅在实际支持的模式中显示，并移动到随机切换按钮之前。
- **统一 Folia 动画参数卡片边界**：将浮名等 7 类动画参数面板写死的白色描边改为跟随 Folia 次要色 token，恢复浅色主题下缺失的圆角边框，并保持深色与自定义主题一致。
- **恢复 Folia 全局背景与歌词动画的展开式选择**：全局背景类型和动画模式重新使用原有的预设选项组，直接展示全部模式及当前选中高光；各模式内部的局部参数继续使用紧凑按钮，避免全局选择也被压缩成单个下拉入口。
- **拆分 Folia 音频设置与 PlayBar 弹层**：Folia 侧栏改用自身的紧凑音质选择器，并新增独立均衡器模态；原“歌词样式”统一更名为“Folia 设置”，通用页在主题与字体设置下方新增歌词全局设置卡片，时间偏移统一通过 Folia 模态调整，均衡器只保留在音频设置中。
- **补齐 Folia 侧栏设置面板的视觉交互与预设入口**：在可视化设置弹窗的 Common/字幕 分区补齐 `range` 滑条即时回调，音量与主题相关 slider 拖拽时不再“抬指才生效”；并让主题快捷入口与预设网格同屏展示，补上主题预设按钮状态与落盘逻辑，形成可点击的预设入口。
- **统一常规设置前端主机输入框右对齐**：为 `GeneralSettingsTab` 中的「前端主机」输入框补充 `align="right"` 配置，与端口号及网络设置输入框保持统一的右对齐输入风格。
- **重构音质与会员 Badge 并收敛至 `@scopify/ui` 基础组件**：将 `MediaInfoBadge`、`SongQualityBadge`、`SongVipBadge`、`UserVipBadge` 及音频设置弹窗中的 `SvipBadge`/`VipBadge` 统一收敛至消费 `@scopify/ui` 的 `Badge` 规范组件；规范化音质与会员色系（SVIP/超清母带采用金色/Warning，VIP/SQ/Hi-Res 采用红色/Danger，HQ/普通采用品牌色/Neutral），解决 Playbar 与列表中音质标签色系和样式未统一的问题。

- **统一板块顶栏分页导航并优化 HomeGreeting 排版**：将各 Section 的分页控件从卡片下方抽离为独立的 `SectionPagination` 组件，统一收敛至 Section 头部右侧与「展开/收起」按钮并排展示，避免卡片下方浮空分页条造成的视觉割裂；`HomeGreetingSection` 默认折叠展示 2 排（6 张卡片），展开后展示 3 排（9 个卡片/组）。
- **拉开首页各 Section 标题与卡片内容间距**：将 `CollapsibleSection` 及活动轮播区的标题与内容间距统一调整为 `space-y-6`（24px），主页外层间距调整为 `space-y-10`（40px），并同步骨架屏尺寸与轮播标题排版，消除标题与卡片列表过近紧贴的问题。
- **补充本地后端设置状态提示**：在桌面端设置中新增自动启动开关、端口配置和运行状态小圆点，启用本地后端时自动将 Ping 与请求目标切换到本机地址。
- **完善日志与诊断设置**：新增单个日志文件大小限制，以及打开当前 `main.log` 和日志目录的快捷操作；日志清理只针对归档文件，不会删除当前会话日志。

### Quality

- **收敛前端内联标签并消除硬编码样式**：重构 `MediaInfoBadge` 消除散落在各处的独立内联 `<span>` 硬编码，统一复用 `@scopify/ui` 导出的 `Badge` 原生组件与设计 Token，保证跨平台与暗黑模式下的边框、圆角与字号规范统一。
- **解耦主页各业务板块组件与修正数据流向**：将主页内联的问候横条与推荐歌手板块分别抽离为独立的 `HomeGreetingSection` 与 `SuggestedArtists` 组件；完善各板块 Props 类型至 `types/components/home.ts`；「为 {{name}} 推荐」板块准确绑定至登录用户个性化推荐接口（`/recommend/resource`，未登录自动回退至 `/personalized`），顶部问候横条绑定至公共推荐池（`/personalized`）。
- **补充日志轮转边界测试**：覆盖启动归档、异常退出标记、同毫秒重名规避和归档清理不影响 `main.log` 等场景。

### Fixed

- **修复 Release 打包工作流子模块更新失败**：将 `release.yml` 中 `package` 任务的 `actions/checkout` 切换为 `submodules: false`，并显式仅初始化 `repo/backend/api-enhanced` 子模块，避免 `frontend/apps/mobile` 缺失提交导致 GitHub Actions 打包终止。
- **修复内置后端 Logo 被压成单行**：转发后端 stdout/stderr 时保留多行输出和 Logo 内部排版，并让多行日志的 `[backend]` 标记独占一行，同时清理终端控制字符，避免启动 Logo 在日志中变成一串方块或横向乱码。
- **修复 electron-log 文件写入失败**：内置文件 transform 完成格式化后会传递字符串，改为对最终日志文本进行清理，避免错误调用 `data.map` 导致 `main.log` 始终为空。
- **修复桌面日志中的终端控制字符与 Logo 排版**：文件日志最终落盘前会清除 ANSI 颜色码，并将回车控制符还原为换行，避免彩色字体残留或后端 Logo 被压成不完整的一行。
- **移除登录页重复的未登录提示**：删除登录页根据 `reason` 参数渲染的紧凑登录提示卡片，并停止各未登录业务入口向 `/login` 传递已无用途的原因参数，避免从非 ProfileMenu 入口进入登录页时出现多余槽位。
- **移除前端自建日志链路**：删除 `repo/frontend/apps/web/lib/web/logger.ts` 及其相关调用路径，页面与请求日志改为直接通过 Electron 侧 `runtime.logging` 落盘，并在上报失败时保底输出控制台日志；同步清理前端日志中转脚本与测试文件，保留桌面端日志功能不变。
- **移除无意义日志中继配置**：删除 `APP_CFG_DEBUG_LOG_RELAY_*` 在前端 Next 配置中的注入与依赖，连同前端开发时的 `renderer log relay` 配置入口一并清理。
- **修复桌面端版本更新后登录状态丢失**：主进程新增 `music_cookie` 持久化文件存储（`repo/frontend/apps/desktop/main/utils/musicCookieStore.ts`），在 `set-music-cookie` 时同步落盘并提供 `get-music-cookie` 同步读取通道；Web 侧 `musicSessionCredential` 支持 Electron 回填到 `localStorage`，兼容保持 Web `localStorage` 为主的现有方案，实现桌面端升级后自动恢复登录态。
- **降低 LoFi 预设默认驱动**：将二段效果台的 LoFi 驱动从 28% 调整为 5%，保留颗粒、摆动与噪声质感，同时减少默认预设的过载失真。
- **修复 ReplayGain 无效与均衡器破音**：保留 `/song/url/v1` 返回的单曲增益 dB 并随播放地址缓存写入当前歌曲，新增独立 Folia 音频增益控件显示真实 `T/A dB` 或不可用状态；音频链拆分为带自动余量的十段 EQ 与独立二段效果台，恢复驱动、颗粒、噪声、颤动、空间等创意控制，同时让零值真正直通、采用安全干湿混合并在末端防削波，所有滑块拖动实时生效。
- **修复全局歌词偏移模态在浅色主题下不可读**：模态 Portal 显式接入 Folia 背景、正文、辅助与强调色 token，并让遮罩、卡片描边、刻度文字和中心指示线随当前主题变化，避免雪白主题下出现白字白底。
- **修复 Folia 背景类型回退英文**：为通用、莫奈、漫游与隐现背景的注册项补齐 `folia.` 翻译命名空间，使展开式背景选择正确显示当前语言文案；嵌入与空背景继续沿用已有的正确翻译键。
- **补齐 Monet 漫游背景新增效果翻译**：补充背景漂移、漂移幅度和流动光带的简体中文、繁体中文与英文文案，避免原始 i18n key 撑出 Folia 设置面板。

## v1.4.5

### Fixed

- **修复设置页后端主机输入被 `0.0.0.` 劫持问题**：废弃 `cleanBackendHostInput` 中依赖 WHATWG URL 整数 IP 解析的副作用逻辑，避免打字输入数字时被自动格式化为 `0.0.0.x`；输入框实时输入与失焦清洗逻辑解耦，用户打字时保持原生输入状态。
- **修复音量拖拽条延迟生效问题**：`VolumeControl` 的滑块回调改为随拖拽即时同步音量，移除拖拽过程中的延迟提交策略，恢复真实“跟随滚动条变化”体验，避免仅在手指/鼠标抬起时才变更音量。

### Visual

- **优化后端主机设置项描述与对齐排版**：移除输入框中冗长的“例如...”占位符，将示例（如 `例如 127.0.0.1 或 api.example.com。`）统一收敛至左侧描述文本，避免误导用户重复输入协议；将主机和代理输入框统一限制宽度并恢复右对齐，与其他表单控件保持严格视觉对齐。

### Added

- **新增后端主机格式合法性校验与即时提示**：引入合规性校验规则，支持标准 IPv4、IPv6、localhost 及多级域名，拒绝格式错误、非法字符及非法顶级域名；当输入非法格式时即时高亮红框并展示多语言错误提示，并在 Ping 和保存时进行强校验拦截。

### Quality

- **修复播放器状态单测的隔离污染与 Action 丢失**：重构 `playerExpiredUrl.test.ts` 与 `playerRepeat.test.ts` 的状态清理机制，废弃全量 `replace` 重置模式，确保测试前后安全隔离并保留 `usePlayerStore` actions。
- **重构桌面配置自愈与出厂模板测试体系**：将桌面 YAML 单测严格对齐至不可变的出厂底本 `app.config.default.yml`，消除针对本地动态工作配置 `app.config.yml` 的脆弱硬编码断言；完善主进程 `ensureConfigFile` 的回退自愈与落户机制，补充本地配置自定义与默认底本隔离的单测覆盖。
- **清理 GitHub Packages 发布工作流与配置**：移除 `.github/workflows/publish-package.yml`，将 `@scopify/desktop-contract` 标记为 `private: true` 并移除 `publishConfig`，收敛桌面契约包仅作为内部 Monorepo workspace 模块维护。
- **完善 Commit 阶段代码质量门禁**：在 `lint-staged` 中补充 Web 源码的 ESLint 自动检查与修复（`eslint --fix`），在 `.husky/pre-commit` 钩子中补充毫秒级架构边界检查（`bun run lint:architecture`），并在 `scripts/check-architecture.ts` 中补齐 `.next-dev` / `.turbo` 忽略目录，确保本地提交阶段与 CI 质量门禁一致。

## v1.4.4

### Added

- **补齐 Voice 与歌单评论/喜欢交互**：评论页现支持歌曲、歌单、单个 Voice 与 VoiceList 四类资源；歌单和声音列表 Action 区新增带评论数量的入口并与随机播放调整顺序，Voice 播放栏会从 Voice 资源自身加载喜欢数与评论数，单曲与侧边栏歌单右键菜单也会按需加载评论数量并提供评论页入口，同时保留旧歌曲评论链接兼容。
- **开发者工具接入快捷键与命令体系**：桌面端启动时不再自动打开 DevTools；设置项改为运行时访问权限开关，无需重启即可生效，并新增默认 `F12` 的“打开/关闭开发者工具”命令供快捷键系统与命令面板统一调用。
- **补齐 Scopify 错误与 404 页面**：在 Next.js 原生错误边界基础上使用 Scopify 语义 token 与清爽的文字排版，状态码采用本地打包的 Black Ops One 展示字体，并补充多语言错误说明、重试与返回主页操作以及覆盖无匹配路由的根级 404 页面。

### Visual

- **优化评论 Action 数量展示**：评论数量改用共享 shadcn Badge，以深色半透明描边气泡轻叠在评论图标右上角，避免高对比气泡与图标脱节，同时不占用操作栏横向空间。

### Quality

- **移除 triggerLibraryUpdate 状态肿瘤并全面接入 TanStack Query**：彻底废弃并移除 Zustand `useUserStore` 中的 `libraryUpdateTrigger` 与 `triggerLibraryUpdate` 遗留补丁，将用户歌单列表生命周期收敛为 `musicQueryKeys.library.playlists(userId)` 与 `useUserPlaylistsQuery`。
- **契约包规范化为内部组织包名**：将桌面契约包统一收敛为本地 Workspace 组织包名 `@scopify/desktop-contract`，各子应用统一使用 `workspace:*` 声明依赖。
- **拆分共享 UI 主题层**：新增内部 `@scopify/ui` workspace package，将 shadcn/tweakcn 标准 token、Scopify 产品语义 token 与 Folia 运行时主题模型拆成三个独立入口；Web 端改为消费共享主题接口，为后续迁移基础组件与统一主题编辑能力建立稳定 seam。
- **固化共享 UI 分层约束**：新增 `ui-package-boundaries` Skill 并接入根项目规范，明确原生 shadcn CLI vendor 层、Scopify 扩展层与应用业务层的职责、依赖方向和迁移决策流程。
- **规范 Docker Compose 镜像版本标识**：为 `docker-compose.yml` 中的后端与前端镜像构建绑定明确的版本环境变量与默认版本号（前端 `1.4.3`，后端 `4.39.0`），避免使用 `latest` 导致版本模糊，并同步更新 `.env` 与 `.env.example`。
- **设置页后端网络配置解耦与智能清洗**：在设置页新增显式「传输协议（HTTP/HTTPS）」切换；主机输入框支持输入智能清洗，自动剥离粘贴混入的协议、路径与端口并同步回填至对应控件；解耦端口维护并大幅简化底层 URL 解析规范化逻辑。

### Visual

- **优化评论页流式布局与评论数展示**：将评论列表容器从原先的窄宽度居中（`max-w-4xl mx-auto`）调整为与歌单、专辑一致的全宽响应式间距（`px-6 md:px-8 lg:px-10 xl:px-12`），使评论流与顶部 Header 封面和标题严格左对齐，消除宽屏下的两侧留白与不对齐问题；同时移除顶部 Hero 中的评论数并将总数移至内部“全部评论”标题旁展示。

### Fixed

- **修复歌单跳转时头部骨架屏隐形与排版跳动问题**：为 `PlaylistHeaderSkeleton` 中的骨架占位显式应用 `bg-skeleton` 语义 token，并将基础 `Skeleton` 默认背景色调整为 `bg-skeleton`，解决暗色模式下回退到 sunken 背景色导致骨架屏完全“隐形”的视觉缺陷；同步重构头部骨架屏的封面尺寸与外层内边距，使其与真实 `PlaylistHeader` 和 `ActionStation` 严格像素级对齐，消除加载完成替换时的 CLS 抖动。
- **修复添加/删除歌单单曲后侧边栏封面与歌单内容不同步问题**：重构 `usePlaylistTrackMutation`，在单曲增删操作成功后自动通过 TanStack Query 精确失效目标歌单内容缓存、用户歌单缓存及喜欢音乐缓存，自动触发侧边栏歌单实时静默拉取最新封面（`coverImgUrl`）与歌曲数（`trackCount`），并清理散落在各 UI 触发点（右键菜单、歌曲列表、歌手页等）的冗余手动缓存清理代码。
- **修复设置页后端地址规范化时丢失自定义端口的问题**：重构 `normalizeBackendConfig` 解析逻辑，当主机输入框填写带 `http://` 协议前缀（但未内联端口）或填写本地回环地址（`127.0.0.1`/`localhost`）时，正确继承并保留端口输入框中的自定义端口（如 `3838`），并确保本地地址智能回退为 HTTP 协议，避免端口被误置为 80 或协议误判为 HTTPS。

## v1.4.3

### Refactor

- **统一桌面端构建产物目录收敛**：桌面端所有构建阶段输入输出（`build/desktop/app/out/main`、`build/desktop/app/renderer`、`build/desktop/app/package.json`、`build/release`）完全内聚收敛于 `repo/frontend/apps/desktop/build/` 内部；彻底消除了以往跨仓库根目录的多级跳转（`../../../../`）与散落临时文件。
- **全链路 Turborepo Task DAG 编排**：桌面端同步、编译、打包全面交由 Turborepo 任务依赖图（Task DAG）管理（`sync:renderer` -> `build` -> `build:win/mac`）；根目录 `package.json` 彻底移除了所有的 `&&` 脚本拼接与 `--cwd`，全部采用单行纯粹的 Turbo 标准命令。
- **阶段化解耦与原子命令提供**：Desktop 内部解耦并提供了清晰的原子阶段命令（`sync:renderer` 同步、`build` 编译、`package:win/mac` 本地打包、`release:win/mac` 发布打包），支持灵活单步调试与 CI 分布式流水线调度。

### Quality

- **自闭环主进程内联打包**：桌面端生产构建（`electron-vite`）将纯 JS 运行时依赖（`@xhayper/discord-rpc`、`electron-log`、`electron-updater`、`js-yaml`、`zod` 等）全量 Tree-Shaking 编译并内联至 `out/main/main.js`；打包运行时声明 0 外部依赖，彻底免除了跨平台/CI 环境中对 `node_modules` 软链接的依赖与查找异常，并提升桌面端启动 I/O 效率。
- **收敛桌面播放 Authority**：彻底移除未启用的隐藏播放 Renderer、专用 preload、会话控制协议、恢复检查点、路由与构建门禁；桌面主 Renderer 继续独占媒体元素、队列与播放 Authority，伴随窗口仅通过可靠 Playback Broker 消费投影。通用媒体类型、持久化 key 与音频特征采样器已迁回对应全局模块，`desktop-contract` 同步升级至 2.0.0。

### Fixed

- **修复共享 UI 主题入口构建失败**：补齐共享主题依赖的 shadcn token 层；Web 对 Folia TS 模型以 `workspace:*` 声明依赖，而全局 CSS 以 monorepo 相对路径加载主题，避开 PostCSS 对 workspace bare specifier 的不稳定解析；新增聚合主题入口完整性测试。
- **修复 ws 模块可选原生依赖动态加载报错**：在 `electron.vite.config.ts` 中将 `ws` 的可选原生模块 `bufferutil` 和 `utf-8-validate` 标记为 `external`，防止 Vite 打包将其转译为顶层抛错 stub，确保在开发态和生产运行时自动平滑降级为纯 JS Buffer 运算。
- **修复 GitHub Packages 发布工作流 409 Conflict 异常**：在 `.github/workflows/publish-package.yml` 中新增版本预检逻辑，当目标版本已在远端存在时优雅跳过，避免 tag 发布流程因包版本未变更而报错中断。

## v1.4.2

### Visual

- 优化歌手详情页布局：歌手“简介”卡片与热门歌曲区域同级并支持 Sticky 悬浮跟随（浏览热门歌曲列表时在右侧保持固定），“音乐作品”保持独立全宽下沉显示，并支持点击简介卡片查看全量歌手介绍弹窗。
- 移动桌面端设置中的 Discord “连接测试” 控制项至 Discord 设置分组卡片内。
- 移除设置页面上的强行满屏最小高度与双层背景卡片约束，使布局自然根据配置表单内容自适应贴合。
- 优化 Discord 与后端连接测试行布局：将连接状态指示标签（如 Discord`已接通`、后端`可用 · 16 ms · v4.39.0`）调整至“连接测试”标题旁紧凑排列，右侧仅保留测试操作按钮。
- 补充设置页面中开发者工具、关闭窗口行为、前端主机、开发端口、日志级别与清除播放缓存等控制项的描述说明文字。
- 侧边栏 Scopify 图标与品牌名称增加点击跳转到首页功能。
- 重构存储设置页为 3 个独立分组（通用设置、页面缓存、播放数据缓存）：通用缓存目录置于独立的“通用设置”分组，页面与播放缓存的开关及高级参数分别归属于各自的标题下，“数据占用”与“清理缓存”按钮移动至各分组末尾。缓存目录支持自动预填、手动编辑及调用系统原生文件夹选择器（“浏览”按钮）。
- 优化“清理缓存”独立页面的视觉样式：移除多余的页面内重复返回按钮与副标题，标题与刷新按钮严格约束在 max-w-4xl 内容容器宽度内对齐；底部“清理所选”操作栏重构为居中悬浮圆角卡片（Floating Action Bar），并增加平滑淡入淡出动效。

### Added

- 新增 GitHub Package 自动化发布支持：配置 GitHub Actions 工作流 `.github/workflows/publish-package.yml`，在打 tag（如 `v*` 或 `contract-v*`）时自动将桌面契约包发布至 GitHub Packages (`npm.pkg.github.com`)；全库仓库地址与包名同步迁移至组织目标 `@scopify/desktop-contract` (https://github.com/MT-SUPER-POWER/Scopify)。
- 统一搜索窗口支持以 `>` 前缀搜索并执行命令；`Ctrl + Shift + P` 会直接打开命令查询。
- 命令候选按设备本地累计使用次数排序，并继续支持上下方向键和 Enter 操作。
- 桌面端设置新增“桌面歌词”独立配置与测试卡片：支持一键开/关桌面歌词悬浮窗口测试，并实时配置保持窗口置顶、鼠标穿透与隐藏任务栏图标。
- 新增独立缓存清理页：按页面、播放地址、在线歌词及用户歌词数据分类展示条目数和占用空间，支持分组勾选、二次确认与选择性清理。

### Quality

- 优化 Electron 主进程打包策略：桌面端生产构建（`electron-vite`）现直接将纯 JS 运行时依赖（如 `@xhayper/discord-rpc`、`electron-log`、`electron-updater`、`js-yaml`、`zod` 等）完整打包内联至 `out/main/main.js`；移除了打包制品对跨目录 `node_modules` 软链接的脆弱依赖，彻底杜绝跨平台/CI 下由于符号链接权限导致的依赖丢失问题，并提升桌面端冷启动加载速度。

### Fixed

- 修复 CI 并发加载测试文件时 Runtime mock 缺少 Cache 契约、导致播放缓存过期回归测试失败的问题；测试替身现覆盖带过期语义的最小缓存接口。
- 修复桌面配置测试在 Linux CI 上使用 Windows 路径解析器读取 YAML 失败的问题，改用跨平台的 Node 路径 API。
- 修复 CI 的干净克隆环境缺少 Next.js 生成的图片模块类型声明，导致 Web TypeScript 检查失败的问题；typecheck 现在会先生成 Next 类型文件。
- 修复 Vercel 部署因 `vercel.json` 缺少 Monorepo 根目录导航与子项目目录切换指令导致无法识别 Next.js 依赖及定位 `.next` 制品的问题；增加根目录 `.vercelignore` 过滤无关子模块与桌面端构建文件。
- 修复 Windows Release 打包在 Bun 1.3.7 下无法解析 Discord Rich Presence 运行时依赖的问题；发布工作流现使用与工作区一致的 Bun 1.3.11。
- 修复 Windows CI Release 工作流在 `windows-latest` 上因缺少开发者模式权限导致 Bun Workspace 创建 `node_modules` 软链接失败、进而使 `electron-builder` 无法定位 `@xhayper/discord-rpc` 等运行时依赖的问题；构建前现自动开启 Windows 开发者模式。
- 修复 GitHub Package 发布工作流在 tag 触发时因 `@scopify/desktop-contract` 版本未变动导致 `npm publish` 报 409 Conflict 失败的问题；发布前现自动检测远端版本，已存在时优雅跳过发布。
- 修复页面缓存与播放缓存共用目录和清理范围的问题；桌面端改为独立子目录并安全迁移旧缓存，Web 端改用分区 IndexedDB 存储。
- 修复 Windows 桌面播放壁纸在安装包中被错误标记为不支持的问题；WorkerW 附着与系统壁纸回退脚本现随安装包发布，并按开发或生产运行时解析对应路径。
- 修复桌面音乐控制器错误继承 Folia 主题色的问题；控制器现在仅跟随全局 NextTheme 的明暗主题，Folia 主题切换只影响歌词渲染。
- 移除桌面控制器 Folia 外观面板中的冗余说明、图标与标题，保留全部提示与确认功能。
- 修复 Audio Feature Broker 仅授权壁纸窗口、遗漏桌面播放控制器订阅的问题；壁纸与控制器均以各自受限的 Electron sender 身份连接，沉浸式视觉不再因授权拒绝持续重连。
- Windows 桌面端按下 `Alt` 不再显示原生 Electron 菜单栏。
- 桌面端新增 Discord Rich Presence：在设置中填入 Scopify 的 Discord Application ID 并启用后，可同步当前曲目、封面、播放状态与进度。
- Discord Rich Presence 默认使用 Scopify Application ID `1536959813114658836` 并在新配置中启用。
- 修复桌面端打包版首屏加载动画可能一闪而过的问题：启动页现在等待自身渲染完成，并在 Renderer 就绪前保持可见。
- 修复桌面端 renderer 同步与打包脚本错误定位工作区根目录、导致正式构建在复制 renderer 后中断的问题。
- 修复 Discord Rich Presence 将曲目名重复显示为副标题或封面说明的问题；封面说明优先显示专辑名。后端 Ping 的成功与失败结果也统一通过 Toast 提示，不再滞留在设置行内。
- 修复主窗口收纳或隐藏后桌面背景流光间断的问题：音频特征由主 Renderer 以独立 33 ms 时钟采样，并由壁纸 Renderer 自己按 rAF 平滑、衰减；Publisher 与 Subscriber 端口断开后都会独立重连。
- 修复高分辨率与高 DPI 桌面上 Dithering 流光被过度放大、只能看到局部闪烁的问题；Shader 像素尺度现在会补偿实际渲染降采样比例。

### Quality

- 新增 PR 质量门禁工作流 `.github/workflows/ci.yml`，在 PR 与主干提交时自动执行 `typecheck`、`format:check`、`lint` 与 `test` 检验；明确收敛 Prettier 校验范围，自动忽略 `repo/backend/` 和 `repo/frontend/apps/mobile/` 子模块与各项构建/工具缓存，配置 Bun 与 Turbo 缓存并支持自动取消同一 PR 的旧构建任务。
- 增强发布工作流 `.github/workflows/release.yml` 的 Changelog 校验逻辑：当提取到的版本发版说明为空时显式 `exit 1` 终止发版，防止漏写 CHANGELOG。
- 将 Next.js 开发缓存隔离至 `.next-dev/`，避免开发服务与生产或桌面 Renderer 构建共用 `.next/` 后触发 Turbopack 缓存重建和 I/O 警告。
- 收敛应用源码目录至 `repo/`：Web、Electron、共享契约、Mobile 与 API 后端统一迁移为 `repo/frontend/*`、`repo/backend/*`，并同步更新 workspace、Docker、Vercel、Release workflow、构建制品路径与架构文档。
- Discord 设置新增本机连接测试与实时连接状态：直接尝试 Discord 桌面端 RPC，并以 Toast 明确反馈连接、配置或启动失败原因。
- 完善 README 部署说明：新增 Vercel 双项目部署、环境变量、CORS、HTTPS 与自定义域名配置指引，并补齐 Docker Compose 子模块初始化步骤。
- 新增 Discord Rich Presence 技术参考，收录官方 RPC、应用配置及活动字段文档。
- 优化 CodeGraph 工作流：适配 CodeGraph Auto-sync 自动增量同步特性，移除手动执行 `codegraph sync` 的规范要求与操作步骤。

## v1.4.1

### Added

- README 新增 GitHub Release 总下载量徽章。

### Fixed

- 修复乐签硬编码问题
- 修复生产环境默认开启 devTools 的问题

## v1.4.0

### Visual

- 完善桌面端“客户端更新”状态：显示最近检查时间，适配浅/深色主题，并清晰呈现更新失败消息。
- 首页问候语根据登录状态显示用户名，增强个性化体验。

### Added

- 桌面端“日志与诊断”现在显示日志文件的实际存储路径。

### Changed

- VisualSetting 界面内容重新分布

### Quality

- 修复 CodeGraph skill 的 YAML frontmatter 解析歧义，确保 Codex 能正常加载该 skill。
- Desktop 构建中间产物与 Windows/macOS 发布物统一写入仓库根目录的 `build/` 目录
- Release workflow 按共享 Renderer、平台打包和发布汇总分层，并同步根目录 `build/` 制品布局。
- popover 现在会显示一些快捷操作的快捷键
- 搜素窗口的适配了快捷键，同时补全的内容也会出现在标题输入内容
- 移除 Turborepo `dev` 脚本中已废弃的 `--parallel` 参数，依赖 `turbo.json` 中配置的 `"persistent": true`

### Added

- Folia 音量平衡操作
  - 对应的平衡界面
- 桌面歌词功能
  - 桌面端的控制小窗口
- 主题色切换接入

### Fixed

- 设置保存确认框改为全局 Portal 模态，避免 Header 与 PlayBar 显示在遮罩之上。
- 断开后端时，歌单页会保留 Header 骨架占位，避免操作栏和曲目表直接顶到页面顶部。
- 首页全部公共内容请求失败时，保留时间问候和动态背景，并显示简洁的网络重试状态。
- 修复 PlayerBar 音量控制图标 Hover 时音量面板与 Tooltip 冲突的问题（移除冗余 Hover Tooltip，恢复悬停展开音量调节面板，并完好保留全局键盘快捷键响应）。
- 修复 Electron 开发模式构建产物路径与启动器入口不一致，导致桌面端无法启动的问题。
- 修复 Electron 安装包移除 source map 后导致 renderer 完整性校验失败、应用无法启动的问题
- 登陆界面返回我们的全局 header 会失去颜色的问题
- 侧边栏目的响应式是伪响应式
- 宽度不够的时候，会导致歌单列表一部分头顶内容渲染为空
- 关闭软件作为一个独立窗口，不再作为一个内部模态，防止特殊情况下无法关闭的问题
- 修复了浅色主题下快捷键硬编码看不到的问题

## v1.3.0

### Added

- 设置后端地址增加了 ping 测试后端是否可用
- ping 测试地址适配了协议测试机制

### Quality

- Folia 沉浸式歌词优化 Sonnet/v2
- Folia Subtitle 优化副歌词显示内容
- playbar 副歌部分采用柔光区域表示

### FIXED

- 修复 playbar 有些时候播放缓存的歌曲失效但是不会重发请求的问题
- 修复日志的问题

## v1.2.0-beta.2

> 前端多端拆分的首个 Beta 版本：在保持 Web 与 Electron 可运行的前提下，完成 Monorepo 结构、运行时边界和独立发布链路。

### Architecture

- 将前端整理为 Bun Workspaces + Turborepo Monorepo，统一管理 Web、Desktop、Mobile 预留入口与 Desktop 契约包
- Web 源码迁入 `frontend/apps/web`，Electron host 迁入 `frontend/apps/desktop`，Desktop 不再反向引用 Web 源码
- 新增 Browser/Electron Runtime 适配层，UI 不再直接访问 `window.electronAPI` 或判断 Electron 环境
- 拆分 Web 与 Desktop 配置所有权，跨端只共享版本化的纯 TypeScript DTO 和 IPC 协议
- 增加架构守卫，阻止 Desktop 导入 Web、UI 绕过 Runtime 边界以及跨端配置重新耦合

### Deployment

- Vercel 独立构建 `@scopify/web`，Cloudflare 仅负责 DNS 与 API 边缘安全，不参与 Web 应用构建
- Desktop Release 改为只构建一次不可变 Renderer，各平台下载同一制品后再独立打包
- Renderer 新增 manifest、协议版本、source revision 与确定性 SHA-256 校验，篡改或版本不匹配时拒绝启动和发布
- GitHub Release 汇总 Windows/macOS 制品，生成校验和并附加构建来源证明
- 含预发布后缀的标签会自动发布为 GitHub Prerelease，且不会覆盖最新稳定版

### Quality

- 清零 Web/Folia ESLint error，根目录 `lint`、`typecheck`、`test` 与 `build` 均可作为 Monorepo 统一门禁运行
- 补充 Runtime 适配器、架构边界、配置映射和 Renderer 制品完整性测试
- API 与用户数据响应补齐类型，移除相关 `any` 与不安全断言

### Fixed

- 修复开发环境中网易云远程图片触发 Next.js `next/image` 域名与代理校验错误的问题
- 开发模式和 Electron 静态构建直接加载远程图片，Vercel 生产构建仅允许受信任的图片域名
- Web 后端按 `.env.development` / `.env.production` 分层，并支持完整 HTTP/HTTPS URL，避免线上请求被 mixed-content 策略拦截
- 修复开发日志在缺少 metadata 时额外输出 `undefined` 的问题
- 修复标签构建时 electron-builder 隐式发布和仓库元数据缺失导致 Windows/macOS 打包失败的问题

## v1.1.0

### Added

- LyricModal 重做，改为 Folia 的动态歌词效果
- Lyric 多做了一个 Theme 库管理部分
- 添加了快捷键机制
- 登陆界面的轮播图
- 重做侧边结构，独立资料库和播放歌单
- 推荐界面新增热门声音推荐列
- `playbar` 悬浮提示条
- 闭环播客功能
- `sidebar` 新增资源库功能，为个人单位的资源做了一个单位库
- 新增副歌歌词的圆环特效
- 新增播放条与进度条副歌（Chorus）高亮区间与起始打点标记
- 支持 Folia 全屏歌词控制栏与底栏播放条同步高亮显示副歌区间

### Fixed

- 修复了歌词显示的时候浮动点的问题
- 修复了歌词不逐字的问题
- 修理了 `tracklist` 按照标题栏划分不好用的问题
- 补全了大部分的 any 技术债
- 补全了搜索界面的大部分机制
- 补齐了专辑的收藏功能
- 音质切换的时候会从头开始播放的问题
- 修复宽度不够的时候，无播放内容在 `playbar` 的时候，龙骨内容和喜欢以及评论挤压在一块的问题
- 播放模式功能失效
- `playbar` 标题很短的时候，我们的评论和喜欢被挤的很远的问题

### Implement

- 搜索结果支持滚动出现更多的内容

### Infrastructure

- CI/CD 后端优化，实现上流的拉去最新的代码作 PR
- log 日志系统完善，记录更多的报错信息
- CI/CD 的发布 Action 进行完善

## v1.0.7

### 新增功能

- 播放缓存系统：LRU + IndexedDB + Electron IPC 双后端，断网恢复播放进度、URL/歌词缓存
- 网易乐签功能：签到卡片、连续天数统计、名言展示
- 音质选择器：PlayerBar 四档音质切换（标准/高清/无损/Hi-Res）
- 评论区重做：独立 Header、艺术家头像、操作权限控制、点赞数气泡
- Home 首页龙骨动画骨架屏
- 侧边栏歌手筛选
- 设置页播放缓存管理

### 性能优化

- 队列 Popover 虚拟滚动重写（@tanstack/react-virtual），流畅滑动
- Playlist 页面滚动丝滑优化
- LRU 页面内容缓存减少重复渲染
- 音质切换复用播放器缓存，避免重复请求

### 修复

- 歌词弹窗响应式布局、控制栏居中
- PlayerBar 音质切换图标不同步
- SSR 水合错误（ResizablePanel localStorage 读取、playbar progress）
- Electron DevTools 打开、Mac 图标、登录窗口UI
- CORS 跨域、Web/客户端端口兜底
- i18n 重复key清理

### 工程化

- Husky + lint-staged 代码提交约束
- Prettier 格式化统一（替换 Biome）
- ESLint 配置迁移
- Claude Skills 适配
- 文档完善（部署、架构、Changelog）
- 评论区 Badge 阴影去除、内联布局优化

## v1.0.6

> 核心功能增强：歌手页关注、右键查看歌手、Profile 弹窗 ShadCN 化、播放容错机制

- **歌手功能**
  - 歌手页面关注/取消关注按钮（接入真实 API `/artist/sub`）
  - 已关注按钮 hover 变红显示"取消关注"
  - 歌曲右键菜单添加"查看歌手"选项（单歌手直接跳转，多歌手子菜单）
  - 搜索结果、队列、最佳匹配中的歌手名字可点击跳转
  - 侧边栏关注歌手列表实时刷新

- **Profile 弹窗重构**
  - 使用 ShadCN Input、Textarea、Select、Button 替换原生元素

- **Profile 下拉菜单**
  - 修复暗色模式背景反白问题（显式暗色背景）

- **播放与网络**
  - 加载失败自动重试（可配置重试次数与延迟）
  - 网络错误检测 UI（显示降级提示条）
  - 播放失败自动跳过与 fallback 机制
  - 键盘快捷键（左右箭头切歌、空格播放暂停）

- **专辑与歌单**
  - 专辑数据加载失败自动重试
  - 专辑收藏/取消收藏（接入真实 API）
  - 歌单表单增加标签选择器

- **登录与状态**
  - 未登录操作的引导提示弹窗
  - 用户数据跨窗口同步优化

- **i18n 国际化**
  - 新增播放、网络、登录、设置等场景的翻译文本
  - 按场景拆分为独立文件模块，按需加载

- **项目结构**
  - 重构 Agent/Skills 配置结构
  - 更新项目结构文档 `docs/structure.md`
  - 更新 README 路线图

- **其他修复**
  - 评论列表布局优化
  - 搜索结果中歌手名可点击跳转
  - 复用 `ArtistInlineLinks` 组件统一歌手链接样式

## v1.0.5

- 新增歌曲与页面缓存，降低重复打开页面时的重新请求和重新渲染成本
- 支持关闭级别的缓存配置，并提供缓存位置配置与清理能力
- 桌面客户端与后端解耦，客户端安装包不再内置或自动启动后端
- 修复未登录状态下推荐页接口触发 301 后反复进入加载弹窗的问题
- 修复登录状态判断缺少 cookie 导致首页推荐接口反复请求的问题
- 修复 Docker Web 部署无法正确访问前端与后端的问题，调整为 Web 独立 Compose 部署并通过配置连接外部后端
- 更新部署文档，将发布日志迁移到 `docs/CHANGELOG.md`
- 前端与客户端构建不再依赖 `backend/api-enhanced` submodule，Release workflow 不再拉取后端子模块

## v1.0.4

- `next.js` 适配了 `devPort` 配置项，可以通过配置文件来修改开发时服务器的端口了
- 解决了因为是先加载前端页面，导致打包后端的情况下，后端启动慢导致首屏一定是没有数据的问题
- 加入了 i18n 和 Proxy 请求的设置，兼容了配置文件来修改

## v1.0.3

> 修改 Layout 布局样式，在模态页面有静态和动态模式。静态模式（用户不移动）就是只有封面和歌词。动态页面（用户移动）就是有封面、歌词和播放条等组件显示出来

- LyricModal 增加了静态和动态两种模式
- LyricModal 改变了新的布局模式，复用了 PlayerBar 组件
- 把 Audio 组件从 PlayBar 解耦了出来，放在比较高的层级，独立了出来，和 Zustand 通信
- 修复了 LyricRender 界面刷线不保存当前听歌进度的问题
  - 因为 latestTimeMsRef 初始为 0，且挂载时间比 audio player-time 更新 currentTime 早，所以第一次出现的时间一定是 0
  - 如果在 LyricRender 进行了刷新，那么 latestTimeMsRef 就会被重置为 0，最后被存入 Zustand 的时间也是 0，于是听歌进度就丢失了
- playbar 的弹出歌词栏播放之后，再次按下停止播放修复完毕
- 优化 Popover 打开体验，只有首次打开是滚动到对应位置的，之后打开就是就是一直是哪个位置，不需要每一次都滚动造成卡顿了
- 修复了拖动进度条的尖锐声音的问题
- 修复拖动音量条体验差的问题
- 随机模式不做成一个随机的歌单，先把所有歌曲打乱顺序，然后按照这个顺序来播放，直到打完一轮再重新打乱
- 每日推荐不喜欢功能
- 搜索换成了单机搜索，不然太反直觉了，用户哪里知道单击应该是补充搜索结果，双击直接搜索
- 修复了快速切换歌曲导致从上一首歌曲的时间点开始播放的问题
- 对歌单做了修改之后会即使刷新最新的数据，包括不限于取消喜欢、喜欢、删除歌单中等可能会改变歌单结构的操作（引入了一个触发器
- 浮动评论区输入栏，防止评论区上拉之后想评论还得上下拉的体验问题
- 限制未登录的用户一些操作
  - 评论
  - 喜欢
  - 歌单操作
- 修复了 tray 控制菜单不管用的问题
- 修复了 ThumbarButton 状态同步的一系列问题
- 歌手列表的内容订阅了新接口，歌曲列表封面走不在被艺术家封面限制，走自己的封面

## v1.0.2-alpha

> 这个测试的分支，主要用于检查 workflow 工作流是否正确

## v1.0.2

- 修复了播放条的性能问题，核心是节流控制，每 800 毫秒最多只更新一次视图
- 保留了 CurrentTime 的记忆点，在切换歌曲或者随机播放时重置为 0
- 修复了一些大组件解耦之后的报错问题
- 移除了 motion.div 部分解决了连续的动画导致的性能问题
- 修复了 Lyric 点击歌词跳转的问题
- 优化 LyricModal 的页面布局

## v1.0.1

> 对于原有的基础更能进行优化和修复

- 托盘会被系统托盘菜单页面覆盖
- Playlist 页面的 Shuffle 没法使用
- Playlist 的点击按钮要对应 Playlist 控制，而不是全局同步
- Album 小组件, 点击播放按钮之后, plarybar 的封面没有内容
- 搜索部分的优化，单击是补充搜索结果，双击直接搜索，而不是只可以通过回车搜索
- 搜索界面的歌曲增加了右键菜单
- 歌手的歌曲部分增加了右键菜单
- 个人介绍的歌曲部分增加了右键菜单
- 可以访问别人的个人介绍页面

## v1.0.0

> 第一个发行版本，适配一个音乐播放软件的基本功能，后台依赖网易云

- 登录页面
- 歌单页面
- 评论页面
- 个人信息页面
