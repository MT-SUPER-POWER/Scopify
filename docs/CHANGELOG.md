# Changelog

<!-- changelog-format: 1 -->

> 这里记录用户能感知的变化，也是应用 What's New 与 GitHub Release 的唯一内容来源。原始工程记录见 [开发日志归档](archive/CHANGELOG.developer.md)，历史提交对应关系见 [来源核对表](updates/PROVENANCE.md)。

## v2.0.3

### Added

- **更新后，一眼知道有什么变化**：更新后会出现简短的新鲜事说明，介绍新增功能和修复。你也可以随时从侧栏菜单或命令面板打开，按版本和页码查看历史更新。 ([feat · 6e404cf2](https://github.com/MT-SUPER-POWER/Scopify/commit/6e404cf2b5fbc78b87af7550ca5615d4b6c942a7))
  <!-- update:legacy-2-0-3-1 -->
  <!-- translation:zh-TW {"title":"更新後，一眼知道有什麼變化","description":"更新後會出現簡短的新鮮事說明，介紹新增功能和修復。你也可以隨時從側欄選單或命令面板開啟，按版本和頁碼查看歷史更新。"} -->
  <!-- translation:en-US {"title":"See what changed after an update","description":"A short What's New window introduces features and fixes after an update. Reopen it from the sidebar menu or command palette and browse previous releases by version and page."} -->

### Visual

- **更新说明可以展开查看详情**：点击一条更新可展开或收起说明，绿色分类标题也能折叠。更新分类与版本记录保持一致，每条后面的提交链接始终可见。 ([feat · 6e404cf2](https://github.com/MT-SUPER-POWER/Scopify/commit/6e404cf2b5fbc78b87af7550ca5615d4b6c942a7))
  <!-- update:legacy-2-0-3-3 -->
  <!-- translation:zh-TW {"title":"更新說明可以展開查看詳情","description":"點擊一條更新可展開或收起說明，綠色分類標題也能摺疊。更新分類與版本記錄保持一致，每條後面的提交連結始終可見。"} -->
  <!-- translation:en-US {"title":"Expand updates to read the details","description":"Expand individual updates or collapse an entire category. Categories follow the version's changelog, with commit links visible beside each update."} -->

- **What's New 按类别展示更新**：更新说明按 Added、Fixed、Visual 和 Quality 分类，以简短列表展示变化，每条末尾直接附上对应提交链接。 ([feat · 6e404cf2](https://github.com/MT-SUPER-POWER/Scopify/commit/6e404cf2b5fbc78b87af7550ca5615d4b6c942a7))
  <!-- update:legacy-2-0-3-4 -->
  <!-- translation:zh-TW {"title":"What's New 按類別顯示更新","description":"更新說明按 Added、Fixed、Visual 和 Quality 分類，以簡短清單顯示變化，每條末尾直接附上對應提交連結。"} -->
  <!-- translation:en-US {"title":"What's New groups updates by category","description":"Updates are grouped into Added, Fixed, Visual and Quality, with a short list of changes and a commit link at the end of each item."} -->

- **新鲜事更清楚，也更好翻阅**：更新说明改用深灰底色、绿色标题和紧凑排版，并使用自定义滚动条。版本切换和翻页集中在底部，随时都能找到。 ([feat · 6e404cf2](https://github.com/MT-SUPER-POWER/Scopify/commit/6e404cf2b5fbc78b87af7550ca5615d4b6c942a7))
  <!-- update:legacy-2-0-3-5 -->
  <!-- translation:zh-TW {"title":"新鮮事更清楚，也更好翻閱","description":"更新說明改用深灰底色、綠色標題和緊湊排版，並使用自訂捲動條。版本切換和翻頁集中在底部，隨時都能找到。"} -->
  <!-- translation:en-US {"title":"A clearer What's New window","description":"Release notes now use a dark gray surface, green headings, compact typography and a custom scrollbar. Version selection and pagination stay together in the footer."} -->

- **开发者工具快捷键更明确**：设置页现在明确提示按 F12 打开开发者工具，方便排查问题时找到入口。 ([fix · 7fde6ce0](https://github.com/MT-SUPER-POWER/Scopify/commit/7fde6ce000d35fdb083546bed4f71ff705924909))
  <!-- update:legacy-2-0-3-6 -->
  <!-- translation:zh-TW {"title":"開發者工具快捷鍵更明確","description":"設定頁現在明確提示按 F12 開啟開發者工具，方便排查問題時找到入口。"} -->
  <!-- translation:en-US {"title":"A clearer developer tools shortcut","description":"Settings now explicitly show F12 as the developer tools shortcut, making troubleshooting easier."} -->

### Quality

- **更新历史完整可查**：What's New 直接读取这份更新日志，支持按版本、分类与页码浏览；旧记录的未知提交会明确标记。
  <!-- update:changelog-single-source -->

### Fixed

- **历史版本与更新分类不再缺失**：可以查看从 v1.0.0 起的全部版本；分页时保留所有分类和总数，可直接跳到对应分类所在页。
  <!-- update:whats-new-history-navigation -->

- **外部链接使用默认浏览器打开**：桌面端的提交链接、活动链接等外部网页会交给系统默认浏览器，不再打开应用内网页窗口。 ([feat · 6e404cf2](https://github.com/MT-SUPER-POWER/Scopify/commit/6e404cf2b5fbc78b87af7550ca5615d4b6c942a7))
  <!-- update:legacy-2-0-3-7 -->
  <!-- translation:zh-TW {"title":"外部連結使用預設瀏覽器開啟","description":"桌面端的提交連結、活動連結等外部網頁會交給系統預設瀏覽器，不再開啟應用程式內網頁視窗。"} -->
  <!-- translation:en-US {"title":"Open external links in your default browser","description":"External pages, including commit and activity links, now open in your system's default browser instead of an extra in-app window."} -->

- **命令面板在浅色背景上也能看清了**：修复命令面板叠在浅色页面上时说明文字难以辨认的问题。搜索命令和查看操作说明更轻松。 ([fix · 53201750](https://github.com/MT-SUPER-POWER/Scopify/commit/5320175086981746d4c9bd04bb9dea84ef21208c))
  <!-- update:legacy-2-0-3-8 -->
  <!-- translation:zh-TW {"title":"命令面板在淺色背景上也能看清了","description":"修復命令面板疊在淺色頁面上時說明文字難以辨認的問題。搜尋命令和查看操作說明更輕鬆。"} -->
  <!-- translation:en-US {"title":"Read commands clearly on light backgrounds","description":"Fixed low-contrast descriptions when the command palette appears over a light page, making commands easier to find and read."} -->

- **歌词外观选项不再白底白字**：修复莱茵档案中场景配色、律动方式、画质和帧率菜单难以看清的问题，下拉选项现在会跟随歌词主题。 ([fix · 0a9b98f0](https://github.com/MT-SUPER-POWER/Scopify/commit/0a9b98f0874cdf1898a1e9633235c1a66ed5be3d))
  <!-- update:legacy-2-0-3-9 -->
  <!-- translation:zh-TW {"title":"歌詞外觀選項不再白底白字","description":"修復萊茵檔案中場景配色、律動方式、畫質和幀率選單難以看清的問題，下拉選項現在會跟隨歌詞主題。"} -->
  <!-- translation:en-US {"title":"Readable lyric appearance menus","description":"Scene colors, motion, quality and frame-rate options in Rhine Archive now follow the lyric theme instead of appearing as pale text on white."} -->

## v2.0.2

### Visual

- **桌面上的 Scopify 更好找了**：应用图标减少了周围的透明留白，在桌面、任务栏和开始菜单中显示得更大、更清楚。 ([fix · 859a6bdb](https://github.com/MT-SUPER-POWER/Scopify/commit/859a6bdb4b4e50d300bcb3139788937205768360))
  <!-- update:legacy-2-0-2-10 -->
  <!-- translation:zh-TW {"title":"桌面上的 Scopify 更好找了","description":"應用程式圖示減少了周圍的透明留白，在桌面、工作列和開始選單中顯示得更大、更清楚。"} -->
  <!-- translation:en-US {"title":"Find Scopify more easily","description":"Reduced empty space around the icon so Scopify looks larger and clearer on your desktop, taskbar and Start menu."} -->

## v2.0.1

### Added

- **用命令切换歌单视图**：在歌单或专辑页打开命令面板，即可切换列表与 Lattice 拼贴视图，也能开关暗场。需要时可在快捷键设置里分配自己的按键。 ([feat · 9bf13f37](https://github.com/MT-SUPER-POWER/Scopify/commit/9bf13f37a34038d5a0195dd4b17e85c67b533754))
  <!-- update:legacy-2-0-1-11 -->
  <!-- translation:zh-TW {"title":"用命令切換歌單檢視","description":"在歌單或專輯頁開啟命令面板，即可切換列表與 Lattice 拼貼檢視，也能開關暗場。需要時可在快捷鍵設定裡分配自己的按鍵。"} -->
  <!-- translation:en-US {"title":"Switch playlist views with a command","description":"Open the command palette on a playlist or album to switch between list and Lattice views or toggle lights-off mode. You can assign your own shortcuts in settings."} -->

- **新增常见问题说明**：按账号、音乐库、播放、歌词和桌面功能整理常见问题，遇到问题时更容易找到解答。 ([docs · 3deeb773](https://github.com/MT-SUPER-POWER/Scopify/commit/3deeb7736f48a0c59c3261bd057dc42fde5eff03))
  <!-- update:legacy-2-0-1-12 -->

- **在屏幕顶部看歌词**：新增可拖动的灵动岛歌词胶囊，靠近屏幕顶边可自动吸附。可在桌面设置或系统托盘开启，并调整大小、翻译和鼠标穿透。 ([feat · c1d25651](https://github.com/MT-SUPER-POWER/Scopify/commit/c1d256513aafe025b18e670f02dc872f90c3ff8a))
  <!-- update:legacy-2-0-1-13 -->
  <!-- translation:zh-TW {"title":"在螢幕頂部看歌詞","description":"新增可拖動的靈動島歌詞膠囊，靠近螢幕頂邊可自動吸附。可在桌面設定或系統匣開啟，並調整大小、翻譯和滑鼠穿透。"} -->
  <!-- translation:en-US {"title":"Keep lyrics at the top of your screen","description":"A draggable lyric capsule can snap to the top of your screen. Enable it in desktop settings or the system tray, then adjust its size, translation and click-through behavior."} -->

- **Windows 任务栏也能显示歌词**：在任务栏空白区域查看歌词和翻译，悬停还能切歌与暂停。前往设置中的桌面选项开启，并按喜好调整位置、字号和颜色。 ([feat · 914507ee](https://github.com/MT-SUPER-POWER/Scopify/commit/914507eeed861d84858e3f3bcdf1e32034c84931))
  <!-- update:legacy-2-0-1-14 -->
  <!-- translation:zh-TW {"title":"Windows 工作列也能顯示歌詞","description":"在工作列空白區域查看歌詞和翻譯，懸停還能切歌與暫停。前往設定中的桌面選項開啟，並按喜好調整位置、字級和顏色。"} -->
  <!-- translation:en-US {"title":"Lyrics on your Windows taskbar","description":"Show lyrics and translations in free taskbar space, with playback controls on hover. Enable taskbar lyrics in desktop settings and customize their position, size and colors."} -->

### Visual

- **统一应用品牌标识**：侧栏、登录页、桌面图标与文档统一使用 Ivory 标识，深浅背景都能清楚辨认。 ([fix · 01c66a4f](https://github.com/MT-SUPER-POWER/Scopify/commit/01c66a4f3fa8245604e642e9237ba47ca9f03203))
  <!-- update:legacy-2-0-1-15 -->

- **Lattice 拼贴可直接返回列表**：歌单或专辑进入拼贴视图后，点击顶栏的返回列表按钮即可退出。 ([fix · 89b41d22](https://github.com/MT-SUPER-POWER/Scopify/commit/89b41d225297589af600892094145163ff38cef9))
  <!-- update:legacy-2-0-1-17 -->

- **按功能查阅产品文档**：产品概览可以跳转到各功能的详细说明，截图和视频与对应功能放在一起。 ([docs · 3deeb773](https://github.com/MT-SUPER-POWER/Scopify/commit/3deeb7736f48a0c59c3261bd057dc42fde5eff03))
  <!-- update:legacy-2-0-1-18 -->

- **精简文档导航品牌展示**：移除导航中的 Scopify 艺术字，仅保留应用图标与 Docs 标识。 ([docs · 3deeb773](https://github.com/MT-SUPER-POWER/Scopify/commit/3deeb7736f48a0c59c3261bd057dc42fde5eff03))
  <!-- update:legacy-2-0-1-19 -->

- **主题实验室入口更集中**：在组件文档的侧栏可直接打开主题实验室。 ([docs · 3deeb773](https://github.com/MT-SUPER-POWER/Scopify/commit/3deeb7736f48a0c59c3261bd057dc42fde5eff03))
  <!-- update:legacy-2-0-1-20 -->

- **桌面功能说明配图更准确**：桌面壁纸、小歌词、灵动岛与播放控制器的配图和对应章节保持一致。 ([docs · 3deeb773](https://github.com/MT-SUPER-POWER/Scopify/commit/3deeb7736f48a0c59c3261bd057dc42fde5eff03))
  <!-- update:legacy-2-0-1-21 -->

- **功能文档补充实际界面截图**：播放、歌词、私信和桌面功能的说明配上实际界面，方便寻找操作入口。 ([docs · 3deeb773](https://github.com/MT-SUPER-POWER/Scopify/commit/3deeb7736f48a0c59c3261bd057dc42fde5eff03))
  <!-- update:legacy-2-0-1-22 -->

- **桌面歌词锁定按钮位置固定**：歌词变化时控制按钮保持原位，更容易锁定和解锁。 ([feat · 8fa5ff3f](https://github.com/MT-SUPER-POWER/Scopify/commit/8fa5ff3ffb4d8d75d5dfe5dc4f54a9f4c90d78bd))
  <!-- update:legacy-2-0-1-31 -->

- **产品介绍改为分章节浏览**：按前奏、主歌、副歌和尾声浏览产品功能，并可从底部导航切换章节。 ([fix · 649fdb04](https://github.com/MT-SUPER-POWER/Scopify/commit/649fdb04508d646dea915a1784bba1ccccfaeee1))
  <!-- update:legacy-2-0-1-32 -->

- **文档歌词演示过渡更连贯**：滚动时从客户端介绍自然过渡到歌词舞台，可继续浏览不同动画。
  <!-- update:legacy-2-0-1-33 historical -->

- **歌词舞台的 14 种动画各演一场，不再单调重复**
  <!-- update:legacy-2-0-1-34 historical -->

- **音质介绍随滚动逐步展示**：滚动查看不同音质与音效介绍后，可以继续浏览下一章节。
  <!-- update:legacy-2-0-1-35 historical -->

### Fixed

- **修复倾诉歌词动画打开时报错**：打开倾诉歌词动画时不再反复出现错误提示。
  <!-- update:legacy-2-0-1-44 historical -->

- **歌词演示不再卡住页面滚动**：浏览文档中的莫奈、时计等歌词演示时，可以继续向下滚动页面。
  <!-- update:legacy-2-0-1-45 historical -->

- **修复文档「网易乐签」演示视频资源提供方式** ([fix · 63def6fd](https://github.com/MT-SUPER-POWER/Scopify/commit/63def6fd3d0d521ed200701f717d8852f9678220))
  <!-- update:legacy-2-0-1-46 -->

## v2.0.0

### Added

- **新增 MCP 播放控制说明**：介绍如何连接 MCP 客户端、设置令牌，以及分别授权播放控制工具。 ([docs · 8bfaadca](https://github.com/MT-SUPER-POWER/Scopify/commit/8bfaadca43342f3d8d4c4ada3cc03b246c5a6402))
  <!-- update:legacy-2-0-0-48 -->

- **《产品能力》补写缺失功能章节**：新增私人 FM 与电台、播客、歌单管理与 Lattice 视图、歌词模式与副字幕、听歌足迹、动态与乐迷团、私信、通知中心、外观与主题、缓存与登录设备、桌面壁纸与托盘、音频输出与系统媒体控制、MCP 播放控制等章节，并同步更新功能图谱。 ([docs · ac1f3b12](https://github.com/MT-SUPER-POWER/Scopify/commit/ac1f3b12c2df2940dd3923abbc55f30f52bb523e))
  <!-- update:legacy-2-0-0-49 -->

- **支持文档站（docs）独立部署至 Vercel 并新增部署脚本** ([feat · 00d2d592](https://github.com/MT-SUPER-POWER/Scopify/commit/00d2d5920f40ece966be93116dc8d0848a6376ca))
  <!-- update:legacy-2-0-0-50 -->

### Visual

- **文档产品能力中「网易乐签」展示形式由截图替换为演示视频** ([docs · 8bfaadca](https://github.com/MT-SUPER-POWER/Scopify/commit/8bfaadca43342f3d8d4c4ada3cc03b246c5a6402))
  <!-- update:legacy-2-0-0-51 -->

- **文档功能截图与资产全面重截更新** ([docs · 8bfaadca](https://github.com/MT-SUPER-POWER/Scopify/commit/8bfaadca43342f3d8d4c4ada3cc03b246c5a6402))
  <!-- update:legacy-2-0-0-52 -->

- **落地页歌词动画可交互、新增主题定制与在线体验** ([feat · 3f17aad7](https://github.com/MT-SUPER-POWER/Scopify/commit/3f17aad759f80c30d1faef43924f3a64a9bd8d12))
  <!-- update:legacy-2-0-0-53 -->

- **文档落地页按听歌报告的叙事重写** ([feat · 159aa8dc](https://github.com/MT-SUPER-POWER/Scopify/commit/159aa8dc35c2b2fa05a6939055529918a115694e))
  <!-- update:legacy-2-0-0-54 -->

### Fixed

- **侧边栏改为整体滚动** ([fix · 8c6a5fa8](https://github.com/MT-SUPER-POWER/Scopify/commit/8c6a5fa8851ede7c9f6436f3f16c28e170d9a37d))
  <!-- update:legacy-2-0-0-60 -->

- **修复桌面端首次进入私人电台为空** ([fix · 726e9aeb](https://github.com/MT-SUPER-POWER/Scopify/commit/726e9aeb0a38875a6019a76e9e22df2aace3d534))
  <!-- update:legacy-2-0-0-61 -->

- **未登录时隐藏用户菜单中的「登录设备」入口** ([fix · ecae61c4](https://github.com/MT-SUPER-POWER/Scopify/commit/ecae61c459758b833112a77d3bb1fbb598a506ae))
  <!-- update:legacy-2-0-0-62 -->

## v1.5.8

### Fixed

- **通知中心周报点击改为跳转听歌报告** ([fix · b477db19](https://github.com/MT-SUPER-POWER/Scopify/commit/b477db19001337699dcb0cc7fc916e7fdba1ea8c))
  <!-- update:legacy-1-5-8-64 -->

- **修复音量弹层中滑块缺失**：打开音量面板后可以正常拖动滑块调整音量。 ([fix · 4057ad83](https://github.com/MT-SUPER-POWER/Scopify/commit/4057ad83911f0a0be9fe2443699f2ccf00b5408e))
  <!-- update:legacy-1-5-8-65 -->

## v1.5.7

### Added

- **桌面小歌词悬浮工具栏新增鼠标穿透按钮**：在悬浮工具栏中补充锁定/鼠标穿透快捷切换按钮，支持一键锁定小歌词进入完全穿透状态。 ([fix · 2c70a79e](https://github.com/MT-SUPER-POWER/Scopify/commit/2c70a79e0cab31acbcc78d8a3be7e0515be19835))
  <!-- update:legacy-1-5-7-66 -->

- **时计齿轮装饰改用 WebGL2 绘制**：同步 Folia e8817f8a、3ca71d57。 ([perf · 4ae13369](https://github.com/MT-SUPER-POWER/Scopify/commit/4ae133693cda2c38eb320ddd2b1b471c33d5d951))
  <!-- update:legacy-1-5-7-67 -->

- **歌词背景视频层与 Sora 纯色背景**：同步 Folia 4eee4ba8。 ([feat · 24db450a](https://github.com/MT-SUPER-POWER/Scopify/commit/24db450aa6d2d5681554a8b5a3e7d71583cfd01e))
  <!-- update:legacy-1-5-7-68 -->

- **凝彩整句显示歌词**：同步 Folia d9e3efaa，凝彩设置新增「歌词分镜 → 整句显示歌词」（默认关闭）。 ([feat · f399d90d](https://github.com/MT-SUPER-POWER/Scopify/commit/f399d90ddab882dac8000240c2be2abc80b2cab4))
  <!-- update:legacy-1-5-7-69 -->

- **凝彩画布图片池备份**：同步 Folia 3e081df8、2bd16cbc、acf7ffc9，图片池弹窗底部新增添加、导入备份、导出备份。 ([feat · f399d90d](https://github.com/MT-SUPER-POWER/Scopify/commit/f399d90ddab882dac8000240c2be2abc80b2cab4))
  <!-- update:legacy-1-5-7-70 -->

- **莫奈频谱显示开关**：同步 Folia 90a30fba，莫奈设置的频谱分区新增「音频图案：显示 / 隐藏」。 ([feat · f399d90d](https://github.com/MT-SUPER-POWER/Scopify/commit/f399d90ddab882dac8000240c2be2abc80b2cab4))
  <!-- update:legacy-1-5-7-71 -->

- **控制栏收起时隐藏鼠标指针**：同步 Folia f1e4f577，全屏歌词的控制栏自动收起后，视觉层上的指针一起隐藏，移动鼠标即可唤回；控制栏、设置弹窗不受影响。 ([feat · f399d90d](https://github.com/MT-SUPER-POWER/Scopify/commit/f399d90ddab882dac8000240c2be2abc80b2cab4))
  <!-- update:legacy-1-5-7-72 -->

- **凝彩边角线框开关**：同步 Folia f79a40ca，凝彩「显示内容」新增「边角线框」开关（默认开启），可单独隐藏左上与右下的边角标记；切换时只重画叠层，不重建场景。 ([feat · 3e402ed2](https://github.com/MT-SUPER-POWER/Scopify/commit/3e402ed20e2c67c8ad0a81b2d247c797b9517e55))
  <!-- update:legacy-1-5-7-73 -->

- **罗马音 + 翻译双行副字幕**：同步 Folia 871a7ba6、f68461ac，副字幕内容新增「罗马音 + 翻译」，底部共用字幕罗马音在上、翻译在下，第二行字号与不透明度略低，缺哪行就省略哪行，两者相同只显示一次；可在可视化设置的字幕页与操作模式的歌词控制中选择。 ([feat · bece3c54](https://github.com/MT-SUPER-POWER/Scopify/commit/bece3c5429bffae4374e90468efd6186038ee655))
  <!-- update:legacy-1-5-7-74 -->

- **时计双行副字幕**：同步 Folia 5809e8e8、5b2bbb6d，时计在「罗马音 + 翻译」模式下于每句歌词下方叠放罗马音与翻译两行，第二行略小略淡；预留高度与实际绘制共用同一套行规格，并按实际 1.5 倍行高预留，避免压到下一句。 ([feat · 041b596d](https://github.com/MT-SUPER-POWER/Scopify/commit/041b596d76b7ed35d0f3a17df5c01209d5140642))
  <!-- update:legacy-1-5-7-75 -->

- **莫奈双行副字幕**：同步 Folia 43f27c36，莫奈在「罗马音 + 翻译」模式下于当前句下方叠放罗马音与翻译两行，第二行略小略淡、入场晚 0.04 秒，每行各自最多两行，超出部分淡出。 ([feat · 59acfc8a](https://github.com/MT-SUPER-POWER/Scopify/commit/59acfc8a8ea4c9e084586b9ae26782ac92e100b7))
  <!-- update:legacy-1-5-7-76 -->

### Quality

- **商籁静止图形不再逐帧重画**：同步 Folia 75804bfa，主图形、画框与引导线在进度不变时跳过清空和重新三角化（shot 画完后不再每帧整套重画），镜头跟踪数据每个 shot 只计算一次，逐帧渲染不再读取宿主尺寸触发同步布局。 ([perf · ed0937e3](https://github.com/MT-SUPER-POWER/Scopify/commit/ed0937e35e976a3f0fd23178f5f11d683e6bb01d))
  <!-- update:legacy-1-5-7-93 -->

- **Latent 背景每帧少画一遍**：同步 Folia cbc97c30、fcb95450，音频驱动的参数在着色器运行时只写入、由其自身的帧循环绘制，不再每帧额外全屏绘制一次（停止时仍立即绘制）；图层的透明度、缩放与滤镜只在数值变化时写入。 ([perf · 3fea73cb](https://github.com/MT-SUPER-POWER/Scopify/commit/3fea73cb2f1d562e0cbf5fc2b20c06d92f571065))
  <!-- update:legacy-1-5-7-95 -->

- **莫奈歌词与频谱每帧减负**：同步 Folia 656025bf，只有正在唱的行逐词跟随时钟计算扫字与填充，只有正在唱和唱过的行计算发光，其余词改读静止时钟，不再每帧每词各跑四个变换；频谱的两条渐变只在画布尺寸变化时重建。 ([perf · b1609fdb](https://github.com/MT-SUPER-POWER/Scopify/commit/b1609fdbf4f407f99151bed7a4a29f97f634ce84))
  <!-- update:legacy-1-5-7-96 -->

- **凝彩每帧减负与渐变纹理释放** ([perf · 66d0a4eb](https://github.com/MT-SUPER-POWER/Scopify/commit/66d0a4ebc3679fa64fce8220c8369d7995d3e233))
  <!-- update:legacy-1-5-7-97 -->

- **烟云字形测量缓存加上限**：同步 Folia d1d94640，烟云的字素偏移测量缓存改为最多 2048 条并按插入顺序淘汰，长时间连续播放、切过很多首歌后不再无限增长；新增各模式共用的有界缓存与前缀测量工具。 ([perf · 14576060](https://github.com/MT-SUPER-POWER/Scopify/commit/145760600c7b4035ee3516d9f075fcdbd5dabae4))
  <!-- update:legacy-1-5-7-98 -->

- **颜色解析与烟云背景渐变缓存**：同步 Folia 5dfc0105，各歌词模式共用的颜色换算按字符串缓存解析结果（最多 512 条），不再逐字逐帧用正则重新解析，输出与改动前逐项一致；烟云背景线条的两层渐变按尺寸、透明度和主题色缓存，不再每帧每个形状新建。 ([perf · a9c838fb](https://github.com/MT-SUPER-POWER/Scopify/commit/a9c838fb85a3a97ac95e4a71c9bffb148a5748c4))
  <!-- update:legacy-1-5-7-99 -->

### Fixed

- **修复文档应用（docs）类型检查失败** ([fix · 586e1384](https://github.com/MT-SUPER-POWER/Scopify/commit/586e1384d05ff89ce2dfc750eed30d767d9a682d))
  <!-- update:legacy-1-5-7-77 -->

- **Folia 舞台播放中途整屏黑屏**：自动隐藏指针的类名拼接漏了空格，控制栏自动收起时舞台容器的类名变成 inset-0folia-cursor-auto-hidden，inset-0 失效、容器塌成 0×0，背景和歌词一起消失，移动鼠标后才恢复；指针也从未真正隐藏。 ([fix · 17f68041](https://github.com/MT-SUPER-POWER/Scopify/commit/17f68041c02656edc97f582053f2ec606dbf4d3d))
  <!-- update:legacy-1-5-7-78 -->

- **Monet 背景首次挂载抛错** ([fix · 17f68041](https://github.com/MT-SUPER-POWER/Scopify/commit/17f68041c02656edc97f582053f2ec606dbf4d3d))
  <!-- update:legacy-1-5-7-79 -->

- **桌面小歌词开启鼠标穿透后无法解锁** ([fix · 2c70a79e](https://github.com/MT-SUPER-POWER/Scopify/commit/2c70a79e0cab31acbcc78d8a3be7e0515be19835))
  <!-- update:legacy-1-5-7-80 -->

- **桌面小歌词间奏填充对齐 Folia**：修复桌面小歌词在间奏、句间空隙或尾奏期间回退显示歌曲名字的问题。 ([fix · 1e6ceafa](https://github.com/MT-SUPER-POWER/Scopify/commit/1e6ceafa582e49277961335c79d061ff4ec6d3a6))
  <!-- update:legacy-1-5-7-81 -->

- **桌面小歌词窗口尺寸自适应贴合与拖动修复**：修复桌面小歌词窗口固定 892px 巨型透明空气墙阻挡周围鼠标点击的问题。 ([fix · 1e6ceafa](https://github.com/MT-SUPER-POWER/Scopify/commit/1e6ceafa582e49277961335c79d061ff4ec6d3a6))
  <!-- update:legacy-1-5-7-82 -->

- **放宽纯音乐识别与空歌词过渡**：同步 Folia 2b824ea5。 ([fix · 13a70056](https://github.com/MT-SUPER-POWER/Scopify/commit/13a70056b6c49aca777ec2c09b23b2321f6c1b5a))
  <!-- update:legacy-1-5-7-83 -->

- **多显示器下的桌面壁纸**：同步 Folia 7452afd2，壁纸模式不再固定使用主屏，而是覆盖主窗口所在的显示器，运行中保持在同一块屏，原屏拔出时回退。 ([feat · f399d90d](https://github.com/MT-SUPER-POWER/Scopify/commit/f399d90ddab882dac8000240c2be2abc80b2cab4))
  <!-- update:legacy-1-5-7-84 -->

- **控制栏唤回**：同步 Folia a2874584，按住鼠标（如拖动进度条）时控制栏不再收起，滚轮与点击也能唤回，窗口失焦后照常收起。 ([feat · f399d90d](https://github.com/MT-SUPER-POWER/Scopify/commit/f399d90ddab882dac8000240c2be2abc80b2cab4))
  <!-- update:legacy-1-5-7-85 -->

- **Linux / NVIDIA 下的黑色三角** ([feat · f399d90d](https://github.com/MT-SUPER-POWER/Scopify/commit/f399d90ddab882dac8000240c2be2abc80b2cab4))
  <!-- update:legacy-1-5-7-86 -->

- **Lattice 歌词在分数缩放下丢字、变糊**：同步 Folia 8aa7b132、2cb9e56e、194d0c4a。 ([fix · 30c15083](https://github.com/MT-SUPER-POWER/Scopify/commit/30c15083aaa739e6512d2714819a5873c10b295d))
  <!-- update:legacy-1-5-7-87 -->

- **商籁弧形仪表多画一圈亮环**：同步 Folia 2a7cd5e0，每段弧线绘制前先移到自身起点，不再连到上一个图形或重描其路径。 ([fix · 30c15083](https://github.com/MT-SUPER-POWER/Scopify/commit/30c15083aaa739e6512d2714819a5873c10b295d))
  <!-- update:legacy-1-5-7-88 -->

- **关闭歌词画面后释放图形资源**：离开歌词画面时及时清理图形资源，减少残留的内存占用。 ([fix · 30c15083](https://github.com/MT-SUPER-POWER/Scopify/commit/30c15083aaa739e6512d2714819a5873c10b295d))
  <!-- update:legacy-1-5-7-89 -->

- **Latent 背景 WebGL 上下文未释放**：同步 Folia 65f8a59f、161756cb，Latent 的两层着色器不再开启多重采样与深度缓冲，卸载后主动释放 WebGL 上下文，避免多次切换模式后绘制缓冲堆积。 ([fix · 30c15083](https://github.com/MT-SUPER-POWER/Scopify/commit/30c15083aaa739e6512d2714819a5873c10b295d))
  <!-- update:legacy-1-5-7-90 -->

## v1.5.6

### Added

- **乐迷团社交生态与多端界面集成** ([feat · d468c0a2](https://github.com/MT-SUPER-POWER/Scopify/commit/d468c0a2d66915030d5d523a9218301dc4546ab9))
  <!-- update:legacy-1-5-6-102 -->

- **私信一键全读支持**：在好友私信面板（FriendsPanel）顶部操作栏新增「全部已读」快捷按钮，提供即时将全量未读私信批量标为已读的能力；未读数为 0 时自动禁用，点击后同步重置通知系统已读状态并清空会话缓存未读数。 ([feat · 5ab77b51](https://github.com/MT-SUPER-POWER/Scopify/commit/5ab77b51c7bc647d2aac5b5e6db2d0c64eddf219))
  <!-- update:legacy-1-5-6-104 -->

### Visual

- **动态页头部减负与语义对齐**：吸顶区域只保留「动态 / 标签 / 操作」一行，高度固定为 56px。 ([feat · 1a25a8d6](https://github.com/MT-SUPER-POWER/Scopify/commit/1a25a8d69c43061c3fc450c03ccd0b1d31960c16))
  <!-- update:legacy-1-5-6-105 -->

- **乐迷团导轨重设计**：「全部」不再使用绿色渐变 + ✨ 图标，改为和团头像同一种圆形形态，内容是已加入团头像的 2×2 拼贴。 ([feat · 1a25a8d6](https://github.com/MT-SUPER-POWER/Scopify/commit/1a25a8d69c43061c3fc450c03ccd0b1d31960c16))
  <!-- update:legacy-1-5-6-106 -->

- **发布去向一致**：「关注」流顶部新增行内输入框，发出的动态会直接出现在下方列表中。 ([feat · 1a25a8d6](https://github.com/MT-SUPER-POWER/Scopify/commit/1a25a8d69c43061c3fc450c03ccd0b1d31960c16))
  <!-- update:legacy-1-5-6-107 -->

### Fixed

- **滚动越过顶部瞬间整页重渲染卡顿修复** ([feat · 1a25a8d6](https://github.com/MT-SUPER-POWER/Scopify/commit/1a25a8d69c43061c3fc450c03ccd0b1d31960c16))
  <!-- update:legacy-1-5-6-108 -->

- **动态页「全部」乐迷团刷新无效修复** ([feat · 1a25a8d6](https://github.com/MT-SUPER-POWER/Scopify/commit/1a25a8d69c43061c3fc450c03ccd0b1d31960c16))
  <!-- update:legacy-1-5-6-109 -->

- **歌手页关注状态未同步与已关注展示异常修复**：修复已收藏/关注的歌手在歌手详情页操作栏（ActionBar）中误显为「关注」而非「已关注」的问题。 ([fix · 0bf3f7e1](https://github.com/MT-SUPER-POWER/Scopify/commit/0bf3f7e1ea18195662aef8ebd89eb51e5f0e56e9))
  <!-- update:legacy-1-5-6-110 -->

- **私信阅读后绿色通知消除与状态同步修复**：修复阅读私信后顶栏图标与会话列表中绿色未读提示（bg-success 小圆点及未读计数）未能消除的问题。 ([feat · 5ab77b51](https://github.com/MT-SUPER-POWER/Scopify/commit/5ab77b51c7bc647d2aac5b5e6db2d0c64eddf219))
  <!-- update:legacy-1-5-6-111 -->

- **桌面歌词算法与 Folia 歌词时钟对齐修复**：桌面小歌词全面接入 Folia 歌词架构。 ([fix · e7b1d2d8](https://github.com/MT-SUPER-POWER/Scopify/commit/e7b1d2d8cf8fe6903d0f67e0c94dbb834ae765a3))
  <!-- update:legacy-1-5-6-112 -->

- **桌面歌词快捷键解绑与双向 Toggle 交互修复** ([fix · e7b1d2d8](https://github.com/MT-SUPER-POWER/Scopify/commit/e7b1d2d8cf8fe6903d0f67e0c94dbb834ae765a3))
  <!-- update:legacy-1-5-6-113 -->

## v1.5.5

### Visual

- **通知设置布局优化与报告检查收敛**：移除右侧孤立冗余的「报告检查」独立卡片，将「今日回顾时间」作为折叠子项直接收敛于左侧「今日听歌回顾」开关下方，开启时展开时间输入，关闭时自动隐藏；并将桌面弹窗测试控件规整收敛至右侧「提醒方式」卡片底部。 ([feat · 80fc5f19](https://github.com/MT-SUPER-POWER/Scopify/commit/80fc5f190d5acfbcea619617ae0e369f855baa8a))
  <!-- update:legacy-1-5-5-114 -->

- **通知设置保存按钮规范化**：通知设置页对齐全局设置风格，移除底部右侧固定内联操作栏与撤销按钮，改为屏幕底部居中悬浮的「保存更改」胶囊按钮，点击弹出统一的二次确认弹窗进行保存与反馈。 ([feat · 5271f019](https://github.com/MT-SUPER-POWER/Scopify/commit/5271f019c669f863cbabceac8ac4a61c78bfbbb6))
  <!-- update:legacy-1-5-5-115 -->

### Fixed

- **开发版与安装版任务栏身份冲突修复** ([fix · ffd4d0c7](https://github.com/MT-SUPER-POWER/Scopify/commit/ffd4d0c7025ecd3a4f99de45ad7486e21e484d7b))
  <!-- update:legacy-1-5-5-119 -->

- **老用户覆盖升级后通知与私信误显未登录修复**：修复消息中心强依赖 loginType 导致老用户升级后因本地缓存缺少该字段被误判为未登录的问题；并在应用启动挂载时为桌面端自动补齐 Electron CookieJar 的静默同步。 ([feat · 2f8917aa](https://github.com/MT-SUPER-POWER/Scopify/commit/2f8917aab48088e3c01e1afd590b6e819b75612d))
  <!-- update:legacy-1-5-5-120 -->

- **Cookie 凭据与用户画像自动水合自愈**：修复持有本地有效 music_cookie 但因时序或存储断层缺少 user 画像导致全站被误判为未登录的死锁问题。 ([fix · 5e8f0b44](https://github.com/MT-SUPER-POWER/Scopify/commit/5e8f0b44aba604075840fe7afea09a08fa964b11))
  <!-- update:legacy-1-5-5-121 -->

- **Windows 任务栏应用图标与身份规范修复** ([refactor · bf5e9ef8](https://github.com/MT-SUPER-POWER/Scopify/commit/bf5e9ef8c1a022589d6cb09e761edf5d7a3511b5))
  <!-- update:legacy-1-5-5-122 -->

## v1.5.4

### Added

- **音乐社区笔记浏览**：热门入口接入乐迷团笔记游标分页并标注真实来源，去重后持续加载；话题保留为独立探索入口，复用作者主页与互动缓存。 ([feat · 43990030](https://github.com/MT-SUPER-POWER/Scopify/commit/43990030e25b407192bc81a10ad6340809fde6e0))
  <!-- update:legacy-1-5-4-151 -->

- **热门话题动态**：新增「热门」入口，接入热门话题分页与话题热门动态，支持切换话题、关注作者、进入个人主页及复用点赞、评论、转发互动；补齐加载、空态和刷新失败重试。 ([feat · b059cbff](https://github.com/MT-SUPER-POWER/Scopify/commit/b059cbff3b7675322dca920e02cafefeed3c519c))
  <!-- update:legacy-1-5-4-155 -->

- **用户动态与社交互动**：接入朋友动态和个人动态分页、文字与音乐分享、转发、点赞、评论回复及本人删除；新增关注/粉丝列表、用户搜索、私信对话和可定位通知的回跳，音乐附件复用播放器与队列。
  <!-- update:legacy-1-5-4-156 historical -->

- **独立私信与会话窗**：私信移至好友图标，独立显示未读会话，铃铛保留互动、报告与更新；复用通知气泡和自定义滚动条，接入会话列表分页、历史消息、文字与表情发送，以及歌曲、专辑和歌单分享卡片。 ([feat · 532ac309](https://github.com/MT-SUPER-POWER/Scopify/commit/532ac3097da43dcfcb1f3873286b4014f70488f1))
  <!-- update:legacy-1-5-4-157 -->

- **管理已登录的设备**：查看登录设备、刷新记录、修改当前设备名称，并可确认让其他设备下线。 ([feat · e7ec254c](https://github.com/MT-SUPER-POWER/Scopify/commit/e7ec254c31829a94677b1e84fa82bb830ee699df))
  <!-- update:legacy-1-5-4-158 -->

- **Lattice 展开播放与歌词**：展开海报接入播放/暂停、切歌、喜欢、循环/随机和进度拖动，嵌入 Folia 逐字歌词与翻译；隐显工具区提供当前歌曲定位、自动跟随、暗场和队列入口，Esc 先收起选择、再返回列表。 ([feat · 5ad9f9c8](https://github.com/MT-SUPER-POWER/Scopify/commit/5ad9f9c8ec698f5615a655a5900f166b2dc07111))
  <!-- update:legacy-1-5-4-159 -->

- **专辑 Lattice 入口**：专辑 Action 区域接入相同的拼贴视图，统一专辑列表、拼贴与播放按钮的播放来源，切换展示模式不替换队列。 ([feat · 002354bf](https://github.com/MT-SUPER-POWER/Scopify/commit/002354bf750060116e326c44e8efe621b6194479))
  <!-- update:legacy-1-5-4-160 -->

- **歌单 Lattice 拼贴视图**：Action 区域可将当前页面的歌曲切换为 Folia 风格海报墙，支持拖动浏览、封面展开让位、播放和定位当前歌曲；右侧主内容区独立切换，保留侧边栏与底部播放条，返回列表时保留搜索和滚动位置。 ([feat · ff82deac](https://github.com/MT-SUPER-POWER/Scopify/commit/ff82deac298351b7eda37176102ccd681ffb7282))
  <!-- update:legacy-1-5-4-161 -->

- **通知中心与桌面提醒**：统一消息、互动、报告和更新通知，加入日期分组、摘要展开、未读筛选与显式已读操作；新增通知设置，接入私信/互动摘要、日报/周报/年报定时就绪检查，以及 Electron 主进程持久化、免打扰、隐私预览和点击展开。
  <!-- update:legacy-1-5-4-162 historical -->

- **臻音全景声与沉浸声格式**：补齐 vivid 音质、播放适配和歌曲音质标识，区分 Audio Vivid 与 Dolby Atmos；沉浸环绕声支持六种格式选择并持久化，播放链接及内存缓存按格式隔离，切换沿用保留播放位置逻辑。 ([feat · 14348b92](https://github.com/MT-SUPER-POWER/Scopify/commit/14348b9217009ae2666165a54106ab5631ed7ca8))
  <!-- update:legacy-1-5-4-163 -->

- **歌单右键相似歌曲**：歌曲条目的右键菜单新增「接着听相似歌曲」，按需打开推荐歌曲模态列表，提供加载、空态及失败重试；复用播放、喜欢、加入歌单、新建歌单、加入队列、评论和复制链接等操作，打开列表不自动插播。 ([feat · 14348b92](https://github.com/MT-SUPER-POWER/Scopify/commit/14348b9217009ae2666165a54106ab5631ed7ca8))
  <!-- update:legacy-1-5-4-164 -->

### Visual

- **个人页背景图片渲染**：使用当前所查看用户的背景图片铺到页面顶部底层，覆盖 顶栏 后方并向资料区渐隐，头像和资料叠在图片上；移除独立渐变横幅。 ([feat · f9f3d0ec](https://github.com/MT-SUPER-POWER/Scopify/commit/f9f3d0eca04225b66af6ac7c98cb6e6ec05dfbdd))
  <!-- update:legacy-1-5-4-137 -->

- **社交背景与个人主页**：动态、个人主页和详情接入外观设置的可控背景层；个人资料改为宽幅横向头部，下方分栏展示动态与歌单，改善长昵称换行；私信入口统一为对话图标，移除社交页面内重复返回入口，由全局 顶栏 负责返回，并保留极窄屏的全局返回按钮。 ([feat · f9f3d0ec](https://github.com/MT-SUPER-POWER/Scopify/commit/f9f3d0eca04225b66af6ac7c98cb6e6ec05dfbdd))
  <!-- update:legacy-1-5-4-138 -->

- **动态设计稿落地**：统一侧栏「浏览」分组下的首页、动态与资料库选中样式，精简全局 顶栏；动态采用吸顶的关注/热门切换、发布弹窗、舒展的图文信息流及关注列表优先的侧栏，补齐笔记标题、相对时间和多图浏览。 ([feat · 43990030](https://github.com/MT-SUPER-POWER/Scopify/commit/43990030e25b407192bc81a10ad6340809fde6e0))
  <!-- update:legacy-1-5-4-139 -->

- **个人页布局样式整理**：增加宽幅资料头及用户背景图片底层，按容器宽度调整头像、资料、操作区和歌单分栏。 ([style · d61ca9f0](https://github.com/MT-SUPER-POWER/Scopify/commit/d61ca9f0863782a1ac10b114e734ac032198ccc7))
  <!-- update:legacy-1-5-4-140 -->

- **动态布局样式整理**：收敛信息流阅读宽度、吸顶栏、侧栏、图片裁切和窄容器布局，沿用现有主题 token。 ([style · 1972592b](https://github.com/MT-SUPER-POWER/Scopify/commit/1972592b19f68c3a236a999db20d9a3b18431a7a))
  <!-- update:legacy-1-5-4-141 -->

- **社交导航统一**：首页和动态归入浏览分组，统一导航选中态，精简全局 顶栏，并统一私信对话图标。 ([fix · 50f39c43](https://github.com/MT-SUPER-POWER/Scopify/commit/50f39c43d306fe46a482d3eb7a3564882d5f04db))
  <!-- update:legacy-1-5-4-142 -->

- **动态浏览布局**：收窄信息流阅读宽度，动态标题、切换栏和话题选择吸顶，右侧话题栏独立滚动并保留原有路由滚动恢复；优化卡片层级、间距、互动入口和窄屏布局，长文支持展开收起，单张图片按原比例展示。 ([feat · b059cbff](https://github.com/MT-SUPER-POWER/Scopify/commit/b059cbff3b7675322dca920e02cafefeed3c519c))
  <!-- update:legacy-1-5-4-143 -->

- **个人音乐主页**：依据确认的融合设计重构 个人资料，采用真实横幅与个人名片、动态/歌单/关于布局，区分本人的编辑发布入口与他人的关注私信入口；动态流保留 Scopify 主题、侧栏与常驻播放器，并适配窄容器。 ([feat · 8a34291d](https://github.com/MT-SUPER-POWER/Scopify/commit/8a34291d1431d25cb847c369a9eb2a634b4d2508))
  <!-- update:legacy-1-5-4-144 -->

- **通知设置交互** ([feat · de5d19f4](https://github.com/MT-SUPER-POWER/Scopify/commit/de5d19f400012bdb9986817fa945d23c34ff97e5))
  <!-- update:legacy-1-5-4-145 -->

- **Lattice 文字层级**：参考 Folia 收敛海报字号，窄卡片使用更小标题，普通歌名限制两行并保留完整标题提示；缩小歌手文字、统一底部边距与行距，协调展开标题和歌词页的元信息，减少封面遮挡。 ([fix · b2f9df61](https://github.com/MT-SUPER-POWER/Scopify/commit/b2f9df61fc4a32ecb1376cbbccc475dbb795cb0c))
  <!-- update:legacy-1-5-4-146 -->

- **Lattice 顶栏透景**：拼贴延伸至透明 顶栏 下方，移除顶部黑色留白；展开与定位海报时继续避开导航区域。 ([fix · cda0a92f](https://github.com/MT-SUPER-POWER/Scopify/commit/cda0a92f7a7cec7c7b1a9c99b9c809dd614b17c0))
  <!-- update:legacy-1-5-4-147 -->

- **登录设备展示台**：采用选定的第一套设计，生成显示器、手机、笔记本、主机四份透明素材及共享摄影背景；替换卡片网格为横向设备陈列、选中设备信息条和紧凑记录列表。 ([feat · 13b7cb29](https://github.com/MT-SUPER-POWER/Scopify/commit/13b7cb29875d71f746e83f7e441017d4eb250ba0))
  <!-- update:legacy-1-5-4-148 -->

- **登录设备页面预览**：通过用户头像菜单的「登录设备」进入，移除设置页中重复的「账号与设备」Tab 和入口卡片；展示当前设备、额度与其他登录记录，提供详情侧栏。 ([feat · 13b7cb29](https://github.com/MT-SUPER-POWER/Scopify/commit/13b7cb29875d71f746e83f7e441017d4eb250ba0))
  <!-- update:legacy-1-5-4-149 -->

- **Lattice 海报布局**：保留透明 顶栏、侧边栏和播放条，恢复封面常驻标题与底部阴影；移除额外标题栏和底部提示，将返回与定位收进右下角隐显工具区。 ([fix · 0a94f440](https://github.com/MT-SUPER-POWER/Scopify/commit/0a94f4404f81dbc81746f14280532d59e81ec9b3))
  <!-- update:legacy-1-5-4-150 -->

- **通知设置布局与保存**：桌面采用左右分栏，精简顶部说明和重复提示；修改保留为草稿，点击「保存更改」后统一生效，支持撤销，保存失败保留修改，发送测试通知前需先保存。 ([feat · de5d19f4](https://github.com/MT-SUPER-POWER/Scopify/commit/de5d19f400012bdb9986817fa945d23c34ff97e5))
  <!-- update:legacy-1-5-4-165 -->

- **通知信息层级**：浮层改用深灰主题色，宽度微调至 440px，桌面端在铃铛附近靠右显示并避让窗口边缘，放大头像与正文；分类明确为私信、评论、@我、通知、报告和更新，未读数量及批量已读仅针对当前分类。 ([feat · de5d19f4](https://github.com/MT-SUPER-POWER/Scopify/commit/de5d19f400012bdb9986817fa945d23c34ff97e5))
  <!-- update:legacy-1-5-4-166 -->

- **通知面板精简**：按设计稿收窄浮层并移除顶部标题，未读消息使用灰色底和标题旁的小绿点，已读仅悬停高亮；铃铛恢复图标右上角的绿点提醒，未读数量移入面板，分类改为下划线导航，并补充真实头像、紧凑时间与摘要层级；列表改用悬停显示的细自定义滚动条。 ([feat · de5d19f4](https://github.com/MT-SUPER-POWER/Scopify/commit/de5d19f400012bdb9986817fa945d23c34ff97e5))
  <!-- update:legacy-1-5-4-167 -->

### Quality

- **拼贴视图支持逐字歌词**：展开歌曲后可以查看逐字高亮与滚动歌词，修复歌词可能空白的问题。 ([feat · d4d3b2ce](https://github.com/MT-SUPER-POWER/Scopify/commit/d4d3b2cea5b6ab7fe4fb519fd6bd16b8c084bcc1))
  <!-- update:legacy-1-5-4-172 -->

- **后端播放能力同步**：后端子模块更新到已合并版本 61b33bb，提供臻音全景声请求适配和相似歌曲接口。 ([feat · 14348b92](https://github.com/MT-SUPER-POWER/Scopify/commit/14348b9217009ae2666165a54106ab5631ed7ca8))
  <!-- update:legacy-1-5-4-176 -->

- **Tempera 切歌复用渲染器**：同步 Folia a69dd947、b2fd8323，保留 WebGL 与图片资源，先准备下一首场景再直接切换，旧场景分帧释放；封面配色变化原位更新，暂停时完成待处理交接。 ([perf · e05c39e6](https://github.com/MT-SUPER-POWER/Scopify/commit/e05c39e6ee9d9b11bdd9dbb8b172c26f2d4d1dc2))
  <!-- update:legacy-1-5-4-177 -->

- **Sonnet 切歌复用渲染器**：同步 Folia a69dd947 的切歌交接与分帧场景预建，等待歌词就绪后原位切换，快速连续切歌合并至最新请求；保留 WebGL 与图标纹理池，并处理暂停、销毁和初始化期间的状态变化。 ([perf · 83060256](https://github.com/MT-SUPER-POWER/Scopify/commit/8306025692e911ec9d962599c006642f64dde6af))
  <!-- update:legacy-1-5-4-178 -->

- **歌词显示减少重复计算**：同步 Folia a69dd947 的测量优化，Sonnet 与 Tempera 按字体、字号和文本复用测量结果，各自最多保留 20,000 条，减少切歌和段落布局中的重复计算。 ([perf · aa6647bf](https://github.com/MT-SUPER-POWER/Scopify/commit/aa6647bf217e292c29ad5cbd1286e9e84a86dd1e))
  <!-- update:legacy-1-5-4-179 -->

### Fixed

- **动态页窄屏适配**：全局搜索区按实际容器宽度收缩，窄容器精简前进/后退按钮，避免挤出通知和个人入口；发布按钮仅显示图标时保留可访问名称。 ([fix · 50f39c43](https://github.com/MT-SUPER-POWER/Scopify/commit/50f39c43d306fe46a482d3eb7a3564882d5f04db))
  <!-- update:legacy-1-5-4-133 -->

- **修复相似歌曲推荐列表** ([feat · de5d19f4](https://github.com/MT-SUPER-POWER/Scopify/commit/de5d19f400012bdb9986817fa945d23c34ff97e5))
  <!-- update:legacy-1-5-4-134 -->

- **修复通知气泡的位置**：移除窗口边缘虚拟锚点，恢复以铃铛为锚点并向右偏移，修复浮层错位到左上角的问题；加入随铃铛定位的气泡箭头，保留窗口边缘避让。 ([feat · de5d19f4](https://github.com/MT-SUPER-POWER/Scopify/commit/de5d19f400012bdb9986817fa945d23c34ff97e5))
  <!-- update:legacy-1-5-4-135 -->

- **播放条音频面板**：移除已拆分的输出设备 Tab，仅保留播放音质与均衡器；滚动视口按浮层可用高度约束，沿用自定义滚动条，避免下方内容被裁切；Dolby Atmos 使用声波图标，与 Audio Vivid 区分，并修复引用不存在的 SurroundSound 导出导致的构建错误。 ([fix · 97ab3886](https://github.com/MT-SUPER-POWER/Scopify/commit/97ab388611ccf20a764b71c27811f53351b456d4))
  <!-- update:legacy-1-5-4-136 -->

- **修复从歌曲菜单加入队列**：追加歌曲时保留当前播放来源和队列状态，添加到歌单的子菜单仅展示本人可编辑歌单。 ([feat · 14348b92](https://github.com/MT-SUPER-POWER/Scopify/commit/14348b9217009ae2666165a54106ab5631ed7ca8))
  <!-- update:legacy-1-5-4-168 -->

- **修复恢复播放时瞬间变音**
  <!-- update:legacy-1-5-4-169 historical -->

- **Monet 海报标题布局**：同步 Folia a36efc1d、57d3f806，为封面外溢与拖动偏移预留标题空间，限制长标题行数并保留下伸字母和重音字形的裁剪余量。
  <!-- update:legacy-1-5-4-170 historical -->

- **Monet 封面切换连续性**：同步 Folia 86531012，保留封面容器并在新封面解码后叠层淡入；快速切歌时保留过渡层，解码失败不清空旧图，最多保留四层。
  <!-- update:legacy-1-5-4-171 historical -->

## v1.5.3

### Added

- **歌词显示设置集中在一页**：在 Folia 设置的歌词控制页调整原文、翻译、罗马音、和声、字体与字幕背景，调整后会保留当前页面。 ([feat · 8c8ea7e1](https://github.com/MT-SUPER-POWER/Scopify/commit/8c8ea7e1d4595f15bb410bbbc566a9d76ff65ce3))
  <!-- update:legacy-1-5-3-185 -->

- **按情绪和场景选择私人 FM**：命令窗口中的私人 FM 支持按情绪、场景、曲风和语种选择音乐，并可直接切歌或查看队列。 ([feat · 8c8ea7e1](https://github.com/MT-SUPER-POWER/Scopify/commit/8c8ea7e1d4595f15bb410bbbc566a9d76ff65ce3))
  <!-- update:legacy-1-5-3-186 -->

- **Folia 分层搜索与可视化选择**：操作模式新增「Folia 设置」入口，将「选择可视化」收进设置内；视觉设置按通用、歌词、背景与和声字幕分层，支持搜索子项名称、描述、关键词及所属层级，并直接打开对应设置分区。 ([feat · 8c8ea7e1](https://github.com/MT-SUPER-POWER/Scopify/commit/8c8ea7e1d4595f15bb410bbbc566a9d76ff65ce3))
  <!-- update:legacy-1-5-3-187 -->

- **直接切换音频输出设备**：在播放条打开输出设备列表即可切换耳机或音箱，也可使用 Ctrl/Cmd+Alt+O 打开面板。 ([feat · 84d3a489](https://github.com/MT-SUPER-POWER/Scopify/commit/84d3a489caf4620502fcee6ac9de237ce0699520))
  <!-- update:legacy-1-5-3-188 -->

- **首页新增新歌、榜单与新碟**：可试听最新歌曲、播放完整榜单，或按页浏览新发行的专辑。 ([feat · 0ce39256](https://github.com/MT-SUPER-POWER/Scopify/commit/0ce39256ace699f0bb44573143a3fd8fb10ec379))
  <!-- update:legacy-1-5-3-189 -->

- **自定义歌词配色与桌面应用**：配色区新增独立命名方案，支持颜色编辑、快捷应用及单项/批量删除，应用时保留字体、布局和动画。 ([feat · 5e6df603](https://github.com/MT-SUPER-POWER/Scopify/commit/5e6df60307153a66a07b14cf97736413720bcb50))
  <!-- update:legacy-1-5-3-190 -->

- **播放条 桌面小歌词入口** ([feat · 5e6df603](https://github.com/MT-SUPER-POWER/Scopify/commit/5e6df60307153a66a07b14cf97736413720bcb50))
  <!-- update:legacy-1-5-3-191 -->

- **歌词样式方案库与播放填色**：支持命名保存完整歌词样式、快捷应用、重命名、更新、单项及批量删除，方案独立持久化。 ([feat · 5e6df603](https://github.com/MT-SUPER-POWER/Scopify/commit/5e6df60307153a66a07b14cf97736413720bcb50))
  <!-- update:legacy-1-5-3-192 -->

- **字幕歌词预览工作台**：借鉴 subtitle-app 的胶囊排版、主副行、中文折叠与流式吐字，将字体、字重、颜色与渐变、宽度、对齐、间距、圆角、模糊和阴影接入外观设置；新增可调时长的淡入、浮入、展开及逐字效果。 ([feat · 5e6df603](https://github.com/MT-SUPER-POWER/Scopify/commit/5e6df60307153a66a07b14cf97736413720bcb50))
  <!-- update:legacy-1-5-3-193 -->

- **主题批量管理**：我的主题新增管理模式，支持多选、全选及批量删除；删除确认列出主题并说明当前背景、每日轮换和时段引用的影响。 ([feat · 8cfe436b](https://github.com/MT-SUPER-POWER/Scopify/commit/8cfe436b1eb1eb9e073aff8d01a0ef2f237b598f))
  <!-- update:legacy-1-5-3-194 -->

- **命名主题与时段轮换**：外观设置分为精选主题与我的主题；支持创建、编辑命名、另存和删除主题，将颜色、强度、渐变范围一同保存到本机。 ([feat · 8cfe436b](https://github.com/MT-SUPER-POWER/Scopify/commit/8cfe436b1eb1eb9e073aff8d01a0ef2f237b598f))
  <!-- update:legacy-1-5-3-195 -->

### Visual

- **Folia 层级与图标**：可视化选择收进 Folia 设置，14 种可视化使用各自的 Phosphor 线性图标；歌词入口使用音符图标，Folia 与 FM 操作图标统一为白色。 ([feat · 8c8ea7e1](https://github.com/MT-SUPER-POWER/Scopify/commit/8c8ea7e1d4595f15bb410bbbc566a9d76ff65ce3))
  <!-- update:legacy-1-5-3-208 -->

- **设置页面标题层级统一**：主题与配色二级页主标题采用设置首页相同的响应式字号与字重。 ([fix · 3acc6ac1](https://github.com/MT-SUPER-POWER/Scopify/commit/3acc6ac1eba49544ccc396748751995e2c0f27a9))
  <!-- update:legacy-1-5-3-209 -->

- **外观二级页标题精简**：移除主题与配色详情标题区下方的分隔线，将“内置 · 只读”收为主标题旁的 Badge。 ([fix · 3dc58b2b](https://github.com/MT-SUPER-POWER/Scopify/commit/3dc58b2b709d07a61530ac3a99e9b2e1f2231824))
  <!-- update:legacy-1-5-3-210 -->

- **外观控件收紧**：移除重复说明与当前主题操作行，查看入口收进卡片悬浮遮罩；字幕设置 Tabs 按内容宽度排列，精简重复标题，新建配色收进分区标题。 ([refactor · 6bb5e939](https://github.com/MT-SUPER-POWER/Scopify/commit/6bb5e939a35d0f115e19da66db74fe1a17c86773))
  <!-- update:legacy-1-5-3-211 -->

- **字幕配色与显示设置分离**：外层即时调整字体、布局、双语、填色和动画；内置配色与我的配色分区展示，二级页面仅保存完整配色字段。 ([refactor · 3c5d617e](https://github.com/MT-SUPER-POWER/Scopify/commit/3c5d617eb498cb4847c8e0d46d9d12f92be9fc3d))
  <!-- update:legacy-1-5-3-212 -->

- **字幕编辑按钮风格统一**：字幕样式与配色的编辑按钮共用网络设置 Ping 按钮的透明底、小圆角、细边框和紧凑间距，并配合小铅笔图标；共用样式定义，保持设置页操作按钮一致。 ([style · c0dd74a4](https://github.com/MT-SUPER-POWER/Scopify/commit/c0dd74a4c8da5af48ad99c042fd58c3e8f6dc176))
  <!-- update:legacy-1-5-3-213 -->

- **主题编辑操作与入口对齐**：移除编辑页局部返回按钮和退出弹窗，导航由全局 顶栏 负责；撤销、另存和保存集中到页面底部。 ([refactor · 0d353f08](https://github.com/MT-SUPER-POWER/Scopify/commit/0d353f08571a9bfb8dd6641550f43572d7c1dfda))
  <!-- update:legacy-1-5-3-214 -->

- **歌词预览操作归位**：预览场景、主行与译文输入移到歌词预览下方，外观设置与字幕编辑页同步使用集中预览区域；标题栏播放、暂停图标改为实心填充。 ([refactor · d0e9bb59](https://github.com/MT-SUPER-POWER/Scopify/commit/d0e9bb59b11c17ab593049b9287a854f57d80d5e))
  <!-- update:legacy-1-5-3-215 -->

- **字幕主题独立编辑页** ([feat · 20c4915d](https://github.com/MT-SUPER-POWER/Scopify/commit/20c4915d0a85b24e134ec8ddc278cc9017da49a5))
  <!-- update:legacy-1-5-3-216 -->

- **背景主题独立编辑页** ([feat · b980e087](https://github.com/MT-SUPER-POWER/Scopify/commit/b980e087fa3ac1db1c81dd442d2cfec1f9d70988))
  <!-- update:legacy-1-5-3-217 -->

- **字幕预览控件精简**：保留原有双栏布局，主行与译文输入统一设置标签和间距，原文语言自动识别并以文字提示；播放/暂停改为预览标题旁的小图标，重播、循环和显隐收进更多菜单，移除进度条，并让暂停停留在当前动画位置。 ([refactor · 2b4fbbf5](https://github.com/MT-SUPER-POWER/Scopify/commit/2b4fbbf587cc2754843f16d03114d719ecfa00e7))
  <!-- update:legacy-1-5-3-218 -->

- **字幕控制状态与入口尺寸**：放大 播放条 字幕图标以补偿图形留白，保持开启与弹层展开的高亮；控制面板可直接切换双语，预览场景及播放按钮按实际状态高亮，重播改为普通动作样式，避免误认为已启用功能。 ([fix · b87f57e2](https://github.com/MT-SUPER-POWER/Scopify/commit/b87f57e28e1ca083734e7afb0a496d4d863813f4))
  <!-- update:legacy-1-5-3-219 -->

- **桌面字幕悬浮工具条**：移除字幕胶囊向下扩散的阴影；窗口控制贴合实际字幕框右上边缘，仅在悬浮或键盘聚焦时出现，扩大按钮点击区域并保留字幕拖动。 ([fix · b5422f4a](https://github.com/MT-SUPER-POWER/Scopify/commit/b5422f4a42f4de8b79005b02c158c18610b4ee66))
  <!-- update:legacy-1-5-3-220 -->

- **艺人热门精选卡片与标题精简**：移除「艺人热门歌曲」分区标题上方冗余的副标题文案；将卡片主标题统一为「{艺人名} 热门精选」；鉴于首页接口无需且无法全量预载每位关注歌手的真实曲目总数，将卡片副标题优化为契合 Spotify 精选风格的「精选最热单曲」，取代死板的歌曲计数。 ([feat · e9fa985f](https://github.com/MT-SUPER-POWER/Scopify/commit/e9fa985f62088c36b8052704b81a4df85275a31a))
  <!-- update:legacy-1-5-3-221 -->

- **官方排行榜 Hero 轮播大卡片**：将官方排行榜重构为四列 Hero 轮播大卡片，左上角标展示官方榜单图，大卡片在 Top 3 歌曲封面间自动平滑交叉淡入淡出；移除底部冗余试听按钮，突出曲目名、歌手与排行动力，鼠标悬浮时提供左右平滑切歌与整榜一键起播控制。 ([feat · e9fa985f](https://github.com/MT-SUPER-POWER/Scopify/commit/e9fa985f62088c36b8052704b81a4df85275a31a))
  <!-- update:legacy-1-5-3-222 -->

- **官方排行榜局部设计提案** ([feat · e9fa985f](https://github.com/MT-SUPER-POWER/Scopify/commit/e9fa985f62088c36b8052704b81a4df85275a31a))
  <!-- update:legacy-1-5-3-223 -->

- **首页排版概念稿**：新增当前首页长截图与 ImageGen 设计提案，统一歌单和新碟网格、收紧活动横幅，并梳理新歌、榜单、播客及歌手的浏览顺序；本次仅产出设计资料，尚未修改首页实现。 ([feat · e9fa985f](https://github.com/MT-SUPER-POWER/Scopify/commit/e9fa985f62088c36b8052704b81a4df85275a31a))
  <!-- update:legacy-1-5-3-224 -->

- **首页播客推荐取消高度折叠限制**：移除播客推荐列表硬编码的高度截断与底部遮罩，默认完整呈现单页推荐内容；展开时仅呼出分页控件进行翻页切换，与首页其他卡片分区保持清爽一致。 ([feat · 0ce39256](https://github.com/MT-SUPER-POWER/Scopify/commit/0ce39256ace699f0bb44573143a3fd8fb10ec379))
  <!-- update:legacy-1-5-3-225 -->

- **字幕预览布局**：移除原尺寸预览及 1440px 缩小画布，直接按可读字号展示并自适应换行；字体、配色与动画设置置于上方，场景文案及播放预览控制统一放在底部，右侧仅显示预览。 ([feat · 5e6df603](https://github.com/MT-SUPER-POWER/Scopify/commit/5e6df60307153a66a07b14cf97736413720bcb50))
  <!-- update:legacy-1-5-3-226 -->

- **重置设置行对齐**：背景与歌词样式的恢复默认操作改为标准设置行，左侧显示重置标题，右侧放置恢复默认按钮，与其余控件保持一致。 ([feat · 8cfe436b](https://github.com/MT-SUPER-POWER/Scopify/commit/8cfe436b1eb1eb9e073aff8d01a0ef2f237b598f))
  <!-- update:legacy-1-5-3-227 -->

- **外观与样式设置**：沿用现有设置页等宽双栏，新增雾银、晨雾、浅苔、暖砂、淡紫及自定义渐变，支持强度、范围、固定或每日轮换预设，实时生效并自动保存；首页、播客与收藏页改用统一背景，保留按时段问候语。 ([feat · 7a822844](https://github.com/MT-SUPER-POWER/Scopify/commit/7a822844bd7d2b94d684457ecdc2563f5689d016))
  <!-- update:legacy-1-5-3-228 -->

- **字幕歌词样式预览**：下方提供字体、字号、文字颜色与底色透明度设置，使用 ImageGen 生成的山雾背景展示单行小横条预览并保存样式；独立桌面字幕歌词窗口尚未接入。 ([feat · 7a822844](https://github.com/MT-SUPER-POWER/Scopify/commit/7a822844bd7d2b94d684457ecdc2563f5689d016))
  <!-- update:legacy-1-5-3-229 -->

- **首页渐变主题选色**：新增独立 HTML 选色预览，提供银灰及低饱和色系的首页场景对照、多选与参数导出，供对照与选择背景主题。 ([feat · 7a822844](https://github.com/MT-SUPER-POWER/Scopify/commit/7a822844bd7d2b94d684457ecdc2563f5689d016))
  <!-- update:legacy-1-5-3-230 -->

### Quality

- **字幕设置共用控件**：设置页和配色编辑共用同一套颜色字段与显示条件，未唱颜色归入配色，预览复用实际字幕组件；字体、填色和动效控件改为受控组件，填色与打字机互斥规则统一到设置更新函数。 ([refactor · 7afeee0a](https://github.com/MT-SUPER-POWER/Scopify/commit/7afeee0a7f13a01542da52aa46e692861d9436a9))
  <!-- update:legacy-1-5-3-232 -->

- **精简桌面小歌词快捷键跳转**：移除桌面小歌词控制面板（DesktopSubtitleControl）中冗余的快捷键设置跳转按钮，保留样式设置入口。 ([feat · 84d3a489](https://github.com/MT-SUPER-POWER/Scopify/commit/84d3a489caf4620502fcee6ac9de237ce0699520))
  <!-- update:legacy-1-5-3-235 -->

### Fixed

- **Folia 设置打开位置与舞台快捷键**：视觉设置和主题工作台从最终位置淡入，移除容易在预览初始化期间停顿的纵向位移动画；弹窗聚焦和焦点恢复不再触发滚动。 ([fix · 5d9998db](https://github.com/MT-SUPER-POWER/Scopify/commit/5d9998dbd0c41818c8f4001c90abb705d43a8c3b))
  <!-- update:legacy-1-5-3-196 -->

- **搜索与操作模式分离**：纯搜索只展示音乐搜索建议和历史记录，Folia、FM 及设置操作保留在操作模式；修复 @ 分类选择的焦点与退出处理，Esc 先收起选择器，再按一次退出搜索，空筛选下退格也可收起选择器。 ([feat · 8c8ea7e1](https://github.com/MT-SUPER-POWER/Scopify/commit/8c8ea7e1d4595f15bb410bbbc566a9d76ff65ce3))
  <!-- update:legacy-1-5-3-197 -->

- **Folia 设置独立模态**：视觉设置与主题工作台迁移至全局按需挂载，舞台、搜索、快捷键和桌面控制器入口不再强制打开 Folia Stage；补齐弹窗层级、键盘焦点及嵌套窗口返回，主题快捷键关闭沿用草稿确认，图片和字体资源变更同步到已打开的舞台。 ([feat · 4d1d2fae](https://github.com/MT-SUPER-POWER/Scopify/commit/4d1d2faec77ec375f7891d5ba6963d46329d0538))
  <!-- update:legacy-1-5-3-198 -->

- **内置背景主题只读详情**：查看当前暖砂等内置主题时保留原名与完整参数，不再进入未命名新主题；主题卡片通过悬浮遮罩提供查看和编辑，新建收敛到我的主题，主动创建副本后才允许修改。 ([fix · e02c7ee1](https://github.com/MT-SUPER-POWER/Scopify/commit/e02c7ee1e4c4f15714c39fa07b94daaba53315a2))
  <!-- update:legacy-1-5-3-199 -->

- **主题编辑页顶部避让**：背景与字幕主题编辑页共用容器增加全局 顶栏 下方的顶部留白，避免标题、返回和保存操作被导航栏遮挡。 ([fix · 0014431e](https://github.com/MT-SUPER-POWER/Scopify/commit/0014431e8c65a680f6058c345b2b9ba5e0594772))
  <!-- update:legacy-1-5-3-200 -->

- **桌面字幕状态即时同步**：窗口开关与置顶、穿透偏好通过事件同步，关闭小窗口后 播放条 立即更新状态；悬浮工具条提供高亮的置顶与双语开关，主窗口和字幕窗口共享双语设置，替代控制面板的定时轮询。 ([fix · de06656c](https://github.com/MT-SUPER-POWER/Scopify/commit/de06656c89d3e2a2847e6556ff7e64186c4fa290))
  <!-- update:legacy-1-5-3-201 -->

- **桌面字幕位置保持**：修改置顶、鼠标穿透或其他窗口偏好时保留用户拖动后的位置，不再跳回屏幕底部。 ([fix · 2eed661b](https://github.com/MT-SUPER-POWER/Scopify/commit/2eed661bfe373ca763c594004162f217fa1e33db))
  <!-- update:legacy-1-5-3-202 -->

- **桌面字幕日语译文漏行**：中文自动折叠结合整首歌词的假名识别，不再把含汉字的日语句子误判为中文；纯汉字且具有不同中文译文的句子也保留双语显示。 ([fix · d955cff5](https://github.com/MT-SUPER-POWER/Scopify/commit/d955cff56264aeadff39bcdfffd11a6fbd1d7854))
  <!-- update:legacy-1-5-3-203 -->

- **最近播放歌单封面与歌曲数修复** ([feat · e9fa985f](https://github.com/MT-SUPER-POWER/Scopify/commit/e9fa985f62088c36b8052704b81a4df85275a31a))
  <!-- update:legacy-1-5-3-204 -->

- **推荐歌单播放量显示条件修正**：修正 GridCard 对播放量的展示门槛，仅在 playCount > 0 时展示播放次数角标，解决部分推荐歌单显示“0次播放”的异常问题。 ([feat · e9fa985f](https://github.com/MT-SUPER-POWER/Scopify/commit/e9fa985f62088c36b8052704b81a4df85275a31a))
  <!-- update:legacy-1-5-3-205 -->

- **字幕预览场景联动**：修正双语场景仅更换文案、未开启译文导致第二行不显示的问题；场景切换同步设置单行、双语及中文折叠，译文不再等待流式主行结束才出现。 ([feat · 5e6df603](https://github.com/MT-SUPER-POWER/Scopify/commit/5e6df60307153a66a07b14cf97736413720bcb50))
  <!-- update:legacy-1-5-3-206 -->

- **主题名称预览**：修正实时预览中主题名称插值格式，显示内置或用户命名主题的真实名称。 ([feat · 8cfe436b](https://github.com/MT-SUPER-POWER/Scopify/commit/8cfe436b1eb1eb9e073aff8d01a0ef2f237b598f))
  <!-- update:legacy-1-5-3-207 -->

## v1.5.2

### Added

- **歌单页面编辑入口**：Action 区的 More 按钮支持点击展开菜单，普通自建歌单可直接编辑封面、名称、描述与标签，并提供复制歌单链接；与侧栏共用权限判断和更新逻辑，保存后同步刷新当前歌单与侧栏。 ([docs · 295192d9](https://github.com/MT-SUPER-POWER/Scopify/commit/295192d9857b41fb2ead15ca2143ca76686fdf4f))
  <!-- update:legacy-1-5-2-243 -->

- **歌单多选批量拖拽与叠层预览**：歌曲列表支持 Shift 区间连选与 Ctrl / Cmd 自由多选，多选拖拽时呈现多卡片 3D 叠层预览，并在拖拽小窗口左上角常驻圆形数字角标显示已选数量；支持 Esc 清空选择。 ([feat · 46d320d8](https://github.com/MT-SUPER-POWER/Scopify/commit/46d320d8b9ae44a60a105c567fe1cfaa1f2f565d))
  <!-- update:legacy-1-5-2-244 -->

- **拖拽至「我喜欢的音乐」一键点赞**：侧边栏「我喜欢的音乐」支持作为放置目标（Drop Target），拖拽单首或多选歌曲悬停时红心发光律动，松手一键批量点赞；播放队列弹窗同样支持反向拖出收藏。 ([feat · 46d320d8](https://github.com/MT-SUPER-POWER/Scopify/commit/46d320d8b9ae44a60a105c567fe1cfaa1f2f565d))
  <!-- update:legacy-1-5-2-245 -->

- **多选右键菜单扩展与单曲动作限制**：多选状态下支持“播放所选（X 首）”直接将所选歌曲组织为新队列并即刻播放；支持“新建歌单并收纳（X 首）”弹窗快速建单并批量关联，以及批量喜欢/入库/入队；自动限制并隐藏“评论”、“查看歌手”、“复制链接”及单首移出等不可复用操作。 ([feat · 46d320d8](https://github.com/MT-SUPER-POWER/Scopify/commit/46d320d8b9ae44a60a105c567fe1cfaa1f2f565d))
  <!-- update:legacy-1-5-2-246 -->

- **Folia 档案歌词模式**：新增独立「档案 / Archive」模式，将歌曲信息、歌词序号、逐词读取和时间码组织为科研档案版式；支持译文或音译、点击歌词跳转、暂停冻结揭示动画、静态与减少动态效果，以及窄屏排版。 ([feat · 45279edc](https://github.com/MT-SUPER-POWER/Scopify/commit/45279edcd3bb92439ef9be108c9c5045bc7c614a))
  <!-- update:legacy-1-5-2-247 -->

- **Folia 莱茵档案背景**：新增独立 Rhine 背景，按需加载 RhineLabUI 档案盒模型与玻璃材质，连接当前歌曲、切歌升降和三种音频律动；暂停保留最后一帧的起伏、升降进度与音频平滑状态，恢复时继续。 ([feat · 594660c9](https://github.com/MT-SUPER-POWER/Scopify/commit/594660c9e47fc79fd0fb50b787128f9ffcaf462a))
  <!-- update:legacy-1-5-2-248 -->

- **歌单与侧栏原位拖拽排序** ([feat · cd16c6e3](https://github.com/MT-SUPER-POWER/Scopify/commit/cd16c6e3d52b5839f0fca407779950de1ced5078))
  <!-- update:legacy-1-5-2-249 -->

- **调整歌单与歌曲顺序** ([feat · cd16c6e3](https://github.com/MT-SUPER-POWER/Scopify/commit/cd16c6e3d52b5839f0fca407779950de1ced5078))
  <!-- update:legacy-1-5-2-250 -->

### Visual

- **音乐厅乐签**：使用 ImageGen 生成的独立棉纸材质与 Paper Shaders 纸张纹理，将乐签重构为主票和可撕票根；歌曲、乐评和日期分别采用衬线、宋体与等宽字体。 ([feat · 2c5c689d](https://github.com/MT-SUPER-POWER/Scopify/commit/2c5c689d258d6b0cc5cc9eea1321112e6ebec601))
  <!-- update:legacy-1-5-2-237 -->

- **头像菜单视觉重构**：按确认稿改为带轻微氛围色的个人菜单，72px 头像与三行用户信息等高对齐，补充明确的个人主页入口；签到区去除嵌套卡片，最近三天使用真实签到状态连接进度线；统一导航图标、行高与右侧箭头，退出登录左对齐并收紧底部留白。 ([docs · 295192d9](https://github.com/MT-SUPER-POWER/Scopify/commit/295192d9857b41fb2ead15ca2143ca76686fdf4f))
  <!-- update:legacy-1-5-2-238 -->

- **侧栏歌单分区**：歌单区域统一组织为「专属音乐」「创建的歌单」「收藏的歌单」三个折叠分区，私人电台与喜欢的音乐归入专属音乐，移除资料库中的重复喜欢入口；保留喜欢歌曲的拖入收藏能力和普通歌单的分组内排序。 ([docs · 295192d9](https://github.com/MT-SUPER-POWER/Scopify/commit/295192d9857b41fb2ead15ca2143ca76686fdf4f))
  <!-- update:legacy-1-5-2-239 -->

- **首页内容布局优化**：推荐卡片改为轻量透明底与更大封面，弱化卡片文字并取消推荐标题中的重复用户名；收紧分区间距、柔化首页氛围背景。 ([docs · 295192d9](https://github.com/MT-SUPER-POWER/Scopify/commit/295192d9857b41fb2ead15ca2143ca76686fdf4f))
  <!-- update:legacy-1-5-2-240 -->

- **歌单多选选中态优化与无感单击**：普通单次点击不再显示任何选中高亮或阴影，仅在使用 Ctrl / Cmd 或 Shift 触发多选时呈现选中态；移除大绿色选中样式，统一沿用行原有 悬停 效果并将其固定（bg-content/10），保持视觉轻量一致。 ([feat · 46d320d8](https://github.com/MT-SUPER-POWER/Scopify/commit/46d320d8b9ae44a60a105c567fe1cfaa1f2f565d))
  <!-- update:legacy-1-5-2-241 -->

- **歌单编辑弹窗视觉体验升级**：弹窗打开时正确呈现歌单既有封面，鼠标悬浮时淡入半透明磨砂“替换封面”遮罩；歌单标签区彻底移除原生粗糙滚动条，改用轻量平滑的 shadcn ScrollArea 组件。 ([docs · 295192d9](https://github.com/MT-SUPER-POWER/Scopify/commit/295192d9857b41fb2ead15ca2143ca76686fdf4f))
  <!-- update:legacy-1-5-2-242 -->

### Fixed

- **侧栏歌单右键权限**：更新与删除仅面向普通自建歌单；喜欢的音乐不显示管理操作，收藏的他人歌单仅提供取消收藏与独立确认文案。 ([docs · 295192d9](https://github.com/MT-SUPER-POWER/Scopify/commit/295192d9857b41fb2ead15ca2143ca76686fdf4f))
  <!-- update:legacy-1-5-2-256 -->

- **私人电台请求与前后顺序**：每次进入电台重新请求歌曲并从新队列首曲开始，隔离换模式、重开电台与后台补歌的请求批次，避免旧响应覆盖新选择；上一首只回溯本轮已播历史，队尾补歌失败时不再循环回首曲，等待补歌期间发生的其他播放操作优先。 ([docs · 295192d9](https://github.com/MT-SUPER-POWER/Scopify/commit/295192d9857b41fb2ead15ca2143ca76686fdf4f))
  <!-- update:legacy-1-5-2-257 -->

- **修复暂停空载时的周期渲染**：播放投影快照字段未变化时复用缓存，不再因每秒心跳生成新对象而通知整组界面订阅者；保留心跳存活检测、真实状态更新与播放位置采样。 ([perf · a96ad923](https://github.com/MT-SUPER-POWER/Scopify/commit/a96ad923e77f4db5db61f5aa32d149b71077004a))
  <!-- update:legacy-1-5-2-258 -->

- **歌单滚动减少重复刷新**：滚动时保留歌曲操作与拖拽状态，减少重复初始化。 ([perf · a96ad923](https://github.com/MT-SUPER-POWER/Scopify/commit/a96ad923e77f4db5db61f5aa32d149b71077004a))
  <!-- update:legacy-1-5-2-259 -->

- **补齐歌曲跨歌单拖放**：单曲与多选歌曲可投放到侧栏自建歌单或「我喜欢的音乐」，统一在拖拽结束时提交并刷新缓存；添加前核对目标权限与完整歌曲 ID，跳过重复歌曲，提示全部重复、部分跳过及失败结果，并解析后端嵌套业务状态，避免失败被当作成功。 ([feat · 46d320d8](https://github.com/MT-SUPER-POWER/Scopify/commit/46d320d8b9ae44a60a105c567fe1cfaa1f2f565d))
  <!-- update:legacy-1-5-2-260 -->

- **固定档案页脚位置**：歌词记录与时间码始终位于底部播放器上方，播放器显隐不再改变页脚高度；矮屏下统一隐藏辅助页脚，避免控制条出现时版式跳动。 ([feat · 45279edc](https://github.com/MT-SUPER-POWER/Scopify/commit/45279edcd3bb92439ef9be108c9c5045bc7c614a))
  <!-- update:legacy-1-5-2-261 -->

- **修复莱茵背景切歌时重新加载**：将莱茵背景挂载到稳定的 Folia 舞台层，歌词壳层只保留背景配置并跳过重复挂载；按歌曲 ID 重建歌词组件或随机切换歌词模式时，继续复用原 Canvas、模型、呼吸相位与切歌展示进度。 ([feat · 594660c9](https://github.com/MT-SUPER-POWER/Scopify/commit/594660c9e47fc79fd0fb50b787128f9ffcaf462a))
  <!-- update:legacy-1-5-2-262 -->

- **修复莱茵背景初始化失败**：适配 Three.js 0.185 的 SMAA 纹理字段，避免旧类型声明对应的空字段触发 reading 'image' 异常；抗锯齿资源监听缺失时不再阻断背景，初始化中途失败也由渲染链统一释放该通道。 ([feat · 594660c9](https://github.com/MT-SUPER-POWER/Scopify/commit/594660c9e47fc79fd0fb50b787128f9ffcaf462a))
  <!-- update:legacy-1-5-2-263 -->

- **修复拖拽落位后滚动闪烁**：落位动画由列表统一记录并仅播放一次，虚拟行滚出后重新进入视口不再重复淡入，也不再重复恢复键盘焦点。 ([feat · cd16c6e3](https://github.com/MT-SUPER-POWER/Scopify/commit/cd16c6e3d52b5839f0fca407779950de1ced5078))
  <!-- update:legacy-1-5-2-265 -->

- **修复整项长按拖拽被提前取消**：移除鼠标长按等待期间的 6 像素位移取消条件，避免按住移动后整次拖拽失效；鼠标持续按住 180 毫秒即可启动，触屏保留滑动滚动所需的位移容差。 ([feat · cd16c6e3](https://github.com/MT-SUPER-POWER/Scopify/commit/cd16c6e3d52b5839f0fca407779950de1ced5078))
  <!-- update:legacy-1-5-2-266 -->

- **队列落位后恢复序号**：松手后立即显示目标行序号，重新悬停时再显示拖拽手柄；避免鼠标操作后的残留焦点持续触发手柄显示。 ([feat · cd16c6e3](https://github.com/MT-SUPER-POWER/Scopify/commit/cd16c6e3d52b5839f0fca407779950de1ced5078))
  <!-- update:legacy-1-5-2-267 -->

- **托盘显示改用普通窗口绘制**：参考主窗口改为不透明宿主；实际卡片挂载与字体首帧绘制，移除托盘透明背景切换及整卡缩放淡入，避免显示过程中空帧和背景切换造成闪烁。 ([fix · 9393288f](https://github.com/MT-SUPER-POWER/Scopify/commit/9393288fd0b2045e31133e28945e2315cdb3d516))
  <!-- update:legacy-1-5-2-268 -->

- **托盘右键防闪与点击位置定位**：右键改为幂等打开，合并短时间重复输入并延迟确认失焦，避免托盘焦点切换引发反复显隐；首次显示等待窗口就绪，以右键时的鼠标坐标为锚点，按当前显示器工作区翻转及约束位置，支持副屏负坐标与隐藏托盘抽屉。 ([fix · 9393288f](https://github.com/MT-SUPER-POWER/Scopify/commit/9393288fd0b2045e31133e28945e2315cdb3d516))
  <!-- update:legacy-1-5-2-269 -->

## v1.5.1

### Added

- **内置后端手动重启**：桌面设置新增“重启内置后端”操作，通过 Main Backend Controller 停止并重新拉起 Scopify 管理的后端进程；外部后端与未启用状态不会被强制接管。 ([feat · 1d8273d0](https://github.com/MT-SUPER-POWER/Scopify/commit/1d8273d0144c0ad41ebdb95dd7d85177e8071c52))
  <!-- update:legacy-1-5-1-270 -->

- **规范 MCP 客户端配置为标准 mcpServers 结构** ([feat · 1d8273d0](https://github.com/MT-SUPER-POWER/Scopify/commit/1d8273d0144c0ad41ebdb95dd7d85177e8071c52))
  <!-- update:legacy-1-5-1-271 -->

- **系统托盘音乐桌面伴随控制独立开关与双向状态同步** ([feat · 8dd1b5a2](https://github.com/MT-SUPER-POWER/Scopify/commit/8dd1b5a2112f626f087d9918d1fb5bb990ede618))
  <!-- update:legacy-1-5-1-272 -->

- **用户菜单补充“音乐足迹”入口** ([feat · 1d8273d0](https://github.com/MT-SUPER-POWER/Scopify/commit/1d8273d0144c0ad41ebdb95dd7d85177e8071c52))
  <!-- update:legacy-1-5-1-273 -->

- **MCP 细粒度受控能力配置** ([feat · 1d8273d0](https://github.com/MT-SUPER-POWER/Scopify/commit/1d8273d0144c0ad41ebdb95dd7d85177e8071c52))
  <!-- update:legacy-1-5-1-274 -->

- **本地 MCP 播放控制与设置** ([feat · 1d8273d0](https://github.com/MT-SUPER-POWER/Scopify/commit/1d8273d0144c0ad41ebdb95dd7d85177e8071c52))
  <!-- update:legacy-1-5-1-275 -->

- **Windows Native Audio Host** ([feat · af720782](https://github.com/MT-SUPER-POWER/Scopify/commit/af720782442fedc5826dc0f42822cdb7a9f3ecaf))
  <!-- update:legacy-1-5-1-276 -->

- **私人 FM 右键减少推荐**：私人 FM 虚拟歌单中的歌曲右键菜单现可执行“不喜欢 / 减少推荐”；操作通过歌单组件契约透传至既有的私人 FM 负反馈流程，不影响普通歌单与日推菜单。 ([feat · ebd7dd51](https://github.com/MT-SUPER-POWER/Scopify/commit/ebd7dd51a0e1fede6e3025cdb2baac6b27e3f310))
  <!-- update:legacy-1-5-1-277 -->

### Visual

- **统一 MCP 客户端凭据单按钮入口与内嵌重新生成** ([feat · 1d8273d0](https://github.com/MT-SUPER-POWER/Scopify/commit/1d8273d0144c0ad41ebdb95dd7d85177e8071c52))
  <!-- update:legacy-1-5-1-287 -->

- **托盘音乐桌面核心伴随功能规范化**：系统托盘菜单对齐音乐桌面定义，聚焦于“桌面动态壁纸”与“悬浮控制器”两大核心功能，移除与音乐桌面无关的桌面歌词条目；采用统一图标 + 标题 + Switch 开关布局，优化窗口高度比例，统一悬浮高亮与响应体验。 ([feat · 8dd1b5a2](https://github.com/MT-SUPER-POWER/Scopify/commit/8dd1b5a2112f626f087d9918d1fb5bb990ede618))
  <!-- update:legacy-1-5-1-288 -->

- **MCP 受控权限二级弹窗重构** ([feat · 1d8273d0](https://github.com/MT-SUPER-POWER/Scopify/commit/1d8273d0144c0ad41ebdb95dd7d85177e8071c52))
  <!-- update:legacy-1-5-1-289 -->

- **首页对齐搜索页固定宽度布局**：为首页（HomePage）正常内容、加载占位（HomePageSkeleton）及网络异常重试容器添加 mx-auto w-full max-w-400 居中限制，外层背景与昼夜渐变层保持全宽满屏铺满，彻底解决超宽屏下首页各板块组件被过度拉伸的问题。 ([fix · 098066ff](https://github.com/MT-SUPER-POWER/Scopify/commit/098066ff1c8b29020267bcb101a5a8ff88791aa7))
  <!-- update:legacy-1-5-1-290 -->

### Quality

- **建立可演进的跨端播放平台边界**
  <!-- update:legacy-1-5-1-299 historical -->

### Fixed

- **修复登录与托盘窗口静态资源协议错误** ([fix · 5b922cfb](https://github.com/MT-SUPER-POWER/Scopify/commit/5b922cfb0c017ef9e853495b97596a70b4c0fb1d))
  <!-- update:legacy-1-5-1-278 -->

- **解除内置后端 CORS 跨域限制以适配本地开发** ([fix · 23c1c5db](https://github.com/MT-SUPER-POWER/Scopify/commit/23c1c5db39bc7a3c38150afa71a942eecf676d2f))
  <!-- update:legacy-1-5-1-279 -->

- **收敛未登录状态下的功能与占位昵称渲染**：修复未登录或本地持久化残留无效账号（如 userId: 0 或占位符 "未知用户"）时误判登录态的问题。
  <!-- update:legacy-1-5-1-280 historical -->

- **恢复音乐会话凭据本地持久化与请求拦截器自动注入**：解决打包后 Electron 生产环境（app:// 协议）与跨域 Web 环境下，因 Chromium 第三方跨站 Cookie 隔离导致扫码登录后 Cookie 无法持久化、请求缺少凭据返回 301 并被误判登出的缺陷。
  <!-- update:legacy-1-5-1-281 historical -->

- **修复系统托盘单击唤出与伴随窗口控制权限** ([feat · 1d8273d0](https://github.com/MT-SUPER-POWER/Scopify/commit/1d8273d0144c0ad41ebdb95dd7d85177e8071c52))
  <!-- update:legacy-1-5-1-282 -->

- **修复桌面音乐控制器最小化后无法主动唤出问题** ([feat · 1d8273d0](https://github.com/MT-SUPER-POWER/Scopify/commit/1d8273d0144c0ad41ebdb95dd7d85177e8071c52))
  <!-- update:legacy-1-5-1-283 -->

- **统一当前歌曲喜欢 Mutation 链路** ([fix · 70dea976](https://github.com/MT-SUPER-POWER/Scopify/commit/70dea97612b6a1d82a11b9412d248f11a953ad9c))
  <!-- update:legacy-1-5-1-284 -->

- **歌单曲目删除权限收敛**：歌单行右键的“从歌单移除”现在只会在已登录用户查看自己创建的真实歌单时出现并创建删除回调；匿名访问、他人歌单、日推/历史日推及其他虚拟歌单均会安全地隐藏该操作。 ([feat · ebd7dd51](https://github.com/MT-SUPER-POWER/Scopify/commit/ebd7dd51a0e1fede6e3025cdb2baac6b27e3f310))
  <!-- update:legacy-1-5-1-285 -->

- **歌曲喜欢/取消喜欢 Mutation 与多端缓存失效** ([fix · 098066ff](https://github.com/MT-SUPER-POWER/Scopify/commit/098066ff1c8b29020267bcb101a5a8ff88791aa7))
  <!-- update:legacy-1-5-1-286 -->

## v1.5.0

### Added

- **听歌足迹周报历史日历周期切换** ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-310 -->

- **最近播放听歌足迹二级页** ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-311 -->

- **个人听歌报告与最近播放虚拟歌单**：个人主页新增累计听歌时长；最近播放歌曲改为最近歌单区域内可进入的虚拟歌单，详情页展示累计、本周和本月听歌时长。 ([feat · 5821e87d](https://github.com/MT-SUPER-POWER/Scopify/commit/5821e87db9604efd71c2c48396071eb269483883))
  <!-- update:legacy-1-5-0-312 -->

- **桌面歌词实用功能与设置面板重构**：将桌面歌词设置从调试期测试按钮重构为 4 项实用功能控制面板。 ([feat · 7d74caec](https://github.com/MT-SUPER-POWER/Scopify/commit/7d74caec57399d1e42f484212cdf56d0342e770a))
  <!-- update:legacy-1-5-0-314 -->

- **私人电台虚拟歌单**：私人电台现可作为动态歌单进入复用的歌单详情页；播放、暂停与切歌仍沿用原有的私人电台推荐流，场景与模式选择收纳为仅在 FM 播放时显示的 PlayBar 控制面板，不依赖 LyricStage。 ([feat · 71a5839e](https://github.com/MT-SUPER-POWER/Scopify/commit/71a5839e7268792099ec6a796068f96d17a931cb))
  <!-- update:legacy-1-5-0-315 -->

- **歌手热门歌曲二级页**：热门歌曲请求现在一次最多获取 200 首；歌手主页保留前 10 首预览，“查看全部”进入复用歌单详情结构的完整歌曲列表，并使用对应歌手封面。 ([feat · 71282340](https://github.com/MT-SUPER-POWER/Scopify/commit/71282340f4ec8199a710df2e5f1012af770aed31))
  <!-- update:legacy-1-5-0-316 -->

- **接入系统媒体控制 (SMTC / MediaSession)** ([feat · a179a641](https://github.com/MT-SUPER-POWER/Scopify/commit/a179a64181c64d4a8859809756c6d4043cb5d250))
  <!-- update:legacy-1-5-0-317 -->

- **新增主窗口命令工作区** ([feat · db4986b2](https://github.com/MT-SUPER-POWER/Scopify/commit/db4986b2cbdf0d212601a3ee631a2f4c8b858f5a))
  <!-- update:legacy-1-5-0-318 -->

- **命令工作区播放队列拖拽排序与富媒体信息**：移除上下移冗余按钮，支持原生拖拽手柄与直接拖放重排队列；每一项补充歌曲封面缩略图、正在播放状态高亮、歌手与专辑独立跳转链接，并在悬浮时提供“下一首播放”与“从队列移除”快捷操作。 ([feat · fc4ae05b](https://github.com/MT-SUPER-POWER/Scopify/commit/fc4ae05b2dbea128144b94022db3e4926201e9cf))
  <!-- update:legacy-1-5-0-319 -->

- **新增音频设置与桌面音乐控制器快捷键**：补充“打开/关闭音频设置”（默认 Ctrl+Alt+A）与“打开/关闭桌面音乐控制器”（默认 Ctrl+Alt+D）快捷键命令；同时将播放队列、音频设置及快捷键设置接入桌面音乐控制器聚焦快捷键列表。 ([feat · e75d90c1](https://github.com/MT-SUPER-POWER/Scopify/commit/e75d90c1d9acc82cd050429dfe9524b7c129ffce))
  <!-- update:legacy-1-5-0-320 -->

- **桌面音乐壁纸快捷键**：新增独立的“开启/关闭桌面音乐壁纸”命令（默认 Ctrl+Alt+P），直接复用现有壁纸开关；原有 Ctrl+Alt+D 的普通桌面控制器开关保持不变。 ([feat · fc5aa989](https://github.com/MT-SUPER-POWER/Scopify/commit/fc5aa9897c66185781e86210478d09e739408fb6))
  <!-- update:legacy-1-5-0-321 -->

### Visual

- **听歌足迹荣誉纹章升级**：初次打开页面的单一全勤胶囊替换为置于左上留白的橄榄叶独立纹章；移除卡片边框、底色和重复的“荣誉”标签，让衬线奖项名、奖杯和出勤天数由完整的香槟金桂冠环抱。 ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-323 -->

- **2.5D 热力图引入 Streaks 连续在场指标小卡片与动态连续立柱高度** ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-324 -->

- **细化雷达图端点与描边线条（Radar Dot & Stroke Refinement）**：将雷达图顶点圆点半径由粗重的 4px 缩减为精致的 2px，描边宽度收窄至 1.5px，仅在鼠标悬停时提供聚焦放大微动效，大幅提升极坐标图形的精致度与轻盈感。 ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-325 -->

- **听歌报告「音乐在你的生活里怎样出现」去除 AI 式冗余说教标题与多余图标** ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-326 -->

- **听歌报告底部总结升级为大块沉浸式收官横幅（Grand Finale Banner）** ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-328 -->

- **听歌报告「陪伴艺人」左侧肖像向右淡色渐变重构**：统一 Top 1/2/3 艺人卡片规格，左侧展示歌手艺术肖像封面并辅以向右自然过渡的柔和渐变消融（bg-linear-to-r from-transparent to-surface-raised），右侧优雅排布大字号艺人名称与收听频次，完美对齐设计图视觉质感。 ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-329 -->

- **听歌报告「封面底片」双行上下错位水平跑马灯升级**：移除生成海报按钮与模态弹窗；将底片封面墙升级为双行上下错位、左右双向平滑流动的水平跑马灯画廊（一行向左、一行向右交错循环），两侧辅以暗调柔和渐变消融，大幅提升动态流动美感。 ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-330 -->

- **听歌报告「你反复回到的声音」全局 Section 对齐与横向展台排版** ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-331 -->

- **听歌报告 Hero 动态跑马灯海报墙与满屏初次打开页面升级** ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-332 -->

- **听歌报告页面 顶栏 工具栏精简**：移除冗余的返回按钮，仅保留单行年月/周选择器、周期 Tabs 与刷新操作（ListeningReport顶栏）。 ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-333 -->

- **按设计图收敛 /recent/report 页面视觉**：报告路由保持现有应用壳层与真实业务数据链路，只在页面内容区域对齐沉浸式唱片内页的英雄区、排行、节奏、艺人、审美与底片归档布局。 ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-334 -->

- **听歌报告 /recent/report 视觉重构与 GitHub 热力图融合**：针对最新设计稿对听歌足迹页面进行 1:1 像素级视觉重构，包括。 ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-335 -->

- **将听歌足迹重构为个人音乐肖像** ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-336 -->

- **桌面壁纸保持纯 Stage**：主窗口进入 WorkerW 形态后只挂载 Folia 视觉 Stage，不渲染应用 顶栏、侧栏、底部 播放条、Stage 浮动播放控制与视觉设置按钮；恢复普通主窗口后这些 chrome 才重新出现。 ([refactor · 0bb4f149](https://github.com/MT-SUPER-POWER/Scopify/commit/0bb4f14975e6ba8ecf9352543fd9f1a66d3ae34e))
  <!-- update:legacy-1-5-0-337 -->

- **重构命令工作区「正在播放」视图** ([feat · 1c15fc23](https://github.com/MT-SUPER-POWER/Scopify/commit/1c15fc239b2fdae4f65b08db3422d2153b5f2a2c))
  <!-- update:legacy-1-5-0-338 -->

- **统一导航栏搜索与命令工作区悬浮胶囊选框** ([feat · fc4ae05b](https://github.com/MT-SUPER-POWER/Scopify/commit/fc4ae05b2dbea128144b94022db3e4926201e9cf))
  <!-- update:legacy-1-5-0-339 -->

- **优化精选活动 Banner 焦点层级与主体尺寸** ([feat · 92fbee39](https://github.com/MT-SUPER-POWER/Scopify/commit/92fbee39d2db144ea44bd1f79598fd03e8b61358))
  <!-- update:legacy-1-5-0-340 -->

- **统一快捷键设置页的分栏节奏**：快捷键分组现复用设置页的双栏布局与章节标题；搜索和恢复默认操作收束到同一工具区，命令行不再以全宽分隔线切割页面。 ([refactor · 350e5329](https://github.com/MT-SUPER-POWER/Scopify/commit/350e532920fddd163aa1a3aad3cf55b5de825887))
  <!-- update:legacy-1-5-0-341 -->

- **精简输出设备页签**：播放栏音频设置的输出设备页签去除重复的内部标题与说明，设备选择器和刷新操作合并为单行工具条。 ([fix · 9aa70a26](https://github.com/MT-SUPER-POWER/Scopify/commit/9aa70a26c78dc4450a84081c1e73708a979871c9))
  <!-- update:legacy-1-5-0-342 -->

- **改善均衡器预设控制的阅读性**：预设标签不再因狭窄空间被拆成竖排，改为常规字号与不换行布局；控件空间不足时保持整组换行，避免文字与选择框相互挤压。 ([fix · 9aa70a26](https://github.com/MT-SUPER-POWER/Scopify/commit/9aa70a26c78dc4450a84081c1e73708a979871c9))
  <!-- update:legacy-1-5-0-343 -->

- **收纳音频输出设备选择**：播放栏音频设置不再将每一台系统输出设备平铺成列表，改为单个全宽下拉选择器；保留默认设备、长名称、设备刷新、加载与错误反馈，并确保其菜单在音频设置浮层之上展开。 ([fix · 9aa70a26](https://github.com/MT-SUPER-POWER/Scopify/commit/9aa70a26c78dc4450a84081c1e73708a979871c9))
  <!-- update:legacy-1-5-0-344 -->

- **收敛个人菜单视觉层级** ([fix · 488e2c27](https://github.com/MT-SUPER-POWER/Scopify/commit/488e2c274fcccfddd6058e9019c8065cc7b5874f))
  <!-- update:legacy-1-5-0-345 -->

- **补齐 PlayBar、设置与桌面音乐控制器 Hovertips**：PlayBar 音频设置按钮、播放队列浮层触发按钮以及桌面音乐控制器启动按钮接入统一的 ShortcutHint 提示条；桌面音乐控制器的壁纸快捷开关与编辑 Folia 设置按钮补齐规范的 Tooltip 浮层与按键提示。 ([feat · e75d90c1](https://github.com/MT-SUPER-POWER/Scopify/commit/e75d90c1d9acc82cd050429dfe9524b7c129ffce))
  <!-- update:legacy-1-5-0-346 -->

- **优化设置项与音频输入输出设备排版** ([fix · d96db357](https://github.com/MT-SUPER-POWER/Scopify/commit/d96db3574b145810ebaef8b06e1ed804b96eeb7a))
  <!-- update:legacy-1-5-0-347 -->

- **替换命令工作区原生滚动条**：命令、搜索、队列和曲目列表采用覆盖式 ScrollArea，将可视高度直接交给 viewport，滚动条不再挤压列表内容。 ([fix · 92479a38](https://github.com/MT-SUPER-POWER/Scopify/commit/92479a382f49807c2aa26447635efbba96322055))
  <!-- update:legacy-1-5-0-348 -->

- **补齐命令工作区快捷键与搜索范围**：快捷操作使用完整组合键胶囊，搜索入口明确支持歌曲、歌手、专辑、歌单、播客和声音结果。 ([feat · a179a641](https://github.com/MT-SUPER-POWER/Scopify/commit/a179a64181c64d4a8859809756c6d4043cb5d250))
  <!-- update:legacy-1-5-0-349 -->

- **调整命令工作区的快捷操作与视觉层级**：Ctrl+Shift+P 现在可再次按下关闭工作区；命令图标按实际播放、音量、歌词、侧栏、全屏、评论等功能区分，并将工作区由绿色强调收敛回原搜索弹层的中性黑白层级。 ([feat · db4986b2](https://github.com/MT-SUPER-POWER/Scopify/commit/db4986b2cbdf0d212601a3ee631a2f4c8b858f5a))
  <!-- update:legacy-1-5-0-350 -->

- **重做快捷键帮助视图**：改为参考面板的单列深色全高布局，补齐常用命令分组、动作图标、独立按键胶囊与细滚动条，同时保留现有快捷键注册与本地化数据。 ([feat · db4986b2](https://github.com/MT-SUPER-POWER/Scopify/commit/db4986b2cbdf0d212601a3ee631a2f4c8b858f5a))
  <!-- update:legacy-1-5-0-351 -->

- **收束快捷键帮助弹窗尺寸**：保留内部滚动与参考页的信息层级，但改为带遮罩、圆角和上下留白的居中固定尺寸窗口，避免占用整个屏幕。 ([feat · db4986b2](https://github.com/MT-SUPER-POWER/Scopify/commit/db4986b2cbdf0d212601a3ee631a2f4c8b858f5a))
  <!-- update:legacy-1-5-0-352 -->

- **补充设置页快捷键辨识度**：保留既有设置页的标题与分组布局；图标与命令名称对齐且不再添加底框，组合键仅保留右对齐的独立胶囊，并以编辑按钮进入录制状态。 ([feat · db4986b2](https://github.com/MT-SUPER-POWER/Scopify/commit/db4986b2cbdf0d212601a3ee631a2f4c8b858f5a))
  <!-- update:legacy-1-5-0-353 -->

- **收束搜索历史悬停状态**：普通搜索与命令工作区的分类 token 默认贴齐右侧；悬停时由同位置的删除按钮替换，不再预留空白槽位，并在鼠标离开普通搜索行时清除残留高亮。 ([fix · 1dcf0111](https://github.com/MT-SUPER-POWER/Scopify/commit/1dcf011138a51d2c1cae83289bd01559f4567c38))
  <!-- update:legacy-1-5-0-354 -->

- **按使用频率排列命令工作区操作**：搜索、正在播放、播放队列、设置等一级入口和快捷操作统一按持久化的使用次数降序排列；直接按下窗口快捷键与在工作区点选都会累计次数，同频时沿用原有注册顺序。 ([feat · 92fbee39](https://github.com/MT-SUPER-POWER/Scopify/commit/92fbee39d2db144ea44bd1f79598fd03e8b61358))
  <!-- update:legacy-1-5-0-355 -->

- **补齐命令工作区 Folia 与桌面设置入口**：设置页现分别直达 Folia 视觉设置和主题库，并复用既有快捷键打开对应界面；桌面播放设置仅在 Electron 桌面运行时显示，Web 端不再出现不可用入口。 ([feat · 7d74caec](https://github.com/MT-SUPER-POWER/Scopify/commit/7d74caec57399d1e42f484212cdf56d0342e770a))
  <!-- update:legacy-1-5-0-356 -->

- **协调命令工作区设置列表层级**：设置页保留工作区的排版与紧凑节奏，同时使用轻微内缩的圆角选择框作为悬停反馈，避免全宽高亮在低密度二级页中过于突兀。 ([feat · 7d74caec](https://github.com/MT-SUPER-POWER/Scopify/commit/7d74caec57399d1e42f484212cdf56d0342e770a))
  <!-- update:legacy-1-5-0-357 -->

### Fixed

- **避免年度报告混入月度歌曲排行**：年度听歌足迹不再为补齐列表而请求并展示仅支持周/月维度的歌曲排行，缺少年度排行时改用年度报告自身的代表歌曲数据，避免把当月偏好误标为全年结论。 ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-362 -->

- **听歌足迹与主页数据更准确**：修复听歌足迹请求失败、个人主页时长和最近歌单信息显示异常的问题。 ([feat · 325fa83a](https://github.com/MT-SUPER-POWER/Scopify/commit/325fa83a7c8160fa874b4f153fd7156c88194296))
  <!-- update:legacy-1-5-0-363 -->

- **WorkerW 壁纸完整覆盖显示器** ([refactor · 0bb4f149](https://github.com/MT-SUPER-POWER/Scopify/commit/0bb4f14975e6ba8ecf9352543fd9f1a66d3ae34e))
  <!-- update:legacy-1-5-0-365 -->

- **播放队列控制与排序**：播放栏队列现支持拖拽调整；当前曲目改走真实播放切换，不再以本地状态覆写实际媒体；移除歌曲和拖拽排序统一委托播放队列状态机。 ([feat · fc5aa989](https://github.com/MT-SUPER-POWER/Scopify/commit/fc5aa9897c66185781e86210478d09e739408fb6))
  <!-- update:legacy-1-5-0-366 -->

- **未登录隐藏私人电台入口与保护详情页** ([feat · 92fbee39](https://github.com/MT-SUPER-POWER/Scopify/commit/92fbee39d2db144ea44bd1f79598fd03e8b61358))
  <!-- update:legacy-1-5-0-367 -->

- **Folia 浅色主题的均衡器可读性**：音频均衡器的文字、弱化说明和滑轨不再继承应用全局深色 token，改为从当前 Folia 主题派生前景色；浅色主题下的频段与音色效果信息现可清晰辨识。 ([fix · 237bcf2d](https://github.com/MT-SUPER-POWER/Scopify/commit/237bcf2daca085c8907a0be5486157dfebbd27b7))
  <!-- update:legacy-1-5-0-368 -->

- **Folia 设置关闭的画面连续性**：打开视觉设置时不再卸载 Lyric Stage 主画面，仅暂停实时采样；关闭设置会直接恢复原有画面，避免画布重新初始化造成突兀的退出感。 ([fix · 2a482866](https://github.com/MT-SUPER-POWER/Scopify/commit/2a4828661acd1c68db6f5a303395a706e584eb1b))
  <!-- update:legacy-1-5-0-369 -->

- **Folia 设置与主题库快捷键的关闭行为**：Ctrl+Shift+,（macOS 为 Cmd+Shift+,）和 Ctrl+Shift+.（macOS 为 Cmd+Shift+.）现会在对应面板已打开时仅关闭该弹窗并留在 Lyric Stage，不再误触舞台开关快捷键的退出行为。 ([fix · 2a482866](https://github.com/MT-SUPER-POWER/Scopify/commit/2a4828661acd1c68db6f5a303395a706e584eb1b))
  <!-- update:legacy-1-5-0-370 -->

- **桌面运行减少重复读写**：减少后台反复读取配置和写入日志的开销。 ([feat · 18de2e50](https://github.com/MT-SUPER-POWER/Scopify/commit/18de2e503fc0bedb0e9013a746da96e47a18aef5))
  <!-- update:legacy-1-5-0-371 -->

- **保持直接搜索的 @ 筛选状态**：命令工作区在输入搜索词时不再把草稿同步回全局搜索状态，避免父级重置已选择的筛选 token；仅在确认搜索后再提交关键词并跳转到对应分类结果页。 ([feat · a179a641](https://github.com/MT-SUPER-POWER/Scopify/commit/a179a64181c64d4a8859809756c6d4043cb5d250))
  <!-- update:legacy-1-5-0-372 -->

- **保留最近搜索的 @ 分类**：搜索历史现在记录关键词及其结果分类；命令工作区与顶部搜索下拉会在带筛选的记录右侧展示原始 @ token，点击后恢复对应搜索 Tab，旧的纯文本记录安全兼容为“全部”结果。 ([feat · 18de2e50](https://github.com/MT-SUPER-POWER/Scopify/commit/18de2e503fc0bedb0e9013a746da96e47a18aef5))
  <!-- update:legacy-1-5-0-373 -->

## v1.4.9

### Added

- **接入私人电台沉浸播放** ([feat · 8e89c953](https://github.com/MT-SUPER-POWER/Scopify/commit/8e89c953c9158720656856714f1fc33a302265d4))
  <!-- update:legacy-1-4-9-374 -->

- **歌单操作区支持收藏他人歌单**：在歌单详情页 Action Station 中为非当前用户创建的第三方歌单提供收藏 / 取消收藏切换按钮（官方日推等特殊歌单自动排除），收藏状态实时联动侧边栏与缓存。 ([feat · 8e89c953](https://github.com/MT-SUPER-POWER/Scopify/commit/8e89c953c9158720656856714f1fc33a302265d4))
  <!-- update:legacy-1-4-9-375 -->

- **播客单集页与播客资料库全量多维排序** ([feat · 8e89c953](https://github.com/MT-SUPER-POWER/Scopify/commit/8e89c953c9158720656856714f1fc33a302265d4))
  <!-- update:legacy-1-4-9-376 -->

- **评论区支持多维排序模式**：评论区顶部新增排序控制器，支持“默认排序 / 最新发布 / 最早发布（远古神评） / 点赞最多”模式无缝切换。 ([feat · 8e89c953](https://github.com/MT-SUPER-POWER/Scopify/commit/8e89c953c9158720656856714f1fc33a302265d4))
  <!-- update:legacy-1-4-9-377 -->

### Visual

- **协调侧边栏导航与私人电台视觉表现**：统一资料库各页面项使用中性灰色路由激活高亮（bg-content/10 text-content），解耦路由导航与音频播放源状态；私人电台在播放期间通过绿色文本与跳动音频声波（PlayingAnimation）标识活跃状态，折叠与展开态均保持语义清晰且互不冲突。 ([feat · 8e89c953](https://github.com/MT-SUPER-POWER/Scopify/commit/8e89c953c9158720656856714f1fc33a302265d4))
  <!-- update:legacy-1-4-9-378 -->

- **优化评论底部操作栏与展示 IP 属地** ([feat · 8e89c953](https://github.com/MT-SUPER-POWER/Scopify/commit/8e89c953c9158720656856714f1fc33a302265d4))
  <!-- update:legacy-1-4-9-379 -->

- **评论区支持“精彩评论”与“最新评论”Tabs 分页切换**：将长列表纵向堆叠的精彩评论与最新评论重构为现代化 Tabs 选项卡，附带各自评论数量指示，并支持平滑切换与针对最新评论的独立无限滚动加载。 ([feat · 8e89c953](https://github.com/MT-SUPER-POWER/Scopify/commit/8e89c953c9158720656856714f1fc33a302265d4))
  <!-- update:legacy-1-4-9-380 -->

### Fixed

- **补齐 Folia v0.7 P0 正确性修复** ([fix · c18b4591](https://github.com/MT-SUPER-POWER/Scopify/commit/c18b4591fbcec47d20f831d72626651a316fb11d))
  <!-- update:legacy-1-4-9-381 -->

- **修复歌单与播客表格表头 # 与序号列未居中对齐问题**：在 TrackTable 与 RadioTracklistTable 中为表头 # 元素补充统一的 size-4 居中容器，使表头 # 符号与数据行序号/播放控件中心轴线精确对齐。 ([feat · 8e89c953](https://github.com/MT-SUPER-POWER/Scopify/commit/8e89c953c9158720656856714f1fc33a302265d4))
  <!-- update:legacy-1-4-9-382 -->

- **修复 Folia 沉浸设置面板运行期引用异常**：补全 FoliaStageSettings 中 isChromeHidden 属性解构与抽屉顶部封面预览所需的当前歌曲选择器，修复在私人电台或任意模式下点击 Visual Settings 面板时报 ReferenceError 的问题。 ([refactor · 4789b34e](https://github.com/MT-SUPER-POWER/Scopify/commit/4789b34e446cebfc4664d6abc63403d687ff5e7f))
  <!-- update:legacy-1-4-9-383 -->

- **修复播客节目表格排序字段属性读取**：纠正 RadioTracklistTable 播放量排序比对逻辑中使用的属性，统一对齐 RadioProgram 标准字段 listenerCount。 ([refactor · 4789b34e](https://github.com/MT-SUPER-POWER/Scopify/commit/4789b34e446cebfc4664d6abc63403d687ff5e7f))
  <!-- update:legacy-1-4-9-384 -->

## v1.4.8

### Added

- **同步 Folia v0.7.0 视觉与播放能力**：新增完整的 Tempera / 凝彩动态歌词视觉系统及 121 种构图、最多 16 张自定义画布图片、后处理与质量控制；新增 Still 静态歌词模式、播放面板与设置页中的音频输入输出设备管理，以及支持逐字时序、翻译和罗马音轨道的 AWLRC 导入。 ([feat · 5eb13880](https://github.com/MT-SUPER-POWER/Scopify/commit/5eb138808e82ecd7742e9959c80b87fc97b8de0a))
  <!-- update:legacy-1-4-8-385 -->

- **补全专辑评论能力**：专辑页操作区新增评论入口与评论数徽标，评论页支持加载专辑信息、浏览、发布、回复、点赞和删除专辑评论。 ([feat · 0a696a8e](https://github.com/MT-SUPER-POWER/Scopify/commit/0a696a8e1c4d50114edea0bf3ff3c875f867a628))
  <!-- update:legacy-1-4-8-386 -->

### Fixed

- **修复 Folia 主题库收纳与拖拽交互**：收纳状态完整展示全部主题唱片并移除当前主题角标，统一左右分栏的拖拽手柄样式；拖动主题库向右展开时不再被折叠状态强制收回，避免侧栏反复滚动与项目裁切。 ([fix · d5eb3034](https://github.com/MT-SUPER-POWER/Scopify/commit/d5eb30346191a2f9f55999427db7dfeb48b6f281))
  <!-- update:legacy-1-4-8-387 -->

- **修复伴随窗口后端 Toast 与启动期查询停滞**：Tray、桌面歌词、播放控制器、壁纸、登录窗和关闭窗不再承载主窗口的后端故障 Toast；self 后端从启动或错误状态恢复为 running 时会自动重拉当前活跃且失败的 Query，避免 侧栏 歌单因首次请求早于后端监听而永久停在“重试”。 ([fix · 582b5ca8](https://github.com/MT-SUPER-POWER/Scopify/commit/582b5ca8a3e79f2b061c759c1319b2e27303c41c))
  <!-- update:legacy-1-4-8-388 -->

- **恢复 Windows 系统托盘 Logo**：Desktop Host 构建同步复制运行时资源，并让通知区域使用独立的 32×32 Scopify PNG，避免直接运行静态 Host 时因资源缺失或单层大尺寸 ICO 缩放失败而显示空白图标。 ([fix · 582b5ca8](https://github.com/MT-SUPER-POWER/Scopify/commit/582b5ca8a3e79f2b061c759c1319b2e27303c41c))
  <!-- update:legacy-1-4-8-389 -->

- **关闭桌面附属窗口后释放资源**：不再使用的附属窗口会释放对应界面资源。 ([perf · f95e5317](https://github.com/MT-SUPER-POWER/Scopify/commit/f95e5317c0fc04f0f01c737a264cc0a2ed299ea0))
  <!-- update:legacy-1-4-8-390 -->

- **恢复 Hovertips 填充色**：将共享 UI 组件目录显式加入 Web 的 Tailwind 扫描范围，避免 Tooltip 等工作区组件的背景与填充工具类在最终 CSS 中被裁掉。 ([fix · d130fff1](https://github.com/MT-SUPER-POWER/Scopify/commit/d130fff1c89c5d809147ea4ad2e37a1176e7435d))
  <!-- update:legacy-1-4-8-391 -->

- **同步桌面歌词时间轴**：桌面歌词窗口与正在播放的 Folia 歌词统一应用全局歌词偏移，避免桌面歌词比主歌词提前。 ([fix · d130fff1](https://github.com/MT-SUPER-POWER/Scopify/commit/d130fff1c89c5d809147ea4ad2e37a1176e7435d))
  <!-- update:legacy-1-4-8-392 -->

- **修复关闭行为无法记住** ([fix · d130fff1](https://github.com/MT-SUPER-POWER/Scopify/commit/d130fff1c89c5d809147ea4ad2e37a1176e7435d))
  <!-- update:legacy-1-4-8-393 -->

- **后端启动不再阻塞主界面**：桌面端会在后台启动内置后端，不再等待固定超时或显示启动失败弹框；失败状态改为应用内非阻塞提醒，并可直接打开设置调整或重新启动后端。 ([fix · d130fff1](https://github.com/MT-SUPER-POWER/Scopify/commit/d130fff1c89c5d809147ea4ad2e37a1176e7435d))
  <!-- update:legacy-1-4-8-394 -->

## v1.4.7

### Added

- **新增 UI Library 主题实验台**：Shadcn 文档可实时编辑标准 Token 并导出单份主题 CSS；Scopify 文档将 Shadcn 基础与 --scopify-* 扩展分开编辑和导出，两套实验台都支持浅色、深色、隔离组件预览、重置、复制与 CSS 下载。 ([feat · 490ec132](https://github.com/MT-SUPER-POWER/Scopify/commit/490ec132243fc703d21f5660a18acf4e575c067a))
  <!-- update:legacy-1-4-7-396 -->

- **集成 Mermaid 图表与交互式全屏查看器**：支持在 MDX 中以独立 .mmd / .mermaid 文件形式编写并导入图表，提供全屏模态预览、鼠标滚轮缩放（40%~400%）、鼠标平移拖拽与复制源码能力，并在「产品能力」页面补充了功能图谱。 ([feat · 96300037](https://github.com/MT-SUPER-POWER/Scopify/commit/9630003760852b5cb1b140b5527dc1b7dc045b81))
  <!-- update:legacy-1-4-7-401 -->

- **接入 LLMs 与 Markdown 导出能力** ([feat · a22f5937](https://github.com/MT-SUPER-POWER/Scopify/commit/a22f59376514032391ae3de02950b3f0dbcc4e0b))
  <!-- update:legacy-1-4-7-402 -->

- **支持文档页面操作与 AI 快捷打开**：在文档页面顶部提供一键复制 Markdown 与跳转打开至 GitHub、ChatGPT、Claude、Cursor 等 AI 工具的交互操作栏，并补全中文本地化词条。 ([feat · badf3ff8](https://github.com/MT-SUPER-POWER/Scopify/commit/badf3ff8e41b1c1eebaaf90271803e021dc6de88))
  <!-- update:legacy-1-4-7-403 -->

- **拆分 Framework 路线图与发布文档** ([feat · badf3ff8](https://github.com/MT-SUPER-POWER/Scopify/commit/badf3ff8e41b1c1eebaaf90271803e021dc6de88))
  <!-- update:legacy-1-4-7-406 -->

- **补充新增接口指南** ([docs · 3cb9eb84](https://github.com/MT-SUPER-POWER/Scopify/commit/3cb9eb84d271d9215b59545e0e526778dc406fd1))
  <!-- update:legacy-1-4-7-409 -->

- **扩充 Framework 文档**：根据仓库 README 重组产品能力、技术栈、开发启动、系统架构、部署运行、路线图与发布规范，并复用现有产品截图形成可浏览的项目知识入口。 ([feat · 6f080d82](https://github.com/MT-SUPER-POWER/Scopify/commit/6f080d826720fba01eea19cd355901e85bc45bea))
  <!-- update:legacy-1-4-7-411 -->

- **新增 Scopify Docs 文档工作台** ([feat · 21345a9b](https://github.com/MT-SUPER-POWER/Scopify/commit/21345a9b93af7a4d639a154dfbb5972cbcb3781d))
  <!-- update:legacy-1-4-7-412 -->

### Visual

- **重做 Folia 主题编辑工作台**：主题库改为可调宽并可折叠的缩略图轨道，Preview 获得主要画面空间并显示亮暗模式、编辑状态、渲染模式、主题主色组、暂停与重播；保存并应用固定在顶部，切换或关闭时会保护未保存草稿。 ([feat · 24d99658](https://github.com/MT-SUPER-POWER/Scopify/commit/24d996589f6a2227a20de816eb70fda916c85417))
  <!-- update:legacy-1-4-7-413 -->

- **让初次打开页面 slogan 自身成为一次性 Folia 云阶**：移除重复的静态大标题和循环歌词背景，以“让声音，显形。 ([fix · 9df5d9f2](https://github.com/MT-SUPER-POWER/Scopify/commit/9df5d9f2da3d71b4fb3fda965cebb37c3df2ae07))
  <!-- update:legacy-1-4-7-414 -->

- **将落地页片尾改为产品索引**：收小单一巨型标语，补充网易云音乐、Folia 与桌面体验三条具体能力，并将文档和源码入口提升为清晰的片尾行动区。 ([fix · d98bf3b7](https://github.com/MT-SUPER-POWER/Scopify/commit/d98bf3b7b1d7c9fa89ac2af6f6a704fee511e737))
  <!-- update:legacy-1-4-7-415 -->

- **用真实 Folia 云阶丰富落地页开幕**：初次打开页面在隐现流体上加载 Partita 的阶梯排版、引导线与逐字高光，进入下一幕时退出并卸载，再由 Sonnet 接管后续演出。 ([feat · 7056c679](https://github.com/MT-SUPER-POWER/Scopify/commit/7056c6798c672bb3df4cad1708f765411d4f8254))
  <!-- update:legacy-1-4-7-416 -->

- **将真实界面幕改为逐屏放映**：移除截断画面的超大标题和三图拼贴，将主界面、桌面 Folia 与动态歌词拆成三幕连续的全屏画面，让真实截图按原生滚动逐张进入。 ([fix · d8b6f244](https://github.com/MT-SUPER-POWER/Scopify/commit/d8b6f244aed861696a4419370f29da22201b1c79))
  <!-- update:legacy-1-4-7-417 -->

- **将 Folia 落地页扩展为五幕视觉作品**：在自主播放的 Sonnet 演出后加入实时歌词切片装置、由三张真实软件截图组成的无重叠产品影像墙与独立尾声，让页面在保持原生滚动和克制文案的前提下拥有完整的视觉叙事。 ([feat · 9792a095](https://github.com/MT-SUPER-POWER/Scopify/commit/9792a095c7639553fd1daaa3e325b07d7ff7cc57))
  <!-- update:legacy-1-4-7-418 -->

- **将公开落地页重做为单一 Sonnet 数字作品**：删除临时 顶栏、时间码、章节刻度、多模式切换与超长 Sticky，改为三屏原生滚动；Folia 全程自主播放，结尾自然显露真实软件界面与项目入口。 ([feat · 1a46133d](https://github.com/MT-SUPER-POWER/Scopify/commit/1a46133dc7ef81625e1deffdcd1d41ea77ba3015))
  <!-- update:legacy-1-4-7-419 -->

- **将公开落地页收敛为 Folia 电影分镜**：滚动时间轴直接驱动真实的商籁、镜台与云阶渲染器，让歌词、镜头与桌面界面按同一段无声节奏推进。 ([feat · d9c84428](https://github.com/MT-SUPER-POWER/Scopify/commit/d9c84428e34233be916ad3c16002c5a59f706132))
  <!-- update:legacy-1-4-7-420 -->

- **新增 Scopify 公开落地页** ([feat · 7c7e5c3f](https://github.com/MT-SUPER-POWER/Scopify/commit/7c7e5c3f96b7c44e937c8f71b3e042fa268c325a))
  <!-- update:legacy-1-4-7-421 -->

- **重编产品能力主文档** ([docs · aa6ccf91](https://github.com/MT-SUPER-POWER/Scopify/commit/aa6ccf9195e05952b01540efdfa74a1e415ecf53))
  <!-- update:legacy-1-4-7-423 -->

- **补充文档侧栏底部操作栏**：在 Scopify Docs 侧栏底部加入 GitHub 图标入口，并与主题切换控件分列两端，形成固定的仓库与外观快捷操作区。 ([feat · 6f080d82](https://github.com/MT-SUPER-POWER/Scopify/commit/6f080d826720fba01eea19cd355901e85bc45bea))
  <!-- update:legacy-1-4-7-425 -->

### Fixed

- **修复桌面内置后端启动被 npm 版本检查阻塞** ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-7-432 -->

- **自定义服务地址不再被覆盖**：使用自定义服务地址时，自动启动本地服务不会替换你的设置。 ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-7-433 -->

- **修复 Docs 代码示例缩进丢失与字体回退** ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-7-435 -->

- **修复主题选择器遗漏 Scopify 默认主题**：将 shadcn-default 与 scopify-default 统一注册为内置主题；Scopify 默认主题会同时读取 Shadcn 基础 Token 和 Scopify 扩展 Token，确保 UI Library 的局部主题切换展示完整主题能力。 ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-7-436 -->

- **修复落地页 Sonnet 拖动与内容重叠**：商籁改用独立的无声播放时钟持续循环，滚动只负责切换章节；章节标题在 Folia 接管画面前自动退场，桌面截图显影时不再与大字争夺视觉焦点。 ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-7-437 -->

- **修复 Folia 隐现流体切歌后停帧**：增加可见状态检测与自动重挂载，解决跨歌单右键切歌时 WebGL 流体停滞的问题。 ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-7-438 -->

- **修复 Electron 内置后端未就绪时主页面提前加载**：桌面端启用本地后端自动启动时，启动页会等待后端健康检查确认运行后再创建主窗口；启动失败时提供重试或退出，不再让初次打开页面请求直接落入错误页；使用自定义后端时不增加启动门槛。 ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-7-439 -->

## v1.4.6

### Added

- **新增设置页快捷键入口** ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-6-443 -->

- **推荐播客声音支持独立刷新与文案对齐** ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-6-444 -->

- **首页全板块展开支持分页直达** ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-6-445 -->

- **新增 Electron 内置后端生命周期管理** ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-6-446 -->

- **默认启用 Electron 内置后端** ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-6-447 -->

- **调整本地后端启动控制位置**：将自动启动开关、端口与运行状态提示归入桌面端设置，网络设置专注于后端连接地址和 Ping 检测。 ([fix · e3881df9](https://github.com/MT-SUPER-POWER/Scopify/commit/e3881df9b4c7e8dfdaabd165dbb58a8459954955))
  <!-- update:legacy-1-4-6-448 -->

### Visual

- **整理 Folia 侧栏音频与视觉快捷设置** ([fix · fe859094](https://github.com/MT-SUPER-POWER/Scopify/commit/fe85909403fccb67c244f17e2e507d5db2661426))
  <!-- update:legacy-1-4-6-450 -->

- **统一 Folia 动画参数卡片边界**：将浮名等 7 类动画参数面板写死的白色描边改为跟随 Folia 次要色 token，恢复浅色主题下缺失的圆角边框，并保持深色与自定义主题一致。 ([fix · fe859094](https://github.com/MT-SUPER-POWER/Scopify/commit/fe85909403fccb67c244f17e2e507d5db2661426))
  <!-- update:legacy-1-4-6-451 -->

- **恢复 Folia 全局背景与歌词动画的展开式选择**：全局背景类型和动画模式重新使用原有的预设选项组，直接展示全部模式及当前选中高光；各模式内部的局部参数继续使用紧凑按钮，避免全局选择也被压缩成单个下拉入口。 ([fix · fe859094](https://github.com/MT-SUPER-POWER/Scopify/commit/fe85909403fccb67c244f17e2e507d5db2661426))
  <!-- update:legacy-1-4-6-452 -->

- **拆分 Folia 音频设置与 PlayBar 弹层**：Folia 侧栏改用自身的紧凑音质选择器，并新增独立均衡器模态；原“歌词样式”统一更名为“Folia 设置”，通用页在主题与字体设置下方新增歌词全局设置卡片，时间偏移统一通过 Folia 模态调整，均衡器只保留在音频设置中。 ([fix · fe859094](https://github.com/MT-SUPER-POWER/Scopify/commit/fe85909403fccb67c244f17e2e507d5db2661426))
  <!-- update:legacy-1-4-6-453 -->

- **补齐 Folia 侧栏设置面板的视觉交互与预设入口**：在可视化设置弹窗的 Common/字幕 分区补齐 range 滑条即时回调，音量与主题相关 slider 拖拽时不再“抬指才生效”；并让主题快捷入口与预设网格同屏展示，补上主题预设按钮状态与落盘逻辑，形成可点击的预设入口。 ([fix · fe859094](https://github.com/MT-SUPER-POWER/Scopify/commit/fe85909403fccb67c244f17e2e507d5db2661426))
  <!-- update:legacy-1-4-6-454 -->

- **统一常规设置前端主机输入框右对齐**：为 GeneralSettingsTab 中的「前端主机」输入框补充 align="right" 配置，与端口号及网络设置输入框保持统一的右对齐输入风格。 ([refactor · f1db852c](https://github.com/MT-SUPER-POWER/Scopify/commit/f1db852c1fab743830abde4bb2374c44f0218a61))
  <!-- update:legacy-1-4-6-455 -->

- **统一板块顶栏分页导航并优化 HomeGreeting 排版** ([refactor · ed9b54b1](https://github.com/MT-SUPER-POWER/Scopify/commit/ed9b54b13116fd6916ad27596104b77f6a4c3f28))
  <!-- update:legacy-1-4-6-457 -->

- **拉开首页各 Section 标题与卡片内容间距**：将 CollapsibleSection 及活动轮播区的标题与内容间距统一调整为 space-y-6（24px），主页外层间距调整为 space-y-10（40px），并同步加载占位尺寸与轮播标题排版，消除标题与卡片列表过近紧贴的问题。 ([feat · 0004a9ba](https://github.com/MT-SUPER-POWER/Scopify/commit/0004a9bade65c8647d771568189fcd625c7c32e4))
  <!-- update:legacy-1-4-6-458 -->

- **补充本地后端设置状态提示**：在桌面端设置中新增自动启动开关、端口配置和运行状态小圆点，启用本地后端时自动将 Ping 与请求目标切换到本机地址。 ([refactor · f1db852c](https://github.com/MT-SUPER-POWER/Scopify/commit/f1db852c1fab743830abde4bb2374c44f0218a61))
  <!-- update:legacy-1-4-6-459 -->

- **完善日志与诊断设置**：新增单个日志文件大小限制，以及打开当前 main.log 和日志目录的快捷操作；日志清理只针对归档文件，不会删除当前会话日志。 ([feat · 78b8d4c4](https://github.com/MT-SUPER-POWER/Scopify/commit/78b8d4c487264aa732a9965e0a176e87cb819db8))
  <!-- update:legacy-1-4-6-460 -->

### Fixed

- **修复内置后端 Logo 被压成单行**
  <!-- update:legacy-1-4-6-465 historical -->

- **修复 electron-log 文件写入失败**：内置文件 transform 完成格式化后会传递字符串，改为对最终日志文本进行清理，避免错误调用 data.map 导致 main.log 始终为空。
  <!-- update:legacy-1-4-6-466 historical -->

- **移除登录页重复的未登录提示** ([fix · eb37535d](https://github.com/MT-SUPER-POWER/Scopify/commit/eb37535d4cf6736433bfef4bb0af77ec00f6df44))
  <!-- update:legacy-1-4-6-468 -->

- **修复桌面端版本更新后登录状态丢失** ([refactor · 48535792](https://github.com/MT-SUPER-POWER/Scopify/commit/485357926393a1cb8d20930e096b4b181e17fc8f))
  <!-- update:legacy-1-4-6-471 -->

- **降低 LoFi 预设默认驱动**：将二段效果台的 LoFi 驱动从 28% 调整为 5%，保留颗粒、摆动与噪声质感，同时减少默认预设的过载失真。 ([docs · 3ca80bfc](https://github.com/MT-SUPER-POWER/Scopify/commit/3ca80bfc10ba527b5d123464bc2995556b813217))
  <!-- update:legacy-1-4-6-472 -->

- **修复 ReplayGain 无效与均衡器破音** ([docs · 3ca80bfc](https://github.com/MT-SUPER-POWER/Scopify/commit/3ca80bfc10ba527b5d123464bc2995556b813217))
  <!-- update:legacy-1-4-6-473 -->

- **修复全局歌词偏移模态在浅色主题下不可读**：模态 Portal 显式接入 Folia 背景、正文、辅助与强调色 token，并让遮罩、卡片描边、刻度文字和中心指示线随当前主题变化，避免雪白主题下出现白字白底。 ([docs · 3ca80bfc](https://github.com/MT-SUPER-POWER/Scopify/commit/3ca80bfc10ba527b5d123464bc2995556b813217))
  <!-- update:legacy-1-4-6-474 -->

- **修复 Folia 背景类型回退英文**：为通用、莫奈、漫游与隐现背景的注册项补齐 folia. 翻译命名空间，使展开式背景选择正确显示当前语言文案；嵌入与空背景继续沿用已有的正确翻译键。 ([docs · 3ca80bfc](https://github.com/MT-SUPER-POWER/Scopify/commit/3ca80bfc10ba527b5d123464bc2995556b813217))
  <!-- update:legacy-1-4-6-475 -->

- **补齐 Monet 漫游背景新增效果翻译**：补充背景漂移、漂移幅度和流动光带的简体中文、繁体中文与英文文案，避免原始 i18n key 撑出 Folia 设置面板。 ([docs · 3ca80bfc](https://github.com/MT-SUPER-POWER/Scopify/commit/3ca80bfc10ba527b5d123464bc2995556b813217))
  <!-- update:legacy-1-4-6-476 -->

## v1.4.5

### Added

- **新增后端主机格式合法性校验与即时提示**：引入合规性校验规则，支持标准 IPv4、IPv6、localhost 及多级域名，拒绝格式错误、非法字符及非法顶级域名；当输入非法格式时即时高亮红框并展示多语言错误提示，并在 Ping 和保存时进行强校验拦截。
  <!-- update:legacy-1-4-5-480 historical -->

### Visual

- **优化后端主机设置项描述与对齐排版**
  <!-- update:legacy-1-4-5-479 historical -->

### Quality

- **修复播放器状态单测的隔离污染与 Action 丢失**
  <!-- update:legacy-1-4-5-481 historical -->

### Fixed

- **修复设置页后端主机输入被 0.0.0. 劫持问题**：废弃 cleanBackendHostInput 中依赖 WHATWG URL 整数 IP 解析的副作用逻辑，避免打字输入数字时被自动格式化为 0.0.0.x；输入框实时输入与失焦清洗逻辑解耦，用户打字时保持原生输入状态。
  <!-- update:legacy-1-4-5-477 historical -->

- **修复音量拖拽条延迟生效问题**：VolumeControl 的滑块回调改为随拖拽即时同步音量，移除拖拽过程中的延迟提交策略，恢复真实“跟随滚动条变化”体验，避免仅在手指/鼠标抬起时才变更音量。 ([fix · fd3d2bff](https://github.com/MT-SUPER-POWER/Scopify/commit/fd3d2bffa2eb1593901b47ad8708746b1fa45c91))
  <!-- update:legacy-1-4-5-478 -->

## v1.4.4

### Added

- **补齐 Voice 与歌单评论/喜欢交互** ([feat · 9099eb9f](https://github.com/MT-SUPER-POWER/Scopify/commit/9099eb9f9a292db11e4052620f81e9bea4040495))
  <!-- update:legacy-1-4-4-485 -->

- **开发者工具接入快捷键与命令体系**：桌面端启动时不再自动打开 DevTools；设置项改为运行时访问权限开关，无需重启即可生效，并新增默认 F12 的“打开/关闭开发者工具”命令供快捷键系统与命令面板统一调用。 ([feat · f941d1eb](https://github.com/MT-SUPER-POWER/Scopify/commit/f941d1eb835d258fb05b529b3cb417aacf99dba0))
  <!-- update:legacy-1-4-4-486 -->

- **补齐 Scopify 错误与 404 页面**：在 Next.js 原生错误边界基础上使用 Scopify 语义 token 与清爽的文字排版，状态码采用本地打包的 Black Ops One 展示字体，并补充多语言错误说明、重试与返回主页操作以及覆盖无匹配路由的根级 404 页面。 ([feat · dc0daafe](https://github.com/MT-SUPER-POWER/Scopify/commit/dc0daafe9baa9c2f7f569ce3a37c0b8d79650834))
  <!-- update:legacy-1-4-4-487 -->

### Visual

- **优化评论 Action 数量展示**：评论数量改用共享 shadcn Badge，以深色半透明描边气泡轻叠在评论图标右上角，避免高对比气泡与图标脱节，同时不占用操作栏横向空间。 ([feat · 9099eb9f](https://github.com/MT-SUPER-POWER/Scopify/commit/9099eb9f9a292db11e4052620f81e9bea4040495))
  <!-- update:legacy-1-4-4-488 -->

- **优化评论页流式布局与评论数展示** ([feat · 9099eb9f](https://github.com/MT-SUPER-POWER/Scopify/commit/9099eb9f9a292db11e4052620f81e9bea4040495))
  <!-- update:legacy-1-4-4-495 -->

### Fixed

- **修复歌单跳转时头部加载占位隐形与排版跳动问题** ([refactor · 3fbc1e1b](https://github.com/MT-SUPER-POWER/Scopify/commit/3fbc1e1bb41ab30ceb208c1bc080f3a9bafa3743))
  <!-- update:legacy-1-4-4-496 -->

- **修复添加/删除歌单单曲后侧边栏封面与歌单内容不同步问题** ([feat · f941d1eb](https://github.com/MT-SUPER-POWER/Scopify/commit/f941d1eb835d258fb05b529b3cb417aacf99dba0))
  <!-- update:legacy-1-4-4-497 -->

- **修复设置页后端地址规范化时丢失自定义端口的问题** ([feat · f941d1eb](https://github.com/MT-SUPER-POWER/Scopify/commit/f941d1eb835d258fb05b529b3cb417aacf99dba0))
  <!-- update:legacy-1-4-4-498 -->

## v1.4.3

### Quality

- **收敛桌面播放 Authority**：彻底移除未启用的隐藏播放 Renderer、专用 preload、会话控制协议、恢复检查点、路由与构建门禁；桌面主 Renderer 继续独占媒体元素、队列与播放 Authority，伴随窗口仅通过可靠 Playback Broker 消费投影。 ([refactor · 8e6c6036](https://github.com/MT-SUPER-POWER/Scopify/commit/8e6c60366f414ea4ba39e694bf4b0e3593360786))
  <!-- update:legacy-1-4-3-503 -->

### Fixed

- **修复 GitHub Packages 发布工作流 409 Conflict 异常**
  <!-- update:legacy-1-4-3-506 historical -->

## v1.4.2

### Added

- **新增 GitHub Package 自动化发布支持** ([feat · f941d1eb](https://github.com/MT-SUPER-POWER/Scopify/commit/f941d1eb835d258fb05b529b3cb417aacf99dba0))
  <!-- update:legacy-1-4-2-515 -->

- **统一搜索窗口支持以 > 前缀搜索并执行命令；Ctrl + Shift + P 会直接打开命令查询**
  <!-- update:legacy-1-4-2-516 historical -->

- **命令候选按设备本地累计使用次数排序，并继续支持上下方向键和 Enter 操作**
  <!-- update:legacy-1-4-2-517 historical -->

- **桌面端设置新增“桌面歌词”独立配置与测试卡片**：支持一键开/关桌面歌词悬浮窗口测试，并实时配置保持窗口置顶、鼠标穿透与隐藏任务栏图标。 ([feat · 6b602c22](https://github.com/MT-SUPER-POWER/Scopify/commit/6b602c227451dcde4241600099f77be205d1ead8))
  <!-- update:legacy-1-4-2-518 -->

- **新增独立缓存清理页**：按页面、播放地址、在线歌词及用户歌词数据分类展示条目数和占用空间，支持分组勾选、二次确认与选择性清理。 ([feat · 6b602c22](https://github.com/MT-SUPER-POWER/Scopify/commit/6b602c227451dcde4241600099f77be205d1ead8))
  <!-- update:legacy-1-4-2-519 -->

### Visual

- **优化歌手详情页布局**：歌手“简介”卡片与热门歌曲区域同级并支持 Sticky 悬浮跟随（浏览热门歌曲列表时在右侧保持固定），“音乐作品”保持独立全宽下沉显示，并支持点击简介卡片查看全量歌手介绍弹窗。
  <!-- update:legacy-1-4-2-507 historical -->

- **移动桌面端设置中的 Discord “连接测试” 控制项至 Discord 设置分组卡片内**
  <!-- update:legacy-1-4-2-508 historical -->

- **移除设置页面上的强行满屏最小高度与双层背景卡片约束，使布局自然根据配置表单内容自适应贴合**
  <!-- update:legacy-1-4-2-509 historical -->

- **优化 Discord 与后端连接测试行布局**：将连接状态指示标签（如 Discord已接通、后端可用 · 16 ms · v4.39.0）调整至“连接测试”标题旁紧凑排列，右侧仅保留测试操作按钮。 ([refactor · e6b2e48a](https://github.com/MT-SUPER-POWER/Scopify/commit/e6b2e48a3657b9971f4786f382cec995034a7af4))
  <!-- update:legacy-1-4-2-510 -->

- **设置项说明更完整**：开发者工具、关闭行为、网络、诊断和播放缓存等选项增加清楚的解释。 ([feat · 6300971a](https://github.com/MT-SUPER-POWER/Scopify/commit/6300971a42abb6fc24ed7682fd162654ec6191ee))
  <!-- update:legacy-1-4-2-511 -->

- **侧边栏 Scopify 图标与品牌名称增加点击跳转到首页功能** ([feat · 6b602c22](https://github.com/MT-SUPER-POWER/Scopify/commit/6b602c227451dcde4241600099f77be205d1ead8))
  <!-- update:legacy-1-4-2-512 -->

- **重构存储设置页为 3 个独立分组（通用设置、页面缓存、播放数据缓存）**：通用缓存目录置于独立的“通用设置”分组，页面与播放缓存的开关及高级参数分别归属于各自的标题下，“数据占用”与“清理缓存”按钮移动至各分组末尾。 ([feat · c003818c](https://github.com/MT-SUPER-POWER/Scopify/commit/c003818c9723c1951c80ad2402a51b2fab1084d6))
  <!-- update:legacy-1-4-2-513 -->

- **优化“清理缓存”独立页面的视觉样式**：移除多余的页面内重复返回按钮与副标题，标题与刷新按钮严格约束在 max-w-4xl 内容容器宽度内对齐；底部“清理所选”操作栏重构为居中悬浮圆角卡片（Floating Action Bar），并增加平滑淡入淡出动效。 ([feat · c003818c](https://github.com/MT-SUPER-POWER/Scopify/commit/c003818c9723c1951c80ad2402a51b2fab1084d6))
  <!-- update:legacy-1-4-2-514 -->

### Fixed

- **修复页面缓存与播放缓存共用目录和清理范围的问题；桌面端改为独立子目录并安全迁移旧缓存，Web 端改用分区 IndexedDB 存储** ([feat · 6b602c22](https://github.com/MT-SUPER-POWER/Scopify/commit/6b602c227451dcde4241600099f77be205d1ead8))
  <!-- update:legacy-1-4-2-528 -->

- **修复安装版桌面壁纸被判为不支持**：Windows 安装版可以正确识别桌面壁纸功能的支持情况。 ([refactor · e6b2e48a](https://github.com/MT-SUPER-POWER/Scopify/commit/e6b2e48a3657b9971f4786f382cec995034a7af4))
  <!-- update:legacy-1-4-2-529 -->

- **桌面控制器跟随应用明暗主题**：切换歌词主题时，控制器保留全局明暗配色。
  <!-- update:legacy-1-4-2-530 historical -->

- **移除桌面控制器 Folia 外观面板中的冗余说明、图标与标题，保留全部提示与确认功能**
  <!-- update:legacy-1-4-2-531 historical -->

- **修复 Audio Feature Broker 仅授权壁纸窗口、遗漏桌面播放控制器订阅的问题；壁纸与控制器均以各自受限的 Electron sender 身份连接，沉浸式视觉不再因**
  <!-- update:legacy-1-4-2-532 historical -->

- **Windows 桌面端按下 Alt 不再显示原生 Electron 菜单栏**
  <!-- update:legacy-1-4-2-533 historical -->

- **桌面端新增 Discord Rich Presence**：在设置中填入 Scopify 的 Discord Application ID 并启用后，可同步当前曲目、封面、播放状态与进度。
  <!-- update:legacy-1-4-2-534 historical -->

- **Discord Rich Presence 默认使用 Scopify Application ID 1536959813114658836 并在新配置中启用**
  <!-- update:legacy-1-4-2-535 historical -->

- **修复 Discord Rich Presence 将曲目名重复显示为副标题或封面说明的问题；封面说明优先显示专辑名**：后端 Ping 的成功与失败结果也统一通过 Toast 提示，不再滞留在设置行内。
  <!-- update:legacy-1-4-2-538 historical -->

- **修复主窗口收纳或隐藏后桌面背景流光间断的问题**：音频特征由主 Renderer 以独立 33 ms 时钟采样，并由壁纸 Renderer 自己按 rAF 平滑、衰减；Publisher 与 Subscriber 端口断开后都会独立重连。 ([refactor · 8e6c6036](https://github.com/MT-SUPER-POWER/Scopify/commit/8e6c60366f414ea4ba39e694bf4b0e3593360786))
  <!-- update:legacy-1-4-2-539 -->

- **修复高分辨率与高 DPI 桌面上 Dithering 流光被过度放大、只能看到局部闪烁的问题；Shader 像素尺度现在会补偿实际渲染降采样比例**
  <!-- update:legacy-1-4-2-540 historical -->

## v1.4.1

### Fixed

- **修复乐签硬编码问题**
  <!-- update:legacy-1-4-1-550 historical -->

- **修复生产环境默认开启 devTools 的问题**
  <!-- update:legacy-1-4-1-551 historical -->

## v1.4.0

### Added

- **诊断页显示真实日志位置**：需要排查问题时，可以从诊断页找到实际使用的日志文件。
  <!-- update:legacy-1-4-0-554 historical -->

- **Folia 音量平衡操作**
  <!-- update:legacy-1-4-0-562 historical -->

- **桌面歌词功能**
  <!-- update:legacy-1-4-0-563 historical -->

- **主题色切换接入**
  <!-- update:legacy-1-4-0-564 historical -->

### Visual

- **完善桌面端“客户端更新”状态**：显示最近检查时间，适配浅/深色主题，并清晰呈现更新失败消息。
  <!-- update:legacy-1-4-0-552 historical -->

- **首页问候语根据登录状态显示用户名，增强个性化体验**
  <!-- update:legacy-1-4-0-553 historical -->

- **VisualSetting 界面内容重新分布**
  <!-- update:legacy-1-4-0-555 historical -->

### Fixed

- **设置保存确认框改为全局 Portal 模态，避免 顶栏 与 PlayBar 显示在遮罩之上**
  <!-- update:legacy-1-4-0-565 historical -->

- **断开后端时，歌单页会保留 顶栏 骨架占位，避免操作栏和曲目表直接顶到页面顶部**
  <!-- update:legacy-1-4-0-566 historical -->

- **首页全部公共内容请求失败时，保留时间问候和动态背景，并显示简洁的网络重试状态**
  <!-- update:legacy-1-4-0-567 historical -->

- **修复 播放条 音量控制图标 Hover 时音量面板与 Tooltip 冲突的问题（移除冗余 Hover Tooltip，恢复悬停展开音量调节面板，并完好保留全局键盘快捷键响应）**
  <!-- update:legacy-1-4-0-568 historical -->

- **修复 Electron 安装包移除 source map 后导致 renderer 完整性校验失败、应用无法启动的问题**
  <!-- update:legacy-1-4-0-570 historical -->

- **登陆界面返回我们的全局 header 会失去颜色的问题**
  <!-- update:legacy-1-4-0-571 historical -->

- **侧边栏目的响应式是伪响应式**
  <!-- update:legacy-1-4-0-572 historical -->

- **宽度不够的时候，会导致歌单列表一部分头顶内容渲染为空**
  <!-- update:legacy-1-4-0-573 historical -->

- **关闭软件作为一个独立窗口，不再作为一个内部模态，防止特殊情况下无法关闭的问题**
  <!-- update:legacy-1-4-0-574 historical -->

- **修复了浅色主题下快捷键硬编码看不到的问题**
  <!-- update:legacy-1-4-0-575 historical -->

## v1.3.0

### Added

- **在设置中检查服务连接**：设置后端地址后可检查连接，确认服务是否可用。
  <!-- update:legacy-1-3-0-576 historical -->

- **连接检查支持不同协议**：按配置的协议检查服务地址。
  <!-- update:legacy-1-3-0-577 historical -->

### Quality

- **Folia 沉浸式歌词优化 Sonnet/v2**
  <!-- update:legacy-1-3-0-578 historical -->

- **Folia Subtitle 优化副歌词显示内容**
  <!-- update:legacy-1-3-0-579 historical -->

### Fixed

- **修复 播放条 有些时候播放缓存的歌曲失效但是不会重发请求的问题**
  <!-- update:legacy-1-3-0-581 historical -->

- **修复日志的问题**
  <!-- update:legacy-1-3-0-582 historical -->

## v1.2.0-beta.2

### Fixed

- **Web 后端按 .env.development / .env.production 分层，并支持完整 HTTP/HTTPS URL，避免线上请求被 mixed-content 策**
  <!-- update:legacy-1-2-0-beta-2-598 historical -->

## v1.1.0

### Added

- **歌词舞台 重做，改为 Folia 的动态歌词效果**
  <!-- update:legacy-1-1-0-601 historical -->

- **Lyric 多做了一个 Theme 库管理部分**
  <!-- update:legacy-1-1-0-602 historical -->

- **添加了快捷键机制**
  <!-- update:legacy-1-1-0-603 historical -->

- **登陆界面的轮播图**
  <!-- update:legacy-1-1-0-604 historical -->

- **重做侧边结构，独立资料库和播放歌单**
  <!-- update:legacy-1-1-0-605 historical -->

- **推荐界面新增热门声音推荐列**
  <!-- update:legacy-1-1-0-606 historical -->

- **播放条 悬浮提示条**
  <!-- update:legacy-1-1-0-607 historical -->

- **闭环播客功能**
  <!-- update:legacy-1-1-0-608 historical -->

- **侧栏 新增资源库功能，为个人单位的资源做了一个单位库**
  <!-- update:legacy-1-1-0-609 historical -->

- **新增副歌歌词的圆环特效** ([fix · ffb44e38](https://github.com/MT-SUPER-POWER/Scopify/commit/ffb44e38f4b7fa5f3e65cef65e1082c69ed65ea0))
  <!-- update:legacy-1-1-0-610 -->

- **新增播放条与进度条副歌（Chorus）高亮区间与起始打点标记** ([feat · 036b7ded](https://github.com/MT-SUPER-POWER/Scopify/commit/036b7dedb5bccaa87d05d89dfb44a61e30bb7729))
  <!-- update:legacy-1-1-0-611 -->

- **支持 Folia 全屏歌词控制栏与底栏播放条同步高亮显示副歌区间** ([feat · 036b7ded](https://github.com/MT-SUPER-POWER/Scopify/commit/036b7dedb5bccaa87d05d89dfb44a61e30bb7729))
  <!-- update:legacy-1-1-0-612 -->

- **搜索结果支持滚动出现更多的内容**
  <!-- update:legacy-1-1-0-623 historical -->

### Fixed

- **修复了歌词显示的时候浮动点的问题** ([fix · ffb44e38](https://github.com/MT-SUPER-POWER/Scopify/commit/ffb44e38f4b7fa5f3e65cef65e1082c69ed65ea0))
  <!-- update:legacy-1-1-0-613 -->

- **修复了歌词不逐字的问题** ([fix · ffb44e38](https://github.com/MT-SUPER-POWER/Scopify/commit/ffb44e38f4b7fa5f3e65cef65e1082c69ed65ea0))
  <!-- update:legacy-1-1-0-614 -->

- **修理了 歌曲列表 按照标题栏划分不好用的问题**
  <!-- update:legacy-1-1-0-615 historical -->

- **补全了搜索界面的大部分机制**
  <!-- update:legacy-1-1-0-617 historical -->

- **补齐了专辑的收藏功能**
  <!-- update:legacy-1-1-0-618 historical -->

- **音质切换的时候会从头开始播放的问题**
  <!-- update:legacy-1-1-0-619 historical -->

- **修复宽度不够的时候，无播放内容在 播放条 的时候，加载占位内容和喜欢以及评论挤压在一块的问题**
  <!-- update:legacy-1-1-0-620 historical -->

- **播放模式功能失效**
  <!-- update:legacy-1-1-0-621 historical -->

- **播放条 标题很短的时候，我们的评论和喜欢被挤的很远的问题**
  <!-- update:legacy-1-1-0-622 historical -->

## v1.0.7

### Added

- **播放缓存系统**
  <!-- update:legacy-1-0-7-627 historical -->

- **网易乐签功能**：签到卡片、连续天数统计、名言展示。
  <!-- update:legacy-1-0-7-628 historical -->

- **音质选择器**
  <!-- update:legacy-1-0-7-629 historical -->

- **评论区重做**：独立 顶栏、艺术家头像、操作权限控制、点赞数气泡。
  <!-- update:legacy-1-0-7-630 historical -->

- **Home 首页加载占位动画加载占位**
  <!-- update:legacy-1-0-7-631 historical -->

- **侧边栏歌手筛选**
  <!-- update:legacy-1-0-7-632 historical -->

- **设置页播放缓存管理**
  <!-- update:legacy-1-0-7-633 historical -->

### Quality

- **队列 弹层 虚拟滚动重写（@tanstack/react-virtual），流畅滑动**
  <!-- update:legacy-1-0-7-634 historical -->

- **LRU 页面内容缓存减少重复渲染**
  <!-- update:legacy-1-0-7-636 historical -->

- **音质切换复用播放器缓存，避免重复请求**
  <!-- update:legacy-1-0-7-637 historical -->

### Fixed

- **歌词弹窗响应式布局、控制栏居中**
  <!-- update:legacy-1-0-7-638 historical -->

- **播放条 音质切换图标不同步**
  <!-- update:legacy-1-0-7-639 historical -->

- **首次加载错误（ResizablePanel localStorage 读取、播放条 progress）**
  <!-- update:legacy-1-0-7-640 historical -->

- **Electron DevTools 打开、Mac 图标、登录窗口UI**
  <!-- update:legacy-1-0-7-641 historical -->

- **CORS 跨域、Web/客户端端口兜底**
  <!-- update:legacy-1-0-7-642 historical -->

- **i18n 重复key清理**
  <!-- update:legacy-1-0-7-643 historical -->

## v1.0.6

### Added

- **歌手页面关注/取消关注按钮**
  <!-- update:legacy-1-0-6-650 historical -->

- **已关注按钮 悬停 变红显示"取消关注"**
  <!-- update:legacy-1-0-6-651 historical -->

- **搜索结果、队列、最佳匹配中的歌手名字可点击跳转**
  <!-- update:legacy-1-0-6-653 historical -->

- **侧边栏关注歌手列表实时刷新**
  <!-- update:legacy-1-0-6-654 historical -->

- **加载失败自动重试（可配置重试次数与延迟）**
  <!-- update:legacy-1-0-6-657 historical -->

- **网络错误检测 UI（显示降级提示条）**
  <!-- update:legacy-1-0-6-658 historical -->

- **播放失败自动跳过与 恢复 机制**
  <!-- update:legacy-1-0-6-659 historical -->

- **键盘快捷键（左右箭头切歌、空格播放暂停）**
  <!-- update:legacy-1-0-6-660 historical -->

- **专辑数据加载失败自动重试**
  <!-- update:legacy-1-0-6-661 historical -->

- **专辑收藏/取消收藏**
  <!-- update:legacy-1-0-6-662 historical -->

- **歌单表单增加标签选择器**
  <!-- update:legacy-1-0-6-663 historical -->

- **新增播放、网络、登录、设置等场景的翻译文本**
  <!-- update:legacy-1-0-6-666 historical -->

- **搜索结果中歌手名可点击跳转**
  <!-- update:legacy-1-0-6-672 historical -->

### Visual

- **歌曲右键菜单添加"查看歌手"选项（单歌手直接跳转，多歌手子菜单）**
  <!-- update:legacy-1-0-6-652 historical -->

- **未登录操作的引导提示弹窗**
  <!-- update:legacy-1-0-6-664 historical -->

- **用户数据跨窗口同步优化**
  <!-- update:legacy-1-0-6-665 historical -->

- **评论列表布局优化**
  <!-- update:legacy-1-0-6-671 historical -->

### Fixed

- **修复暗色模式背景反白问题（显式暗色背景）**
  <!-- update:legacy-1-0-6-656 historical -->

## v1.0.5

### Added

- **新增歌曲与页面缓存，降低重复打开页面时的重新请求和重新渲染成本**
  <!-- update:legacy-1-0-5-674 historical -->

- **支持关闭级别的缓存配置，并提供缓存位置配置与清理能力**
  <!-- update:legacy-1-0-5-675 historical -->

- **桌面客户端与后端解耦，客户端安装包不再内置或自动启动后端**
  <!-- update:legacy-1-0-5-676 historical -->

### Fixed

- **修复未登录状态下推荐页接口触发 301 后反复进入加载弹窗的问题**
  <!-- update:legacy-1-0-5-677 historical -->

- **修复登录状态判断缺少 cookie 导致首页推荐接口反复请求的问题**
  <!-- update:legacy-1-0-5-678 historical -->

- **修复 Docker Web 部署无法正确访问前端与后端的问题，调整为 Web 独立 Compose 部署并通过配置连接外部后端**
  <!-- update:legacy-1-0-5-679 historical -->

## v1.0.4

### Added

- **next.js 适配了 devPort 配置项，可以通过配置文件来修改开发时服务器的端口了**
  <!-- update:legacy-1-0-4-682 historical -->

- **加入了 i18n 和 Proxy 请求的设置，兼容了配置文件来修改**
  <!-- update:legacy-1-0-4-684 historical -->

## v1.0.3

### Added

- **歌词舞台 增加了静态和动态两种模式**
  <!-- update:legacy-1-0-3-685 historical -->

- **随机模式不做成一个随机的歌单，先把所有歌曲打乱顺序，然后按照这个顺序来播放，直到打完一轮再重新打乱**
  <!-- update:legacy-1-0-3-693 historical -->

- **每日推荐不喜欢功能**
  <!-- update:legacy-1-0-3-694 historical -->

- **搜索换成了单机搜索，不然太反直觉了，用户哪里知道单击应该是补充搜索结果，双击直接搜索**
  <!-- update:legacy-1-0-3-695 historical -->

- **对歌单做了修改之后会即使刷新最新的数据，包括不限于取消喜欢、喜欢、删除歌单中等可能会改变歌单结构的操作（引入了一个触发器**
  <!-- update:legacy-1-0-3-697 historical -->

- **浮动评论区输入栏，防止评论区上拉之后想评论还得上下拉的体验问题**
  <!-- update:legacy-1-0-3-698 historical -->

- **限制未登录的用户一些操作**
  <!-- update:legacy-1-0-3-699 historical -->

- **歌曲列表显示对应封面**：歌曲使用自己的封面，避免都显示成歌手头像。
  <!-- update:legacy-1-0-3-702 historical -->

### Visual

- **歌词舞台布局更新**：在歌词页面也可以使用完整的播放控制。
  <!-- update:legacy-1-0-3-686 historical -->

- **弹层保留上次浏览位置**：再次打开时保留当前位置，减少重复滚动造成的卡顿。
  <!-- update:legacy-1-0-3-690 historical -->

### Fixed

- **修复了 歌词页面 界面刷线不保存当前听歌进度的问题**
  <!-- update:legacy-1-0-3-688 historical -->

- **播放条 的弹出歌词栏播放之后，再次按下停止播放修复完毕**
  <!-- update:legacy-1-0-3-689 historical -->

- **修复了拖动进度条的尖锐声音的问题**
  <!-- update:legacy-1-0-3-691 historical -->

- **修复拖动音量条体验差的问题**
  <!-- update:legacy-1-0-3-692 historical -->

- **修复了快速切换歌曲导致从上一首歌曲的时间点开始播放的问题**
  <!-- update:legacy-1-0-3-696 historical -->

- **修复了 tray 控制菜单不管用的问题**
  <!-- update:legacy-1-0-3-700 historical -->

- **修复了 任务栏播放按钮 状态同步的一系列问题**
  <!-- update:legacy-1-0-3-701 historical -->

## v1.0.2-alpha

> 此版本没有单独的用户更新说明；原始记录保留在归档中。

## v1.0.2

### Added

- **切歌后从正确的进度开始播放**：切换歌曲时清除上一首的进度记录。
  <!-- update:legacy-1-0-2-704 historical -->

### Visual

- **优化 歌词舞台 的页面布局**
  <!-- update:legacy-1-0-2-708 historical -->

### Fixed

- **播放条刷新更流畅**：减少重复刷新带来的性能开销。
  <!-- update:legacy-1-0-2-703 historical -->

- **修复部分界面异常**：修复界面调整后出现的错误。
  <!-- update:legacy-1-0-2-705 historical -->

- **移除了 motion.div 部分解决了连续的动画导致的性能问题**
  <!-- update:legacy-1-0-2-706 historical -->

- **修复点击歌词跳转失效**：点击歌词行可以跳转到对应播放位置。
  <!-- update:legacy-1-0-2-707 historical -->

## v1.0.1

### Added

- **歌单按钮显示对应播放状态**：歌单上的播放按钮与当前歌单的播放状态保持一致。
  <!-- update:legacy-1-0-1-711 historical -->

- **可以访问别人的个人介绍页面**
  <!-- update:legacy-1-0-1-717 historical -->

### Visual

- **搜索支持鼠标操作**：点击可补充搜索内容，双击可直接发起搜索。
  <!-- update:legacy-1-0-1-713 historical -->

- **搜索界面的歌曲增加了右键菜单**
  <!-- update:legacy-1-0-1-714 historical -->

- **歌手的歌曲部分增加了右键菜单**
  <!-- update:legacy-1-0-1-715 historical -->

- **个人介绍的歌曲部分增加了右键菜单**
  <!-- update:legacy-1-0-1-716 historical -->

### Fixed

- **修复托盘面板被系统菜单遮挡**：托盘控制界面可以正常显示。
  <!-- update:legacy-1-0-1-709 historical -->

- **修复歌单随机播放按钮失效**：在歌单页面可以正常使用随机播放。
  <!-- update:legacy-1-0-1-710 historical -->

- **修复播放专辑后封面缺失**：从专辑卡片开始播放后，播放条会显示对应封面。
  <!-- update:legacy-1-0-1-712 historical -->

## v1.0.0

### Added

- **账号登录**：支持登录网易云音乐账号。
  <!-- update:legacy-1-0-0-718 historical -->

- **浏览和播放歌单**：可打开歌单并播放其中的歌曲。
  <!-- update:legacy-1-0-0-719 historical -->

- **查看歌曲评论**：可在评论页浏览歌曲讨论。
  <!-- update:legacy-1-0-0-720 historical -->

- **查看个人主页**：展示账号资料与个人音乐内容。 ([feat · f9f3d0ec](https://github.com/MT-SUPER-POWER/Scopify/commit/f9f3d0eca04225b66af6ac7c98cb6e6ec05dfbdd))
  <!-- update:legacy-1-0-0-721 -->
