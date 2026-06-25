# 🏗️ 04 — 代码重构模板

> **适用场景**：结构优化 / 目录迁移 / 提取公共逻辑 / 拆分解耦
>
> **预计填写**：5-8 分钟

---

```markdown
---template-start---

## 重构动机
<!-- 为什么要重构？当前的痛点是什么？ -->
<!-- 例如：逻辑散落、目录不合规、组件过重、难以测试 -->

## 重构范围
<!-- 改什么不改什么，明确边界 -->

### 改动的文件 / 目录

</details>

### 不改动的范围（明确排除）

## 目标状态
<!-- 重构后长什么样？架构图 / 目录结构 / 调用关系 -->
<!-- 可以用简化的目录树或伪代码描述 -->

## 风险与兼容性
<!-- 是否有破坏性变更？哪些调用方会受影响？ -->

- [ ] 无破坏性变更（纯内部重组）
- [ ] 有破坏性变更（需同步修改调用方）
- [ ] 需要后端配合

## 测试策略
<!-- 如何保证重构后功能不变？ -->

## 回滚方案（可选）
<!-- 如果出问题了怎么回退 -->

---template-end---
```

---

## 📌 填写示例

### 重构动机
`components/Playlist/hook/` 目录下放了数据请求逻辑，违反了 AGENTS.md 的规范（hooks 应归入 `hooks/`）。共 3 个 hook 文件需要迁移，并在对应组件中更新 import 路径。

### 重构范围

#### 改动的文件 / 目录

| 源路径 | 目标路径 | 说明 |
|--------|---------|------|
| `components/Playlist/hook/usePlaylistDetail.ts` | `hooks/playlist/usePlaylistDetail.ts` | 纯迁移 |
| `components/Playlist/hook/usePlaylistTracks.ts` | `hooks/playlist/usePlaylistTracks.ts` | 纯迁移 |
| `components/Playlist/hook/usePlaylistComments.ts` | `hooks/playlist/usePlaylistComments.ts` | 纯迁移 |
| `components/Playlist/*.tsx` | — | 更新 import 路径 |

#### 不改动的范围
- `components/Playlist/hook/` 目录本身保留（git 跟踪，完成迁移后单独 PR 删除）
- 不修改 hook 内部逻辑，只动 import/export

### 目标状态
```
hooks/playlist/
├── usePlaylistDetail.ts
├── usePlaylistTracks.ts
└── usePlaylistComments.ts
```

所有组件从 `@/hooks/playlist/useXxx` import。

### 风险与兼容性
- [x] 无破坏性变更（纯内部重组）
- 所有组件 import 自动更新，外部无感知

### 测试策略
- 先确认所有组件能正常 import
- 跑 `bun run dev:web` 验证对应页面功能正常
- 检查类型编译通过

### 回滚方案
通过 git revert 回退整个 commit
