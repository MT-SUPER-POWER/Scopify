# Changelog

## v1.4.2

### Visual

- 优化歌手详情页布局：歌手“简介”卡片与热门歌曲区域同级并支持 Sticky 悬浮跟随（浏览热门歌曲列表时在右侧保持固定），“音乐作品”保持独立全宽下沉显示，并支持点击简介卡片查看全量歌手介绍弹窗。
- 移动桌面端设置中的 Discord “连接测试” 控制项至 Discord 设置分组卡片内。
- 移除设置页面上的强行满屏最小高度与双层背景卡片约束，使布局自然根据配置表单内容自适应贴合。
- 优化 Discord 与后端连接测试行布局：将连接状态指示标签（如 Discord“已接通”、后端“可用 · 16 ms · v4.39.0”）调整至“连接测试”标题旁紧凑排列，右侧仅保留测试操作按钮。

### Added

- 统一搜索窗口支持以 `>` 前缀搜索并执行命令；`Ctrl + Shift + P` 会直接打开命令查询。
- 命令候选按设备本地累计使用次数排序，并继续支持上下方向键和 Enter 操作。
- 桌面端新增应用级隐藏 Playback Host：独立承载媒体元素、AudioContext、播放 Authority、队列、网易云音源/歌词解析及自动续播，主窗口隐藏、刷新或销毁不再中断播放运行时。
- 新增版本化 Audio Feature 与 Playback Host Control MessagePort 协议，并加入 Host 会话 Checkpoint；Host 崩溃后可在有界重试中恢复完整队列、播放意图、音量和粗粒度进度，同时重新解析媒体地址。

### Fixed

- 修复桌面音乐控制器错误继承 Folia 主题色的问题；控制器现在仅跟随全局 NextTheme 的明暗主题，Folia 主题切换只影响歌词渲染。
- 移除桌面控制器 Folia 外观面板中的冗余说明、图标与标题，保留全部提示与确认功能。
- 修复 Electron 多 preload 入口被提取为共享 chunk、导致 sandbox 窗口无法加载桥接的问题；普通窗口与 Playback Host preload 现独立构建为自包含单文件，并由生产门禁拒绝不受支持的 `require`，恢复桌面设置、Tray 与关闭退出流程。
- 修复开发模式 React Strict Effects 重放时过早销毁 Playback Host Runtime、导致 Host 未接入播放控制与 Authority 通道的问题；点播现在可由独立 Host 正常加载并持续播放。
- 修复 Audio Feature Broker 仅授权壁纸窗口、遗漏桌面播放控制器订阅的问题；壁纸与控制器均以各自受限的 Electron sender 身份连接，沉浸式视觉不再因授权拒绝持续重连。
- 修复桌面主窗口直接点歌、上一首/下一首会被本地草稿或过期会话覆盖的问题；所有队列替换与切换现在都由 Playback Host 收敛，过期 Main 会话不会再抬高版本重写 Host 队列。
- 修复 Playback Host 切歌时嵌套等待 Authority 命令、以及 React 尚未写入 `audio.src` 就判定新音源无效的问题；切歌会等待对应 URL/revision 的媒体元素就绪后播放，不再短暂加载新曲又回滚旧曲。
- 修复 Playback Host 已解析网易云歌词却未同步到 Authority 的问题；桌面沉浸歌词、Folia 与其他 Playback Replica 现在会收到同一份规范化歌词，重复 source 确认也不会重复广播。
- 修复非列表循环的末曲结束后仍保留播放意图的问题；Host 现在会持久化暂停快照，控制通道重连不会重播已结束歌曲；正常列表循环重播时仍会重新同步缓存歌词。
- 修复桌面端列表点击会先发送完整队列、随后被单曲播放命令覆盖的问题；搜索、歌手等旧入口现在会把区域全部歌曲和选中索引一并交给 Playback Host，后续切歌、结束策略与歌词会基于正确队列执行。
- 修复队首执行“上一首”回绕到队尾时未同步历史游标的问题；Playback Host 现在会将队尾作为完整的新历史状态提交，避免随后“下一首”仍按第一首历史循环。
- 修复搜索页点播歌曲时播放栏的点赞/评论总数可能长期空白：统计请求现已按歌曲去重、自动重试并回填缓存；加载中显示轻量指示，最终失败时可直接重试并记录结构化诊断事件。
- Windows 桌面端按下 `Alt` 不再显示原生 Electron 菜单栏。
- 桌面端新增 Discord Rich Presence：在设置中填入 Scopify 的 Discord Application ID 并启用后，可同步当前曲目、封面、播放状态与进度。
- Discord Rich Presence 默认使用 Scopify Application ID `1536959813114658836` 并在新配置中启用。
- Discord 设置新增本机连接测试与实时连接状态：直接尝试 Discord 桌面端 RPC，并以 Toast 明确反馈连接、配置或启动失败原因。

### Fixed

- 修复桌面端打包版首屏加载动画可能一闪而过的问题：启动页现在等待自身渲染完成，并在 Renderer 就绪前保持可见。
- 修复桌面端 renderer 同步与打包脚本错误定位工作区根目录、导致正式构建在复制 renderer 后中断的问题。
- 修复 Discord Rich Presence 将曲目名重复显示为副标题或封面说明的问题；封面说明优先显示专辑名。后端 Ping 的成功与失败结果也统一通过 Toast 提示，不再滞留在设置行内。
- 修复主窗口收纳、隐藏或重建后桌面背景流光间断的问题：音频特征改由 Playback Host 以独立 33 ms 时钟采样，并由壁纸 Renderer 自己按 rAF 平滑、衰减；Publisher、Subscriber 与 Host Control 端口断开后都会独立重连。
- 修复高分辨率与高 DPI 桌面上 Dithering 流光被过度放大、只能看到局部闪烁的问题；Shader 像素尺度现在会补偿实际渲染降采样比例。
- 修复 Playback Host 接管播放后 Windows 缩略图播放状态不再更新的问题；状态上报使用仅允许当前 Host sender 的窄 IPC 能力。

### Quality

- 新增 Discord Rich Presence 技术参考，收录官方 RPC、应用配置及活动字段文档。
- 新增独立 Playback Host 与桌面壁纸运行时架构文档：结合 Lively 的 Core/播放器隔离思路，明确 Authority、队列、音频特征 latest-wins 通道、Wallpaper 生命周期、Shader 尺度及分阶段迁移方案。
- 将桌面主窗口降为 Playback Replica 与会话命令客户端：队列游标、重复/随机、清缓存、URL/歌词加载、媒体错误恢复和音频特征发布均只有 Host 一个执行者；浏览器模式继续复用同一 Runtime seam。
- 为 Playback Host、控制 Broker、Checkpoint、独立采样、壁纸流排序、打包入口和 Renderer 制品补齐自动化门禁；专用 preload 采用最小权限桥接并由构建脚本强制校验。
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
