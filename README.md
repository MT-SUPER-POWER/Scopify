<div align="center">
<img alt="logo" height="100" width="100" src="doc/img/icon.ico" />
<h2> Scopify </h2>
<p> 一个仿 Spotify UI 的音乐播放器 </p>

[后端 API](https://vdoonnridu.apifox.cn/) | [发行版](https://github.com/MT-SUPER-POWER/Scopify/releases) | [版本日志](https://github.com/MT-SUPER-POWER/Scopify/doc/CHANGE.log)

<br/>

[![Stars](https://img.shields.io/github/stars/MT-SUPER-POWER/Scopify?style=flat)](https://github.com/MT-SUPER-POWER/Scopify/stargazers)
[![Version](https://img.shields.io/github/v/release/MT-SUPER-POWER/Scopify)](https://github.com/MT-SUPER-POWER/Scopify/releases)
[![license](https://img.shields.io/github/license/mt-super-power/scopify)](https://github.com/mt-super-power/scopify/blob/master/license)
[![Issues](https://img.shields.io/github/issues/MT-SUPER-POWER/Scopify)](https://github.com/MT-SUPER-POWER/Scopify/issues)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/MT-SUPER-POWER/Scopify)

</div>

## 简介

这是一个基于 Next.js + Electron 配合网易云 node.js API 的一个客户端音乐播放器，主要是为了练习前端 UI 和 Electron 的开发。
后端的 API 部分我们直接使用了现成的开源项目，部署也比较简单。

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

### 前端的部署方法

```bash
# 安装前端
git clone https://github.com/MT-SUPER-POWER/Scopify.git
cd Scopify
npm install

# 安装后端
cd backend/api-enhanced
git clone https://github.com/MT-SUPER-POWER/api-enhanced
npm install

npm run dev  # 开发模式：运行 next.js 和 electron
```

### 后端的部署方法

#### 1. 自己部署后端

> 这里使用 k8s 来部署，我们在 backend 文件中会给出对用的 svc 和 pod 文件，你照着大致修改就好
>
> 我们使用的是这个[仓库](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)以及对应的[API 文档](https://docs-neteasecloudmusicapi.focalors.ltd/#/)

1. 下载项目，进入项目打包 image

   > [!note]
   > 打包 image 的过程中，如果有 `url.parse()` 出现的报错暂且不理会就好

```bash
git clone https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced
cd api-enhanced

docker build -t netease-api:[版本号自己想吧] ./
```

2. 使用 `Makefile` 部署到 k3s

```bash
make netease_deploy   # 部署
make netease_status   # 查看状态
make netease_undeploy # 卸载
```

3. 记得修改 `config/app.config.yml` 中的后端地址为你部署的地址，`autoStart` 设置为 `false`，因为我们已经自己部署了后端了

4. `electron-builder` 的配置文件，去掉 `extraResources` 中的后端相关配置

#### 2. 使用现成的后端

> [!important]
> 推荐使用这个方法，毕竟部署后端还是比较麻烦的。加上本人还没有测试过分离部署的功能。可能意外比较多

```bash
git submodule update --init --recursive
cd backend/api-enhanced
npm install
```

我们程序里面是打包了一个后端一起部署的，默认地址地址是 `localhost:5252`，如果你不需要自己部署后端，在 `config/app.config.yml` 吧 `autoStart` 设置为 `true` 就好。

### 本地部署

直接运行 `npm run build:win` 就会自动打包程序，生成在 `dist` 是直接可运行的版本。
如果有想打包成有安装引导的版本，还请自己修改 `package.json` 中的 build:build:target: nsis 就可以打包成 exe 文件了。
程序的运行日志在这个位置: `C:\Users\[YourUserName]\AppData\Roaming\scopify\logs`。

> [!note]
> 如果程序没有正常运行，请检查 logs 里面的日志里面的基础配置部分的输出，还有后端是否运行正常，如果简单排查还是有问题，可以把日志发到 issue 里面来，我会尽快回复的。

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

![主页面](/doc/img/main.png)

</details>

<details>
<summary> 播放歌曲模态界面 - 动态 </summary>

![播放页面](/doc/img/DynamicEffect.png)

</details>

<details>
<summary> 播放歌曲模态界面 - 静态 </summary>

![播放页面](/doc/img/StaticEffect.png)

</details>

<details>
<summary> 歌单页面 </summary>

![发现页面](/doc/img/Playlist.png)

</details>

<details>
<summary> 用户页面 </summary>

![用户页面](/doc/img/profile.png)

</details>

<details>
<summary> 评论页面 </summary>

![发现页面](/doc/img/comment.png)

</details>

<details>
<summary> 搜索模态界面 </summary>

![搜索页面](/doc/img/SearchModal.png)

</details>

<details>
<summary> 一般搜索效果 </summary>

![搜索页面](/doc/img/SearchWithBar.png)

</details>

<details>
<summary> 搜索结果页面</summary>

![搜索页面](/doc/img/SearchResult.png)

</details>

## TODO

- 侧边栏中多添加一个作者相关的功能区
- 收藏 / 取消收藏专辑
- 窗口刚启动就播放动画，因为资源没加载好，然后这个动画就会卡顿
- 本地打包打包后端一起导致特别大，看后期能否编译一个二进制文件一次解决问题
- 使用过多的 `any` 了，数据类型需要重新梳理一下
- 拉去 github 的 release 自动更新客户端版本
- 编辑歌单的部分还要做一个 Tag 选择
- 用户个人信息的编辑
- i18n 国际化
- 开发蓝牙基础功能，为后续功能适配铺一些路
- 切换歌曲的时候偶尔是继续上一次歌曲的播放继续，而不是从头开始
- 按照日期展示每日推荐
- 点击歌手做跳转到歌手页面
- 播放的一些 web 快捷键适配

## 版本号规则

> 版本号的发布规则 `x,y,z`

- `x`: 重大更新，可能包含不兼容的 API 修改
- `y`: 次要更新，添加了新功能，但保持向后兼容
- `z`: 修复 bug 和小的改进，不添加新功能

## 开源许可

- 本项目基于 [MIT](https://www.gnu.org/licenses/mit-license.html) 许可进行开源
