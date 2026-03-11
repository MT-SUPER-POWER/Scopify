# README

## 简介

这是一个基于 Next.js + Electron 配合网易云 node.js API 的一个客户端音乐播放器，主要是为了练习前端 UI 和 Electron 的开发。
后端的 API 部分我们直接使用了现成的开源项目，部署也比较简单，后续会考虑自己实现一个后端来对接网易云的接口。

## 技术栈

1. Next.js + React: 前端框架
2. Electron: 桌面应用框架
3. Tailwind CSS: CSS 框架
4. shadnCN UI: UI 组件库
5. Makefile + k8s + Docker: 后端部署部分
6. Axios: 后端通讯统一管理部分
7. Zustand: 前端状态管理

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
bun i
bun run dev
```

### 后端的部署方法

> 这里使用 k8s 来部署，我们在 backend 文件中会给出对用的 svc 和 pod 文件，你照着大致修改就好
>
> 我们使用的是这个[仓库](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)以及对应的[API 文档](https://docs-neteasecloudmusicapi.focalors.ltd/#/)
> 记得自己打包 image，如果有 `url.parse()` 出现的报错暂且不理会就好

1. 下载项目，进入项目打包 image

```bash
git clone https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced
cd api-enhanced
docker build -t netease-api:v1.0.0 ./
```

2. 使用 `Makefile` 部署到 k3s

```bash
make netease_deploy   # 部署
make netease_status   # 查看状态
make netease_undeploy # 卸载
```

## 待做功能

### 样式部分

- playlist 模式其内容超过了边界

### 单页

- 个人信息页面
- 设置页面
  - 配合 toml 文件实现管理
- 搜索歌曲之后展示的内容页

### 优化部分

- zustand + persist 进行状态管理和持久化存储
  1. 共享的当前音乐播放时间
  2. 过滤曲库类型当前的选择

- GPU 加速

### 功能部分

- 可以使用标题部分的间隔调整 Table 之间的大小
  - 实现函数的调用
- 托盘化
  - 关闭按钮显示，最小化或者关闭程序，而不是直接关闭
  - 对接正在播放的音乐数据并展示出来
  - 对接托盘按钮的回调函数

- github 发布更新客户端自动更新

### 接口部分

- 搜索框可以搜索内容
