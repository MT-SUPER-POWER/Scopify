# ✨ 01 — 提需求模板

> **适用场景**：提交新功能、新页面、新模块的开发需求
>
> **预计填写**：5-10 分钟

---

```markdown
---template-start---

## 背景与动机
<!-- 为什么要做这个？用户遇到了什么痛点？ -->

## 功能描述
<!-- 具体要做什么，尽量详细 -->

## 技术范围（可选）
<!-- 涉及的文件 / 组件 / 路由 / API -->

- 前端：
- 后端：
- 类型定义：

## 验收标准
<!-- 怎么做完才算完成？可逐条列出 -->

- [ ] 

## 前置依赖（可选）
<!-- 依赖其他 PR / 任务 / 接口吗？ -->

## 参考与设计（可选）
<!-- 设计稿链接 / 类似页面 / UI 参考 -->

---template-end---
```

---

## 📌 填写示例

### 背景与动机
歌手页目前只有基本信息，用户想看热门歌曲必须去搜索，体验割裂。希望直接在该歌手页面展示 Top 50 热门歌曲。

### 功能描述
在歌手页的英雄区下方新增「热门歌曲」区块，展示该歌手的 Top 50 曲目列表，支持：
- 显示序号、封面、歌名、专辑、播放时长
- 点击行直接播放
- 点击「播放全部」一键播放 Top 50
- 点击「收藏全部」收藏所有曲目
- 加载中显示 Skeleton

### 技术范围
- 前端：`components/artist/PopularTracks.tsx`（新增）、`app/(dashboard)/artist/page.tsx`（组装）
- 类型：`types/api/artist.ts`（`ArtistTopSongsResponse`）、`types/components/artist.ts`（`PopularTracksProps`）
- API：`lib/api/artist.ts`（新增 `getArtistTopSongs` 函数）
- Hook：`hooks/artist/useArtistTopSongs.ts`（新增，封装数据请求与状态）

### 验收标准
- [x] Top 50 列表正常展示，包含序号、封面、歌名、专辑、时长
- [x] 点击行调用播放器播放该曲目
- [x] 「播放全部」触发播放队列
- [x] 加载中显示 Skeleton
- [x] 接口异常时显示错误提示（非空状态）
- [x] 布局在移动端适配

### 前置依赖
- 需要后端 `artist/songs` 接口（有，文档见 `backend/api-enhanced/AGENTS.md`）
- 不依赖其他进行中的 PR

### 参考与设计
参考 Spotify 歌手页的「热门歌曲」区块布局
