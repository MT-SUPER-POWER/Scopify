# Rhine background — phase 1

## 来源

- 上游：LBEILC/RhineLabUI，版本 `d9ecb6c`，本地源目录 `D:/Github/RhineLabUI`。
- `appearance.ts`、`glassReveal.ts`、`internalOptics.ts`、`themeMaterial.ts`、`instanceUpdates.ts`：从上游对应模块适配，修改导入、类型归属及 Three 类型接口。
- `rhythm.ts`：提取 `archive-play-motion.ts` 中三种律动及切换函数。
- `motion.ts`、`model.ts`、`renderer.ts`：复用上游呼吸公式、材质参数、工作室光照和长焦阵列构图；移除档案业务、游戏、独立查看器和原站交互。
- 程序代码沿用随附 `LICENSE.RhineLabUI`，Copyright (c) 2026 LBEILC。
- 模型来源及非代码资产边界见 `public/folia/rhine/NOTICE.md`；模型未重新打包或加工，不将其声明为 MIT。

## 对接

在 Folia 的背景选择中选择 **莱茵 / Rhine**。背景以歌曲 ID 作为档案位种子，播放时读取现有 `AudioBands`；不创建音频节点，也不请求歌曲接口。它可以和已有歌词模式组合，模型单曲详情页留待第二阶段讨论。

职责分布：

- `components/lyrics/FoliaPresentationSurface.tsx`：在舞台层持有唯一的莱茵背景，切歌只更新歌曲 ID、主题与播放状态；歌词壳层通过 `renderedByHost` 跳过重复挂载，保持其原有透明模式语义。
- `components/lyrics/rhine/`：背景容器、错误重试与设置 UI。
- `hooks/lyrics/useRhineBackground.ts`：加载、帧率、尺寸、可见性及资源生命周期。
- `lib/lyrics/rhine/scene.ts`：切歌短暂展示、归位、阵列实例和冻结状态。
- `types/rhineBackground.ts`、`types/rhineRuntime.ts`、`constants/rhineBackground.ts`：数据契约和默认参数。
- Folia 背景 registry、Zustand store 和设置归一化负责入口、重置及持久化。

## 切歌展示

莱茵背景位于歌词渲染器之外。商籁与凝彩等模式的组件以歌曲 ID 为 `key`，切歌会重建歌词子树；舞台层的背景不随之卸载，随机切换歌词模式或切换歌词显示层也保持同一个场景。背景关闭、切换到其他背景、舞台本身卸载或显式错误重试仍会释放相应实例。

首次打开及普通播放时，所有档案片都留在阵列中呼吸。歌曲 ID 改变后，在构图中央选取一个档案位，按 **升起 0.9 秒 → 展示 1.2 秒 → 归位 1.1 秒** 播放一次动画；材质随高度显露内部结构，落下后恢复普通实例和同一时刻的呼吸高度，不保留常驻升起的档案。

连续切歌时，旧展示从当前高度归位，最新歌曲触发新的展示。计时只用场景播放时间，不调用播放器的暂停或恢复接口。

## 暂停语义

只有 `RhineScene.advance()` 累加场景时间并更新频段包络、呼吸、律动与展示进度。暂停、静态模式、窗口隐藏或背景离开视口时取消帧循环，并清空上一帧的墙钟时间。恢复后重新计时，不补算暂停期间的时间。

每个格子的最终高度都有缓存。暂停时缩放窗口可以重绘同一姿态，不重新计算起伏；改变明暗、画质和遮罩也不会推进动画。暂停期间发生的切歌会在恢复播放后触发展示。首次以暂停或静态状态打开时显示普通阵列，不自动升起档案。

## 画质与开销

所有画质移除 Bokeh 景深后处理及其共享深度通道，保持整个阵列清晰，玻璃本身的磨砂质感仍由原材质呈现。默认保留 32 样本 AO 与全分辨率玻璃透射，启用 SMAA，DPR 上限从 1.5 提高到 2，仍为 30 FPS。节能档关闭 AO 与 SMAA、减半透射分辨率；精细档提高阴影分辨率并以 1.25 倍尺寸渲染。渲染目标仍受约 829 万像素预算限制。背景阵列共用实例矩阵，仅展示过程中的档案使用完整模型。模型仅在选中该背景后加载。

## 交付状态

本阶段交付源码、模型、设置和来源说明。初次交付未运行应用或附加校验。

2026-09-15 用户报告无法加载后，在实际 Scopify 页面复现了 `RhineRenderer.initialize()` 的 `reading 'image'` 异常：Three.js 0.185 的 SMAA 纹理使用 `_areaTexture` / `_searchTexture`，而类型包仍声明旧字段。已适配实际字段并隔离可选的纹理就绪监听；模型请求返回 200，修复后实际页面已显示档案阵列和升起的档案。

同次排查中，持续编译在首页未打开莱茵背景时也会出现。Webpack 对照日志定位到 `app/layout.tsx / MainLayout.tsx → lib/utils.ts → colorthief → sharp` 的公共依赖链及缺失可选模块；将图片取色隔离到 `lib/web/imageColor.ts` 并迁移四处调用后，恢复 Turbopack，观察到热更新在约 6.9 秒结束，编译提示消失。该时间是本次开发会话记录，不是性能基准。

本次针对加载失败查看页面与日志；没有运行全量构建、类型检查或测试。完整播放联动、各档画质及设备性能仍未作全面确认。

后续按用户反馈将常驻升起改为切歌短暂展示，并移除景深、提高默认渲染精度；这次调整已写入源码，未另行运行测试或进行实机视觉验收。

随后从组件挂载链定位到切歌重建问题：`sonnet/entry.tsx` 与 `tempera/entry.tsx` 的歌曲 `key` 会连同内部 `VisualizerShell` 卸载背景。已把莱茵背景提升至稳定的 `FoliaPresentationSurface`，保持歌曲更新传入既有场景；本次未另行执行运行时验证。
