# CHANGELOG → What's New

`docs/CHANGELOG.md` 是唯一内容来源。应用弹窗、历史版本选择器和 GitHub Release 都使用同一个 Markdown 解析器，不再维护条目 JSON 或版本清单。

## 写一条更新

在对应版本的 Added / Visual / Quality / Fixed 分类下写：

```markdown
- **音量滑块恢复正常**：修复音量面板只显示图标、无法拖动滑块的问题。
  <!-- update:volume-slider -->
```

标题是用户能理解的结果，正文用一两句话描述变化或入口。每条使用唯一且稳定的 `update:` ID；以后改标题或补充说明时保留 ID。分类来自 Markdown 章节，与提交的 feat / fix / perf 等关键词独立。

新条目不用填写自己的 hash。构建通过 Git blame 查找 ID 首次被引入的真实提交，再读取该提交的 Conventional Commit 类型。未提交时显示待生成，提交后会自动关联；不会让未来的文档整理提交冒充旧功能。

已确认的历史关联可以显式保留为：

```markdown
- **说明文字在浅色背景上更清楚**：修复命令窗口说明文字难以辨认的问题。 ([fix · 53201750](https://github.com/MT-SUPER-POWER/Scopify/commit/5320175086981746d4c9bd04bb9dea84ef21208c))
  <!-- update:command-contrast -->
```

历史记录确实找不到对应功能提交时，使用迁移标记：

```markdown
- **修复旧版播放问题**
  <!-- update:legacy-playback historical -->
```

`historical` 仅用于本次旧日志迁移。界面明确标记待核对，CI 禁止把新改动伪装成历史条目。

可在同一条 Markdown 记录下附真实译文，不再写第二套内容文件：

```markdown
  <!-- translation:en-US {"title":"A clearer volume control","description":"The volume slider is visible again."} -->
  <!-- translation:zh-TW {"title":"音量滑塊恢復正常","description":"修復音量滑塊無法顯示的問題。"} -->
```

已有 Demo 的译文已保留。没有人工译文的旧条目使用来源原文，界面按钮仍按用户语言显示；不会凭空伪造历史译文。

## 版本、日期和分类

- 标题统一为 `## v2.0.3`；确认真实发布日期后可写 `## v2.0.3 — 2026-10-23`，不猜历史日期。
- 分类只允许 Added、Visual、Quality、Fixed，正文只记录用户可感知的变化。性能与可靠性提升可放 Quality，CI、依赖、类型和模块拆分保留在开发记录或提交正文。
- 纯内部维护的 Conventional Commit 正文加入独立一行 `Changelog: internal`，无需为了过 CI 在用户弹窗编造一条功能。
- 每个非 merge 提交应新增一个用户更新 ID，或明确标记内部维护。首次将旧日志迁入新格式时有迁移例外。
- 版本选择器覆盖这份文件中的所有已安装版本及更早版本，包括旧的预发布版本；没有独立说明的版本也保留入口。
- 分类顺序与 Markdown 约定一致，每页最多八条。跨页分类显示本页条数 / 分类总数；不在本页的分类也保留标题、总数和跳页入口，避免将分页误认为内容缺失。分类和条目详情均可折叠。

## 检查与发布

- `pnpm updates:check`：解析整份 Markdown，检查版本、分类、ID 和 hash 链接，并输出每个版本的分类数量、已关联和待核对数量。
- `pnpm updates:release`：使用同一数据生成当前版 `release_notes.md`。正式发布要求当前版各条目有真实来源，缺 Git 历史或新条目尚未提交会明确失败。
- 发布工作流拉取完整历史，renderer 内嵌解析结果以支持桌面离线阅读；Turbo 将 `docs/CHANGELOG.md` 纳入输入。开发中修改日志后应重新载入 Next 配置或重启 Web 开发服务。
- 定向解析器测试：在 Web 目录运行 `bun test tests/updates/changelog.test.ts`。

## 本次历史整理

保留 35 个版本，按用户变化整理原文，合并同版本中的旧品牌中间方案，工程细节移出用户正文。

- [原始开发日志](../archive/CHANGELOG.developer.md)：完整保留整理前的内容，方便追溯；不作为运行时输入。
- [来源核对表](PROVENANCE.md)：逐条记录原版本、原记录提交、对应功能提交、整理结果和归档行号。

同一次提交同时引入原日志和业务源码时，可以建立关联；只有文档、版本号或批量搬运记录时不作功能提交推断。尚未确认的历史 hash 继续公开标记待核对，后续可依据证据逐项补齐。
