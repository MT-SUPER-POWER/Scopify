# README

## 简介

这是一个基于 Next.js + Electron 配合网易云 node.js API 的一个客户端音乐播放器，主要是为了练习前端 UI 和 Electron 的开发。
后端的 API 部分我们直接使用了现成的开源项目，部署也比较简单。

## 技术栈

1. Next.js + React: 前端框架
2. Electron: 桌面应用框架
3. Tailwind CSS: CSS 框架
4. shadnCN UI: UI 组件库
5. Makefile + k8s + Docker: 后端部署部分
6. Axios: 后端通讯统一管理部分
7. Zustand: 前端状态管理
8. TODO: Zod 来作为数据类型来声明 `type` --> 下一次升级，或者下一个项目来做了

## 重要的三方库

1. [Apple Music Like Lyric](https://github.com/Steve-xmh/applemusic-like-lyrics)
2. [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
3. [Netease Cloud Music API Enhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced)

## 文档

1. [Apple Music Like Lyric Doc](https://amll-dev.github.io/applemusic-like-lyrics/reference/react-full/typealiassongdata/)
2. [Electron](https://www.electronjs.org/zh/docs/latest/api/app)
3. [Netease Cloud Music API Doc](https://docs-neteasecloudmusicapi.focalors.ltd/#/)
4. [Electron Builder](https://github.com/QDMarkMan/CodeBlog/blob/master/Electron/electron-builder%E6%89%93%E5%8C%85%E8%AF%A6%E8%A7%A3.md)

## 部署方法

### 前端的部署方法

```bash
cd momo-music-player/
bun i

cd backend/api-enhanced
bun install  # 安装后端依赖

bun run dev  # 开发模式：运行 next.js 和 electron
bun run build:win # 打包 windows 可执行文件，生成在 dist 目录下
```

### 后端的部署方法

#### 1. 自己部署后端

> 这里使用 k8s 来部署，我们在 backend 文件中会给出对用的 svc 和 pod 文件，你照着大致修改就好
>
> 我们使用的是这个[仓库](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)以及对应的[API 文档](https://docs-neteasecloudmusicapi.focalors.ltd/#/)
> 记得自己打包 image，如果有 `url.parse()` 出现的报错暂且不理会就好

1. 下载项目，进入项目打包 image

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

3. 记得修改 next.config.js 中的后端地址为你部署的地址

#### 2. 使用现成的后端

我们程序里面是打包了一个后端一起部署的，地址是 `localhost:3838`，如果你不想自己部署后端，可以直接使用这个地址

> [!note]
> 如果你是想要自己编译程序，且不想要打包一个后端本地运行
>
> 1. 修改 `electron-builder` 的配置文件，去掉 `extraResources` 中的后端相关配置
> 2. 修改 `next.config.js` 中的后端地址为 `你部署端口的 ip 地址`，k8s 文件给你写好了，你按需修改就行

## 待做功能

### 样式部分

- Mock 界面参考网易主页进行修改

### 单页

- 个人信息页面
  - 配合 toml 文件实现管理
- 歌曲搜索页
- 歌曲搜索的 modal 页放置最近存储的 10 首歌曲

### 优化部分

- zustand + persist 进行状态管理和持久化存储
  1. 共享的当前音乐播放时间
  2. 过滤曲库类型当前的选择

### 功能部分

- github 发布更新客户端自动更新
- 右键歌单栏
  - 查看歌单
  - 删除歌单
  - 编辑歌单信息
- 音量条可以通过鼠标滚动来调整音量
- Playbar 可以通过空格键来控制播放和暂停

### 接口部分

- 搜索框可以搜索内容
  - 更具搜索内容跳转对应的查询
