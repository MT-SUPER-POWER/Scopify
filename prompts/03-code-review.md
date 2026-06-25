# 🔍 03 — 代码审查模板

> **适用场景**：代码变更后，请求 AI 进行审查
>
> **预计填写**：3-5 分钟

---

```markdown
---template-start---

## 改动摘要
<!-- 一句话说清楚改了什么 -->

## 关联任务
- [ ] 对应 Issue / 需求：

## 变更文件清单

| 文件 | 操作（新增/修改/删除） | 说明 |
|------|------------------------|------|
| | | |

## 重点关注
<!-- 想让审查者特别关注哪些方面？ -->
<!-- 例如：类型安全、边界情况、性能、与现有模式一致性、i18n 覆盖 -->

## 自检清单

- [ ] 类型定义放在正确位置（`types/`，非 inline）
- [ ] 目录归属符合 AGENTS.md 规范
- [ ] i18n 文案已提取（如需）
- [ ] 无遗留的 console.log / debugger
- [ ] 无未处理的边界情况（空数据、错误态）

## 测试覆盖（可选）
<!-- 覆盖了哪些场景？ -->

---template-end---
```

---

## 📌 填写示例

### 改动摘要
重构 `useAlbumData` hook，提取数据请求逻辑到 `lib/api/`，统一 Loading / Error 状态管理。

### 关联任务
- [x] 对应 Issue / 需求：#142 — Album 页数据层重构

### 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `hooks/album/useAlbumData.ts` | 修改 | 拆分为数据层 + UI 状态层 |
| `lib/api/album.ts` | 新增 | `getAlbumDetail`、`getAlbumComments` 函数 |
| `types/api/album.ts` | 新增 | API 响应类型 |
| `types/components/album.ts` | 新增 | 组件 Props 类型 |
| `app/(dashboard)/album/page.tsx` | 修改 | 适配新 hook 接口 |

### 重点关注
- 类型安全：`types/api/album.ts` 是否覆盖所有后端响应字段
- 错误处理：网络异常时是否有 fallback UI
- 与现有模式一致性：是否遵循了 AGENTS.md 的目录规范
- i18n：新增文案是否已提取

### 自检清单
- [x] 类型定义放在正确位置（`types/`，非 inline）
- [x] 目录归属符合 AGENTS.md 规范
- [x] i18n 文案已提取
- [x] 无遗留的 console.log / debugger
- [x] 无未处理的边界情况（空数据、错误态）

### 测试覆盖
- 正常渲染：mock 3 条曲目
- 空状态：0 条曲目
- 错误态：模拟网络异常
