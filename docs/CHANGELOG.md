# Changelog

> 根据 commit 自动生成，请勿手动编辑；推送版本 tag 后由 CI 更新。v2.0.3 及更早版本见[历史更新记录](archive/CHANGELOG-legacy.md)。

## v3.3.0 — 2026-10-31

### 新增

- 从播放栏直接观看当前歌曲的 MV ([0773a28a](https://github.com/MT-SUPER-POWER/Scopify/commit/0773a28ae096fd7c202c21af6599babd6161ce6f))
- 支持轻量中心歌词并优化歌词层级跳转 ([b9b55ebb](https://github.com/MT-SUPER-POWER/Scopify/commit/b9b55ebbdd2ba60f661c869b6966c8f9afb20d59))

### 修复

- 修复右键与下拉二级菜单显示系统原生滚动条 ([c270a6b8](https://github.com/MT-SUPER-POWER/Scopify/commit/c270a6b8dfff41e9b4bf28b2b5260bae2465acea))

## v3.2.0 — 2026-10-30

### 新增

- 新增「町景」「雾笺」两个歌词样式 ([259736b1](https://github.com/MT-SUPER-POWER/Scopify/commit/259736b1091bc7404b78b17219c8553b252cf98e))
- 桌面音乐壁纸开关旁显示快捷键 ([d00e0f7c](https://github.com/MT-SUPER-POWER/Scopify/commit/d00e0f7cfb38b85ff9d21b50a51724655eabccd4))

### 修复

- 首次打开或更新后桌面音乐壁纸不再因加载慢而启动失败 ([4833a12b](https://github.com/MT-SUPER-POWER/Scopify/commit/4833a12b194b63de56631648f22b6e7a348cef3a))

## v3.1.4 — 2026-10-30

### 新增

- 空背景新增暗角，范围可在 Folia 设置中调节 ([11cbb167](https://github.com/MT-SUPER-POWER/Scopify/commit/11cbb1675ea2ffb86c8fb187f657f6c5be1337c1))
- 支持背景陈列架切换与补齐心象参数面板 ([1b082536](https://github.com/MT-SUPER-POWER/Scopify/commit/1b082536ab75a442bac776f434089d05668a2b8d))
- 命令工作区支持二级界面切换外观与主题配色 ([495c34ee](https://github.com/MT-SUPER-POWER/Scopify/commit/495c34eed578f24db321962fe8c27a1b546c951e))
- 支持主题亮暗双配色并修复桌面音乐留边 ([f98d2c0e](https://github.com/MT-SUPER-POWER/Scopify/commit/f98d2c0ea33b36f00b8eda6fa28fb2fcddff0482))
- 支持从命令面板重新加载窗口 ([5fecc203](https://github.com/MT-SUPER-POWER/Scopify/commit/5fecc20329476e60f0672d8cc8223286db92ba38))

### 修复

- 修复壁纸驱动中窗口最小尺寸元组类型报错 ([8a91976d](https://github.com/MT-SUPER-POWER/Scopify/commit/8a91976d2fee28113db832831790c80a20294c0e))
- 补齐原生构建与产物同步脚本 ([1b88ba6a](https://github.com/MT-SUPER-POWER/Scopify/commit/1b88ba6a39aaa1142da64136d0232f90fa9500ad))
- 修复 win 端无法进入桌面歌词的问题 ([4f6070b6](https://github.com/MT-SUPER-POWER/Scopify/commit/4f6070b65b8ac7dc135ed523c53a36fd875b054f))
- 补齐亮色界面适配并柔化整体底色 ([fbe885a9](https://github.com/MT-SUPER-POWER/Scopify/commit/fbe885a9c03d5727bc663bf4e20030220e833d8a))
- 歌词面板与「匹配歌词」的歌词来源保持同步 ([d7c72d6c](https://github.com/MT-SUPER-POWER/Scopify/commit/d7c72d6cc9b5940c827559d6cabc94d50c3d0977))
- 匹配歌词搜索或预览失败时显示重试，不再显示「未找到」 ([f517dff4](https://github.com/MT-SUPER-POWER/Scopify/commit/f517dff480100e3a21c7b7e440d1075b8a50551e))
- 云盘匹配搜索失败时显示重试，不再显示「没有找到」 ([2b7cad60](https://github.com/MT-SUPER-POWER/Scopify/commit/2b7cad60abe82ed5ec1d94bd0806a3f1b15e30e5))

## v3.1.3 — 2026-10-29

### 新增

- 评论支持「N 条回复」展开，输入框加入表情 ([6232e326](https://github.com/MT-SUPER-POWER/Scopify/commit/6232e326e08daeac31eee690981a5ddcbe8a179d))
- 评论页改用 MV 页的 YouTube 式评论布局 ([101709b0](https://github.com/MT-SUPER-POWER/Scopify/commit/101709b06ac97c5d795ccd9511b2d0bd9f91ac1f))
- 动态标签改用瀑布流，发布框收成一行 ([563ffd5a](https://github.com/MT-SUPER-POWER/Scopify/commit/563ffd5a919d09bdf28236d31534d71ee5dbee33))
- 头部资料改为一行小字，加载时不再带光 ([35a4eb2f](https://github.com/MT-SUPER-POWER/Scopify/commit/35a4eb2f84803e3635b83cf31cebb75a2c8fd332))
- 重做分享音乐的选择弹窗 ([d4d0f0cb](https://github.com/MT-SUPER-POWER/Scopify/commit/d4d0f0cb6bf4d6451e97bd173f59894fcf28cf45))
- 每日推荐支持自选音乐风格 ([680a608b](https://github.com/MT-SUPER-POWER/Scopify/commit/680a608b147113bade00ce88f689ec9ba1d2109d))
- 重新设计个人主页，新增数据带与概览标签 ([db7052e6](https://github.com/MT-SUPER-POWER/Scopify/commit/db7052e6939fca9149a17e1f815c13b83b435261))
- 个人主页新增听歌排行 ([8185ef38](https://github.com/MT-SUPER-POWER/Scopify/commit/8185ef38e3b36a819f6fdd240e1c68a18f1c4fd5))
- 背景默认随时间切换 ([81b498fb](https://github.com/MT-SUPER-POWER/Scopify/commit/81b498fbf7f559e18b47411f09ab446679856ca7))
- 桌面小歌词与桌面音乐合并为同一个浮层 ([cc4db3c7](https://github.com/MT-SUPER-POWER/Scopify/commit/cc4db3c7c9cce54439787854051d1f91a1a695ae))
- 支持调试时刷新窗口 ([032ca48e](https://github.com/MT-SUPER-POWER/Scopify/commit/032ca48eecc296e0945f79c9c9c0a55b2107ad75))
- 支持从命令面板退出应用 ([2d014692](https://github.com/MT-SUPER-POWER/Scopify/commit/2d0146924f2061746eaa6450817028de5dd22262))
- 支持调整视频播放设置 ([bcb90b98](https://github.com/MT-SUPER-POWER/Scopify/commit/bcb90b98a40db995190d48de9cd1f103623c81a3))
- 优化剧场模式观看体验 ([36a7b567](https://github.com/MT-SUPER-POWER/Scopify/commit/36a7b567ae1c17ef4f95eb428cc3dd7befed1ce2))

### 修复

- 修复骨架屏硬编码样式与评论回复状态的类型错误 ([d3af7995](https://github.com/MT-SUPER-POWER/Scopify/commit/d3af79952c24902570dca9044bcce34c9a55ff2b))
- 别人没公开的听歌排行不再占位显示 ([1c27bed7](https://github.com/MT-SUPER-POWER/Scopify/commit/1c27bed7204798be9b4282b5f81c5b588788bd51))
- 评论页加载时显示骨架屏 ([a849369b](https://github.com/MT-SUPER-POWER/Scopify/commit/a849369b25e72d0093e33d6ad230694f80594adb))
- 动态评论加载时显示与评论行一致的骨架屏 ([e8cf89f6](https://github.com/MT-SUPER-POWER/Scopify/commit/e8cf89f62ec0325d9e339563c2e76d797493dbf9))
- 分享音乐的搜索结果恢复封面 ([013f8936](https://github.com/MT-SUPER-POWER/Scopify/commit/013f893635009f577324521a8f669929d602571a))
- 显示动态发布失败的具体原因 ([d1367fbd](https://github.com/MT-SUPER-POWER/Scopify/commit/d1367fbd96065eae76880f5800098b15e5017459))
- 个人主页加载时显示与页面一致的骨架屏 ([e411e356](https://github.com/MT-SUPER-POWER/Scopify/commit/e411e356d1b85b50891b24da348418bedadea991))
- 列表读完后不再显示“已经到底了” ([76bf50a9](https://github.com/MT-SUPER-POWER/Scopify/commit/76bf50a9613b1d961168990522420af2b36b8fc0))
- 恢复正在播放的动画提示 ([43678abf](https://github.com/MT-SUPER-POWER/Scopify/commit/43678abf1218b8ea67bd300e2d44cd993d5894a1))
- 改善右侧面板加载体验 ([780d2bb3](https://github.com/MT-SUPER-POWER/Scopify/commit/780d2bb375024fff954d2afaaf2719bea0dd0406))
- 保留已加载的歌单内容 ([a7d35d17](https://github.com/MT-SUPER-POWER/Scopify/commit/a7d35d175a7a7a53cd507bc2f30cff43a23c38e8))
- 避免取消请求时误报网络错误 ([88654d8e](https://github.com/MT-SUPER-POWER/Scopify/commit/88654d8e15acf0bd98b17f8d547c0b5a50f6c112))
- 播放栏左右边距对称，中间控制区位置更舒适 ([3d16cc51](https://github.com/MT-SUPER-POWER/Scopify/commit/3d16cc515533b171b1636a9edf4b1eec27da5cec))
- 桌面音乐控制器快捷键改为 Ctrl+Alt+W，不再与桌面小歌词冲突 ([22e50d72](https://github.com/MT-SUPER-POWER/Scopify/commit/22e50d721dfb5943e39e208dcae9f43a49fed6ff))
- 修复首页加载占位布局 ([dbf1e7e8](https://github.com/MT-SUPER-POWER/Scopify/commit/dbf1e7e81ad85b12b0985fd4743e2b985d597a06))
- 修复播放页布局和加载占位 ([d9afbd9c](https://github.com/MT-SUPER-POWER/Scopify/commit/d9afbd9c3777ac141e76edf0a45e5a952f30389d))

## v3.1.0 — 2026-10-28

### 新增

- 菜单栏长歌词支持自动滚动 ([351c5ec7](https://github.com/MT-SUPER-POWER/Scopify/commit/351c5ec7f11410b419ea6f9b2215f58c3dd68911))
- 支持舞台控制面板快捷键与分层退出 ([b46df6dd](https://github.com/MT-SUPER-POWER/Scopify/commit/b46df6dd624e1d5585ce424855d08795cc3ad782))

### 修复

- 修正 Windows 快捷键显示 ([eab55859](https://github.com/MT-SUPER-POWER/Scopify/commit/eab55859c030b52f035d0871ab75d8747c8a45b4))
- 精简落地页章节与尾部展示 ([67ede9d0](https://github.com/MT-SUPER-POWER/Scopify/commit/67ede9d0068839452e8ae1398744e8e028cb28aa))
- 跨平台统一按键符号并区分控制键 ([78c95111](https://github.com/MT-SUPER-POWER/Scopify/commit/78c95111b9978f4e08c011d6d610510b9494ea35))
- 使用平台按键符号显示快捷键 ([deed66c6](https://github.com/MT-SUPER-POWER/Scopify/commit/deed66c63c260da5ea61531c8d0a40d42f2f8f18))
- macOS 快捷键正确显示 Option 键 ([27e72445](https://github.com/MT-SUPER-POWER/Scopify/commit/27e7244512d3571602b10680537ed6e92f59b64a))
- 修复播放与暂停图标不随状态切换 ([c76adbe9](https://github.com/MT-SUPER-POWER/Scopify/commit/c76adbe9fdc3d68af6841ec7a9d7f5253015e3bc))
- 修复菜单栏播放按钮无法独立交互 ([9c15bd6b](https://github.com/MT-SUPER-POWER/Scopify/commit/9c15bd6be4fe19991f574d077a7a57944615cb14))

### 优化

- 让菜单栏长歌词滚动更流畅 ([9496ba29](https://github.com/MT-SUPER-POWER/Scopify/commit/9496ba2942d95f0c2e64c88136a5fabd84fa95a0))

## v3.0.1 — 2026-10-27

### 新增

- 乐谱搜索直接展示谱面并支持滚动自动加载 ([b33db0b0](https://github.com/MT-SUPER-POWER/Scopify/commit/b33db0b0e49bac5500bb9f87a0a267e74fa4b919))
- 支持音乐百科与乐谱搜索和预览 ([18b155f9](https://github.com/MT-SUPER-POWER/Scopify/commit/18b155f904e61b18e20e80169a322c56f9b33e2d))
- 优化歌词搜索卡片并支持完整歌词弹窗与导出 ([8e50951b](https://github.com/MT-SUPER-POWER/Scopify/commit/8e50951b73a2ba917aac6a77fa6f8ff21c922782))
- 前端搜索接入歌词搜索能力 ([061c39d5](https://github.com/MT-SUPER-POWER/Scopify/commit/061c39d51386874d6946426fab0d15ccf0487d11))

### 修复

- 修复乐谱结果卡片的主题色彩兼容 ([1b97e635](https://github.com/MT-SUPER-POWER/Scopify/commit/1b97e6352a36c6b0a586699c8c9734b849eea7ab))
- 没有乐谱的歌曲不再提示加载失败 ([bd0b0ce6](https://github.com/MT-SUPER-POWER/Scopify/commit/bd0b0ce6e3662b67ba06e0ec674bf9defedb54bc))
- 补齐命令搜索分类并对齐搜索页约束 ([31b088f3](https://github.com/MT-SUPER-POWER/Scopify/commit/31b088f373e029aa914ee9e73f9d7d3b08359fe5))
- 使用歌曲搜索结果展示相似视频 ([8b7b016f](https://github.com/MT-SUPER-POWER/Scopify/commit/8b7b016fc1a9d2be89f82be112e47f673dba5d5b))

## v3.0.0 — 2026-10-26

### 新增

- 点开动态改为小红书式浮层 ([f5f94696](https://github.com/MT-SUPER-POWER/Scopify/commit/f5f94696721d98ed3ae7673a9cbf0d12cd21af3e))
- 动态页改为瀑布流卡片，去掉热门话题 ([e203a769](https://github.com/MT-SUPER-POWER/Scopify/commit/e203a76995a0e85975ee5b25f7b849f61ae63864))
- 动态标题中的 #话题# 也会高亮 ([2d09977d](https://github.com/MT-SUPER-POWER/Scopify/commit/2d09977dba3081988ef4a1ca4f9438e449befc1a))
- 乐迷团筛选改为胶囊样式，名字不再被截断 ([281342eb](https://github.com/MT-SUPER-POWER/Scopify/commit/281342eb17497c36ef30392ed35a146a5ef50801))
- 动态页头部合并为一行，去掉多余的说明文字 ([2ea690e8](https://github.com/MT-SUPER-POWER/Scopify/commit/2ea690e83bba1b968e3c829c510cf54fb5fd214a))
- 动态页改为单列居中，热门话题移到页签 ([ba21a834](https://github.com/MT-SUPER-POWER/Scopify/commit/ba21a8340fc6e019aa3053d4a54eddb80f204132))
- 乐迷团聚合动态显示每条内容来自哪个乐迷团 ([74210e3a](https://github.com/MT-SUPER-POWER/Scopify/commit/74210e3a0a680e82a0bfff565625309248c18e95))
- 动态改为卡片样式，单张图片不再撑满版面 ([94df46d6](https://github.com/MT-SUPER-POWER/Scopify/commit/94df46d67f3c86f21136b62e78c4b70af4044a78))
- 优化 MV 卡片排布、悬停预览与骨架屏体验 ([d1184295](https://github.com/MT-SUPER-POWER/Scopify/commit/d1184295ff1c507beb904e8d9b277db4af374d89))
- 支持剧场模式和 T 键切换 ([b9d434af](https://github.com/MT-SUPER-POWER/Scopify/commit/b9d434afbc8e768dff35163415810c430b941d51))
- 播放器显示清晰度并支持保留进度切换 ([b32a46b0](https://github.com/MT-SUPER-POWER/Scopify/commit/b32a46b08b337cb268954fd77df1772aa70643a3))
- MV 页改为完整 YouTube 观看布局，评论区按 YouTube 复刻 ([9523f71e](https://github.com/MT-SUPER-POWER/Scopify/commit/9523f71ea99587bc8cb1589ce3a08f010d664ee3))
- MV 播放器改为 YouTube 式自定义控件，新增网页全屏 ([e6706c8f](https://github.com/MT-SUPER-POWER/Scopify/commit/e6706c8f89045619e0944e6a41aa64e8b1385232))
- 歌单与专辑新增 MV 预览，像刷视频一样逐首试听 ([c748867f](https://github.com/MT-SUPER-POWER/Scopify/commit/c748867f0fc7153eed0234636623c206bd990e6c))
- MV 卡片按 YouTube 视频卡复刻，悬停自动静音预览 ([74783099](https://github.com/MT-SUPER-POWER/Scopify/commit/747830997adc5fb849b7cc1e2c6be422687cb89f))
- MV 搜索结果改为 YouTube 式卡片 ([91e84a37](https://github.com/MT-SUPER-POWER/Scopify/commit/91e84a37cbe3dd83d5c7ce7db581239d909e45e4))
- MV 页改为 YouTube 式观看布局，并接入完整评论区 ([5497c5f2](https://github.com/MT-SUPER-POWER/Scopify/commit/5497c5f2041782fbb8b805ed425fc9e3d5ad740f))
- 评论页支持 MV，可查看、点赞、回复和发表 MV 评论 ([4ab0c312](https://github.com/MT-SUPER-POWER/Scopify/commit/4ab0c3125a4b915329f0876965f327e04162027d))
- 搜索结果接入 MV，新增「MV」分类与综合结果中的 MV 区块 ([47b421b5](https://github.com/MT-SUPER-POWER/Scopify/commit/47b421b526ceb89604ddf5a11aa06675342c813d))
- 新增 MV 播放页，可切换画质并浏览相似 MV 与精彩评论 ([75a33c12](https://github.com/MT-SUPER-POWER/Scopify/commit/75a33c1274da97bd4b6908e0e8ce91a509b7577c))
- 正在播放面板支持观看 MV，并新增「MV」卡片 ([6c0b9117](https://github.com/MT-SUPER-POWER/Scopify/commit/6c0b9117a6c2c7a88ed813c918191116a4450d82))
- 支持按 Home 键返回首页 ([cc014998](https://github.com/MT-SUPER-POWER/Scopify/commit/cc014998febcc14ece2958451080e6309853130a))
- 正在播放面板新增「相似歌曲」卡片 ([8e464bab](https://github.com/MT-SUPER-POWER/Scopify/commit/8e464bab0ffcbdaad61fb01a522a8617e90d8b1b))
- 正在播放面板新增「精彩评论」卡片 ([60972107](https://github.com/MT-SUPER-POWER/Scopify/commit/60972107306894dc5da9e5ed8b40acabb13bdc1a))
- 「关于艺人」改为大图标题样式，并新增可逐个关注的「演职人员」卡片 ([40fef86b](https://github.com/MT-SUPER-POWER/Scopify/commit/40fef86b8bcb6bf256f0702d20d2ec7aae3ea26b))
- 正在播放面板顶部改为通栏沉浸式封面，有动态封面时播放视频 ([56fea26e](https://github.com/MT-SUPER-POWER/Scopify/commit/56fea26ebdcabc493282448de9de6df610a668ac))
- 右侧面板新增「歌词」视图与歌词预览卡片，可点击任意一句跳转 ([4a7c7991](https://github.com/MT-SUPER-POWER/Scopify/commit/4a7c7991b467d912cae92bfdde8e21653bc9dc24))
- 右侧面板新增「队列」视图，宽窗口下播放队列直接停靠在面板里 ([d1881f87](https://github.com/MT-SUPER-POWER/Scopify/commit/d1881f877b838269b628bb436c7785f565057ecc))
- 前进/后退仅在桌面端显示，无法跳转时置灰，并支持 Alt+Shift+H/L ([74d43975](https://github.com/MT-SUPER-POWER/Scopify/commit/74d43975a3252fb6706924b0e43692d68fec150e))
- 去掉系统标题栏，窗口按钮并入顶栏 ([b5074abc](https://github.com/MT-SUPER-POWER/Scopify/commit/b5074abc552d6bb72c2ec183483ed7ed165b96f2))
- 正在播放面板开关时与左侧边栏一样平滑滑动 ([b9f7c438](https://github.com/MT-SUPER-POWER/Scopify/commit/b9f7c438fb3a772a2509791e43f3ff41187b82eb))
- 正在播放面板显示下一首与歌曲信息 ([56b7f73c](https://github.com/MT-SUPER-POWER/Scopify/commit/56b7f73c59bee1d0192a0be095f3e72efbef5f6b))
- 关闭正在播放面板后保留窄条，按 Ctrl+Alt+B 快速开关 ([61a49afb](https://github.com/MT-SUPER-POWER/Scopify/commit/61a49afbb942c0420c79f65908e52d403130b85f))
- 正在播放面板显示「关于艺人」卡片 ([31d81f55](https://github.com/MT-SUPER-POWER/Scopify/commit/31d81f55582b89ad2a19c31e9ec7991b5028c4fa))
- 新增右侧「正在播放」面板，显示大封面与歌曲信息 ([7772a5fe](https://github.com/MT-SUPER-POWER/Scopify/commit/7772a5fe7b8e75f8df4af0dba15d2746cbb35db6))
- 顶栏横跨整个窗口，首页按钮与搜索框居中 ([197e191c](https://github.com/MT-SUPER-POWER/Scopify/commit/197e191c6381230472811db9e1ee792413aa21f3))
- 客户端更新状态改为与其他设置项一致的样式 ([7929e96d](https://github.com/MT-SUPER-POWER/Scopify/commit/7929e96de7375f881ae73946a933669156e02090))

### 修复

- 修复托盘音量条布局并增加托盘窗口默认高度 ([26818380](https://github.com/MT-SUPER-POWER/Scopify/commit/26818380407de0543d034e11f78049b2d8f49b1c))
- 统一侧边栏歌单间距并优化歌单页头高度 ([9f0da924](https://github.com/MT-SUPER-POWER/Scopify/commit/9f0da924ffe7e3c59c080ac258274b850018ee31))
- 修复歌单内容区过渡渐变截断导致的底色断层 ([74c8db5d](https://github.com/MT-SUPER-POWER/Scopify/commit/74c8db5d89ec8df44fcdf4d63caaa4c063ff3ef5))
- 移除页头重复预留的顶部空白 ([f7cdc84e](https://github.com/MT-SUPER-POWER/Scopify/commit/f7cdc84ebbc0c8f3695dd6e9092f41d89ba5a930))
- 动态页去掉渐变背景，卡片改为不透明底色 ([44f495f4](https://github.com/MT-SUPER-POWER/Scopify/commit/44f495f4f83a7b2d2f77e5d0b27321a523e9e3a3))
- 修复错误边界策略导致的查询类型推断失败 ([9a4f1d6e](https://github.com/MT-SUPER-POWER/Scopify/commit/9a4f1d6ed2b5e98e5ab2df16c7fe7169f7178b46))
- 按栏目区分加载失败并保留可用内容 ([01c874bb](https://github.com/MT-SUPER-POWER/Scopify/commit/01c874bb24682e2b36c3d5fe438d9aacbce992b6))
- 拖动进度条松手后不再短暂回弹 ([9a074043](https://github.com/MT-SUPER-POWER/Scopify/commit/9a074043182756cbcda811a9253bee27898e3901))
- 保留搜索词并恢复默认提示词搜索 ([2dfbc850](https://github.com/MT-SUPER-POWER/Scopify/commit/2dfbc850df2bab04b1966ae33c4a62537e67e8c3))
- 收紧清晰度选择器的留白 ([c1e614a2](https://github.com/MT-SUPER-POWER/Scopify/commit/c1e614a2101dbcb7d39b0faa77d6858c96e6a195))
- 面板顶栏浮在封面上，不再在封面上方空出一条 ([1f6afdee](https://github.com/MT-SUPER-POWER/Scopify/commit/1f6afdee78e3d1ac84fd491323bbf5b3edee799e))
- 移除分类标签下重复的结果标题 ([b870f54e](https://github.com/MT-SUPER-POWER/Scopify/commit/b870f54edbe72160259710128f3359d763dd3105))
- 窗口由窄变宽、右侧面板重新出现时不再导致主布局崩溃 ([b0b0f540](https://github.com/MT-SUPER-POWER/Scopify/commit/b0b0f54061513f64f5098201b8498ff62075ba44))
- 播放栏封面垂直中线与侧边栏对齐 ([fe5daec8](https://github.com/MT-SUPER-POWER/Scopify/commit/fe5daec8d51599b7511968bc8f5ba25acc671866))
- 去除新布局下设置页为旧顶栏预留的顶部留白 ([6133f425](https://github.com/MT-SUPER-POWER/Scopify/commit/6133f425f8ad86b06387f7609dbc36e0f5bc8492))
- 启动骨架按左右栏的折叠状态还原，不再总显示默认布局 ([709b36bf](https://github.com/MT-SUPER-POWER/Scopify/commit/709b36bfe4761ccb8823b83981d42c4ebc49e9ce))
- 桌面端搜索框与首页按钮回到窗口正中 ([e787c929](https://github.com/MT-SUPER-POWER/Scopify/commit/e787c929d4d698ca7516e7288da34e31c7a56a3d))
- 切换页面时窗口标题不再闪烁 ([ea9558af](https://github.com/MT-SUPER-POWER/Scopify/commit/ea9558af7c40874fa90e8c011cf4e0c6cf9df4bf))
- 未登录时侧边栏菜单底部不再多出一条空分隔线 ([9240f677](https://github.com/MT-SUPER-POWER/Scopify/commit/9240f6777cdad4646613b88509099a3bc77a96bd))

### 优化

- 头像改为更大气的深色圆盘样式，顶栏整体比例向 Spotify 看齐 ([65d1275f](https://github.com/MT-SUPER-POWER/Scopify/commit/65d1275f784c0e20fba5836e71ed0c267bbf0cb6))
- 启动加载时预留正在播放面板位置，避免布局跳动 ([59f5ec9a](https://github.com/MT-SUPER-POWER/Scopify/commit/59f5ec9ab196dcf09a538d06ad41f85f09502de3))
- 默认窗口尺寸调整为 1600×900 ([ac222ae8](https://github.com/MT-SUPER-POWER/Scopify/commit/ac222ae84a202a9e342f7143e7e9ac07fc961a65))
- 底部播放栏高度降低，界面更紧凑 ([db22f24f](https://github.com/MT-SUPER-POWER/Scopify/commit/db22f24f6e6d997a53e3831410419c89a4240b33))

## v2.2.3 — 2026-10-25

### 新增

- 节拍跃动模式下，莱茵档案跟着鼓点起伏 ([ddebdd6f](https://github.com/MT-SUPER-POWER/Scopify/commit/ddebdd6f24e17afe96de8307dad260873fcbdb35))
- 莱茵律动方式新增「节拍跃动」选项 ([ec38dd46](https://github.com/MT-SUPER-POWER/Scopify/commit/ec38dd46979283f4ffcccd415ad2a67c4a0ce0fb))
- 新增莱茵背景的鼓点检测 ([1b54adba](https://github.com/MT-SUPER-POWER/Scopify/commit/1b54adbae71461498c1ef814ccb47341b8310083))
- 通知铃铛显示更新下载的环形进度 ([184a82fc](https://github.com/MT-SUPER-POWER/Scopify/commit/184a82fc0584f731401ab1778555508a8a8167b6))
- 更新下载完成后退出应用即自动安装 ([a6ed235c](https://github.com/MT-SUPER-POWER/Scopify/commit/a6ed235c7e15ff9206d911bf362ac0ec1b3f6aba))

### 修复

- 莱茵原有三种律动重新跟随音乐强弱起伏 ([c1dca55a](https://github.com/MT-SUPER-POWER/Scopify/commit/c1dca55ab40aec4be641d1a7cced0638494a09da))
- 更新版本后不再丢失关闭行为等桌面设置 ([1e36cce8](https://github.com/MT-SUPER-POWER/Scopify/commit/1e36cce8b8d5bef6e27b72535538defbcf3aca63))
- 鼓点检测不再漏掉重拍之间的轻拍 ([e26d67a2](https://github.com/MT-SUPER-POWER/Scopify/commit/e26d67a246e4459a30d52de84f432c9a83ae9dfc))

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
