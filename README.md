<div align="center">
<img alt="logo" height="100" width="100" src="docs/img/icon.ico" />
<h2> Scopify </h2>
<p> 一个仿 Spotify UI 的音乐播放器 </p>

[后端 API](https://vdoonnridu.apifox.cn/) | [发行版](https://github.com/MT-SUPER-POWER/Scopify/releases) | [版本日志](https://github.com/MT-SUPER-POWER/Scopify/blob/master/docs/CHANGELOG.md)

<br/>

[![Stars](https://img.shields.io/github/stars/MT-SUPER-POWER/Scopify?style=flat)](https://github.com/MT-SUPER-POWER/Scopify/stargazers)
[![Version](https://img.shields.io/github/v/release/MT-SUPER-POWER/Scopify)](https://github.com/MT-SUPER-POWER/Scopify/releases)
[![license](https://img.shields.io/github/license/mt-super-power/scopify)](https://github.com/mt-super-power/scopify/blob/master/license)
[![Issues](https://img.shields.io/github/issues/MT-SUPER-POWER/Scopify)](https://github.com/MT-SUPER-POWER/Scopify/issues)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/MT-SUPER-POWER/Scopify)

</div>

## 简介

这是一个基于 Next.js + Electron 配合网易云 node.js API 的一个客户端音乐播放器，是我初学 Electron 的第一个作品。

- 本项目主要技术链为 [Next.js](https://nextjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [ShadCN UI](https://ui.shadcn.com/) + [Electron](https://www.electronjs.org/zh/docs/latest/)
- Node.js 版本要求：>= 20，包管理器：bun >= 1.3.7
- 支持网页端与客户端，由于设备有限，目前仅保证 Windows 系统的适配

## 技术栈总览

1. Next.js + React: 前端框架
2. Electron: 桌面应用框架
3. Tailwind CSS: CSS 框架
4. shadnCN UI: UI 组件库
5. Makefile + k8s + Docker: 后端部署部分
6. Axios: 后端通讯统一管理部分
7. Zustand: 前端状态管理

### 代码结构

新建或修改代码前，请先阅读：

- **[AGENTS.md](./AGENTS.md)** — 项目结构规范（跨 AI 工具通用，不依赖 Cursor）
- **[docs/structure.md](./docs/structure.md)** — 面向贡献者的结构说明与迁移进度

### 重要的三方库

> 特别感谢以下项目的开源：

1. [Apple Music Like Lyric](https://github.com/Steve-xmh/applemusic-like-lyrics)
2. [Netease Cloud Music API Enhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced)

### 参考文档

1. [Apple Music Like Lyric Doc](https://amll-dev.github.io/applemusic-like-lyrics/reference/react-full/typealiassongdata/)
2. [Electron Doc](https://www.electronjs.org/zh/docs/latest/api/app)
3. [Netease Cloud Music API Doc](https://docs-neteasecloudmusicapi.focalors.ltd/#/)
4. [Electron Builder Help Doc - Not Official](https://github.com/QDMarkMan/CodeBlog/blob/master/Electron/electron-builder%E6%89%93%E5%8C%85%E8%AF%A6%E8%A7%A3.md)

## 部署方法

Scopify 现在把桌面客户端、Web 前端和后端拆开部署。前端构建不依赖后端源码，也不需要拉取 `backend/api-enhanced` submodule；Web 和桌面客户端只需要能访问一个独立运行的 NetEase API 后端。

### 1. Docker Compose 部署 Web

推荐用于本机、局域网或私有服务器部署 Web 前端。根目录的 `docker-compose.yml` 只启动 Web 服务：

- Web: `http://127.0.0.1:3000`

```bash
git clone https://github.com/MT-SUPER-POWER/Scopify.git
cd Scopify
docker compose up -d --build
```

查看状态和日志：

```bash
docker compose ps
docker compose logs -f web
```

可以在根目录创建 `.env` 覆盖 Web 端口和浏览器可访问的后端地址：

```env
FRONTEND_PORT=3000
BACKEND_PUBLIC_HOST=127.0.0.1
BACKEND_PUBLIC_PORT=3838
```

`BACKEND_PUBLIC_HOST` 是浏览器访问后端时使用的地址。如果 Web 部署在服务器上并给其他设备访问，请改成服务器 IP 或域名，而不是 `127.0.0.1`。

Docker Web 会先执行 `bun run build:web`，再静态服务 `renderer` 目录；它不是 `next dev`。不同端口对应不同浏览器 localStorage，换到 Docker 的 `3000` 端口后需要重新登录。

### 2. 桌面客户端连接独立后端

Release 安装包只包含桌面客户端，不再内置或自动启动后端。使用前请先部署 backend，然后在 `config/app.config.yml` 中配置后端地址：

```yaml
backend:
  host: 127.0.0.1
  port: 3838
```

如果后端部署在远程服务器，把 `host` 改成服务器 IP 或域名。客户端会请求 `http://host:port`。

### 3. 后端部署

后端可以独立部署，不需要和前端在同一个仓库 checkout 中构建。你可以使用已有的 NetEase API Enhanced 服务，只要保证 Web 或客户端能访问到它。

如果需要从本仓库的后端子模块构建，再单独拉取 submodule：

```bash
git submodule update --init --recursive backend/api-enhanced
cd backend/api-enhanced
docker build -t scopify-backend .
docker run -d --name scopify-backend -p 3838:3838 -e HOST=0.0.0.0 -e PORT=3838 scopify-backend
```

### 4. 本地开发

```bash
bun install
bun run dev:web      # Next.js 开发服务
bun run dev          # Electron 开发模式
```

如果需要同时调试后端，先拉取后端子模块，然后再运行后端开发脚本：

```bash
git submodule update --init --recursive backend/api-enhanced
bun run dev:backend
```

`dev:web` 是开发服务；生产 Web 部署请使用 Docker Compose，或 `bun run build:web` 后静态服务 `renderer` 目录。

### 5. Release 检查清单

发布 tag 前建议确认：

```bash
docker compose config --quiet
docker compose up -d --build
```

并访问：

- `http://127.0.0.1:3000`
- 你配置的后端地址，例如 `http://127.0.0.1:3838`

GitHub Actions 会在推送 `v*` tag 时构建安装包。Release workflow 不再 checkout submodule，并从 `docs/CHANGELOG.md` 中提取同名版本标题作为 Release Notes。发布 `v1.0.5` 前请确保存在：

```md
# v1.0.5
```

## 功能

- 只支持扫码登录
- 封面主题色自适应，支持全站着色
- 新建歌单及歌单编辑
- 收藏 / 取消收藏歌单
- 支持评论区
- 支持滚动歌词
- 音乐频谱显示

## 单页展示

> 还有很多细节要打磨，目前只是初定设计，如果你有任何特别好的想法，请务必提 issue 或者 PR 来告诉我。(**如果你还懂点美术，爹！妈！帮帮孩子吧**)。

<details>
<summary> 主页面 </summary>

![主页面](/docs/img/main.png)

</details>

<details>
<summary> 播放歌曲模态界面 - 动态 </summary>

![播放页面](/docs/img/DynamicEffect.png)

</details>

<details>
<summary> 播放歌曲模态界面 - 静态 </summary>

![播放页面](/docs/img/StaticEffect.png)

</details>

<details>
<summary> 歌单页面 </summary>

![发现页面](/docs/img/Playlist.png)

</details>

<details>
<summary> 用户页面 </summary>

![用户页面](/docs/img/profile.png)

</details>

<details>
<summary> 评论页面 </summary>

![发现页面](/docs/img/comment.png)

</details>

<details>
<summary> 搜索模态界面 </summary>

![搜索页面](/docs/img/SearchModal.png)

</details>

<details>
<summary> 一般搜索效果 </summary>

![搜索页面](/docs/img/SearchWithBar.png)

</details>

<details>
<summary> 搜索结果页面</summary>

![搜索页面](/docs/img/SearchResult.png)

</details>

## TODO

- 侧边栏中多添加一个作者相关的功能区
- 收藏 / 取消收藏专辑
- 本地打包打包后端一起导致特别大，看后期能否编译一个二进制文件一次解决问题
- 使用过多的 `any` 了，数据类型需要重新梳理一下
- 拉去 github 的 release 自动更新客户端版本
- 编辑歌单的部分还要做一个 Tag 选择
- 用户个人信息的编辑
- 开发蓝牙基础功能，为后续功能适配铺一些路
- 按照日期展示每日推荐
- 点击歌手名字做跳转到歌手页面
- 播放的一些 web 快捷键适配
- 歌手页面的做一个全部歌曲折叠展示，就 10 首有点少了
- 专辑页面的内容去抓网易的接口，防止封面数据定死的问题
- i18n 国际化
- Electron 代理功能
- 如果是没有联网导致的请求失败，我们多做一个刷新按钮，提示用户刷新页面
- 封面的播放接口，没有效果
- 在不同的曲库之间切换，使用 Action 部分的大按钮，切换歌曲不会清空 currentTime 导致从切换的位置开始播放
- 播放当前歌曲失败的话，尝试切换到下一首歌曲，如果下一首歌曲也失败的话，提示用户当前网络环境不佳，无法播放歌曲

## 版本号规则

> 版本号的发布规则 `x.y.z`

- `x`: 重大更新，可能包含不兼容的 API 修改
- `y`: 次要更新，添加了新功能，但保持向后兼容
- `z`: 修复 bug 和小的改进，不添加新功能

## 开源许可

- 本项目基于 [MIT](https://www.gnu.org/licenses/mit-license.html) 许可进行开源

