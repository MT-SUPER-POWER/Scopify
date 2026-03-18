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
git clone https://github.com/MT-SUPER-POWER/api-enhanced
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

## 如何自己打包程序

> [!note] 直接运行 `npm run build:win` 就会自动打包程序，生成在 dist 目录下，是一个 dir 解压的结果，如果有需要自己修改 `package.json` 中的 build:build:target: nsis 就可以打包成 exe 文件了
> 程序的运行日志在这个位置: C:\Users\[YourUserName]\AppData\Roaming\scopify\logs

如果程序没有正常运行，请检查 logs 里面的日志

## 待做功能

- 多加一个艺术家侧边 LibItem

### 样式部分

- 缩放控制整体界面

### 单页

- Mock 界面参考网易主页进行修改
- 用户信息页面
- 歌曲搜索页
- 歌曲搜索的 modal 页放置最近存储的 10 首歌曲

### 优化部分

- AMLL 太吃性能，占用特别的大

### 功能部分

- github 发布更新客户端自动更新
- 音量条可以通过鼠标滚动来调整音量
- 编辑歌单的部分还要做一个 Tag 选择
- 即便我设置 config 中的 devTools，程序仍然打得开，这个不行

### 接口部分

- 搜索框可以搜索内容
  - 更具搜索内容跳转对应的查询
