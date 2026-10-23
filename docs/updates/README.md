# 用户更新说明

应用「What's New」与 GitHub Release 共用这套数据。`docs/CHANGELOG.md` 保留开发记录，不再直接作为用户弹窗内容。

## 每次提交

1. 使用 Conventional Commit，例如 `feat(lyrics): add desktop capsule`。
2. 新增 `entries/<唯一标识>.json`，概括用户得到的变化。一个提交可有多个条目，但不要每改一个文件就写一条。
3. 纯维护使用 `audience: internal`，保留追踪记录，但不出现在用户更新中。
4. 不填写 `commit`。构建从首次引入文件的提交解析真实 hash 和关键词；界面以 Added、Fixed、Visual、Quality 为绿色分类标题，下面逐条展示变化，行尾直接显示 `(01234567)` 并链接到完整提交。

```json
{
  "type": "fix",
  "category": "Fixed",
  "audience": "user",
  "title": {
    "zh-CN": "切歌后，歌词不再停留在上一首",
    "zh-TW": "切歌後，歌詞不再停留在上一首",
    "en-US": "Lyrics follow the new track"
  },
  "description": {
    "zh-CN": "修复快速切歌时偶尔显示上一首歌词的问题。",
    "zh-TW": "修復快速切歌時偶爾顯示上一首歌詞的問題。",
    "en-US": "Fixed lyrics occasionally staying on the previous song when skipping tracks quickly."
  }
}
```

`category` 必填，必须对应 CHANGELOG 中的 Added、Visual、Quality、Fixed 章节；`type` 独立记录 Conventional Commit 类型。比如 F12 提示的提交虽然是 `fix`，但原文归在 Visual，就应展示在 Visual。只显示有用户条目的分类，先按分类排列再分页。分类标题可收起，条目摘要显示标题和 hash，点击展开完整说明。Squash 后各条目可能共享同一个 hash，来源关键词仍记录 squash 提交的真实类型。

已合并的条目保持不变；后续修正用新文件记录。历史迁移条目允许显式填写已存在的 commit；CI 仅在首次引入本机制时允许这个例外。未提交的本地新增条目没有 hash，不会伪造来源。

## 发布版本

编辑 `releases.json`，添加版本、真实发布日期（`YYYY-MM-DD`）、三语言标题与对应条目 ID。没有归入版本的条目是待发布内容，不会进入弹窗。条目只归属一个版本，内部条目无需放进版本清单。

发布者应按最终体验选取条目：多次品牌尝试只保留定稿说明，纯实现细节不面向用户。同一功能的多条修复可在发版前选择最能概括最终结果的一条，其余原始条目继续保留在 Git。自动化不代替这一步编辑判断。

根目录与 Web、Desktop、Docs 的 package 版本照现有发布流程同步。不要在已经发布的版本里追加新变化：已读状态按安装版本保存，同版本内容不会重新弹出。

- `pnpm updates:check`：校验 JSON 结构和版本分配；CI 额外检查 PR 中每个非 merge 提交的 Conventional Commit 格式与新增条目，禁止修改已合并条目。
- `pnpm updates:release`：严格解析已归档条目的 Git 来源，确认它们属于当前提交历史，生成当前版本 `release_notes.md`；缺少当前版用户说明会阻止发布。

CI 与发布构建拉取完整 Git 历史。Release workflow 将生成的说明作为 artifact 传给发布任务，并在 renderer 构建时启用严格来源校验。Web 与桌面导出构建通过 `next.config.ts` 嵌入说明，离线也能阅读。Git 不可用的普通本地构建仍可展示文字，来源标为待生成；正式发布不允许缺失来源。

## 弹窗行为

- 第一版默认首次安装展示当前版，后续升级展示一次；关闭后才记录已读。开发模式仅手动打开，避免反复调试被打断。
- 只在主界面挂载，等待命令面板和歌词舞台关闭；弹窗可按 Escape、点击遮罩或右上角关闭退出。
- 弹窗采用固定深灰、浅灰正文与绿色分节标题；版本选择和分页位于底栏。正文使用 Radix 自定义滚动区域，隐藏原生滚动条，短版本随内容收紧高度。
- 手动入口：侧栏菜单「What's New」；命令面板搜索「新鲜事」「更新日志」「changelog」「what's new」。命令默认不占用快捷键，可自行分配。
- 每个版本独立浏览，每页最多八条；切换版本会回到第一页。只展示不高于当前安装版本的说明，正式版隐藏预发布版本。
- 降级不会覆盖较新版本的已读状态。存储不可用时保留手动入口，不自动反复弹窗。

当前只精简迁移 v2.0.1–v2.0.3，不等于完整历史。历史实际发布日期尚未核实，暂不展示日期。按本轮要求，What's New 的新增与界面迭代已归入当前 CHANGELOG 对应的 v2.0.3；尚未提交的变更显示待生成 hash，不借用别的提交。

### v2.0.3 内容对应

| CHANGELOG 内容 | 条目 | 展示分类 |
| --- | --- | --- |
| 新增用户更新说明弹窗 | whats-new | Added |
| 更新说明与提交追踪流程 | update-notes-pipeline | Quality，内部维护，不展示 |
| 新鲜事弹窗按参考图重做 | whats-new-reference-style | Visual |
| What's New 按分类列出更新 | whats-new-category-list | Visual |
| 恢复 What's New 折叠并补齐版本内容 | whats-new-completeness | Visual |
| 开发者工具设置写明快捷键 | developer-shortcut | Visual |
| 命令面板在亮色页面上看不清说明文字 | command-contrast | Fixed |
| Folia 莱茵档案下拉菜单配色与主题一致 | rhine-dropdowns | Fixed |
| 外部链接统一交给默认浏览器 | external-browser-navigation | Fixed |
