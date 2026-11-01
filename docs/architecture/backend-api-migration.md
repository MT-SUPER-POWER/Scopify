# 后端 submodule 迁移

后端改为 `https://github.com/MT-SUPER-POWER/api-enhanced.git`，基线为远端 `feat/yidun-support` 的 `72a655b3263f8d90548e6e800dcf3c78924fdc22`。

保留新后端原生的扁平模块加载、初始化和易盾实现；只补充 Scopify 生产源码确实调用、而新后端尚未提供的 11 个接口。模块名沿用现有命名惯例，版本号作为后缀，且与网易实际接口版本一致：例如 `artist_songs_v2.js` 对应 `/artist/songs/v2`，`search_album_v1.js` 对应 `/search/album/v1`。没有版本号的接口不加自定义版本前缀，前端调用同步使用新路径。

单曲搜索复用目标后端已有的 `/search/song/list/page`，不增加重复模块；`needCorrect`、`channel` 参数按需透传。新增模块同时补充 `interface.d.ts` 函数声明与 `public/docs/home.md` 接口文档。

## 迁移接口

| URL | Scopify 调用位置 | 新后端模块 |
| --- | --- | --- |
| `/dj/program/v6` | `repo/frontend/apps/web/lib/api/radio.ts` | `module/dj_program_v6.js` |
| `/djradio/my/radio/recommend` | `repo/frontend/apps/web/lib/api/voicelist.ts` | `module/djradio_my_radio_recommend.js` |
| `/search/pc/complex/page/v3` | `repo/frontend/apps/web/lib/api/search.ts` | `module/search_pc_complex_page_v3.js` |
| `/content/my/liked/voice` | `repo/frontend/apps/web/lib/api/voicelist.ts` | `module/content_my_liked_voice.js` |
| `/voicelist/my/subscribed` | `repo/frontend/apps/web/lib/api/voicelist.ts` | `module/voicelist_my_subscribed.js` |
| `/artist/songs/v2` | `repo/frontend/apps/web/lib/api/artist.ts` | `module/artist_songs_v2.js` |
| `/pc/voicelist/rcmd/list` | `repo/frontend/apps/web/lib/api/voicelist.ts` | `module/pc_voicelist_rcmd_list.js` |
| `/search/album/v1` | `repo/frontend/apps/web/lib/api/search.ts` | `module/search_album_v1.js` |
| `/search/artist/v1` | `repo/frontend/apps/web/lib/api/search.ts` | `module/search_artist_v1.js` |
| `/search/playlist/v1` | `repo/frontend/apps/web/lib/api/search.ts` | `module/search_playlist_v1.js` |
| `/search/default/pc` | `repo/frontend/apps/web/lib/api/search.ts` | `module/search_default_pc.js` |

## 排除项

- `/token/fresh`、`/v1/pc/page/rcmd/block/resource/refresh`、`/v1/search/suggest/pc` 未被项目生产源码调用，不迁移。
- 空的 `/v1/momo/byebye` 测试占位不迁移。
- 原有 `/search/default` 覆盖无调用；歌词搜索已传 `keyword`，声音搜索已传 `offset`，无需迁移旧别名或默认值补丁。评论点赞沿用目标后端原始实现。
- 不迁移旧递归路由加载、启动初始化改写或旧 UA 调整。

## 开发运行与提交边界

`pnpm run dev:backend` 通过 Scopify 启动脚本默认设置 `PORT=3838`，也允许调用者传入其他端口。目标后端自身仍保留原始启动行为。

迁移接口及针对性测试位于 submodule 的 `feat/artist-search-podcast-apis` 分支，用于向上游提交歌手、搜索与播客接口 PR。`.gitmodules` 跟踪同名分支。发布 Scopify 提交前，须先推送包含这些接口的后端分支，确保 CI 能拉到 gitlink 指向的提交。

## 验证边界

已验证：

- 24 项针对性离线测试通过，覆盖模块导出、类型声明、接口文档、迁移路由注册及请求参数映射。
- 目标后端共注册 472 条唯一模块路由；Web/Desktop 生产源码引用的 163 条既有静态接口路径均能匹配，未发现缺失。
- 临时在本机 3848 端口启动新后端，`/inner/version` 返回 200；空请求调用 `/yidun/login` 正确返回缺少手机号的 400。验证后已关闭临时服务。
- 未修改锁文件，依赖链接已恢复；未执行全仓 lint、类型检查或构建。

未发码、未执行真实账号登录；切换来源本身不等于已经证明登录故障消除。运行中的旧后端需要重启才能加载新代码。
