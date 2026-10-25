# Changelog

> 根据 commit 自动生成，请勿手动编辑；推送版本 tag 后由 CI 更新。v2.0.3 及更早版本见[历史更新记录](archive/CHANGELOG-legacy.md)。

## v2.2.2 — 2026-10-25

### 新增

- 取出的档案发出琥珀暖光照亮同列 ([982581e8](https://github.com/MT-SUPER-POWER/Scopify/commit/982581e8d78be1fe3cd0e13333f60a1b5df70f91))
- 莱茵背景明暗切换从当前档案向外扩散 ([4d1f8523](https://github.com/MT-SUPER-POWER/Scopify/commit/4d1f85232bb4dff9d4642e0a48a2234f9747b186))
- 切歌时档案带起同列山脊与涟漪 ([2e7265a5](https://github.com/MT-SUPER-POWER/Scopify/commit/2e7265a57df440e0bb117e61223d2f0b02e0717e))
- 莱茵背景换用暖色光照与纸面晕染 ([b82a5680](https://github.com/MT-SUPER-POWER/Scopify/commit/b82a5680ad7f35161dfa08685e85ba09319f9d84))

### 修复

- 取出档案的螺钉与内衬不再跟着玻璃变透明 ([8d5c1e34](https://github.com/MT-SUPER-POWER/Scopify/commit/8d5c1e341f911556865a7e429be53c3a796f4e3f))

### 优化

- 莱茵背景切歌时不再卡顿 ([db55d653](https://github.com/MT-SUPER-POWER/Scopify/commit/db55d65337bdea3d394a416391e3a8370ba52198))

## v2.2.1 — 2026-10-25

### 新增

- 在命令面板内完整调整灵动岛设置 ([19907494](https://github.com/MT-SUPER-POWER/Scopify/commit/199074944549ef1e8afe60b596aecf50ef599f39))
- 新增播放进度刷新率设置 ([45ee62ef](https://github.com/MT-SUPER-POWER/Scopify/commit/45ee62ef9664d40977e227995e74bf152d8ca6c3))

### 修复

- 背景跟随电台封面取色 ([bf5b5e67](https://github.com/MT-SUPER-POWER/Scopify/commit/bf5b5e67f321c78a05f855891b011bd129cee257))
- 再按搜索快捷键可收起歌单搜索 ([2075c953](https://github.com/MT-SUPER-POWER/Scopify/commit/2075c953d7fb8a4106052103808cf861ec5d49ff))
- 返回私人电台时保留原歌单 ([5eaf283d](https://github.com/MT-SUPER-POWER/Scopify/commit/5eaf283dc4e6bd024e978437c7bb1977d1c89cf6))
- 灵动岛间奏保持空白并避免省略号混入歌词 ([dacb73f7](https://github.com/MT-SUPER-POWER/Scopify/commit/dacb73f7fb5546026af9dfe6291849c828387cfd))
- 灵动岛换行动画默认使用平滑效果 ([8456d8b7](https://github.com/MT-SUPER-POWER/Scopify/commit/8456d8b7cf84bb9356a59ec0a1bcf5c5eb77a65f))
- 下拉菜单跟随应用主题显示 ([ab9e6204](https://github.com/MT-SUPER-POWER/Scopify/commit/ab9e620493a19088b05ca6979c1825edf4bc5cc1))
- 支持快捷切换灵动岛与任务栏歌词 ([95e0902b](https://github.com/MT-SUPER-POWER/Scopify/commit/95e0902b07ea5a374c6c1083ddf74641964fb69d))
- 热门歌曲页随歌手封面显示取色背景 ([3b78858b](https://github.com/MT-SUPER-POWER/Scopify/commit/3b78858bf0a90e8e43f5bd20163fdda917b57cbe))
- 显示下载进度并整合更新状态与操作 ([3b760f68](https://github.com/MT-SUPER-POWER/Scopify/commit/3b760f6807508e925b1fb738df4eb02c486c0866))

### 优化

- 减少伴随歌词逐帧重复渲染 ([dd2deb80](https://github.com/MT-SUPER-POWER/Scopify/commit/dd2deb8007915aa95d07bad205004edf34150a68))
- 打开歌单、歌手等页面时内存不再大幅飙升 ([0a7b4a16](https://github.com/MT-SUPER-POWER/Scopify/commit/0a7b4a165f7bfabee1dd91aaf693778c88cbf40d))
- 降低灵动岛与任务栏歌词的逐帧计算开销 ([7f523b7c](https://github.com/MT-SUPER-POWER/Scopify/commit/7f523b7c1708ffd46fff7c6c2567222b2cff074d))
- 播放时快捷键监听不再让界面每帧重绘 ([f5204167](https://github.com/MT-SUPER-POWER/Scopify/commit/f5204167315a69a6ddd9445db241f968b5278826))
- 主窗口隐藏到托盘后停止后台渲染 ([3b4674af](https://github.com/MT-SUPER-POWER/Scopify/commit/3b4674afe0c880f253620f88199953c9aa0da869))

## v2.2.0 — 2026-10-25

### 新增

- 云盘歌曲在网易云没有歌词时，显示上传文件里自带的歌词 ([b06fdcbf](https://github.com/MT-SUPER-POWER/Scopify/commit/b06fdcbff9932527a7f57645dd2325aa4be97916))
- 资料库新增「我的云盘」，可播放、上传、匹配、下载和删除云盘歌曲 ([45ebb97f](https://github.com/MT-SUPER-POWER/Scopify/commit/45ebb97fcc276315d161fc2127c4b39113eab1b3))
- 歌单操作栏右侧的搜索与视图按钮大小统一 ([8fd10df2](https://github.com/MT-SUPER-POWER/Scopify/commit/8fd10df2b4c029fccf6362461b8ffd9962ebb777))
- 窗口标题显示正在播放的歌曲 ([f0cf7ca0](https://github.com/MT-SUPER-POWER/Scopify/commit/f0cf7ca0ac5053acd3a695386e310833f176a377))
- 歌单标题旁新增创建歌单按钮 ([94140839](https://github.com/MT-SUPER-POWER/Scopify/commit/941408390bbd28d11c6fa8837074e5f83915ebc7))
- 未登录打开动态只显示标题和一行淡提示，去掉渐变背景和登录按钮 ([5a266ffd](https://github.com/MT-SUPER-POWER/Scopify/commit/5a266ffd2c57c0e14f52dd6a6dd7a605ec3d28f7))
- 歌单无歌曲或搜索无结果时改为淡图标提示，重新加载按钮不再是醒目绿色 ([f4cd5412](https://github.com/MT-SUPER-POWER/Scopify/commit/f4cd5412c59c05f804857b997925e01cf3d3ae18))
- 未登录打开我的播客只显示一行淡提示，不再弹出登录卡片 ([70c23859](https://github.com/MT-SUPER-POWER/Scopify/commit/70c238591023212c46f03ba53b595f14db1dc823))
- 任务栏图标显示当前歌曲播放进度 ([34149d4b](https://github.com/MT-SUPER-POWER/Scopify/commit/34149d4b150232755a23109b94f932feb52f2617))
- 未登录打开我的收藏只显示一行淡提示，不再弹出登录卡片 ([df6558ea](https://github.com/MT-SUPER-POWER/Scopify/commit/df6558ea4faa1623c8cc5b22da97d4d3b46a24db))
- 未登录打开私人电台只显示一行淡提示，不再弹出登录卡片 ([af513759](https://github.com/MT-SUPER-POWER/Scopify/commit/af513759fe506bf6888f1c9bb75f8e3e47366977))
- 未登录打开最近播放只显示一行淡提示，不再弹出登录卡片 ([acaff410](https://github.com/MT-SUPER-POWER/Scopify/commit/acaff410f9f94e98acaf8f7745ea891d5c9ac7cd))
- 未登录打开喜欢的音乐只显示一行淡提示，不再弹出登录卡片 ([31f6afad](https://github.com/MT-SUPER-POWER/Scopify/commit/31f6afad616590931a04bfdefd03fe2e9509ccbe))
- 喜欢、收藏和播客的空列表改为淡图标提示 ([3a6d60cb](https://github.com/MT-SUPER-POWER/Scopify/commit/3a6d60cbeca9e74e04079d8ab16250abfeb606b0))
- 加载失败提示改为淡图标加轻量重试按钮，不再满屏醒目 ([675d5e23](https://github.com/MT-SUPER-POWER/Scopify/commit/675d5e23a2455978706655f853ba30152b37f49f))

### 修复

- 没有封面的歌曲显示默认云朵图，无专辑的歌曲不再跳到空专辑页 ([c20f4369](https://github.com/MT-SUPER-POWER/Scopify/commit/c20f436968f5505be17c82add3c6e4ebacd86d40))
- 歌单状态卡片按钮恢复正常高度与悬停放大 ([4fb23c32](https://github.com/MT-SUPER-POWER/Scopify/commit/4fb23c328386478ec106cc73781880e35856d0b1))
- 歌单状态卡片按钮悬停时不再缩成一点 ([25a1c920](https://github.com/MT-SUPER-POWER/Scopify/commit/25a1c9207b2103f2780a4743667c283892b3cd9e))
- 未登录时右上角头像不再是醒目的绿色圆标 ([83e076ff](https://github.com/MT-SUPER-POWER/Scopify/commit/83e076ffd7b0a22ee6ddf7bb2fe5e6dab2e1431c))
- 侧边栏加载骨架与实际布局对齐，加载完成不再跳动 ([45a9d464](https://github.com/MT-SUPER-POWER/Scopify/commit/45a9d464f02e576bbdd627c37ae84c86236162e3))
- 未登录时侧边栏不再显示登录提示卡片 ([3ca36fe3](https://github.com/MT-SUPER-POWER/Scopify/commit/3ca36fe36ef1f64501b366c9864efac22b6b47e2))
- 未登录时我的收藏和我的播客不再渲染顶部渐变背景 ([d53a126f](https://github.com/MT-SUPER-POWER/Scopify/commit/d53a126f16721688fb70b4bd725342b8d16bb73e))
- 专辑加载失败时不再显示半透明骨架，只留居中的重试提示 ([96f3da40](https://github.com/MT-SUPER-POWER/Scopify/commit/96f3da40cac13c508e340dcda733e443b3cd8137))
- 歌单加载骨架与实际歌曲列表对齐，加载完成不再跳动 ([730ab68c](https://github.com/MT-SUPER-POWER/Scopify/commit/730ab68c0fcbc6d198d55524a8ca7b04eccc6157))
- 打开设置时定位到对应设置区域 ([6f93aba9](https://github.com/MT-SUPER-POWER/Scopify/commit/6f93aba997bc26630d8171d2ce31fe5c85343595))

## v2.1.1 — 2026-10-24

### 修复

- macOS 更新改为引导下载并手动安装 ([1cf30d06](https://github.com/MT-SUPER-POWER/Scopify/commit/1cf30d0621d70b6e21a866b0fada11d7701ffdad))
- 更新设置中持续显示当前客户端版本 ([d4b539cf](https://github.com/MT-SUPER-POWER/Scopify/commit/d4b539cfedb0ae1a3974b20f035d0e38d1b2a793))

## v2.1.0 — 2026-10-24

### 新增

- macOS 菜单栏歌词与播放控制可分别开关 ([2216d003](https://github.com/MT-SUPER-POWER/Scopify/commit/2216d00396485def46f4c68554227241e2bb840e))
- macOS 菜单栏显示实时歌词，播放按钮更紧凑醒目 ([bb8b8af7](https://github.com/MT-SUPER-POWER/Scopify/commit/bb8b8af7e0f232539e8060c2e2ff89d2db92668d))
- 桌面歌词操作栏添加单色品牌标识 ([d670547e](https://github.com/MT-SUPER-POWER/Scopify/commit/d670547e41691c06f4eebc3821184c975f6701d2))
- macOS 菜单栏新增歌名与播放控制，点 Dock 不再退出桌面壁纸 ([7ca2301e](https://github.com/MT-SUPER-POWER/Scopify/commit/7ca2301eda150deadd9c1e6763694b33b818acdc))
- 新增 macOS 菜单栏图标与 Dock 右键菜单 ([70cc78e2](https://github.com/MT-SUPER-POWER/Scopify/commit/70cc78e2c13d6a160158cfb007baaafe3822c2dc))
- 使用统一 Rust 模块支持双端桌面壁纸 ([a2d36427](https://github.com/MT-SUPER-POWER/Scopify/commit/a2d36427ae0cf762ef28b91086a0efd3999a2a01))

### 修复

- 修复桌面端 renderer 模块被 gitignore 导致 CI 缺失的问题 ([6346e949](https://github.com/MT-SUPER-POWER/Scopify/commit/6346e94912f4a4c5029ffbb81cecc321939c1d8b))
- 调整 macOS 菜单栏播放按钮的间距与粗细 ([3568e286](https://github.com/MT-SUPER-POWER/Scopify/commit/3568e28615546273b73bc886d51cdba55a684de4))
- 修复 macOS 壁纸类型与托盘防抖 ([d5bb9573](https://github.com/MT-SUPER-POWER/Scopify/commit/d5bb9573dc861a5c341e7888efc7ea57fa9b0ae0))
- 修复隐藏 Dock 时桌面壁纸意外退出 ([0e48e192](https://github.com/MT-SUPER-POWER/Scopify/commit/0e48e1925ea48b7352bce28385c6ab78898cfe7e))
- 修复更新说明文字穿透底部按钮栏 ([b1fcc70e](https://github.com/MT-SUPER-POWER/Scopify/commit/b1fcc70e4f66530b38a2638351c6e7497790837d))
- 修复 macOS 安装包缺少完整临时签名 ([a3cfcdcc](https://github.com/MT-SUPER-POWER/Scopify/commit/a3cfcdccd430badb9ed8b70bbc8024227104472a))

## v2.0.4 — 2026-10-24

### 新增

- 补充更新说明自动生成与发版前预览指南 ([233a3f60](https://github.com/MT-SUPER-POWER/Scopify/commit/233a3f605adecf3b5c53d6ff597a1bdce16ac9ba))
- 点击大标题查看完整更新记录 ([c21ab624](https://github.com/MT-SUPER-POWER/Scopify/commit/c21ab6241dabead927aa968b447eab4d82c87aac))
- 新增「花火」烟花歌词样式 ([a09a41e7](https://github.com/MT-SUPER-POWER/Scopify/commit/a09a41e74eeb68405073eb0c5795a3c218798257))
- 均衡器界面焕新，效果分组并支持一键复位 ([712f28ba](https://github.com/MT-SUPER-POWER/Scopify/commit/712f28ba5d8ba983d09849bc0f9da968a55dee08))
- 均衡器改为可拖动的频响曲线，调节时曲线实时跟随 ([6845e547](https://github.com/MT-SUPER-POWER/Scopify/commit/6845e547a6587b4df69e6bbcb3676a446b6f96ed))
- 支持快速调节莱茵配色与律动 ([442a6b08](https://github.com/MT-SUPER-POWER/Scopify/commit/442a6b08af1d98f24c7ef624cd3dc9ac72d3fa4c))
- 完善播放面板与歌词背景快捷调节 ([9ef005fa](https://github.com/MT-SUPER-POWER/Scopify/commit/9ef005fabd336a89af7f61e0e7d1699663b02f6a))
- 统一歌词样式与主题库设置界面 ([ba419e82](https://github.com/MT-SUPER-POWER/Scopify/commit/ba419e82259e92f9dbfcc68b3513061945717f38))
- 统一 Folia 窗口与面板调节样式 ([3aa05f05](https://github.com/MT-SUPER-POWER/Scopify/commit/3aa05f054d7f8a0c95c7b4d5c622033fc8123110))
- 播放页面板换成 Folia 新版设计，歌词样式可横向切换并自选随机池 ([db270dc9](https://github.com/MT-SUPER-POWER/Scopify/commit/db270dc9fd946b6a6e7b06a9ec20c9b242c0bcfb))
- 歌词可以导出为 LRC 或逐字 YRC 文件 ([a7c9a107](https://github.com/MT-SUPER-POWER/Scopify/commit/a7c9a10751afea33b6bfe19a7fb549f9bcad78c5))
- What's New 改用更好读的文档排版，按新增、修复、优化列出每个版本的变化 ([cbe5fa1b](https://github.com/MT-SUPER-POWER/Scopify/commit/cbe5fa1b2e23d08924680c708440ed3dbd528cb5))

### 修复

- 修复 Sora 星空背景无法显示 ([ed5847c1](https://github.com/MT-SUPER-POWER/Scopify/commit/ed5847c14022d3115483a10821c558772c225001))
- make sure the icon for web tab ([f7b8638f](https://github.com/MT-SUPER-POWER/Scopify/commit/f7b8638fc504839e5191be6817b0ba2ad2889a07))
- 修复可视化设置面板中歌词预览的水合错误 ([f4bd8756](https://github.com/MT-SUPER-POWER/Scopify/commit/f4bd8756ec981e3243c675e49f3311fa75e75911))
- 外部链接改用系统默认浏览器打开，不再弹出应用内窗口 ([6e404cf2](https://github.com/MT-SUPER-POWER/Scopify/commit/6e404cf2b5fbc78b87af7550ca5615d4b6c942a7))
