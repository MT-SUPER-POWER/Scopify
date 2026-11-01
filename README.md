<div align="center">

<img src="repo/frontend/apps/web/public/brand-kits/ivory/icon-256.png" alt="Scopify Ivory S 标志" width="100" height="100" />

<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/img/wordmark-light.png" />
    <img src="docs/img/wordmark.png" alt="Scopify" width="320" />
  </picture>
</h1>

<p>
  <a href="https://scopify-web.vercel.app">在线体验</a> ·
  <a href="https://scopify-docs.vercel.app">开发文档</a> ·
  <a href="https://github.com/MT-SUPER-POWER/Scopify/releases">下载客户端</a> ·
  <a href="https://vdoonnridu.apifox.cn/">后端 API</a>
</p>

[![Stars](https://img.shields.io/github/stars/MT-SUPER-POWER/Scopify?style=flat)](https://github.com/MT-SUPER-POWER/Scopify/stargazers) [![Version](https://img.shields.io/github/v/release/MT-SUPER-POWER/Scopify)](https://github.com/MT-SUPER-POWER/Scopify/releases) [![License](https://img.shields.io/github/license/MT-SUPER-POWER/Scopify)](https://github.com/MT-SUPER-POWER/Scopify/blob/master/license) [![Ask DeepWiki](https://img.shields.io/badge/Ask-DeepWiki-blue)](https://deepwiki.com/MT-SUPER-POWER/Scopify) [![CI](https://github.com/MT-SUPER-POWER/Scopify/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/MT-SUPER-POWER/Scopify/actions/workflows/ci.yml) [![Latest completed release build](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Frepos%2FMT-SUPER-POWER%2FScopify%2Factions%2Fworkflows%2Frelease.yml%2Fruns%3Fstatus%3Dcompleted%26per_page%3D1&query=%24.workflow_runs%5B0%5D.conclusion&label=Build%20and%20Release&logo=github&cacheSeconds=300)](https://github.com/MT-SUPER-POWER/Scopify/actions/workflows/release.yml)

</div>

## 简介

这是一个基于 Next.js + Electron 配合网易云 node.js API 的仿 Spotify UI 的跨平台音乐播放器客户端，是我初学 Electron 的第一个作品。

`技术栈`: [![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com/) [![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/zh/docs/latest/) [![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/)

`包管理工具`: [![pnpm 12.x](https://img.shields.io/badge/pnpm-12.x-F69220?logo=pnpm&logoColor=white)](./package.json) 用于包管理（版本见 `packageManager`），[![Bun >= 1.3.11](https://img.shields.io/badge/Bun-%3E%3D%201.3.11-000000?logo=bun&logoColor=white)](https://bun.sh/)用于运行脚本与测试。

支持网页端与客户端，由于设备有限，目前仅保证 `Windows` 和 `MacOS` 系统的适配，App 开发中（不太想做，但是现在已经是可用了，就是得自己配后端）。

## 技术栈总览

1. Next.js + React: 前端框架
2. Electron: 桌面应用框架
3. Tailwind CSS: CSS 框架
4. shadnCN UI: UI 组件库
5. Docker: 部署部分
6. Axios + TanStack Query: 后端通讯统一管理部分
7. Zustand: 前端状态管理
8. Eslint + Prettier + Husky: 代码格式化约束 + Git 提交规范
9. Framer-Motion: 动画框架
10. TanStack-Virtual: 虚拟列表
11. WebGL: 歌词舞台可视化
12. i18next + x18n: 多语言运行时与翻译管理（[国际化文档](./docs/i18n.md)）

### 代码结构

仓库使用 pnpm Workspaces + Turborepo 管理 Web、Electron 和共享契约：

```text
repo/
├── frontend/
│   ├── apps/
│   │   ├── web/                 # Next.js Web 与 Electron Renderer 源码
│   │   ├── desktop/             # Electron 主进程、预加载与打包配置
│   │   └── mobile/              # Flutter 预留入口（submodule）
│   └── packages/
│       └── desktop-contract/    # Web 与 Electron 之间的类型化契约
└── backend/
    └── api-enhanced/            # NetEase API 后端（submodule）
```

新建或修改代码前，请先阅读：

- **[CONTRIBUTE.md](./CONTRIBUTE.md)** — 贡献指南与文档索引
- **[项目结构与拆分原理](./skills/nextjs-project-structure/rules/architecture.md)**、**[组件规则](./skills/nextjs-project-structure/rules/components.md)**、**[数据请求与边界](./skills/nextjs-project-structure/rules/data-and-boundaries.md)** — 前端代码结构规范
- **[AGENTS.md](./AGENTS.md)** — AI Agent 的工作约定

### 重要的三方库

> 特别感谢以下项目的开源：

1. [Folia](https://github.com/chthollyphile/folia-major/tree/main)
2. [Netease Cloud Music API Enhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced)
3. [SPlayer-Next](https://github.com/SPlayer-Dev/SPlayer-Next)
4. [Rhine](https://github.com/LBEILC/RhineLabUI)

### 参考文档

1. [Folia Doc](https://folia-site.cielaniska.top/guide/)
2. [Electron Doc](https://www.electronjs.org/zh/docs/latest/api/app)
3. [Netease Cloud Music API Doc](https://docs-neteasecloudmusicapi.focalors.ltd/#/)
4. [Electron Builder Help Doc - Not Official](https://github.com/QDMarkMan/CodeBlog/blob/master/Electron/electron-builder%E6%89%93%E5%8C%85%E8%AF%A6%E8%A7%A3.md)
5. [国际化开发](./docs/i18n.md)

## 部署方法

Scopify 现在把桌面客户端、Web 前端和后端分开管理。Web 和桌面客户端需要能访问一个独立运行的 NetEase API 后端。

### 后端的运行

> 请确保你后端的实际运行当然你也可以看这个文档[部署文档](https://scopify-docs.vercel.app/docs/deployment)来部署你的专有后端作为项目后端运行。

```bash
git submodule update --init --recursive   # 初次克隆时需要
pnpm run dev:backend                      # 运行后端
```

### 前端与桌面客户端的运行

```bash
pnpm install
pnpm run dev:web          # 仅 Next.js Web
pnpm run dev:desktop      # 仅 Electron（开发时使用 Web dev server），确保你的 dev:web 已运行
pnpm run dev              # Web + Electron
pnpm run dev:full         # Web + Electron + backend

# 其他网页
pnpm run dev:docs         # 仅 docs（文档网站），确保你的 dev:web 已运行
```

## 功能

功能与界面会随版本持续更新。你可以通过下面的功能图谱快速了解产品能力，完整说明与最新界面截图请查看在线文档：

```mermaid
mindmap
  root((Scopify 功能图谱))
    界面与布局
      顶栏导航与常驻搜索
      可收起的音乐库侧栏
      正在播放与歌词队列面板
      常驻播放栏
    内容发现
      每日与个性化推荐
      歌单专辑与歌手
      私人 FM 与电台
      播客声音
      评论内容
      Lattice 歌单视图
    搜索与导航
      快捷搜索
      常驻搜索栏
      分类结果页
      歌词搜索与完整歌词预览
      LRC 与 YRC 导出
      乐谱搜索与谱页预览
      MV 卡片与悬停预览
      命令面板
    播放与队列
      播放控制
      播放模式
      待播队列
      正在播放面板
      输出设备
      音乐百科与乐谱
    MV 视频
      普通播放布局
      剧场模式
      网页全屏与系统全屏
      保留进度切换清晰度
      歌单与专辑 MV 预览
      相似 MV 与评论互动
    歌词与 Folia
      动态歌词舞台
      歌词来源与匹配
      时间轴校准
      舞台控制面板与分层退出
      样式与视觉主题
    音频体验
      音质选择
      十段均衡器
      ReplayGain
      声音效果
    账户与音乐库
      喜欢与收藏
      最近播放
      我的云盘
      自建歌单
      听歌足迹
      用户与网易乐签
    社交与通知
      动态与乐迷团
      乐迷团筛选与来源标识
      瀑布流与动态详情浮层
      音乐分享与评论互动
      私信
      通知中心
    个性化与效率
      命名主题与时段轮换
      缓存与登录设备
      语言与主题
      快捷键
      命令面板
      运行设置
    桌面端集成
      桌面歌词
      桌面壁纸与托盘
      灵动岛与 Windows 任务栏歌词
      macOS 菜单栏歌词与播放控制
      MCP 播放控制
      Discord 状态
      客户端更新
      本地后端与诊断
```

- **[产品能力](https://scopify-docs.vercel.app/docs/features)**：按使用场景整理的完整功能说明与最新界面截图
- **[快捷键](https://scopify-docs.vercel.app/docs/shortcuts)**：全部快捷键与命令
- **[版本日志](docs/CHANGELOG.md)**：每个版本新增、改进与修复的内容

本地预览文档站：`pnpm run dev:docs`（需先运行 `pnpm run dev:web`）。

## 版本号规则

> 版本号的发布规则 `x.y.z`

- `x`: 重大更新，可能包含不兼容的 API 修改
- `y`: 次要更新，添加了新功能，但保持向后兼容
- `z`: 修复 bug 和小的改进，不添加新功能

## 开源许可

本项目基于 [GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.html) 许可开源。

- **修改与分发：** 任何修改或分发都必须同样基于 **AGPL-3.0**，并提供完整源代码。
- **派生作品：** 必须同样采用 **AGPL-3.0**，并在适当位置保留本项目的许可与版权信息。
- **署名：** 必须保留原作者及版权信息。可为二次开发添加你自己的署名，但不得移除或篡改原始信息。
- **商业用途：** 如用于售卖或其他盈利用途，必须提供源代码及原项目链接。由于本项目涉及第三方服务，商业使用可能存在法律风险。
- **免责：** 本软件按「现状」提供，不附带任何形式的担保，详见 AGPL-3.0。
