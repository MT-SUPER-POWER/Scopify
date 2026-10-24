# Changelog

> 根据 commit 自动生成，请勿手动编辑；推送版本 tag 后由 CI 更新。v2.0.3 及更早版本见[历史更新记录](archive/CHANGELOG-legacy.md)。

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
